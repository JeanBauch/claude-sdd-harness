import { test } from 'node:test'
import assert from 'node:assert/strict'
import { git, gitRepo, runHook } from './helpers.mjs'

const bash = (command, cwd) => ({ hook_event_name: 'PreToolUse', tool_name: 'Bash', tool_input: { command }, cwd })

// A repo checked out on a feature branch, so a bare `git push` is not a push to main.
const featureRepo = gitRepo()
git(featureRepo, 'switch', '-q', '-c', 'feat/1-x')
const mainRepo = gitRepo()

const blocked = [
  'git push --force origin feat/x',
  'git push -f',
  'git push -uf origin feat/x',
  'git push --force-with-lease origin feat/x',
  'git push origin +feat/x',
  'git push origin main',
  'git push origin HEAD:main',
  'git push origin refs/heads/master',
  'git push --mirror',
  'git push origin --delete feat/x',
  'git -C ../other push -f origin x',
  'pnpm test && git push -f',
  'git reset --hard HEAD~1',
  'git clean -fd',
  'git clean -xdf',
  'git checkout .',
  'git checkout -- .',
  'git restore .',
  'git branch -D feat/x',
  'git branch -d main',
  'gh pr merge 3 --squash',
  'gh repo delete me/repo --yes',
]

const allowed = [
  'git push -u origin feat/1-x',
  'git push origin feat/1-x',
  'git status',
  'git log --format=%H -n 3',
  'git reset --soft HEAD~1',
  'git clean -n',
  'git checkout -b feat/2-y',
  'git restore --staged src/a.ts',
  'git branch -d feat/old',
  'gh pr view 3',
  'gh pr create --draft --title x --body y',
  'echo "git push -f"',
  'pnpm test',
]

for (const command of blocked) {
  test(`blocks: ${command}`, () => {
    const r = runHook('git-guardrails.mjs', bash(command, featureRepo))
    assert.equal(r.code, 2, `expected exit 2, got ${r.code}\n${r.stderr}`)
    assert.match(r.stderr, /git-guardrails/)
  })
}

for (const command of allowed) {
  test(`allows: ${command}`, () => {
    const r = runHook('git-guardrails.mjs', bash(command, featureRepo))
    assert.equal(r.code, 0, `expected exit 0, got ${r.code}\n${r.stderr}`)
  })
}

test('blocks a bare `git push` while the checkout is on main', () => {
  const r = runHook('git-guardrails.mjs', bash('git push', mainRepo))
  assert.equal(r.code, 2, r.stderr)
})

test('allows a bare `git push` on a feature branch', () => {
  const r = runHook('git-guardrails.mjs', bash('git push', featureRepo))
  assert.equal(r.code, 0, r.stderr)
})

test('ignores tools other than Bash', () => {
  const r = runHook('git-guardrails.mjs', { tool_name: 'Read', tool_input: { file_path: 'x' }, cwd: featureRepo })
  assert.equal(r.code, 0)
})
