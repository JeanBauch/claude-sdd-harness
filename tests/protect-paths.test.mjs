import { test } from 'node:test'
import assert from 'node:assert/strict'
import { join } from 'node:path'
import { gitRepo, git, runHook } from './helpers.mjs'

const edit = (file_path, tool_name = 'Edit') => ({ hook_event_name: 'PreToolUse', tool_name, tool_input: { file_path } })

const blocked = [
  '.env',
  '.env.local',
  'apps/web/.env.production',
  'C:\\proj\\.env.development.local',
  'pnpm-lock.yaml',
  'package-lock.json',
  'yarn.lock',
  'bun.lock',
  'node_modules/next/dist/server/lib/start-server.js',
  'F:\\proj\\node_modules\\react\\index.js',
  'packages/web/node_modules/.pnpm/x/index.js',
]

const allowed = ['.env.example', 'src/app/page.tsx', 'src/environment.ts', 'docs/env.md', 'package.json', 'src/node_modules_notes.md']

for (const file of blocked) {
  test(`blocks edits to ${file}`, () => {
    const r = runHook('protect-paths.mjs', edit(file))
    assert.equal(r.code, 2, r.stderr)
    assert.match(r.stderr, /protect-paths/)
  })
}

for (const file of allowed) {
  test(`allows edits to ${file}`, () => {
    const r = runHook('protect-paths.mjs', edit(file, 'Write'))
    assert.equal(r.code, 0, r.stderr)
  })
}

test('ignores tools without a file path', () => {
  const r = runHook('protect-paths.mjs', { tool_name: 'Bash', tool_input: { command: 'cat .env' } })
  assert.equal(r.code, 0)
})

// Rule files are a separate layer: they change on retro (chore/*) branches, never inside a ticket.
function repoOn(branch) {
  const root = gitRepo()
  if (branch !== 'main') git(root, 'switch', '-q', '-c', branch)
  return root
}

const editIn = (root, rel) => ({ hook_event_name: 'PreToolUse', tool_name: 'Edit', cwd: root, tool_input: { file_path: join(root, rel) } })

const ruleFiles = ['CLAUDE.md', 'AGENTS.md', 'CODING_STANDARDS.md', '.claude/skills/ship-ticket/SKILL.md', '.claude/settings.json', '.claude/hooks/verify-gate.mjs', 'packages/web/CLAUDE.md']

for (const rel of ruleFiles) {
  test(`blocks ${rel} on a ticket branch`, () => {
    const root = repoOn('feat/9-volume-test')
    const r = runHook('protect-paths.mjs', editIn(root, rel))
    assert.equal(r.code, 2, r.stderr)
    assert.match(r.stderr, /NEEDS-DECISION/)
  })
}

test('blocks rule files on fix/ ticket branches too', () => {
  const r = runHook('protect-paths.mjs', editIn(repoOn('fix/12-typo'), 'CODING_STANDARDS.md'))
  assert.equal(r.code, 2, r.stderr)
})

test('allows source edits on a ticket branch', () => {
  const r = runHook('protect-paths.mjs', editIn(repoOn('feat/9-volume-test'), 'src/a.ts'))
  assert.equal(r.code, 0, r.stderr)
})

for (const branch of ['main', 'chore/retro-2']) {
  test(`allows rule files on ${branch}`, () => {
    const r = runHook('protect-paths.mjs', editIn(repoOn(branch), 'CLAUDE.md'))
    assert.equal(r.code, 0, r.stderr)
  })
}

test('allows rule files outside the repo, such as user memory', () => {
  const root = repoOn('feat/9-volume-test')
  const outside = gitRepo()
  const r = runHook('protect-paths.mjs', { tool_name: 'Write', cwd: root, tool_input: { file_path: join(outside, 'CLAUDE.md') } })
  assert.equal(r.code, 0, r.stderr)
})
