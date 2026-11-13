import { test } from 'node:test'
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { repoRoot, tempDir, writeFile } from './helpers.mjs'

const script = join(repoRoot, 'scripts', 'apply-template.mjs')
const apply = (...args) => {
  const r = spawnSync(process.execPath, [script, ...args], { encoding: 'utf8' })
  return { code: r.status, out: `${r.stdout}${r.stderr}` }
}

function allFiles(dir, prefix = '') {
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name)
    const rel = prefix ? `${prefix}/${name}` : name
    return statSync(full).isDirectory() ? allFiles(full, rel) : [rel]
  })
}

test('dry run lists what would be created and writes nothing', () => {
  const target = tempDir()
  const r = apply(target, '--name', 'demo', '--dry-run')
  assert.equal(r.code, 0, r.out)
  assert.match(r.out, /create\s+CLAUDE\.md/)
  assert.match(r.out, /create\s+\.claude\/settings\.json/)
  assert.match(r.out, /create\s+\.claude\/hooks\/verify-gate\.mjs/)
  assert.deepEqual(readdirSync(target), [])
})

test('copies the template and fills in the project name everywhere', () => {
  const target = tempDir()
  const r = apply(target, '--name', 'demo-app')
  assert.equal(r.code, 0, r.out)
  assert.ok(existsSync(join(target, '.claude', 'hooks', 'git-guardrails.mjs')))
  assert.ok(existsSync(join(target, '.github', 'workflows', 'ci.yml')))
  assert.match(readFileSync(join(target, 'CLAUDE.md'), 'utf8'), /demo-app/)
  for (const file of allFiles(target)) {
    assert.doesNotMatch(readFileSync(join(target, file), 'utf8'), /\{\{PROJECT_NAME\}\}/, file)
  }
  assert.ok(!existsSync(join(target, 'gitignore.append')), 'the append fragment is not copied as a file')
})

test('never overwrites an existing file unless --force is given', () => {
  const target = tempDir()
  writeFile(target, 'CLAUDE.md', 'mine\n')
  const first = apply(target, '--name', 'demo')
  assert.match(first.out, /skip\s+CLAUDE\.md/)
  assert.equal(readFileSync(join(target, 'CLAUDE.md'), 'utf8'), 'mine\n')
  const forced = apply(target, '--name', 'demo', '--force')
  assert.match(forced.out, /overwrite\s+CLAUDE\.md/)
  assert.notEqual(readFileSync(join(target, 'CLAUDE.md'), 'utf8'), 'mine\n')
})

test('appends missing .gitignore lines once and keeps existing ones', () => {
  const target = tempDir()
  writeFile(target, '.gitignore', 'node_modules\n.next\n')
  apply(target, '--name', 'demo')
  apply(target, '--name', 'demo')
  const lines = readFileSync(join(target, '.gitignore'), 'utf8').split(/\r?\n/).filter(Boolean)
  assert.ok(lines.includes('node_modules'))
  assert.ok(lines.includes('CLAUDE.local.md'))
  assert.equal(lines.filter((l) => l === 'CLAUDE.local.md').length, 1)
})

test('fails when the target directory does not exist', () => {
  const r = apply(join(tempDir(), 'missing'))
  assert.notEqual(r.code, 0)
})
