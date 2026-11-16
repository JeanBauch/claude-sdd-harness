import { test } from 'node:test'
import assert from 'node:assert/strict'
import { join } from 'node:path'
import { tempDir, writeFile } from './helpers.mjs'
import { collect, parseFindings, render, scanTranscripts, transcriptsDirFor } from '../scripts/retro-evidence.mjs'

const T0 = '2026-11-16T10:00:00.000Z'
const at = (min) => new Date(Date.parse(T0) + min * 60_000).toISOString()

const toolUse = (id, name, input, { min = 1, branch = 'feat/9-volume', msgId = `m-${id}`, model = 'claude-sonnet-5-5', out = 100 } = {}) => ({
  type: 'assistant',
  timestamp: at(min),
  gitBranch: branch,
  message: { id: msgId, model, usage: { output_tokens: out }, content: [{ type: 'tool_use', id, name, input }] },
})
const toolResult = (id, content, { min = 2, branch = 'feat/9-volume', isError = true } = {}) => ({
  type: 'user',
  timestamp: at(min),
  gitBranch: branch,
  message: { role: 'user', content: [{ type: 'tool_result', tool_use_id: id, is_error: isError, content }] },
})
const stopSummary = (errors, { min = 3, branch = 'feat/9-volume' } = {}) => ({
  type: 'system',
  subtype: 'stop_hook_summary',
  timestamp: at(min),
  gitBranch: branch,
  hookInfos: [{ command: 'verify-gate: format + typecheck + related tests' }],
  hookErrors: errors,
  preventedContinuation: errors.length > 0,
})

function transcripts(files) {
  const dir = tempDir('retro-ev-')
  for (const [rel, entries] of Object.entries(files)) writeFile(dir, rel, entries.map((e) => JSON.stringify(e)).join('\n') + '\n')
  return dir
}

test('maps a project path to its Claude Code transcripts folder', () => {
  const home = tempDir('retro-home-')
  // Claude Code turns every separator (and the drive colon) into a dash: F:\Projetos\x → f--Projetos-x, /home/u/x → -home-u-x.
  const [project, folder, missing] =
    process.platform === 'win32'
      ? ['F:\\Projetos\\reading-list', 'f--Projetos-reading-list', 'F:\\Projetos\\missing']
      : ['/home/u/reading-list', '-home-u-reading-list', '/home/u/missing']
  writeFile(home, `.claude/projects/${folder}/a.jsonl`, '')
  assert.equal(transcriptsDirFor(project, home), join(home, '.claude', 'projects', folder))
  assert.equal(transcriptsDirFor(missing, home), null)
})

test('a failing command repeated across two tickets is a recurring signal with pointers', () => {
  const dir = transcripts({
    'sess-aaaa1111.jsonl': [
      toolUse('t1', 'Bash', { command: 'cd /x && pnpm exec playwright test -g foo' }),
      toolResult('t1', 'Exit code 1\nError: browser not installed'),
    ],
    'sess-bbbb2222/subagents/agent-1.jsonl': [
      toolUse('t2', 'Bash', { command: 'pnpm exec playwright test' }, { branch: 'feat/8-conn' }),
      toolResult('t2', [{ type: 'text', text: 'Exit code 1\nError: browser not installed' }], { branch: 'feat/8-conn' }),
    ],
  })
  const r = scanTranscripts(dir, { since: T0 })
  const sig = r.signals.find((s) => s.key === 'Bash: pnpm exec playwright')
  assert.equal(sig.count, 2)
  assert.deepEqual(sig.tickets, [8, 9])
  assert.deepEqual(
    sig.pointers.sort(),
    ['sess-aaaa1111.jsonl:2', 'sess-bbbb2222/subagents/agent-1.jsonl:2'].sort(),
  )
})

test('hook blocks are classified by hook name, including Stop hook blocks', () => {
  const dir = transcripts({
    's1.jsonl': [
      toolUse('t1', 'Edit', { file_path: 'C:\\p\\CLAUDE.md' }),
      toolResult('t1', 'PreToolUse:Edit hook error: protect-paths: blocked edit to CLAUDE.md: rule files are read-only'),
      stopSummary(['verify-gate: changed files are not green yet. TS2322']),
      stopSummary([], { min: 4 }),
    ],
  })
  const r = scanTranscripts(dir, { since: T0 })
  assert.equal(r.signals.find((s) => s.kind === 'hook-block').key, 'protect-paths')
  assert.equal(r.signals.find((s) => s.kind === 'stop-hook').key, 'verify-gate')
  assert.equal(r.signals.filter((s) => s.kind === 'stop-hook').length, 1)
})

test('entries before the window and successful results are ignored', () => {
  const dir = transcripts({
    's1.jsonl': [
      { ...toolUse('old', 'Bash', { command: 'pnpm test' }), timestamp: '2026-11-01T00:00:00.000Z' },
      { ...toolResult('old', 'Exit code 1'), timestamp: '2026-11-01T00:00:01.000Z' },
      toolUse('ok', 'Bash', { command: 'pnpm test' }),
      toolResult('ok', 'all green', { isError: false }),
    ],
  })
  const r = scanTranscripts(dir, { since: T0 })
  assert.equal(r.signals.length, 0)
  assert.equal(r.sessions.length, 1)
})

test('sessions report models, output tokens (deduplicated by message id), implementer calls and large results', () => {
  const big = 'x'.repeat(40_000)
  const dir = transcripts({
    's1.jsonl': [
      toolUse('a1', 'Agent', { subagent_type: 'implementer', prompt: 'Ticket #9' }, { out: 50, model: 'claude-opus-5-5' }),
      toolUse('a1', 'Agent', { subagent_type: 'implementer', prompt: 'Ticket #9' }, { out: 50, model: 'claude-opus-5-5' }),
      toolUse('a2', 'Agent', { subagent_type: 'implementer', model: 'opus', prompt: 'fix' }, { out: 70, model: 'claude-opus-5-5' }),
      toolUse('b1', 'Bash', { command: 'gh pr diff 13' }),
      toolResult('b1', big, { isError: false }),
    ],
  })
  const r = scanTranscripts(dir, { since: T0 })
  const s = r.sessions[0]
  assert.equal(s.outputTokens, 220)
  assert.deepEqual(s.models, ['claude-opus-5-5', 'claude-sonnet-5-5'])
  assert.deepEqual(s.implementerCalls, ['default', 'opus'])
  assert.equal(r.largeResults[0].key, 'Bash: gh pr diff')
  assert.equal(r.largeResults[0].chars, 40_000)
})

test('parses the findings table of a PR body', () => {
  const body = [
    '## Findings da revisão',
    '',
    '| Finding | Veredito | Motivo |',
    '| --- | --- | --- |',
    '| Limite oscila no CI | fix | troca por contagem |',
    '| Teste depende do anterior | accept | convenção da suíte |',
    '| Falso positivo | reject | provado |',
    '',
    'outro texto',
  ].join('\n')
  assert.deepEqual(parseFindings(body), [
    { finding: 'Limite oscila no CI', verdict: 'fix', reason: 'troca por contagem' },
    { finding: 'Teste depende do anterior', verdict: 'accept', reason: 'convenção da suíte' },
    { finding: 'Falso positivo', verdict: 'reject', reason: 'provado' },
  ])
})

function fakeGh(data) {
  return (args) => {
    const key = args.join(' ')
    for (const [pattern, value] of Object.entries(data)) if (key.startsWith(pattern)) return value
    throw new Error(`unexpected gh ${key}`)
  }
}

test('collect joins tickets, PRs and transcripts into one report', () => {
  const dir = transcripts({
    's1.jsonl': [toolUse('t1', 'Bash', { command: 'pnpm lint' }), toolResult('t1', 'Exit code 1')],
  })
  const gh = fakeGh({
    'issue view 1': { number: 1, title: 'Lista de leitura', createdAt: T0, closedAt: null },
    'api repos/{owner}/{repo}/issues/1/sub_issues': [{ number: 9, title: 'Teste de volume', state: 'closed' }],
    'issue view 9': {
      number: 9,
      title: 'Teste de volume',
      labels: [{ name: 'type:ticket' }],
      comments: [
        { body: 'ASSUMPTION: limites de 50 ms' },
        { body: 'Escalado para Opus: limite frouxo' },
        { body: 'Métricas: modelo=sonnet→opus · findings=7/3/1 · assumptions=1 · ci-vermelho=0' },
      ],
    },
    'pr list': [
      { number: 13, headRefName: 'feat/9-teste-volume', state: 'MERGED', body: '| Finding | Veredito | Motivo |\n|---|---|---|\n| a | fix | b |' },
      { number: 12, headRefName: 'chore/harness', state: 'MERGED', body: '' },
    ],
  })
  const report = collect({ spec: 1, transcriptsDir: dir, gh })
  assert.equal(report.tickets[0].pr, 13)
  assert.equal(report.tickets[0].assumptions, 1)
  assert.equal(report.tickets[0].escalations, 1)
  assert.match(report.tickets[0].metrics, /sonnet→opus/)
  assert.equal(report.tickets[0].findings.length, 1)
  assert.equal(report.transcripts.signals.length, 1)

  const md = render(report)
  assert.match(md, /# Evidência para o retro: spec #1/)
  assert.match(md, /\| #9 \| #13 \|/)
  assert.match(md, /Bash: pnpm lint/)
})

test('a file listing that mentions hook names is not a hook block', () => {
  const dir = transcripts({
    's1.jsonl': [
      toolUse('t1', 'Bash', { command: 'cat package.json; ls .claude/hooks; false' }),
      toolResult('t1', 'Exit code 1\n"format:check": "prettier --check ."\n.claude/hooks/verify-gate.mjs'),
      toolUse('t2', 'Bash', { command: 'git push -f origin x' }),
      toolResult('t2', 'PreToolUse:Bash hook error: [node hook]: git-guardrails: blocked `git push -f`: force push'),
    ],
  })
  const r = scanTranscripts(dir, { since: T0 })
  assert.deepEqual(
    r.signals.map((s) => `${s.kind} ${s.key}`).sort(),
    ['hook-block git-guardrails', 'tool-error Bash: cat package.json'],
  )
})

test('command keys skip cd, exports and variable assignments', () => {
  const dir = transcripts({
    's1.jsonl': [
      toolUse('t1', 'Bash', { command: 'SP="/tmp/x y" && rm "$SP"/a && pnpm build' }),
      toolResult('t1', 'Exit code 1\nboom'),
      toolUse('t2', 'Bash', { command: 'cd "/f/my dir" && export A=1; pnpm exec tsc --noEmit' }),
      toolResult('t2', 'Exit code 2\nTS2322'),
    ],
  })
  const keys = scanTranscripts(dir, { since: T0 }).signals.map((s) => s.key).sort()
  assert.deepEqual(keys, ['Bash: pnpm exec tsc', 'Bash: rm $SP/a'])
})

test('searches that find nothing are not errors', () => {
  const dir = transcripts({
    's1.jsonl': [
      toolUse('t1', 'Bash', { command: 'grep -rn foo src' }),
      toolResult('t1', 'Exit code 1'),
      toolUse('t2', 'Bash', { command: 'cd /x && rg bar' }),
      toolResult('t2', 'Exit code 1\n'),
    ],
  })
  assert.equal(scanTranscripts(dir, { since: T0 }).signals.length, 0)
})
