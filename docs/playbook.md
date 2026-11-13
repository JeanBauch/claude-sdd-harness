# Playbook: do pedido ao merge

Roteiro operacional do Pipeline A (ver `pesquisa-workflow-agentico.md`, seção 6). **Você decide; o agente executa.** Cada fase termina num portão que só você abre.

## Antes de começar

- Abra o Claude **na pasta do projeto** (`cd <projeto> && claude`, ou abra a pasta no VS Code). Só assim o `.claude/settings.json` do projeto carrega.
- Confira em `/plugin` que `superpowers`, `spec-driven-dev`, `engineering`, `agent-architecture-designer` e `supabase` estão **desligados** e que `mattpocock-skills` está ligado.
- Na primeira vez num repo: `/mattpocock-skills:setup-matt-pocock-skills` (tracker GitHub, labels padrão, single-context), depois `gh label create type:spec` e `gh label create type:ticket`.
- Mods: `/quota` (cota do Pro), `/context-lens` (contexto), `/pull-request-pane` (PR, CI e review) e `/flow` (subagentes).

## Fases

| Fase | Comando | Sai daqui | Portão (você) |
|---|---|---|---|
| **F1 Descoberta** | `/effort high`, depois `/mattpocock-skills:grill-with-docs` + descrição curta da ideia | Decisões tomadas; `GLOSSARY.md`; ADRs só do que for difícil de reverter | **G1:** nenhuma pergunta pendente |
| **F4 System design** (no mesmo grilling) | Peça explicitamente: "agora as decisões técnicas: persistência, fronteiras de módulo, server actions × route handlers, validação" | "Implementation Decisions"; ADRs | **G3:** você aprova cada trade-off |
| **F2 Spec** | `/mattpocock-skills:to-spec` e peça: critérios de aceite Given/When/Then por história, requisitos não funcionais, seção "Perguntas em aberto: nenhuma" | Issue com label `type:spec` (ainda **sem** `ready-for-agent`) | — |
| **F3 Lacunas** | Cole o prompt da seção "Prompt F3" abaixo | Lista numerada de lacunas → responda no formato do grilling → spec atualizada | **G2:** zero lacunas abertas → aplique `ready-for-agent` |
| **F5 Tickets** | `/mattpocock-skills:to-tickets #<spec>` | 3 a 5 sub-issues (`type:ticket`) com `blocked-by` nativo | **G4:** granularidade e dependências aprovadas → `/clear` |
| **F6 Implementação** | `git switch -c feat/<spec#>-<slug>`, depois `/mattpocock-skills:implement #<ticket>`, um ticket por vez, na ordem da fronteira | Um commit `feat(#<ticket>): …` por ticket; ticket fechado com SHA | DoD (abaixo) |
| **F7 Verificação** | `/mattpocock-skills:code-review main` → `/code-review` → correções → `/mattpocock-skills:pr` → `gh pr create` | PR com Summary, Evidence e Merge Danger; CI verde | **Você faz o merge** |
| **F8 Retro** | `/mattpocock-skills:retro` | Melhorias no ambiente → viram commit `retro(<projeto>): …` no harness | — |

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

## Definition of Ready (ticket)

Critérios de aceite testáveis · seam de teste definido · bloqueadores declarados · zero dúvidas · cabe numa janela de contexto nova · comando de verificação conhecido.

## Definition of Done (ticket)

Teste vermelho → verde no seam · `pnpm typecheck`, `pnpm lint` e `pnpm test` verdes, **com o comando e a saída como evidência** · commit `feat(#n)` · `ASSUMPTION:` registradas no ticket · ticket fechado com o SHA.

## Fronteira de fase: continuar, `/clear` ou `/compact`?

Na ordem (critério do Matt): **continuar** se a próxima fase precisa desta conversa como fonte primária (por exemplo, grilling → spec). **`/clear`** se tudo o que importa já está no GitHub (por exemplo, depois do G4). **Subagente** se a tarefa roda sem você. **`/compact <foco>`** só em último caso. Nunca no meio de uma fase.

## Quando algo trava

- **O verify-gate não deixa o turno terminar:** leia o erro, que é o motivo real. Para desligar só nesta sessão: `SDD_VERIFY_GATE=off claude`.
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
