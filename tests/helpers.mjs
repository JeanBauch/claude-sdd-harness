import { spawnSync } from 'node:child_process'
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
export const repoRoot = resolve(here, '..')
export const hooksDir = join(repoRoot, 'templates', 'project', '.claude', 'hooks')

/** Runs a hook script the way Claude Code does: JSON on stdin, exit code + stderr back. */
export function runHook(name, input, { env = {}, cwd } = {}) {
  const result = spawnSync(process.execPath, [join(hooksDir, name)], {
    input: JSON.stringify(input),
    encoding: 'utf8',
    cwd: cwd ?? input.cwd ?? repoRoot,
    env: { ...process.env, ...env },
    timeout: 60_000,
  })
  return { code: result.status, stdout: result.stdout, stderr: result.stderr }
}

export function tempDir(prefix = 'sdd-harness-') {
  return mkdtempSync(join(tmpdir(), prefix))
}

export function writeFile(root, relPath, content) {
  const full = join(root, relPath)
  mkdirSync(dirname(full), { recursive: true })
  writeFileSync(full, content)
  return full
}

export function git(cwd, ...args) {
  const r = spawnSync('git', args, { cwd, encoding: 'utf8' })
  if (r.status !== 0) throw new Error(`git ${args.join(' ')} failed: ${r.stderr}`)
  return r.stdout.trim()
}

/** A throwaway git repo with one committed file, so `git status` has something to compare against. */
export function gitRepo() {
  const root = tempDir()
  git(root, 'init', '-q', '-b', 'main')
  git(root, 'config', 'user.email', 'test@example.com')
  git(root, 'config', 'user.name', 'test')
  git(root, 'config', 'commit.gpgsign', 'false')
  writeFile(root, 'src/a.ts', 'export const a = 1\n')
  writeFile(root, 'README.md', '# fixture\n')
  git(root, 'add', '.')
  git(root, 'commit', '-q', '-m', 'init')
  return root
}

/**
 * Fake tool binaries at the paths the hooks look for. Each stub appends its argv to calls.log
 * and exits with the code configured in stub-config.json, so tests control pass/fail.
 */
export function installStubs(root, config) {
  writeFile(root, 'stub-config.json', JSON.stringify(config))
  const stub = (tool) => `
const fs = require('fs'); const path = require('path')
const root = ${JSON.stringify(root)}
const cfg = JSON.parse(fs.readFileSync(path.join(root, 'stub-config.json'), 'utf8'))
fs.appendFileSync(path.join(root, 'calls.log'), ${JSON.stringify(tool)} + ' ' + process.argv.slice(2).join(' ') + '\\n')
const c = cfg[${JSON.stringify(tool)}] || { exit: 0, out: '' }
process.stdout.write(c.out || '')
process.exit(c.exit || 0)
`
  writeFile(root, 'node_modules/typescript/bin/tsc', stub('tsc'))
  writeFile(root, 'node_modules/vitest/vitest.mjs', `import { createRequire } from 'module'\nconst require = createRequire(import.meta.url)\n${stub('vitest')}`)
  writeFile(root, 'node_modules/prettier/bin/prettier.cjs', stub('prettier'))
  writeFile(root, 'tsconfig.json', '{}')
  // keep stubs and their logs out of `git status`
  writeFile(root, '.gitignore', 'node_modules/\ncalls.log\nstub-config.json\n')
  git(root, 'add', '.gitignore', 'tsconfig.json')
  git(root, 'commit', '-q', '-m', 'tooling')
}
