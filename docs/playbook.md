# Playbook: do pedido ao merge

Roteiro operacional do Pipeline A (ver `pesquisa-workflow-agentico.md`, seção 6). **Você decide; o agente executa.** Cada fase termina num portão que só você abre.

## Antes de começar

- Abra o Claude **na pasta do projeto** (`cd <projeto> && claude`, ou abra a pasta no VS Code). Só assim o `.claude/settings.json` do projeto carrega.
- Confira em `/plugin` que `superpowers`, `spec-driven-dev`, `engineering`, `agent-architecture-designer` e `supabase` estão **desligados** e que `mattpocock-skills` está ligado.
- Na primeira vez num repo: `/mattpocock-skills:setup-matt-pocock-skills` (tracker GitHub, labels padrão, single-context), depois `gh label create type:spec`, `gh label create type:ticket` e `gh label create model:opus`.
- Mods: `/quota` (cota do Pro), `/context-lens` (contexto), `/pull-request-pane` (PR, CI e review) e `/flow` (subagentes).

## Fases

| Fase | Comando | Sai daqui | Portão (você) |
|---|---|---|---|
| **F1 Descoberta** | `/effort high`, depois `/mattpocock-skills:grill-with-docs` + descrição curta da ideia | Decisões tomadas; `GLOSSARY.md`; ADRs só do que for difícil de reverter | **G1:** nenhuma pergunta pendente |
| **F4 System design** (no mesmo grilling) | Peça explicitamente: "agora as decisões técnicas: persistência, fronteiras de módulo, server actions × route handlers, validação" | "Implementation Decisions"; ADRs | **G3:** você aprova cada trade-off |
| **F2 Spec** | `/mattpocock-skills:to-spec` e peça: critérios de aceite Given/When/Then por história, requisitos não funcionais, seção "Perguntas em aberto: nenhuma" | Issue com label `type:spec` (ainda **sem** `ready-for-agent`) | — |
| **F3 Lacunas** | Cole o prompt da seção "Prompt F3" abaixo | Lista numerada de lacunas → responda no formato do grilling → spec atualizada | **G2:** zero lacunas abertas → aplique `ready-for-agent` |
| **F5 Tickets** | `/mattpocock-skills:to-tickets #<spec>` | Sub-issues (`type:ticket`) com `blocked-by` nativo | **G4:** granularidade e dependências aprovadas; marque `model:opus` nos tickets arriscados (ver abaixo) → `/clear` |
| **F6 + F7 por ticket** | `/ship-ticket` (propõe o próximo ticket livre) ou `/ship-ticket <n>` | Branch `feat/<n>-<slug>` → `implementer` (Sonnet, ou Opus) → reviews com veredito por finding → PR → CI verde | **Você faz o merge** → `/clear` → próximo `/ship-ticket` |
| **F8 Retro** (ao fechar o spec) | Gere a evidência e rode o `/mattpocock-skills:retro` com o prompt da seção "Prompt F8" | Candidatos com ocorrências e ponteiros → mudanças em branch `chore/retro-<n>` no projeto ou commit `retro(<projeto>): …` no harness | **Você aprova** cada candidato |

**Quando marcar `model:opus` no G4:** o ticket mexe com concorrência, transações, máquinas de estado, cache e invalidação, autenticação e permissões, ou dinheiro. Em dúvida, deixe sem o label: a `/ship-ticket` escala para Opus sozinha se o Sonnet travar ou se o review achar bug de correção, e comenta o motivo no ticket. Escaladas frequentes indicam que o critério do G4 precisa mudar.

**Requisitos de desempenho no F3 e no G4:** cada um vira (1) um teste determinístico que pega a regressão, contando consultas ou operações, e (2) um limite absoluto folgado tirado do próprio requisito. Nunca um limite em milissegundos calibrado na máquina de quem escreveu: ele oscila no CI.

**Regras ficam numa camada à parte:** nas branches `feat/*` e `fix/*`, o hook `protect-paths` bloqueia edições em `CLAUDE.md`, `AGENTS.md`, `CODING_STANDARDS.md` e `.claude/**`. O implementer propõe a mudança num comentário `NEEDS-DECISION:`, e ela entra no F8.

## Prompt F3 (análise de lacunas)

Cole numa mensagem, trocando `<N>`:

```text
Use um subagente general-purpose NOVO (não um fork), somente leitura, para criticar a spec #<N>.
Ele deve ler a issue (gh issue view <N> --comments), GLOSSARY.md, docs/adr/ e o código atual, e procurar:
termos vagos ou em conflito com o glossário; atores, estados e erros que faltam; casos de borda e concorrência;
ciclo de vida dos dados e migrações; critérios de aceite que não dá para testar; requisitos não funcionais
ausentes (desempenho, segurança, privacidade, acessibilidade); conflitos com ADRs; escopo que vazou; e
principalmente decisões que um LLM teria de inferir sozinho durante a implementação.
Formato: perguntas numeradas, cada uma com uma resposta recomendada, no estilo do grilling. Até 400 palavras.
Pule estilo e redação.
```

## Prompt F8 (retro do spec)

Num terminal na pasta do projeto, gere a evidência. O script lê as transcrições de todas as sessões do spec, incluindo subagentes, e os tickets e PRs via `gh`. Não gasta tokens.

```bash
node <harness>/scripts/retro-evidence.mjs --project . --spec <N> --out ../retro-spec-<N>.md
```

Depois, numa sessão nova no projeto:

```text
/mattpocock-skills:retro Fonte primária: ../retro-spec-<N>.md (evidência do spec #<N>, todos os tickets).
Abra as transcrições só nos ponteiros arquivo:linha que precisar (pasta ~/.claude/projects/<projeto>/).
Para cada candidato, informe: ocorrências, tickets afetados, ponteiros de evidência e destino
(harness: vale para qualquer projeto · projeto: ADR, CODING_STANDARDS ou skill local · memória do usuário: fato da máquina).
Marque como "caso isolado" o que aparece em um só ticket. Proponha também remover regras que a evidência mostra sem efeito.
```

As mudanças aprovadas vão para uma branch `chore/retro-<N>` no projeto. As que valem para qualquer projeto viram commit no harness, com o trailer `Retro-Source: <projeto> spec #<N>`.

## Definition of Ready (ticket)

Critérios de aceite testáveis · seam de teste definido · bloqueadores declarados · zero dúvidas · cabe numa janela de contexto nova · comando de verificação conhecido.

## Definition of Done (ticket)

Teste vermelho → verde no seam · `pnpm typecheck`, `pnpm lint` e `pnpm test` verdes, **com o comando e a saída como evidência** · commit `feat(#n)` · `ASSUMPTION:` registradas no ticket · todo finding com veredito (fix, accept ou reject) · PR com `Closes #n` e CI verde · linha `Métricas:` no ticket.

## Fronteira de fase: continuar, `/clear` ou `/compact`?

Na ordem (critério do Matt): **continuar** se a próxima fase precisa desta conversa como fonte primária (por exemplo, grilling → spec). **`/clear`** se tudo o que importa já está no GitHub (por exemplo, depois do G4). **Subagente** se a tarefa roda sem você. **`/compact <foco>`** só em último caso. Nunca no meio de uma fase.

## Quando algo trava

- **O verify-gate não deixa o turno terminar:** leia o erro, que é o motivo real (formatação, tipo ou teste). Numa branch de feature, ele também checa o que já foi commitado desde `main`, então um erro de um ticket anterior bloqueia. Para desligar só nesta sessão: `SDD_VERIFY_GATE=off claude`.
- **Um hook bloqueou um comando legítimo** (por exemplo, `git push` que você quer fazer): rode você mesmo no terminal. O agente não deve tentar contornar.
- **O agente comentou `NEEDS-DECISION:`:** decida no ticket e diga "continue".

## Registro do piloto (preencha ao final)

| Métrica | Valor |
|---|---|
| Cota usada (janela de 5 horas / 7 dias, via `/quota`) | |
| Rodadas de grilling até o G1 | |
| Lacunas encontradas no F3 | |
| Tickets / tickets reabertos | |
| Findings do review (verdadeiros / rejeitados) | |
| `ASSUMPTION:` que chegaram ao PR | |
| Bloqueios do verify-gate (úteis / ruído) | |

Para medir: anote o % do `/usage` **antes e depois de cada fase** (o `/quota` não grava o valor). Os demais números saem das transcrições em `~/.claude/projects/<projeto>/*.jsonl` (subagentes em `<sessão>/subagents/`) e da API do GitHub (issues, comentários `ASSUMPTION:`, eventos `reopened`).

### Piloto 1: reading-list (2026-11-13)

| Métrica | Valor |
|---|---|
| Cota usada | 12% da janela de 5 horas e 8% da semana, lidos no fim, incluindo a sessão do harness. ~219 mil tokens de saída e ~22,7 milhões de leitura de cache, tudo Opus, em 3 sessões e 4 subagentes, das 16:55 às 21:17. Maiores consumidores: `/mattpocock-skills:tdd` (13%) e o plugin do Matt (24% no total) |
| Rodadas de grilling até o G1 | 3 (15 perguntas) |
| Lacunas encontradas no F3 | 11, todas aceitas e incorporadas na spec |
| Tickets / tickets reabertos | 5 / 0, mais 2 de follow-up (#8 e #9) |
| Findings do review (verdadeiros / rejeitados) | 26 / 3, num total de 29. `/code-review` embutido: 7 corrigidos, 2 aceitos como risco, 1 rejeitado. Standards: 3 corrigidos, 5 aceitos, 2 rejeitados. Spec: 1 corrigido, 8 aceitos. Os 3 bugs de correção (transação sem ROLLBACK, corrida do Cancelar, rejeição de Server Action) vieram só do `/code-review` embutido |
| `ASSUMPTION:` que chegaram ao PR | 4 (#2, #4, #5, #6); `NEEDS-DECISION:` 0 |
| Bloqueios do verify-gate (úteis / ruído) | 0 / 0 em 4 execuções. **Inócuo:** o hook só olhava mudanças não commitadas, e cada ticket era commitado antes do fim do turno. Corrigido no harness |

**Achados levados ao template:** verify-gate passa a cobrir os commits da branch e a checar o `prettier --check`; `format:check` no CI; duas regras de erros no `CODING_STANDARDS.md`; gotchas de edição por `sed` e de pipe que esconde o exit code.

**Resolvido na Etapa 2:** 1 PR por ticket com `/ship-ticket` · implementador em Sonnet, com `model:opus` e escalada automática · regra do `ready-for-agent` no `CLAUDE.md` · `CODING_STANDARDS.md` lido antes de codificar · bloqueio de Edit/Write em `node_modules/`.

**Skills de padrões** (`next-architecture`, `react-state`, `seo`): escritas a partir de `docs/research/`, pré-carregadas pelo `implementer` e cobradas pelo review via `CODING_STANDARDS.md`. Ficam para depois do deploy: Lighthouse CI e as skills específicas do projeto grande.
