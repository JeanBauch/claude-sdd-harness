# claude-sdd-harness

Harness for spec-driven, agent-driven development with Claude Code (Pro plan, solo projects, JS/Node/Next).
Design and rationale: `docs/pesquisa-workflow-agentico.md`. Phase-by-phase playbook: `docs/playbook.md`.

## Layout
- `templates/project/`: copied into each project by `scripts/apply-template.mjs` (`{{PROJECT_NAME}}` is substituted; `gitignore.append` is merged, not copied).
- `templates/project/.claude/hooks/`: deterministic gates. Node only (no bash, jq or sleep) so they run on native Windows; they read `cwd` from the hook JSON so they follow worktrees.
- `tests/`: `node:test` suites. Hooks are tested by piping hook JSON into the script, with stub `tsc`/`vitest`/`prettier` binaries.

## Commands
- Test: `npm test` (zero dependencies)
- Preview applying the template: `node scripts/apply-template.mjs <dir> --name <project> --dry-run`

## Rules
- Change a hook test-first: add the failing case in `tests/`, then change the hook.
- Keep `templates/project/CLAUDE.md` short; procedures belong in skills, review judgement in `CODING_STANDARDS.md`.
- Findings from a project's `/retro` land here as template changes, committed as `retro(<project>): <change>`.
- Human-facing docs in Brazilian Portuguese; code, identifiers and commit messages in English.
