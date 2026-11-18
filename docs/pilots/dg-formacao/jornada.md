# Jornada DG Formação

Registro da construção do DG Formação (Discipulando Gerações) com o claude-sdd-harness. Quem mantém é a sessão acompanhada ([prompt-sessao-acompanhada.md](prompt-sessao-acompanhada.md)). As seções de referência mudam conforme a jornada avança; a seção **Entradas** só recebe linhas novas no fim.

Specs, tickets, PRs e CI vivem no GitHub (`JeanBauch/dg-formacao`), e o histórico, no git dos dois repositórios. Aqui fica o que eles não guardam: o resumo de cada sessão, as decisões de portão e o motivo, a cota, os atritos do harness e as métricas por spec. Este arquivo é público: nada de dados pessoais nem segredos.

## Objetivo

1. Entregar o MVP do DG Formação descrito nos requisitos v2.3 (fatias R0 a R5, seção 10.4), em planos gratuitos (ADR-007).
2. Pôr o harness à prova num projeto grande. Cada atrito com evidência vira candidato à retro e, aprovado, vira mudança no template, com o trailer `Retro-Source: dg-formacao spec #<n>`.

A jornada termina quando o R5 fecha com o critério de saída cumprido e cada spec tem as métricas registradas.

## Mapa das sessões

Quem abre cada portão é o usuário. Cada sessão do projeto termina com `/relatorio-sessao`.

### Preparação

| Sessão | Fase | Objetivo | Portão |
| --- | --- | --- | --- |
| S0 | Bootstrap | Montar o esqueleto Next.js 16.4, aplicar o template do harness, fazer os ajustes do projeto e criar o repositório público protegido | Relatório aceito com: `format:check`, `lint`, `typecheck`, `test`, `build` e `test:e2e` verdes; CI verde na `main`; ruleset `protect-main` ativo; segurança do repositório confirmada; smoke test dos hooks com os códigos de saída esperados |
| S1 | F1 + F4 Descoberta | Rodar `/mattpocock-skills:grill-with-docs` sobre `docs/requisitos/` e gerar o `GLOSSARY.md` e as ADR-001 a 010 em `docs/adr/`. Decidir os itens "Proposto" da seção 1.5 e a ADR-005, devolver as mudanças a `docs/requisitos/` e entregar tudo num PR | G1: nenhuma pergunta pendente · G3: cada trade-off aprovado · merge do PR, o primeiro a passar pelo ruleset |

### R0 Esqueleto e operação

| Sessão | Fase | Objetivo | Portão |
| --- | --- | --- | --- |
| R0.1 | F2 + F3 | Escrever a spec do R0 com `to-spec`. As verificações da seção 10.4 e os itens "Unverified" das skills entram como critérios de aceite. Depois, rodar o prompt F3 | G2: zero lacunas → `ready-for-agent` |
| R0.2 | F5 | `to-tickets #<spec>`: sub-issues com `blocked-by` | G4: granularidade e dependências aprovadas; `model:opus` nos tickets de autenticação, transação, backup e migration |
| R0.3 em diante | F6 + F7, uma sessão por ticket | `/ship-ticket` | Definition of Done completa e merge feito pelo usuário |
| R0.e | Avaliação das skills | Rodar os cenários de `docs/agents/skill-evals/` sem e com cada skill | Placar registrado no README das evals; regra que não muda o placar sai da skill |
| R0.s | Skill `testing-stack` | Escrever a skill e as evals dela a partir dos testes que o R0 criou | Evals escritas e rodadas |
| R0.r | F8 Retro | `retro-evidence.mjs` + `/mattpocock-skills:retro` | Cada candidato aprovado ou rejeitado; spec fechada |

Saída do R0:
- as 7 verificações da seção 10.4 respondidas (uma resposta negativa volta aos requisitos);
- as seções "Unverified" apagadas das duas skills;
- placar das evals preenchido;
- E2E de cadastro e login verdes.

### R1 a R5

Cada fatia repete o ciclo do R0:
- Rn.1 F2 + F3 → G2;
- Rn.2 F5 → G4;
- Rn.3 em diante, F6 + F7 → merge;
- Rn.r F8 → aprovação.

O F4 só volta quando a fatia trouxer uma decisão difícil de reverter, que vira ADR nova.

| Fatia | Antes de começar | Objetivo (seção 10.4) | Saída da fatia |
| --- | --- | --- | --- |
| R1 Vitrine | Skill `ui-design-system`, com evals · grilling da demanda #2 (cursos por liberação), depois da retro do R0 e antes da R1.1 | Design system com os tokens do DESIGN.md, home, catálogo, página do curso, páginas institucionais, carga por CSV, SEO e CSP | CSP e cabeçalhos verificados por teste (RNF-SEG-11); nenhum recurso de terceiros no front (RPV-15); E2E do catálogo verde |
| R2 Aprender | Skill `integrations`, com evals | Matrícula, aula em vídeo com `VideoPlayer`, aula em PDF, `/media/{id}`, conclusão, progresso, Meus cursos e "Continue assistindo" | E2E de assistir e concluir verde (RNF-QUA-01); testes de contrato do `VideoPlayer` |
| R3 Família | — | Perfis, "Quem está assistindo?", perfil infantil e escopo do catálogo, PIN do titular, acompanhamento do responsável e consentimentos | Testes da PROFILES.md verdes: escopo infantil em todas as rotas e bloqueio do PIN |
| R4 Backoffice | — | Formulários, editor de currículo, envio ao R2 com variantes de imagem, revisão, equipe, autores e métricas | E2E de publicar curso verde; uma linha de `audit_log` por escrita da equipe |
| R5 Lançamento | — | Teste de carga com 150 simultâneos, OWASP ZAP, RIPD, runbooks e plano de e-mail do lançamento | Metas da seção 8.1 atingidas no teste de carga; ZAP sem alerta alto; DPs jurídicos fechados |

## Itens "Unverified" das skills

Cada item vira critério de um ticket do R0. Quando o item se confirmar, a linha correspondente sai da skill; se não se confirmar, a regra da skill muda.

| # | Skill | Item a confirmar | Ticket | Resultado |
| --- | --- | --- | --- | --- |
| U1 | data-layer | O drizzle-kit emite `.op('extensions.gin_trgm_ops')` no SQL do índice exatamente como escrito | — | — |
| U2 | data-layer | O tipo de coluna que o CLI do Better Auth gera para `user.id` quando `generateId` devolve UUID | — | — |
| U3 | auth-identity | `schemaName: 'app'` no adapter põe todas as tabelas do Better Auth em `app`, inclusive os campos do plugin admin e `rateLimit` | — | — |
| U4 | auth-identity | O plugin admin guarda vários papéis separados por vírgula em `role` e respeita todos | — | — |
| U5 | auth-identity | O pedido de reset de senha devolve a mesma resposta para e-mail desconhecido | — | — |
| U6 | auth-identity | `after()` funciona dentro dos callbacks de e-mail do Better Auth | — | — |
| U7 | auth-identity | `databaseHooks.user.create.after` roda na requisição do cadastro, de modo que perfil principal e consentimentos podem ser gravados ali | — | — |
| U8 | auth-identity | Um after-hook em `/sign-in/email` alcança e revoga a sessão que acabou de criar (STAFF.md) | — | — |
| U9 | auth-identity | Os nomes de rota do rate limit na 1.7: `/sign-in/email`, `/sign-up/email`, `/request-password-reset` e `/send-verification-email` | — | — |

U3 e U4 se sobrepõem ao item 3 das verificações do R0 (seção 10.4). A spec do R0 trata os dois juntos.

## Avaliações de skill pendentes

| Skill | Cenários | Quando rodar | Placar |
| --- | --- | --- | --- |
| data-layer | 4 (`docs/agents/skill-evals/data-layer.json`) | R0.e, depois dos tickets que criam o schema | — |
| auth-identity | 3 (`docs/agents/skill-evals/auth-identity.json`) | R0.e, depois do ticket da configuração do Better Auth | — |
| testing-stack | a escrever | Fim do R0 | — |
| ui-design-system | a escrever | Antes do R1 | — |
| integrations | a escrever | Antes do R2 | — |

## Levar ao F1

- **Conflito nos requisitos:** a seção 9.5 e a CONFIG.md da skill `auth-identity` mantêm o IP na sessão, porque o rate limit depende dele. Já o item 3 da seção 10.4 pede para verificar que "o registro de IP na sessão pode ser desligado". Decidir qual vale e corrigir o outro lado.
- **A decidir:** a ADR-005 (proposta) e os itens "Proposto" da seção 1.5 (permissões no código, refinamentos técnicos e as fatias da 10.4).

## Atritos do harness

Candidatos à retro, cada um com o ponteiro da evidência. Ficam aqui até a retro de alguma spec decidir.

| # | Atrito | Evidência | Estado |
| --- | --- | --- | --- |
| A1 | O `ci.yml` do template não declara `permissions` e fixa as actions por tag. Isso conflita com a RNF-SEG-13 e é boa prática para qualquer projeto | `templates/project/.github/workflows/ci.yml` | Parcial: `permissions: contents: read` entrou no template (ac5a083). Fixar por SHA vira ticket do R0, junto com o Dependabot |
| A2 | O `.claude/settings.json` do projeto só carrega no início da sessão. Na primeira sessão de um projeto novo, os plugins do usuário (inclusive o SessionStart do superpowers) ficam ligados e os hooks ficam desligados até reiniciar. O playbook não fala disso | `docs/playbook.md:7-8`; relatório da S0, passo 9 | Confirmado: a S0 parou no passo 9 e virou duas sessões (S0 e S0b). Depois do reinício, os plugins e hooks carregaram como esperado (transcrição da S0b) |
| A3 | O playbook não tem uma fase de bootstrap. O que o piloto fez existe só no histórico do git e na memória | `docs/playbook.md` (seções "Antes de começar" e "Fases"); na S0, `vitest.config.mts` e o bloco `# playwright` do `.gitignore`, copiados do piloto | Aberto, 2 ocorrências. Copiar do piloto trouxe o `vite-tsconfig-paths`, que o Vite 8 dispensa, e um `*.tsbuildinfo` duplicado. O passo do `partialPrefetching` também era desnecessário, porque o create-next-app 16.4 já gera essa opção. Candidato: o template passa a trazer `vitest.config.mts`, `playwright.config.ts`, os testes de fumaça e as linhas do Playwright no `gitignore.append`, e o playbook ganha uma seção de bootstrap |
| A4 | O playbook manda conferir os plugins no `/plugin`, que não existe na extensão do VS Code. A lista de skills da sessão serve como prova: nenhuma skill de plugin desligado aparece nela | `docs/playbook.md:8`; relatório da S0b, passo 1 | Aberto. Candidato: o playbook confere os plugins pela lista de skills da própria sessão, o que funciona em qualquer interface |
| A5 | A regra "never edit `.env*` or lockfiles" do `CLAUDE.md` do template fez a S0b tratar o `pnpm remove` como conflito. No R0, cada ticket que instala dependência esbarraria nela, e um lockfile fora do commit quebra o `pnpm install --frozen-lockfile` do CI | `templates/project/CLAUDE.md:21`; relatório da S0b | Corrigido no template: lockfile muda só por `pnpm add` e `pnpm remove`, nunca à mão, como o `protect-paths` já dizia. O projeto recebe a mesma linha no PR da S1 |
| A6 | O `setup-matt-pocock-skills` não criou os labels de triagem `needs-triage`, `needs-info`, `ready-for-agent` e `ready-for-human`. A S0b criou os quatro à mão | relatório da S0b, passo 5 | Aberto, 1 ocorrência. Candidato: o playbook lista os quatro no `gh label create` |
| A7 | A skill `anthropic-skills:supabase`, sincronizada do claude.ai, aparece nas sessões do projeto, embora o template desligue o plugin `supabase@synced`. A descrição dela pede uso em "ANY task involving Supabase", o que concorre com a `data-layer` no R0 | transcrição da S0b (lista de skills) | Aberto. Decidir na R0.1: desligar por `skillOverrides` no `.claude/settings.json` do projeto, ou medir nas evals da R0.e |

## Cota por fase

Uma linha por sessão, copiada do relatório.

| Sessão | Fase | Modelo | Janela de 5 h (antes → depois) | Semana (antes → depois) |
| --- | --- | --- | --- | --- |
| S0 | Bootstrap, passos 1 a 8 | Sonnet | não medido | não medido |
| S0b | Bootstrap, reinício e GitHub | Sonnet | 5% → 12% | 30% → 31% |

O `/usage` mede a conta inteira. Os números da S0b incluem a sessão acompanhada, que rodou em paralelo.

## Métricas por spec

As mesmas do registro do piloto (`docs/playbook.md`), preenchidas no F8 de cada fatia.

| Métrica | R0 | R1 | R2 | R3 | R4 | R5 |
| --- | --- | --- | --- | --- | --- | --- |
| Cota usada (5 h / semana) | | | | | | |
| Rodadas de grilling até o G1 | | | | | | |
| Lacunas no F3 | | | | | | |
| Tickets / reabertos | | | | | | |
| Findings (verdadeiros / rejeitados) | | | | | | |
| `ASSUMPTION:` que chegaram ao PR | | | | | | |
| Escaladas Sonnet → Opus | | | | | | |
| Bloqueios do verify-gate (úteis / ruído) | | | | | | |

## Entradas

<!-- Uma entrada por relatório recebido ou por rodada de decisões, sempre no fim da lista. As entradas antigas não mudam.
### <data> · Sessão <n> · <fase> · <fatia> · <spec/ticket>
- Resumo: <2 linhas>
- Portão: <qual> · <decisão do usuário> · <motivo>
- Conferência: <item da DoD ou do portão → ok | falta | não se aplica>
- Sinais: <candidato à retro → ponteiro> ou nenhum
- Cota: <5 h> · <semana>
-->

### 17/11/2026 · Sessão acompanhada 1 · Preparação da S0

- **Resumo:**
  - jornada criada;
  - prompt da S0 escrito a partir do playbook, do template e do piloto reading-list;
  - o usuário aceitou as seis recomendações para antes da S0.
- **Decisões do usuário, com o motivo:**
  1. O ruleset entra no fim da S0. A S0 não tem conteúdo para revisar, e o PR do F1 testa o ruleset.
  2. Os recursos de segurança que são só configuração entram na S0: push protection antes do primeiro push, alertas do Dependabot, relato privado de vulnerabilidades e CodeQL. Gitleaks, `SECURITY.md`, `dependabot.yml` e actions fixadas por SHA viram tickets do R0. A push protection só protege se já estiver ligada no primeiro push.
  3. `permissions: contents: read` entrou no `ci.yml` do template (ac5a083). Fixar as actions por SHA fica no R0, porque sem o Dependabot os SHAs envelhecem.
  4. Os requisitos vão para `docs/requisitos/requisitos-v2.3.md`, fora do Prettier e públicos. A varredura não achou e-mail, telefone, CPF, endereço nem segredo.
  5. A S0 roda em Sonnet, para guardar a cota de Opus para o F1.
  6. Commit local de `docs/pilots/dg-formacao/`. O push fica para decidir.
- **Conferência:** não se aplica, porque não houve relatório.
- **Sinais:** A1 a A3, na seção "Atritos do harness".
- **Cota:** não medido.

### 17/11/2026 · Sessão 0 · Bootstrap · R0 (preparação) · sem spec nem ticket

- **Resumo:**
  - os passos 1 a 8 foram concluídos e verificados, em dois commits locais na `main` (3c7a961 e e718a81);
  - o reinício (passo 9) e o GitHub (passo 10) ficaram para a S0b, porque o reinício depende do usuário.
- **Portão:** o da S0 continua aberto e fecha na S0b. A sessão acompanhada conferiu o estado do projeto: dois commits, `git status` limpo, nenhum remoto, `next` 16.4.6, nada de `.env*`, `node_modules` ou `.next` rastreado, seção "Privacy and security" com 9 itens e os 4 IDs. Nenhum dado pessoal nos arquivos rastreados.
- **Conferência:**
  - `format:check`, `lint`, `typecheck`, `test`, `build` e `test:e2e` verdes, com comando e saída → ok;
  - o lint barra `dangerouslySetInnerHTML` → ok;
  - cópia dos requisitos com o mesmo SHA-256 → ok;
  - template aplicado, com 7 skills e `permissions: contents: read` → ok;
  - implementer e `CODING_STANDARDS.md` ajustados → ok;
  - smoke test dos hooks, 11 de 11 → ok;
  - `/plugin` e `/hooks` depois do reinício → falta;
  - repositório, segurança, labels, setup do Matt, CI verde, CodeQL e ruleset → falta;
  - `ASSUMPTION:` e findings → não se aplica.
- **Sinais:**
  - A2 confirmado: a S0 teve de ser dividida;
  - A3 com 2 ocorrências: o `vite-tsconfig-paths` e o bloco `# playwright` do `.gitignore` vieram do piloto;
  - o teste de fumaça importa por caminho relativo, então nenhum teste exercita o alias `@/`. A S0b corrige isso junto com a troca do plugin;
  - nenhum item "Unverified" resolvido.
- **Cota:** não medido; o relatório deixou o campo para o usuário preencher.

### 17/11/2026 · Sessão 0b · Bootstrap (continuação) · R0 (preparação) · sem spec nem ticket

- **Resumo:**
  - foram para a `main` a troca do `vite-tsconfig-paths` pelo `resolve.tsconfigPaths` (657d2a9) e o setup das skills do Matt (f17a139);
  - o repositório `JeanBauch/dg-formacao` foi publicado com CI verde, segurança ligada e ruleset `protect-main` ativo (id 27512496).
- **Portão:** S0. Todos os critérios conferidos pela sessão acompanhada; a sessão recomenda aceitar.
- **Conferência:**
  - `format:check`, `lint`, `typecheck`, `test`, `build` e `test:e2e` verdes → ok (o CI do f17a139 roda todos);
  - CI verde na `main` → ok: `ci` e `CodeQL` com `success` no f17a139;
  - ruleset ativo → ok: `deletion`, `non_fast_forward`, `pull_request` com 0 aprovações e check `ci`, sem bypass, alvo `~DEFAULT_BRANCH`;
  - segurança → ok: secret scanning e push protection `enabled` antes do primeiro push, alertas do Dependabot, relato privado de vulnerabilidades e CodeQL `configured`;
  - hooks carregados → ok, pela transcrição da S0b: o `verify-gate` rodou em 10 fins de turno sem erro nem bloqueio, e o `format` foi conferido pelo comportamento. `git-guardrails` e `protect-paths` não dispararam porque nenhum comando os acionou; o smoke test da S0 já os cobria;
  - plugins → ok, pela transcrição da S0b: nenhuma skill dos plugins desligados aparece na lista de skills;
  - labels → ok: os 5 de triagem e `type:spec`, `type:ticket`, `model:opus` e `capacity`;
  - nenhum dado pessoal nos arquivos rastreados → ok.
- **Sinais:**
  - A4 a A7, na seção "Atritos do harness";
  - o `/usage` atribui 17% do uso à lista de skills, cerca de 12 mil tokens por requisição, e 75% a conversas longas;
  - o atrito "branch desprotegida entre os passos 3 e 8" do relatório não é atrito: o ruleset entrou por último de propósito, porque a regra de PR barraria os commits diretos na `main`.
- **Cota:** 5 h de 5% → 12% · semana de 30% → 31%, incluindo a sessão acompanhada.

### 17/11/2026 · Sessão acompanhada 1 · Skills sem uso desligadas

- **Resumo:** o `/usage` atribuía 17% do uso à lista de skills. A pedido do usuário, 12 skills foram desligadas com `skillOverrides: "off"` no `settings.json` do usuário: só as sem uso previsto nos requisitos e no harness. Prova: uma sessão de teste em Haiku. A lista de skills gravada na transcrição não tem nenhuma das 12, e as mantidas aparecem. O `skillOverrides` com o nome puro vale também para as skills sincronizadas do claude.ai.
- **Desligadas, com o motivo:**
  - `built-in-browser`, `chrome-browser` e `computer-use`: a jornada roda no VS Code, sem o app desktop nem a extensão do Chrome, e o plugin do Playwright cobre o navegador;
  - `google-workspace` e `pptx`: os requisitos não citam Google Docs, Sheets, Drive nem apresentações;
  - `morning` e `import-memory`: sem relação com o projeto nem com o harness;
  - `find-skills`: o harness escreve as próprias skills e desliga as de terceiros de propósito;
  - `claude-api`: o produto não tem recurso de IA, e o harness usa só o Claude Code;
  - `schedule`: o job periódico do projeto roda no GitHub Actions (seção 9.13);
  - `keybindings-help`: sem relação com a jornada;
  - `init`: o `apply-template` já escreve o `CLAUDE.md`.
- **Mantidas por evidência:**
  - `xlsx`: carga por planilha/CSV (RF-ADM-08, ADR-001);
  - `pdf`: aulas em PDF (R2);
  - `docx` e `docs`: RIPD (RPV-11) e runbooks (R5);
  - `dataviz`: painéis (RNF-OBS-08, RF-ADM-12);
  - `skill-creator`: evals da R0.e;
  - `supabase` e `supabase-postgres-best-practices`: dependem do A7.
- **Mantida por juízo:** `deep-research`. Ela se sobrepõe à `research` do Matt, mas nada mostra que não será usada.
- **Cota:** a medir. Na próxima leitura do `/usage`, comparar a linha "Turn off skills you don't use".

### 18/11/2026 · Sessão acompanhada 1 · Demanda nova: cursos por liberação (#2)

- **Resumo:** o usuário trouxe uma demanda que não está nos requisitos. As contas de equipe liberam cursos específicos para pessoas específicas, por exemplo o curso para casamento e o onboarding do ministério. A demanda virou a issue #2, com `needs-triage` e as 6 perguntas do grilling.
- **Decisão do usuário, com o motivo:** nem entrar na S1, nem esperar o sistema pronto. Vai num grilling próprio, depois da retro do R0 e antes da R1.1.
  - A S1 estava perto do G1, e a demanda traz perguntas de produto e jurídicas.
  - O R0 não cria tabela de curso (seção 10.4).
  - Decidir depois da R1 obrigaria a refazer o catálogo em cache, a matrícula, os perfis e o backoffice.
- **Como retomar:**
  - o ritual de cada sessão acompanhada vê a #2 no `gh issue list`;
  - o mapa da R1 tem a linha "Antes de começar";
  - quando o R0 fechar, a sessão acompanhada escreve o prompt do `grill-with-docs` sobre a #2, partindo das respostas que o usuário deixar em comentários na issue.
- **Levar ao jurídico, junto com o DP-04:** a lista de pessoas liberadas pode revelar o papel na igreja ou a intenção de casar (seção 7.2, dado sensível).
- **Sinais:** a `/ship-ticket` só propõe `type:ticket` com spec `ready-for-agent`, então a #2 não entra no ciclo por engano.
