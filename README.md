# claude-sdd-harness

Harness pessoal para desenvolvimento **spec-driven e guiado por agentes** com Claude Code (plano Pro, projetos solo, stack JS/Node/React/Next).

- **Base:** as skills do Matt Pocock (`mattpocock-skills`): grilling → spec → tickets → TDD → review → PR → retro.
- **Garantias determinísticas:** hooks em Node que bloqueiam git destrutivo, protegem `.env` e lockfiles, formatam o código editado e só deixam o turno terminar com typecheck e testes relacionados verdes.
- **GitHub como barramento:** specs e tickets em issues (sub-issues com dependências); merge sempre humano.

Desenho completo e justificativas: [`docs/pesquisa-workflow-agentico.md`](docs/pesquisa-workflow-agentico.md) · Roteiro por fase: [`docs/playbook.md`](docs/playbook.md)

## Usar num projeto

Pré-requisitos: Node 24, pnpm, `gh` autenticado e o plugin `mattpocock-skills@claude-plugins-official` instalado.

```bash
node scripts/apply-template.mjs <pasta-do-projeto> --name <nome> --dry-run   # revisar
node scripts/apply-template.mjs <pasta-do-projeto> --name <nome>             # aplicar
```

As skills de padrões assumem esta configuração, que o script não aplica (o `next.config.ts` e o `eslint.config.mjs` vêm do `create-next-app`):

- `next.config.ts`: `cacheComponents: true`, `partialPrefetching: true`, `reactCompiler: true`;
- `pnpm add -D babel-plugin-react-compiler eslint-plugin-react-hooks`, e o preset `recommended` do `react-hooks` no ESLint.

O script nunca sobrescreve arquivos existentes sem `--force`. Depois, numa sessão do Claude aberta na pasta do projeto, rode `/mattpocock-skills:setup-matt-pocock-skills` e crie os labels `type:spec`, `type:ticket` e `model:opus`.

## O que o template instala

| Arquivo | Função |
|---|---|
| `.claude/settings.json` | Liga o plugin do Matt e desliga os plugins concorrentes (Superpowers e outros); permissões; hooks |
| `.claude/hooks/verify-gate.mjs` | `Stop`: `prettier --check`, typecheck e `vitest related` nos arquivos alterados (os não commitados e, numa branch de feature, tudo o que foi commitado desde `main`); bloqueia o fim do turno se algo estiver vermelho e lembra o último estado verde |
| `.claude/hooks/git-guardrails.mjs` | Bloqueia force push, push para `main`, `reset --hard`, `clean -f`, `checkout .`, `branch -D`, `gh pr merge` |
| `.claude/hooks/protect-paths.mjs` | Bloqueia a edição de `.env*`, lockfiles e `node_modules/` |
| `.claude/skills/ship-ticket/` | `/ship-ticket [#n]`: um ticket de ponta a ponta (branch → implementer → reviews → PR → CI verde); para antes do merge |
| `.claude/skills/next-architecture/`, `react-state/`, `seo/` | Padrões de Next 16, React 19 e SEO, pré-carregados pelo implementer e cobrados pelo review. Fontes: [`docs/research/`](docs/research/) |
| `.claude/agents/implementer.md` | Subagente que implementa um ticket com TDD, em Sonnet (Opus quando o ticket tem `model:opus` ou há escalada) |
| `.claude/hooks/format.mjs` | Prettier no arquivo editado |
| `CLAUDE.md`, `CODING_STANDARDS.md` | Regras do fluxo e padrões para o review |
| `.github/workflows/ci.yml` | format:check → lint → typecheck → test → build → e2e (o projeto precisa dos scripts `format:check`, `lint`, `typecheck`, `test`, `build` e `test:e2e`) |

Para desligar o verify-gate numa sessão: `SDD_VERIFY_GATE=off claude`.

## Desenvolvimento

`npm test` roda as suítes (`node:test`, sem dependências) em Ubuntu e Windows na CI.
