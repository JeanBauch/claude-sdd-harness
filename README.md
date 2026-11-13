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

O script nunca sobrescreve arquivos existentes sem `--force`. Depois, numa sessão do Claude aberta na pasta do projeto, rode `/mattpocock-skills:setup-matt-pocock-skills`.

## O que o template instala

| Arquivo | Função |
|---|---|
| `.claude/settings.json` | Liga o plugin do Matt e desliga os plugins concorrentes (Superpowers e outros); permissões; hooks |
| `.claude/hooks/verify-gate.mjs` | `Stop`: typecheck + `vitest related` nos arquivos alterados; bloqueia o fim do turno se algo estiver vermelho |
| `.claude/hooks/git-guardrails.mjs` | Bloqueia force push, push para `main`, `reset --hard`, `clean -f`, `checkout .`, `branch -D`, `gh pr merge` |
| `.claude/hooks/protect-paths.mjs` | Bloqueia a edição de `.env*` e lockfiles |
| `.claude/hooks/format.mjs` | Prettier no arquivo editado |
| `CLAUDE.md`, `CODING_STANDARDS.md` | Regras do fluxo e padrões para o review |
| `.github/workflows/ci.yml` | lint → typecheck → test → build → e2e |

Para desligar o verify-gate numa sessão: `SDD_VERIFY_GATE=off claude`.

## Desenvolvimento

`npm test` roda as suítes (`node:test`, sem dependências) em Ubuntu e Windows na CI.
