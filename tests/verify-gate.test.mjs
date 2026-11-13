import { test } from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { git, gitRepo, installStubs, runHook, tempDir, writeFile } from './helpers.mjs'

const stop = (cwd) => ({ hook_event_name: 'Stop', stop_hook_active: false, cwd })
const calls = (root) => (existsSync(join(root, 'calls.log')) ? readFileSync(join(root, 'calls.log'), 'utf8') : '')

test('passes outside a git repository', () => {
  const r = runHook('verify-gate.mjs', stop(tempDir()))
  assert.equal(r.code, 0, r.stderr)
})

test('passes without running anything when nothing changed', () => {
  const root = gitRepo()
  installStubs(root, { tsc: { exit: 1, out: 'error TS1: should not run' } })
  const r = runHook('verify-gate.mjs', stop(root))
  assert.equal(r.code, 0, r.stderr)
  assert.equal(calls(root), '')
})

test('does not typecheck or test when only docs changed, but checks their formatting', () => {
  const root = gitRepo()
  installStubs(root, { tsc: { exit: 1, out: 'error TS1: should not run' } })
  writeFile(root, 'README.md', '# changed docs only\n')
  const r = runHook('verify-gate.mjs', stop(root))
  assert.equal(r.code, 0, r.stderr)
  assert.doesNotMatch(calls(root), /^(tsc|vitest)/m)
  assert.match(calls(root), /^prettier --check --ignore-unknown .*README\.md/m)
})

test('blocks the stop when prettier --check fails on a changed file', () => {
  const root = gitRepo()
  installStubs(root, { tsc: { exit: 0 }, vitest: { exit: 0 }, prettier: { exit: 1, out: '[warn] src/a.ts' } })
  writeFile(root, 'src/a.ts', 'export const   a = 2\n')
  const r = runHook('verify-gate.mjs', stop(root))
  assert.equal(r.code, 2)
  assert.match(r.stderr, /prettier --write/)
  assert.match(r.stderr, /\[warn\] src\/a\.ts/)
})

test('on a feature branch, checks code already committed since main (commit-per-ticket flow)', () => {
  const root = gitRepo()
  installStubs(root, { tsc: { exit: 2, out: 'src/b.ts(1,14): error TS2322' }, vitest: { exit: 0 } })
  git(root, 'switch', '-q', '-c', 'feat/1-x')
  writeFile(root, 'src/b.ts', "export const b: number = 'x'\n")
  git(root, 'add', '.')
  git(root, 'commit', '-q', '-m', 'feat(#2): b')
  const r = runHook('verify-gate.mjs', stop(root))
  assert.equal(r.code, 2)
  assert.match(r.stderr, /TS2322/)
})

test('on a feature branch, related tests cover committed and uncommitted files', () => {
  const root = gitRepo()
  installStubs(root, { tsc: { exit: 0 }, vitest: { exit: 0 } })
  git(root, 'switch', '-q', '-c', 'feat/1-x')
  writeFile(root, 'src/b.ts', 'export const b = 1\n')
  git(root, 'add', '.')
  git(root, 'commit', '-q', '-m', 'feat(#2): b')
  writeFile(root, 'src/c.ts', 'export const c = 1\n')
  const r = runHook('verify-gate.mjs', stop(root))
  assert.equal(r.code, 0, r.stderr)
  const related = calls(root).split('\n').find((l) => l.startsWith('vitest related'))
  assert.match(related, /src\/b\.ts/)
  assert.match(related, /src\/c\.ts/)
  assert.doesNotMatch(related, /src\/a\.ts/)
})

test('on main, committed history is not re-checked', () => {
  const root = gitRepo()
  installStubs(root, { tsc: { exit: 1, out: 'error TS1: should not run' } })
  const r = runHook('verify-gate.mjs', stop(root))
  assert.equal(r.code, 0, r.stderr)
  assert.equal(calls(root), '')
})

test('skips re-checking when nothing changed since the last green run', () => {
  const root = gitRepo()
  installStubs(root, { tsc: { exit: 0 }, vitest: { exit: 0 } })
  writeFile(root, 'src/a.ts', 'export const a = 2\n')
  assert.equal(runHook('verify-gate.mjs', stop(root)).code, 0)
  assert.equal(runHook('verify-gate.mjs', stop(root)).code, 0)
  assert.equal(calls(root).match(/^tsc /gm).length, 1)
  writeFile(root, 'src/a.ts', 'export const a = 3\n')
  assert.equal(runHook('verify-gate.mjs', stop(root)).code, 0)
  assert.equal(calls(root).match(/^tsc /gm).length, 2)
})

test('re-checks after a failed run even if nothing changed', () => {
  const root = gitRepo()
  installStubs(root, { tsc: { exit: 2, out: 'error TS2322' } })
  writeFile(root, 'src/a.ts', "export const a: number = 'x'\n")
  assert.equal(runHook('verify-gate.mjs', stop(root)).code, 2)
  assert.equal(runHook('verify-gate.mjs', stop(root)).code, 2)
})

test('ignores changes under .claude/', () => {
  const root = gitRepo()
  installStubs(root, { tsc: { exit: 1, out: 'error TS1' } })
  writeFile(root, '.claude/hooks/x.mjs', 'export {}\n')
  const r = runHook('verify-gate.mjs', stop(root))
  assert.equal(r.code, 0, r.stderr)
})

test('blocks the stop with the typecheck output when tsc fails', () => {
  const root = gitRepo()
  installStubs(root, { tsc: { exit: 2, out: "src/a.ts(1,14): error TS2322: Type 'string' is not assignable" } })
  writeFile(root, 'src/a.ts', "export const a: number = 'x'\n")
  const r = runHook('verify-gate.mjs', stop(root))
  assert.equal(r.code, 2)
  assert.match(r.stderr, /TS2322/)
  assert.match(r.stderr, /verify-gate/)
})

test('blocks the stop with the test output when related tests fail', () => {
  const root = gitRepo()
  installStubs(root, { tsc: { exit: 0 }, vitest: { exit: 1, out: 'FAIL src/a.test.ts > adds' } })
  writeFile(root, 'src/a.ts', 'export const a = 2\n')
  const r = runHook('verify-gate.mjs', stop(root))
  assert.equal(r.code, 2)
  assert.match(r.stderr, /FAIL src\/a\.test\.ts/)
})

test('runs related tests only for changed, existing code files and passes when green', () => {
  const root = gitRepo()
  installStubs(root, { tsc: { exit: 0 }, vitest: { exit: 0 } })
  writeFile(root, 'src/a.ts', 'export const a = 2\n')
  writeFile(root, 'src/new.tsx', 'export const B = () => null\n')
  const r = runHook('verify-gate.mjs', stop(root))
  assert.equal(r.code, 0, r.stderr)
  const log = calls(root)
  assert.match(log, /^tsc --noEmit/m)
  assert.match(log, /^vitest related --run --passWithNoTests .*src\/a\.ts/m)
  assert.match(log, /src\/new\.tsx/)
})

test('passes when the project has no TypeScript or Vitest installed', () => {
  const root = gitRepo()
  writeFile(root, 'src/a.ts', 'export const a = 3\n')
  const r = runHook('verify-gate.mjs', stop(root))
  assert.equal(r.code, 0, r.stderr)
})

test('can be switched off for a session with SDD_VERIFY_GATE=off', () => {
  const root = gitRepo()
  installStubs(root, { tsc: { exit: 2, out: 'error TS2322' } })
  writeFile(root, 'src/a.ts', "export const a: number = 'x'\n")
  const r = runHook('verify-gate.mjs', stop(root), { env: { SDD_VERIFY_GATE: 'off' } })
  assert.equal(r.code, 0, r.stderr)
})

test('format: runs prettier on the edited file and never blocks', () => {
  const root = gitRepo()
  installStubs(root, { prettier: { exit: 1 } })
  const file = join(root, 'src', 'a.ts')
  writeFileSync(file, 'export const   a = 1\n')
  const r = runHook('format.mjs', { hook_event_name: 'PostToolUse', tool_name: 'Edit', tool_input: { file_path: file }, cwd: root })
  assert.equal(r.code, 0, r.stderr)
  assert.match(calls(root), /^prettier --write --ignore-unknown .*a\.ts/m)
})

test('format: does nothing when prettier is not installed', () => {
  const root = gitRepo()
  const r = runHook('format.mjs', { tool_name: 'Write', tool_input: { file_path: join(root, 'src', 'a.ts') }, cwd: root })
  assert.equal(r.code, 0, r.stderr)
})
