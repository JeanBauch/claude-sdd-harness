import { test } from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { gitRepo, installStubs, runHook, tempDir, writeFile } from './helpers.mjs'

const stop = (cwd) => ({ hook_event_name: 'Stop', stop_hook_active: false, cwd })
const calls = (root) => (existsSync(join(root, 'calls.log')) ? readFileSync(join(root, 'calls.log'), 'utf8') : '')

test('passes outside a git repository', () => {
  const r = runHook('verify-gate.mjs', stop(tempDir()))
  assert.equal(r.code, 0, r.stderr)
})

test('passes without running anything when no code file changed', () => {
  const root = gitRepo()
  installStubs(root, { tsc: { exit: 1, out: 'error TS1: should not run' } })
  writeFile(root, 'README.md', '# changed docs only\n')
  const r = runHook('verify-gate.mjs', stop(root))
  assert.equal(r.code, 0, r.stderr)
  assert.equal(calls(root), '')
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
