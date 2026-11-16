#!/usr/bin/env node
// Collects cross-ticket evidence for a spec's /retro: recurring tool failures and hook blocks from the
// Claude Code transcripts, plus per-ticket metrics, assumptions, escalations and review findings from GitHub.
// Deterministic and token-free: the /retro reads the short report instead of megabytes of transcripts.
//
// Usage: node scripts/retro-evidence.mjs --project <dir> --spec <n> [--since <ISO>] [--transcripts <dir>] [--out <file>]
import { spawnSync } from 'node:child_process'
import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { join, relative, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

const LARGE_RESULT_CHARS = 20_000
const HOOKS = ['verify-gate', 'protect-paths', 'git-guardrails', 'format']

/** Claude Code stores a project's transcripts under ~/.claude/projects/<path with separators as dashes>. */
export function transcriptsDirFor(projectDir, home = homedir()) {
  const base = join(home, '.claude', 'projects')
  if (!existsSync(base)) return null
  const wanted = resolve(projectDir).replace(/[^A-Za-z0-9]/g, '-').toLowerCase()
  const match = readdirSync(base).find((name) => name.toLowerCase() === wanted)
  return match ? join(base, match) : null
}

function jsonlFiles(dir) {
  const out = []
  for (const name of readdirSync(dir)) {
    const full = join(dir, name)
    if (statSync(full).isDirectory()) {
      if (name !== 'memory') out.push(...jsonlFiles(full))
    } else if (name.endsWith('.jsonl')) out.push(full)
  }
  return out
}

const ticketOf = (branch) => Number(/^(?:feat|fix)\/(\d+)-/.exec(branch ?? '')?.[1]) || null

const SEARCHES = new Set(['grep', 'rg', 'find', 'diff', 'test', '['])
const BLOCK_MESSAGE = /(^|\n|: )(verify-gate|protect-paths|git-guardrails): (blocked|changed files)/

/** The first segment of a shell line that does real work: not cd, export or a variable assignment. */
function mainSegment(command) {
  const segments = command
    .split(/&&|\|\||;|\n/)
    .map((x) => x.trim())
    .filter(Boolean)
  return segments.find((x) => !/^(cd|export)\b/.test(x) && !/^\w+=("[^"]*"|'[^']*'|\S*)$/.test(x)) ?? segments[0] ?? ''
}

function commandKey(command) {
  const words = mainSegment(command)
    .replace(/["']/g, '')
    .split(/\s+/)
    .filter((w) => !w.startsWith('-') && !/^\d+$/.test(w))
  return words.slice(0, 3).join(' ')
}

function toolKey(name, input = {}) {
  if (name === 'Bash' || name === 'PowerShell') return `${name}: ${commandKey(String(input.command ?? ''))}`
  if (name === 'Skill') return `Skill: ${input.skill}`
  if (name === 'Agent' || name === 'Task') return `Agent: ${input.subagent_type ?? 'general-purpose'}`
  return name
}

const textOf = (content) =>
  typeof content === 'string' ? content : Array.isArray(content) ? content.map((c) => c.text ?? '').join('\n') : ''

function classify(text) {
  const hook = BLOCK_MESSAGE.exec(text)?.[2]
  if (hook || /hook error/i.test(text)) return { kind: 'hook-block', hook: hook ?? 'hook' }
  if (text.includes('<tool_use_error>Blocked')) return { kind: 'harness-block' }
  if (text.includes('InputValidationError')) return { kind: 'input-validation' }
  return { kind: 'tool-error' }
}

/** The line that best explains a failure: the last one naming an error, else the first non-empty one. */
function sample(text) {
  const lines = text
    .split('\n')
    .map((l) => l.replace(/<\/?tool_use_error>/g, '').trim())
    .filter((l) => l && !/^Exit code \d+$/.test(l))
  const telling = lines.filter((l) => /error|fail|denied|blocked|not found|EOF/i.test(l)).pop()
  return (telling ?? lines[0] ?? '').slice(0, 160)
}

/** Reads every transcript (subagents included) and keeps entries inside [since, until]. */
export function scanTranscripts(dir, { since, until } = {}) {
  const from = since ? Date.parse(since) : -Infinity
  const to = until ? Date.parse(until) : Infinity
  const signals = new Map()
  const sessions = new Map()
  const largeResults = []

  for (const file of jsonlFiles(dir)) {
    const rel = relative(dir, file).replace(/\\/g, '/')
    const sessionId = rel.split('/')[0].replace(/\.jsonl$/, '')
    const uses = new Map()
    const seenMessages = new Set()
    const seenUses = new Set()
    const lines = readFileSync(file, 'utf8').split('\n')

    lines.forEach((line, i) => {
      if (!line.trim()) return
      let e
      try {
        e = JSON.parse(line)
      } catch {
        return
      }
      const ts = Date.parse(e.timestamp ?? '')
      if (!(ts >= from && ts <= to)) return
      const pointer = `${rel}:${i + 1}`
      const ticket = ticketOf(e.gitBranch)
      const session =
        sessions.get(sessionId) ??
        sessions.set(sessionId, { id: sessionId, start: e.timestamp, end: e.timestamp, branches: new Set(), models: new Set(), outputTokens: 0, implementerCalls: [] }).get(sessionId)
      if (e.timestamp < session.start) session.start = e.timestamp
      if (e.timestamp > session.end) session.end = e.timestamp
      if (e.gitBranch) session.branches.add(e.gitBranch)

      const addSignal = (kind, key, text) => {
        const id = `${kind}|${key}`
        const s = signals.get(id) ?? signals.set(id, { kind, key, count: 0, tickets: new Set(), sessions: new Set(), pointers: [], sample: sample(text) }).get(id)
        s.count++
        s.sessions.add(sessionId)
        if (ticket) s.tickets.add(ticket)
        s.pointers.push(pointer)
      }

      if (e.type === 'system' && e.subtype === 'stop_hook_summary' && (e.preventedContinuation || e.hookErrors?.length)) {
        const text = [...(e.hookErrors ?? []).map(String), ...(e.hookInfos ?? []).map((h) => h.command)].join('\n')
        addSignal('stop-hook', HOOKS.find((h) => text.includes(h)) ?? 'stop-hook', text)
      }

      const content = Array.isArray(e.message?.content) ? e.message.content : []
      if (e.type === 'assistant') {
        const msgId = e.message?.id
        if (!msgId || !seenMessages.has(msgId)) {
          if (msgId) seenMessages.add(msgId)
          session.outputTokens += e.message?.usage?.output_tokens ?? 0
          if (e.message?.model && !e.message.model.startsWith('<')) session.models.add(e.message.model)
        }
        for (const c of content) {
          if (c.type !== 'tool_use') continue
          uses.set(c.id, toolKey(c.name, c.input))
          if ((c.name === 'Agent' || c.name === 'Task') && c.input?.subagent_type === 'implementer' && !seenUses.has(c.id)) {
            seenUses.add(c.id)
            session.implementerCalls.push(c.input.model ?? 'default')
          }
        }
      }
      if (e.type === 'user') {
        for (const c of content) {
          if (c.type !== 'tool_result') continue
          const text = textOf(c.content)
          const key = uses.get(c.tool_use_id) ?? 'unknown tool'
          if (text.length > LARGE_RESULT_CHARS) largeResults.push({ key, chars: text.length, pointer })
          if (!c.is_error) continue
          const isSearch = SEARCHES.has(key.replace(/^(Bash|PowerShell): /, '').split(' ')[0])
          if (isSearch && /^Exit code 1\s*$/.test(text.trim().split('\n')[0]) && text.trim().split('\n').length === 1) continue
          const { kind, hook } = classify(text)
          addSignal(kind, hook ?? key, text)
        }
      }
    })
  }

  const sorted = (set) => [...set].sort((a, b) => (typeof a === 'number' ? a - b : String(a).localeCompare(String(b))))
  return {
    sessions: [...sessions.values()]
      .map((s) => ({ ...s, branches: sorted(s.branches), models: sorted(s.models) }))
      .sort((a, b) => a.start.localeCompare(b.start)),
    signals: [...signals.values()]
      .map((s) => ({ ...s, tickets: sorted(s.tickets), sessions: sorted(s.sessions) }))
      .sort((a, b) => b.count - a.count || a.key.localeCompare(b.key)),
    largeResults: largeResults.sort((a, b) => b.chars - a.chars),
  }
}

/** Rows of the "Finding | Veredito | Motivo" table that /ship-ticket puts in each PR body. */
export function parseFindings(body = '') {
  const rows = body.split('\n').filter((l) => l.trim().startsWith('|'))
  const cells = (l) => l.trim().replace(/^\||\|$/g, '').split('|').map((c) => c.trim())
  const header = rows.findIndex((l) => cells(l).some((c) => /^(veredito|verdict)$/i.test(c)))
  if (header < 0) return []
  const verdictCol = cells(rows[header]).findIndex((c) => /^(veredito|verdict)$/i.test(c))
  const out = []
  for (const row of rows.slice(header + 1)) {
    const c = cells(row)
    if (c.every((x) => /^:?-+:?$/.test(x))) continue
    const verdict = c[verdictCol]?.toLowerCase()
    if (!['fix', 'accept', 'reject'].includes(verdict)) break
    out.push({ finding: c[0], verdict, reason: c[verdictCol + 1] ?? '' })
  }
  return out
}

/** Runs gh in `cwd` and parses its JSON output. */
export function ghRunner(cwd) {
  return (args) => {
    const r = spawnSync('gh', args, { cwd, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 })
    if (r.status !== 0) throw new Error(`gh ${args.join(' ')} failed: ${r.stderr || r.error}`)
    return JSON.parse(r.stdout)
  }
}

export function collect({ spec, transcriptsDir, gh, since, until }) {
  const specIssue = gh(['issue', 'view', String(spec), '--json', 'number,title,createdAt,closedAt'])
  const subIssues = gh(['api', `repos/{owner}/{repo}/issues/${spec}/sub_issues`])
  const prs = gh(['pr', 'list', '--state', 'all', '--limit', '200', '--json', 'number,headRefName,state,body'])

  const tickets = subIssues.map((sub) => {
    const issue = gh(['issue', 'view', String(sub.number), '--json', 'number,title,labels,comments'])
    const bodies = (issue.comments ?? []).map((c) => c.body ?? '')
    const pr = prs.find((p) => new RegExp(`^(feat|fix)/${sub.number}-`).test(p.headRefName))
    const metrics = bodies.filter((b) => /^Métricas/.test(b)).pop() ?? null
    return {
      number: sub.number,
      title: issue.title,
      labels: (issue.labels ?? []).map((l) => l.name),
      pr: pr?.number ?? null,
      metrics: metrics?.replace(/^Métricas[^:]*:\s*/, '').trim() ?? null,
      assumptions: bodies.filter((b) => b.startsWith('ASSUMPTION:')).length,
      decisions: bodies.filter((b) => b.startsWith('NEEDS-DECISION:')).length,
      escalations: bodies.filter((b) => b.startsWith('Escalado para Opus')).length,
      flaky: bodies.filter((b) => /oscil|flaky/i.test(b)).length,
      findings: parseFindings(pr?.body),
    }
  })

  return {
    spec: specIssue,
    window: { since: since ?? specIssue.createdAt, until: until ?? specIssue.closedAt ?? null },
    tickets,
    transcripts: transcriptsDir ? scanTranscripts(transcriptsDir, { since: since ?? specIssue.createdAt, until: until ?? undefined }) : null,
  }
}

const short = (id) => id.slice(0, 8)
const list = (xs, max = 4) => (xs.length > max ? `${xs.slice(0, max).join(', ')} (+${xs.length - max})` : xs.join(', '))
const cell = (s) => String(s ?? '').replace(/\|/g, '\\|').replace(/\n/g, ' ')

export function render(report) {
  const { spec, window, tickets, transcripts: tr } = report
  const out = []
  out.push(`# Evidência para o retro: spec #${spec.number}`, '')
  out.push(`${spec.title} · janela ${window.since} → ${window.until ?? 'agora'} · gerado por \`scripts/retro-evidence.mjs\`.`, '')
  out.push('Use como fonte primária do `/mattpocock-skills:retro`. Um padrão que aparece em 2 ou mais tickets pesa mais que um caso isolado; cite as ocorrências e os ponteiros `arquivo:linha` (relativos à pasta de transcrições) em cada proposta.', '')

  out.push('## Tickets', '')
  out.push('| Ticket | PR | Labels | Métricas | ASSUMPTION | NEEDS-DECISION | Escaladas | Findings fix/accept/reject |')
  out.push('|---|---|---|---|---|---|---|---|')
  for (const t of tickets) {
    const n = (v) => t.findings.filter((f) => f.verdict === v).length
    out.push(`| #${t.number} | ${t.pr ? `#${t.pr}` : '—'} | ${cell(t.labels.filter((l) => l !== 'type:ticket').join(', ') || '—')} | ${cell(t.metrics ?? '—')} | ${t.assumptions} | ${t.decisions} | ${t.escalations} | ${n('fix')}/${n('accept')}/${n('reject')} |`)
  }
  out.push('')

  const carried = tickets.flatMap((t) => t.findings.filter((f) => f.verdict !== 'fix').map((f) => ({ ...f, ticket: t.number })))
  if (carried.length) {
    out.push('## Findings aceitos ou rejeitados', '', 'Repetições aqui sugerem regra nova no `CODING_STANDARDS.md`, um check automático ou ruído do review.', '')
    out.push('| Ticket | Veredito | Finding | Motivo |', '|---|---|---|---|')
    for (const f of carried) out.push(`| #${f.ticket} | ${f.verdict} | ${cell(f.finding)} | ${cell(f.reason)} |`)
    out.push('')
  }

  if (tr) {
    const recurring = tr.signals.filter((s) => s.count >= 2)
    const single = tr.signals.filter((s) => s.count < 2)
    out.push('## Sinais recorrentes nas transcrições (2 ou mais)', '')
    if (recurring.length) {
      out.push('| Tipo | Origem | Ocorrências | Tickets | Sessões | Exemplo | Ponteiros |', '|---|---|---|---|---|---|---|')
      for (const s of recurring)
        out.push(`| ${s.kind} | ${cell(s.key)} | ${s.count} | ${s.tickets.map((t) => `#${t}`).join(', ') || '—'} | ${s.sessions.length} | ${cell(s.sample)} | ${cell(list(s.pointers))} |`)
    } else out.push('Nenhum.')
    out.push('')
    out.push('## Sinais isolados', '')
    if (single.length) {
      out.push('| Tipo | Origem | Ticket | Exemplo | Ponteiro |', '|---|---|---|---|---|')
      for (const s of single.slice(0, 20)) out.push(`| ${s.kind} | ${cell(s.key)} | ${s.tickets.map((t) => `#${t}`).join(', ') || '—'} | ${cell(s.sample)} | ${s.pointers[0]} |`)
      if (single.length > 20) out.push('', `(+${single.length - 20} isolados omitidos)`)
    } else out.push('Nenhum.')
    out.push('')

    if (tr.largeResults.length) {
      const byKey = new Map()
      for (const r of tr.largeResults) {
        const k = byKey.get(r.key) ?? byKey.set(r.key, { key: r.key, count: 0, chars: 0, pointer: r.pointer }).get(r.key)
        k.count++
        k.chars += r.chars
      }
      out.push(`## Resultados de ferramenta grandes (> ${LARGE_RESULT_CHARS / 1000} mil caracteres)`, '', 'Candidatos a *Tool economy*.', '')
      out.push('| Origem | Vezes | Caracteres | Exemplo |', '|---|---|---|---|')
      for (const k of [...byKey.values()].sort((a, b) => b.chars - a.chars).slice(0, 10)) out.push(`| ${cell(k.key)} | ${k.count} | ${k.chars.toLocaleString('pt-BR')} | ${k.pointer} |`)
      out.push('')
    }

    out.push('## Sessões', '')
    out.push('| Sessão | Início | Fim | Branches | Modelos | Tokens de saída | Chamadas do implementer |', '|---|---|---|---|---|---|---|')
    for (const s of tr.sessions)
      out.push(`| ${short(s.id)} | ${s.start} | ${s.end} | ${cell(list(s.branches))} | ${cell(s.models.join(', '))} | ${s.outputTokens.toLocaleString('pt-BR')} | ${s.implementerCalls.join(', ') || '—'} |`)
    out.push('')
  }
  return out.join('\n')
}

function parseArgs(argv) {
  const args = {}
  for (let i = 0; i < argv.length; i += 2) {
    if (!argv[i].startsWith('--')) throw new Error(`unexpected argument ${argv[i]}`)
    args[argv[i].slice(2)] = argv[i + 1]
  }
  if (!args.spec) throw new Error('usage: retro-evidence.mjs --project <dir> --spec <n> [--since <ISO>] [--transcripts <dir>] [--out <file>]')
  return args
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  try {
    const args = parseArgs(process.argv.slice(2))
    const project = resolve(args.project ?? '.')
    const transcriptsDir = args.transcripts ?? transcriptsDirFor(project)
    if (!transcriptsDir) process.stderr.write(`retro-evidence: no transcripts found for ${project}; reporting GitHub data only.\n`)
    const md = render(collect({ spec: Number(args.spec), transcriptsDir, gh: ghRunner(project), since: args.since }))
    if (args.out) {
      writeFileSync(args.out, md)
      process.stdout.write(`retro-evidence: wrote ${args.out}\n`)
    } else process.stdout.write(md + '\n')
  } catch (err) {
    process.stderr.write(`retro-evidence: ${err.message}\n`)
    process.exit(1)
  }
}
