import { test } from 'node:test'
import assert from 'node:assert/strict'
import { runHook } from './helpers.mjs'

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
