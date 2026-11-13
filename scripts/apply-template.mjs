#!/usr/bin/env node
// Copies templates/project into a target project.
// Usage: node scripts/apply-template.mjs <targetDir> [--name <project>] [--force] [--dry-run]
//   - never overwrites an existing file unless --force (reported as "skip")
//   - replaces {{PROJECT_NAME}} in every copied file
//   - gitignore.append is merged into the target .gitignore (missing lines only), not copied
import { appendFileSync, existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs'
import { basename, dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const templateDir = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'templates', 'project')
const GITIGNORE_FRAGMENT = 'gitignore.append'

function parseArgs(argv) {
  const opts = { target: null, name: null, force: false, dryRun: false }
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (a === '--name') opts.name = argv[++i]
    else if (a === '--force') opts.force = true
    else if (a === '--dry-run') opts.dryRun = true
    else if (!opts.target) opts.target = a
    else throw new Error(`unexpected argument: ${a}`)
  }
  if (!opts.target) throw new Error('usage: apply-template.mjs <targetDir> [--name <project>] [--force] [--dry-run]')
  opts.target = resolve(opts.target)
  opts.name ??= basename(opts.target)
  return opts
}

function templateFiles(dir, prefix = '') {
  return readdirSync(dir).flatMap((entry) => {
    const rel = prefix ? `${prefix}/${entry}` : entry
    return statSync(join(dir, entry)).isDirectory() ? templateFiles(join(dir, entry), rel) : [rel]
  })
}

function mergeGitignore(target, dryRun) {
  const wanted = readFileSync(join(templateDir, GITIGNORE_FRAGMENT), 'utf8').split(/\r?\n/)
  const file = join(target, '.gitignore')
  const current = existsSync(file) ? readFileSync(file, 'utf8') : ''
  const have = new Set(current.split(/\r?\n/).map((l) => l.trim()))
  const missing = wanted.filter((l) => l.trim() && !l.startsWith('#') && !have.has(l.trim()))
  if (missing.length === 0) return 'keep      .gitignore (already has the Claude Code entries)'
  if (!dryRun) {
    const prefix = current && !current.endsWith('\n') ? '\n' : ''
    appendFileSync(file, `${prefix}\n# Claude Code (local only)\n${missing.join('\n')}\n`)
  }
  return `append    .gitignore (+${missing.length} lines)`
}

function main() {
  const opts = parseArgs(process.argv.slice(2))
  if (!existsSync(opts.target) || !statSync(opts.target).isDirectory()) {
    console.error(`target directory not found: ${opts.target}`)
    process.exit(1)
  }
  const report = []
  for (const rel of templateFiles(templateDir)) {
    if (rel === GITIGNORE_FRAGMENT) continue
    const dest = join(opts.target, rel)
    const exists = existsSync(dest)
    if (exists && !opts.force) {
      report.push(`skip      ${rel} (exists; use --force to overwrite)`)
      continue
    }
    report.push(`${exists ? 'overwrite' : 'create   '} ${rel}`)
    if (opts.dryRun) continue
    const content = readFileSync(join(templateDir, rel), 'utf8').replaceAll('{{PROJECT_NAME}}', opts.name)
    mkdirSync(dirname(dest), { recursive: true })
    writeFileSync(dest, content)
  }
  report.push(mergeGitignore(opts.target, opts.dryRun))
  console.log(`${opts.dryRun ? '[dry run] ' : ''}apply-template → ${opts.target} (project: ${opts.name})`)
  for (const line of report) console.log(`  ${line}`)
}

try {
  main()
} catch (error) {
  console.error(error.message)
  process.exit(1)
}
