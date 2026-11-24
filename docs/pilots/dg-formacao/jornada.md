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

Desde a S2, o R0 tem duas specs: a **A** (#3, identidade e dados), que fecha só com evidência local e do CI, e a **B** (operação e cadeia de suprimentos). A B recebe os critérios que dependem dos provedores reais.

| Sessão | Fase | Objetivo | Portão |
| --- | --- | --- | --- |
| R0.1 | F2 + F3 da spec A | Spec #3 com as histórias A1 a A6, os 5 seams de teste e os itens U1 a U10 como critérios; depois, o prompt F3 | G2: zero lacunas → `ready-for-agent` |
| R0.1d | Desvios da spec A | PR numa branch `docs/`, fora da `/ship-ticket`: requisitos v2.5, glossário e skill `auth-identity`, conforme a seção "Desvios dos requisitos" da #3 | Merge do usuário, antes do F5 |
| R0.2 | F5 da spec A | `to-tickets #3`: sub-issues com `blocked-by` | G4: granularidade e dependências aprovadas; `model:opus` nos tickets de autenticação, transação, backup e migration |
| R0.2d | Sincronia do harness | PR `docs/` com o implementer que lê o ticket (00666f5) e o `format.mjs` que ignora arquivos fora do projeto (ea8b7d8) | Merge do usuário, antes da primeira `/ship-ticket` |
| R0.3 em diante | F6 + F7 da spec A, uma sessão por ticket | `/ship-ticket` | Definition of Done completa e merge feito pelo usuário |
| R0.3d | Sincronia do harness e limpeza do "Unverified", depois do #8 | PR `docs/` com as correções A26, A29 e A34 do template; U1, U2, U7 e U10 saem das skills; regra nova no lugar do U3; decisões do #8 registradas nos tickets | Merge do usuário, antes do #9 |
| R0.B | Spec B: F2 + F3, F5, F6 + F7 | B1 a B6. Começa depois do G2 da A; a B1 (contas nos provedores, só do usuário) corre em paralelo aos tickets da A | G2 e G4 da B; merges |
| R0.e | Avaliação das skills | Rodar os cenários de `docs/agents/skill-evals/` sem e com cada skill | Placar registrado no README das evals; regra que não muda o placar sai da skill |
| R0.s | Skill `testing-stack` | Escrever a skill e as evals dela a partir dos testes que o R0 criou | Evals escritas e rodadas |
| R0.r | F8 Retro, uma por spec | `retro-evidence.mjs` + `/mattpocock-skills:retro` | Cada candidato aprovado ou rejeitado; spec fechada |

Saída do R0:
- as 8 verificações da seção 10.4 respondidas (eram 7 na v2.3; uma resposta negativa volta aos requisitos);
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
| R1 Vitrine | Skill `ui-design-system`, com evals · grilling da demanda #2 (cursos por liberação), depois das retros das duas specs do R0 e antes da R1.1 | Design system com os tokens do DESIGN.md, home, catálogo, página do curso, páginas institucionais, carga por CSV, SEO e CSP | CSP e cabeçalhos verificados por teste (RNF-SEG-11); nenhum recurso de terceiros no front (RPV-15); E2E do catálogo verde |
| R2 Aprender | Skill `integrations`, com evals | Matrícula, aula em vídeo com `VideoPlayer`, aula em PDF, `/media/{id}`, conclusão, progresso, Meus cursos e "Continue assistindo" | E2E de assistir e concluir verde (RNF-QUA-01); testes de contrato do `VideoPlayer` |
| R3 Família | — | Perfis, "Quem está assistindo?", perfil infantil e escopo do catálogo, PIN do titular, acompanhamento do responsável e consentimentos | Testes da PROFILES.md verdes: escopo infantil em todas as rotas e bloqueio do PIN |
| R4 Backoffice | — | Formulários, editor de currículo, envio ao R2 com variantes de imagem, revisão, equipe, autores e métricas | E2E de publicar curso verde; uma linha de `audit_log` por escrita da equipe |
| R5 Lançamento | — | Teste de carga com 150 simultâneos, OWASP ZAP, RIPD, runbooks e plano de e-mail do lançamento | Metas da seção 8.1 atingidas no teste de carga; ZAP sem alerta alto; DPs jurídicos fechados |

## Itens "Unverified" das skills

Cada item vira critério de um ticket do R0. Quando o item se confirmar, a linha correspondente sai da skill; se não se confirmar, a regra da skill muda. A coluna "Critério" aponta o critério da spec #3 e, depois da seta, o ticket que confirma o item (F5, S5).

| # | Skill | Item a confirmar | Critério | Resultado |
| --- | --- | --- | --- | --- |
| U1 | data-layer | O drizzle-kit emite `.op('extensions.gin_trgm_ops')` no SQL do índice exatamente como escrito | #3 A1.9 (schema descartável, fora do commit; o índice real entra na R1) → #7 | Confirmado no #7 (S9, PR #29): o SQL gerado traz `extensions.gin_trgm_ops` exatamente como escrito. A linha sai da skill no PR `docs/` depois do #8 |
| U2 | data-layer | O tipo de coluna que o CLI do Better Auth gera para `user.id` quando `generateId` devolve UUID | #3 A2.6 → #8 | Confirmado no #8 (S10, PR #30): o CLI 1.7.15 gera `text` para `user.id`, e o `generateId` grava UUIDv7. O tipo `text` vale para toda chave que aponta para a Conta. A linha sai da skill na R0.3d |
| U3 | auth-identity | `schemaName: 'app'` no adapter põe todas as tabelas do Better Auth em `app`, inclusive os campos do plugin admin e `rateLimit` | #3 A2.5 → #8 | Não se confirmou como a skill escreve (#8, S10, NEEDS-DECISION). No adaptador do Drizzle, só o gerador do CLI lê o `schemaName`. Em tempo de execução, as tabelas ficam no `app` porque o schema do Drizzle as declara em `pgSchema('app')`. O resultado da A2.5 vale, e o código já segue a regra proposta. A regra nova, aprovada pelo usuário em 24/11, entra na skill na R0.3d |
| U4 | auth-identity | O plugin admin guarda vários papéis separados por vírgula em `role` e respeita todos | #3 A4.8 → #19 | — |
| U5 | auth-identity | O pedido de reset de senha devolve a mesma resposta para e-mail desconhecido | #3 A3.5 → #17 | — |
| U6 | auth-identity | `after()` funciona dentro dos callbacks de e-mail do Better Auth | #3 A3.12 (seam 5, contra `next start`) → #13 (A3.7, seam 1), #15 (primeira prova, no E2E pelo HTTP) e #23 (A3.12, dono) | — |
| U7 | auth-identity | `databaseHooks.user.create.after` roda na requisição do cadastro, de modo que perfil principal e consentimentos podem ser gravados ali | #3 A2.1 → #8 | Confirmado no #8 (S10, PR #30): o gancho roda na requisição do cadastro, depois do commit da Conta e fora da transação dela. A linha sai da skill na R0.3d |
| U8 | auth-identity | Um after-hook em `/sign-in/email` alcança e revoga a sessão que acabou de criar (STAFF.md) | #3 A4.11 → #18 | — |
| U9 | auth-identity | Os nomes de rota do rate limit na 1.7: `/sign-in/email`, `/sign-up/email`, `/request-password-reset` e `/send-verification-email` | #3 A2.11 e A3.8 → #12 (A2.11) e #17 (A3.8) | — |
| U10 | auth-identity (da S2) | Com `transaction: true` no `drizzleAdapter`, o gancho `after` roda depois do commit e é pulado no rollback. A documentação do Better Auth 1.7.15 já afirma isso; o teste confirma no código | #3 A2.12 → #8 | Confirmado no #8 (S10, PR #30): uma sonda com `xmin` mostra que a linha da Conta já está commitada quando o gancho roda, e invertida, a sonda falha. No rollback da Conta, o gancho não roda. A linha sai da skill na R0.3d |
| U11 | auth-identity (da S3) | Com `disabledPaths`, a rota HTTP responde 404, mas a chamada pelo servidor (`auth.api`) continua funcionando. Na main do Better Auth, o `disabledPaths` só é conferido no `onRequest` do roteador HTTP | #3, seam 1 (a A4.8 depende dele) → #19 | — |
| U12 | auth-identity (da S3) | Com `storage: 'database'`, o Better Auth não apaga as linhas vencidas de `rate_limits`. As notas da 1.5 citam limpeza automática só no armazenamento em memória; o PR traz o trecho do código da 1.7.15 | #3 A2.21 (limpeza própria no job diário) → #25 | — |

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

## Levar à retro da spec A

Correções das skills do projeto e decisões que saíram dos tickets. Os atritos do harness ficam em "Atritos do harness".

- **Guia de migrations da `data-layer` (NEEDS-DECISION do #7):** a primeira migration passa a ser gerada pelo drizzle-kit a partir do schema `app`, com o SQL reescrito à mão, no lugar da migration `--custom` vazia. A migration vazia copia o snapshot anterior, que está vazio, e a geração seguinte tenta criar de novo o que ela criou. Decisão do usuário.
- **Outras divergências da `data-layer` com o #7:** a skill diz que o `DATABASE_URL_DIRECT` serve "só ao drizzle-kit e aos backups" e que as migrations rodam "uma vez por execução", e o #7 fez diferente (relatório da S9). O retro confere no PR #29 e corrige a skill ou o código.
- **Actions fixadas por tag no `ci.yml`:** o `CODING_STANDARDS.md` do projeto exige SHA (RNF-SEG-13). A divergência veio do template (A32) e se corrige num PR próprio.
- **Campos que a biblioteca aceita do cliente:** o F3 da spec A não pegou que o cadastro do Better Auth grava `name` e `image` como o cliente manda. O review do #8 pegou (CR3 e CR4, PR #30). Candidato: a `auth-identity` lista, para cada rota que o projeto liga, as entradas que o Better Auth aceita e o que o projeto recusa; e o prompt F3 pergunta pelos campos que a biblioteca grava sem validar.

## Levar aos tickets seguintes da spec A

O que um ticket descobriu e outro precisa receber. Cada item entra no prompt de abertura do ticket indicado.

- **#12, logs sem dados pessoais (NEEDS-DECISION do #8, RNF-OBS-01):** no Better Auth 1.7.15, o roteador repassa ao better-call 1.4.4 todo erro que não é `APIError`, e o better-call o imprime inteiro com `console.error("# SERVER_ERROR: ", error)` (`better-call/dist/router.mjs:93`). O `onAPIError.onError` não evita isso, porque devolve nada e o better-call segue para o `console.error` (`better-auth/dist/api/index.mjs:196-205`). Só o `onAPIError.throw` tira o erro do roteador, e o `APIError` continua virando resposta. O `DrizzleQueryError` do Drizzle 0.45.4 põe os parâmetros da consulta na mensagem (`drizzle-orm/errors.js:12`). O `logger.log` próprio substitui o console nas chamadas internas da biblioteca (`@better-auth/core/dist/env/logger.mjs:63-69`). Decidido pelo usuário em 24/11 (D2): o #12 liga o `onAPIError.throw`, a rota do Next captura o erro e registra só o nome e o código do Postgres, um `logger.log` próprio reduz do mesmo jeito os erros que a biblioteca registra, e um teste força uma falha no banco e confere a saída do console.
- **#12, rota `/update-user`:** a rota da 1.7.15 aceita `name` e `image` do cliente (`better-auth/dist/api/routes/update-user.mjs:14-41`). Quando o #12 ligar o handler, ela vai aceitar o que o cadastro do #8 recusa: imagem de terceiros (RNF-SEG-12) e nome vazio ou com mais de 100 caracteres. O #12 desliga a rota com `disabledPaths`, se nenhum ticket da spec A a usar, ou aplica nela as regras do cadastro.
- **#14, #20 e #22, Contas criadas fora do cadastro:** o gancho do #8 lê as declarações do pedido de cadastro e apaga a Conta que não as traz (ASSUMPTION 5 do #8). Os seeds e o convite precisam de um caminho próprio para criar a Conta.

## Levar à spec B e à R1

Saiu da análise de registros, auditoria e cotas gratuitas que a sessão acompanhada fez a pedido do usuário (entrada da S3). Os itens da spec A já estão na #3.

- **Backup incremental das tabelas de registro** (`security_events`, `audit_log` e `analytics_events`): o dump noturno exclui os dados delas, um passo exporta só as linhas do dia anterior, e um dump completo roda uma vez por semana. Motivo: o `pg_dump` passa pelo pooler sem compressão, e 100 MB de dados custam cerca de 3 GB dos 5 GB de egress do mês. Decisão do usuário pendente.
- **Relatório de capacidade:** acompanhar a média diária do tamanho do banco no ciclo, que é o que a cota de 500 MB mede (a restrição de uso justo dura até a virada do ciclo); o tamanho de cada tabela contra um orçamento; o egress estimado pelo volume sem compressão; e, no Axiom, a cota de consulta (10 GB-horas por mês) e o número de campos (256 por dataset), no lugar da ingestão.
- **B1, conferências do usuário:** uma regra de rate limit do firewall da Vercel no login (no Hobby, 1 regra, por IP, com janela de 10 s a 10 min), mais folgada que a do Better Auth; se a regra aceita prefixo de caminho; se requisições bloqueadas contam na cota; spike protection e limite por DSN no plano Developer do Sentry; Standard Protection ligada; parte 1 do script de papéis em staging e produção.
- **Sentry:** nenhum resultado esperado vira erro (4xx, validação, rate limit, falha de login); filtros de entrada; `allowUrls` só com o domínio; o adaptador do aviso de transbordo do registro de segurança (B4).
- **Axiom:** logger com lista fechada de chaves; um dataset para logs e outro para traces, com o campo `env`; poucos monitores, a cada 5 min ou mais.
- **B3:** parte 2 do script de papéis depois das migrations; conferir se o pooler do Supabase aceita os papéis próprios.
- **Restauração (9.12.9 e 9.12.11):** o diário das migrations fica no schema `app` e entra no dump. Rodar a primeira migration antes do `pg_restore` pode colidir com ele; o ensaio de restauração confere.
- **Job diário:** a limpeza própria das linhas vencidas do rate limit (A2.21) e a do registro de segurança.
- **TLS do banco em staging e produção:** a validação do #6 aceita `sslmode` com `require`, `verify-ca` ou `verify-full` (ASSUMPTION do #6). O Supabase recomenda `verify-full` com a CA do projeto (docs "Postgres SSL Enforcement"). No postgres.js 3.4.9, que o #7 instalou, o código da conexão liga `rejectUnauthorized = false` para `require`, `allow` e `prefer`: a conexão é cifrada, mas aceita qualquer certificado. `verify-ca` e `verify-full` usam a verificação padrão do Node (cadeia e nome do host) contra as CAs do sistema, e a CA do Supabase não está nelas: o driver precisa receber a CA do projeto. Decidir na spec B: a validação recusa `require` em staging e produção, e a CA entra como configuração.
- **Variáveis dos scripts de banco:** ficaram fora do inventário de variáveis do #6 (ASSUMPTION do #7). A spec B decide onde inventariá-las.
- **TEMP no papel da aplicação:** o `dg_app` ainda cria tabelas temporárias, pelo direito `TEMPORARY` que o Postgres dá a PUBLIC em todo banco (ASSUMPTION do #7, que o usuário confirma no PR #29). No Supabase, revogar mexe no PUBLIC de um banco que os papéis do próprio Supabase usam. Decidir junto da parte 1 do script de papéis em staging e produção.
- **Parâmetros de consulta nos logs:** a coleta da spec B (Sentry e Axiom) ganha a limpeza dos parâmetros de consulta como regra, porque o erro do Drizzle os traz na mensagem (proposta 3 do NEEDS-DECISION do #8; ver "Levar aos tickets seguintes da spec A").
- **Renovate ou Dependabot:** os requisitos citam o Dependabot na RNF-SEG-13 e o Renovate na tabela de riscos (falha de segurança no Better Auth). A ASSUMPTION 1 do #8 fixa o Better Auth na 1.7.15 e conta com o Renovate. Nenhum dos dois está configurado. A spec B escolhe um e corrige o outro lado.
- **F3 da spec B:** o prompt leva a categoria "capacidade e cotas" (A18).
- **R1:** o `search_misses` repete o padrão do registro de segurança (visitante anônimo, termo aleatório). A spec da R1 traz tamanho máximo do termo e teto de termos por dia.

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
| A8 | O `RBAC.md` da skill `next-architecture` manda buscar a regra 404 × 403 "na ADR do projeto". Pelo critério do harness, só decisão difícil de reverter vira ADR, e a S1 pôs essa regra na seção 4 dos requisitos | `templates/project/.claude/skills/next-architecture/RBAC.md`; relatório da S1 | Aberto. Mitigado no R0: a spec cita a seção 4 nos critérios de autorização. Candidato: o `RBAC.md` aponta para "a decisão do projeto (ADR ou requisitos)" |
| A9 | O formato de abertura termina com "rode /relatorio-sessao", mas a skill tem `disable-model-invocation` e só o usuário consegue rodá-la | `docs/pilots/dg-formacao/prompt-sessao-acompanhada.md`; relatório da S1 | Corrigido no formato: o prompt pede para a sessão avisar o usuário |
| A10 | A skill `relatorio-sessao` do projeto manda preencher a cota "com /quota", mas o valor certo vem do `/usage`, como o playbook diz | `.claude/skills/relatorio-sessao` do projeto; relatório da S1 | Aberto, cosmético. Vai para a branch da retro do R0 |
| A7 | A skill `anthropic-skills:supabase`, sincronizada do claude.ai, aparece nas sessões do projeto, embora o template desligue o plugin `supabase@synced`. A descrição dela pede uso em "ANY task involving Supabase", o que concorre com a `data-layer` no R0 | transcrição da S0b (lista de skills); relatório da S3, passo 1 | Resolvido na S3: `supabase`, `supabase-postgres-best-practices` e o `to-spec` avulso ficaram fora da lista, com o `skillOverrides` dividido entre o `settings.json` e o `settings.local.json`. Os dois arquivos se somam. Candidato: o template desliga as duas no `settings.json`, onde já desliga o `to-spec` avulso |
| A11 | A `to-spec` do Matt manda aplicar `ready-for-agent` ao publicar, mas o playbook só aplica o label no G2. A regra do projeto venceu | relatório da S2 | Aberto, 1 ocorrência. Candidato: o playbook avisa, no F2, que o label do `to-spec` fica para o G2 |
| A12 | O playbook não tem um passo para as correções de requisitos e de skills que aparecem no F3. O `protect-paths` bloqueia `.claude/**` nas branches `feat/*`, então um ticket não consegue corrigir a skill que o implementer pré-carrega | relatório da S2; #3, seção "Desvios dos requisitos" | Confirmado na S4: o PR `docs/` (#4) passou com o CI verde. Sem receita no playbook, a sessão improvisou a branch: o `git checkout -b … origin/main` deixou o upstream em `origin/main`, e o `push -u` corrigiu. O relatório também não achou uma fase do playbook para citar. Candidato: o playbook ganha esse passo, com a mesma receita de branch da `/ship-ticket` (`git switch main`, `git pull --ff-only`, `git switch -c`) |
| A13 | `.env.example`: o `CLAUDE.md` do template proíbe editar `.env*`, o `protect-paths` libera e pede para editar o `.env.example`, e o `.env*` do `.gitignore` gerado pelo create-next-app ignora o `.env.example` | `templates/project/CLAUDE.md:21`; `templates/project/.claude/hooks/protect-paths.mjs:12-13`; `.gitignore:34` do projeto; lacuna 9 da #3 | Corrigido no template (917c7f1): o hook libera só o `.env.example`, o `CLAUDE.md` abre a exceção e o `gitignore.append` traz `!.env.example`. O projeto recebe as mesmas linhas no PR da R0.1d |
| A14 | A skill `auth-identity` afirmava como fato coisas que a spec teve de desfazer: o `after()` no callback de e-mail e o convite pelo plugin admin. A linha do U7 (`SKILL.md:53`) levava a supor que o gancho `after` grava na mesma transação da conta | `auth-identity/SKILL.md:53` e `STAFF.md` do projeto; lacunas 1 e 2 da #3 | Corrigido na spec; a skill muda no PR da R0.1d. Para a retro: rever como as skills de projeto separam o que é fato conferido do que é suposição |
| A15 | O passo 1 do prompt da S3 esperava o `mattpocock-skills:to-spec` na lista de skills do modelo. Uma skill com `disable-model-invocation: true` não aparece nessa lista; só o menu `/` do usuário ou o manifesto do plugin confirmam que ela existe | relatório da S3; prompt da S3, passo 1 | Corrigido nos prompts da sessão acompanhada: a lista do modelo serve só para as skills que o modelo invoca. Liga com o A4 |
| A16 | O corpo da spec A tem cerca de 92 mil caracteres. Cada leitura da issue inteira pesa no contexto, inclusive no F5 | relatório da S3 | 3 ocorrências. Na S4, o corpo tinha 93.226 caracteres, e a sessão precisou de dois scripts próprios para extrair a seção e os critérios citados. Na S5, a maior carga na conta de "cabe na janela" foi o passo 1 do implementer, que lia a #3 com os comentários (cerca de 121 mil caracteres) em cada ticket. Corrigido no template (00666f5): o implementer lê o ticket e só abre o corpo da spec quando o ticket deixa uma dúvida, e o F5 do playbook pede tickets autocontidos. O projeto recebeu a linha no PR #26 (S6). Na S7, pela transcrição dos subagentes, as duas execuções do implementer do #5 não abriram a #3. Ainda candidato para a retro da A: um orçamento de tamanho para a spec |
| A17 | O `format.mjs` roda `prettier --write` em cada arquivo editado, e o prettier realinha as tabelas Markdown. A edição seguinte de uma linha de tabela não casa mais com o texto lido; a S3 contornou com um script Node que casa pelo começo da linha | `templates/project/.claude/hooks/format.mjs:13`; relatório da S3 | Aberto. Na S4, as edições por script Node passaram por fora do `format.mjs` e do `protect-paths`, cujo matcher é `Edit|Write|NotebookEdit`; o `prettier --check` passou. Esse contorno contradiz o gotcha de edição do `CLAUDE.md` do template e escapa das travas. Na S6, a sessão trocou uma linha de `.claude/agents/` por script para fugir do hook, que nem age em `.claude/` (a pasta está no `.prettierignore`): o hábito do contorno se espalha. Candidato mais barato: depois de editar uma tabela, reler só as linhas dela antes da edição seguinte, sem script |
| A18 | O prompt F3 do playbook não pede capacidade e cotas: o que cresce sem limite, quem controla o volume e qual cota ele consome. O F3 da spec A não viu o registro de segurança como amplificador de ataque; a pergunta veio do usuário | `docs/playbook.md:35-42`; entrada da S3 | Aberto, 1 ocorrência. O prompt F3 da spec B leva a categoria. Candidato para a retro da A: entrar no prompt F3 do playbook |
| A19 | O script Node do contorno do A17 quebrou duas vezes no heredoc do Bash: `unexpected EOF` e escapes perdidos no template literal, por causa de crases e aspas. A S4 passou a gravar o `.mjs` com a ferramenta Write | relatório da S4 (`patch-req.mjs` e `crit.mjs` no scratchpad da sessão) | Aberto, 2 ocorrências. Em 21/11, a sessão acompanhada viu o mesmo `unexpected EOF` num heredoc com aspas, fora do contorno do A17, e também resolveu com o Write. O problema vale para qualquer script longo passado por heredoc, não só para o A17. Candidato: um gotcha no `CLAUDE.md` do template, dizendo para gravar o script com o Write e rodar em seguida |
| A20 | O critério do `model:opus` no G4 ("autenticação") marca quase tudo numa spec de autenticação: a proposta do F5 tinha 14 de 19 tickets com Opus; depois do G4, 13 de 21 | proposta da S5; labels dos #5 a #25 | Aberto. A medir: as escaladas dos 8 tickets em Sonnet. No #5, a escalada era devida e não aconteceu (A26), então a medida começa no #6. Candidato para a retro da A: separar o ticket que toca credencial, sessão, transação ou SQL do que só usa um fluxo já testado. Custo medido: na S9 e na S10, cada ticket em Opus custou 8 a 9 pontos da semana, contra 1 a 2 em Sonnet (S7 e S8). Em 24/11, a sessão acompanhada propôs passar o #16 e o #24 (telas sobre fluxos que outros tickets testam) para Sonnet. O usuário manteve o Opus, para uma saída mais robusta e elaborada nas telas |
| A21 | Antes do primeiro código, o implementer lê cerca de 91 mil caracteres de regras, skills, ADRs e glossário, inclusive a skill `seo` pré-carregada num ticket de autenticação | `templates/project/.claude/agents/implementer.md:5-9` e o passo 1; proposta revisada da S5 | Aberto, 1 ocorrência. Candidato para a retro da A: pré-carregar só as skills que o ticket toca |
| A22 | O `format.mjs` rodava o prettier em qualquer arquivo editado, inclusive no scratchpad, fora do projeto. Duas substituições por script falharam sem aviso na S5 | relatório da S5; `templates/project/.claude/hooks/format.mjs` | Corrigido no template (ea8b7d8), com teste novo: o hook só formata arquivo dentro da raiz do projeto. O projeto recebeu o hook no PR #26 (S6), com smoke test dentro e fora da raiz |
| A23 | A `/ship-ticket` propõe o ticket desbloqueado de menor número, então a ordem de publicação do F5 define a ordem de execução. A `to-tickets` não diz isso | relatório da S5; `templates/project/.claude/skills/ship-ticket/SKILL.md:14` | Aberto, 1 ocorrência. Na S5, a renumeração contornou o problema. Candidato: o F5 do playbook avisa que a ordem de publicação é a de execução |
| A24 | A regra "sem caminho de arquivo nem código" nas issues fica ambígua quando o critério literal da spec cita identificadores (`.env.example`, `databaseHooks`). A S5 manteve o texto literal | relatório da S5; `templates/project/CLAUDE.md`, regras do fluxo | Aberto, 1 ocorrência. Candidato: a regra vale para a implementação, e o texto citado da spec fica como está |
| A25 | No modo auto, o classificador nega ao agente a escrita num hook: o `Copy-Item` para `.claude/hooks/` saiu com o motivo "Undermining Oversight". Sincronizar um hook do template no projeto vira passo do usuário, e o prompt da S6 não marcou isso. O `apply-template --force` não serve, porque sobrescreve as personalizações do projeto | relatório da S6; `scripts/apply-template.mjs:3-4` | Aberto, 1 ocorrência. Na S6, o primeiro comando dado ao usuário usava caminho relativo e falhou no PowerShell do PC; a sessão acompanhada fez a cópia a pedido dele. Candidato: o `apply-template` ganha uma opção para copiar só os caminhos indicados, rodada pelo usuário, e os prompts marcam a sincronia de hook como passo do usuário |
| A26 | A `/ship-ticket` não escalava para Opus quando o review de uma execução em Sonnet achava bug de correção. O passo 6 fazia a chamada de fix com o modelo do passo 4, e a regra ficava no passo 7, que o fluxo só alcança quando o implementer volta `stuck`. No #5, dois bugs de correção foram corrigidos em Sonnet | relatório da S7; `templates/project/.claude/skills/ship-ticket/SKILL.md`, passos 6 e 7 | Corrigido no template (e5c9cd6): o passo 6 confere o passo 7 antes da chamada de fix, e um finding que os dois reviews relatam recebe um veredito só. O projeto recebe a skill num PR `docs/` junto com a limpeza dos primeiros itens "Unverified". Até lá, os prompts de abertura reforçam a regra |
| A27 | A `/ship-ticket` não define "bug de correção", e é isso que decide a escalada. No #6, três fixes de qualidade de teste (isolamento do `VERCEL`, cobertura da A1.7 e parser do inventário) ficaram fora da escalada por julgamento da sessão | relatório da S8; corpo do PR #28 | Aberto, 1 ocorrência. A sessão acompanhada concorda com a classificação. Candidato: a skill define bug de correção como comportamento errado do produto, e falha de teste fica de fora |
| A28 | O `mattpocock-skills:code-review` exige que a sessão monte à mão a lista das fontes de padrões e os dois prompts de subagente, enquanto o `/code-review` embutido devolve os findings direto | relatório da S8 | Aberto, 1 ocorrência. Candidato: a `/ship-ticket` lista as fontes de padrões do projeto (`CODING_STANDARDS.md`, `CLAUDE.md` e as skills pré-carregadas) na chamada do review |
| A29 | O implementer mandava editar a ASSUMPTION antiga, com `gh api` quando o comentário já não é o último. O `settings.json` do projeto só libera `gh issue *`, e o sistema de permissões negou a edição no #7 | relatório da S9; comentários do #7 | Corrigido no template (`3bfb08f`): a ASSUMPTION nova vai num comentário novo, que começa com `ASSUMPTION (substitui <url>):`, e a `/ship-ticket` conta itens, com o substituído uma vez só. No #7, o usuário escolheu o mesmo caminho. O projeto recebe a correção no PR `docs/` do A26. Liberar o `gh api` ficou descartado, porque ele alcança merge e ruleset. No #8 (S10), o implementer do projeto mandou editar o comentário de novo, e a `/ship-ticket` do projeto contava comentários, não itens. O prompt de abertura segurou a regra. A sincronia entra na R0.3d |
| A30 | O verify-gate roda `vitest related`, que segue o grafo de imports. Quando só mudam arquivos fora dele, como o script de papéis (rodado como processo) ou o SQL das migrations, os testes de banco não rodam no ciclo rápido. O passo 5 da `/ship-ticket` e o CI rodam a suíte inteira | relatório da S9 | Aberto, 1 ocorrência. Candidato, a pesquisar antes: o projeto associa caminhos fora do grafo a um projeto do Vitest, e o verify-gate roda esse projeto. Mudança de hook, teste primeiro |
| A31 | Com o banco desligado, o `vitest related` imprime "No affected test files found, exiting with code 0" antes do erro da A1.10, embora saia com 1. A saída engana quem lê só o começo | relatório da S9 | Aberto, 1 ocorrência. Conferir junto do A30, que mexe na mesma chamada |
| A32 | O `ci.yml` do template fixa as actions por tag (`actions/checkout@v7`, `pnpm/action-setup@v6` e `actions/setup-node@v7`), e o `CODING_STANDARDS.md` do projeto exige SHA (RNF-SEG-13). O projeto herdou a divergência | relatório da S9; `templates/project/.github/workflows/ci.yml:21-23` | Aberto. Candidato: o template fixa por SHA, com a tag em comentário. No projeto, a correção é um PR próprio |
| A33 | O prompt de abertura da S10, escrito pela sessão acompanhada, listou a A2.11, a A2.14, a A2.20 e a A2.21 como critérios do #8. Elas são do #12, do #25 e de outros tickets (#16, #17 e #20). A sessão corrigiu o escopo com o implementer já rodando | relatório da S10; corpo do #8; tabela "Itens Unverified" (U9 → #12, U12 → #25) | Corrigido no prompt da sessão acompanhada: o prompt de um ticket cita o número e não copia critérios, porque o ticket é autocontido (A16) |
| A34 | O preflight da `/ship-ticket` não sobe os serviços locais. Desde o #7, os testes de banco precisam do Postgres no Docker, e o implementer do #8 teve de rodar `pnpm db:up` por conta própria. O `CLAUDE.md` do projeto não lista o comando | relatório da S10; `templates/project/.claude/skills/ship-ticket/SKILL.md`, passo 2 | Corrigido no template (`d6c4af9`): o preflight roda o comando de serviços locais que o `CLAUDE.md` do projeto listar. O projeto recebe o passo e a linha do `pnpm db:up` no `CLAUDE.md` na R0.3d |

## Cota por fase

Uma linha por sessão, copiada do relatório.

| Sessão | Fase | Modelo | Janela de 5 h (antes → depois) | Semana (antes → depois) |
| --- | --- | --- | --- | --- |
| S0 | Bootstrap, passos 1 a 8 | Sonnet | não medido | não medido |
| S0b | Bootstrap, reinício e GitHub | Sonnet | 5% → 12% | 30% → 31% |
| S1 | F1 + F4 | Opus | não medido → 31% (janela nova) | 31% → 36% |
| S2 | F2 + F3 da spec A | Opus | não medido → 48% (22,7%/h nas últimas 2 h) | 36% (fim da S1) → 42% |
| S3 | F3 (lacunas 6 a 12) + G2 da spec A | Opus | não medido → 28% (6,8%/h nas últimas 3 h) | 42% (fim da S2) → 2% (depois do reset de sexta às 13:00) |
| S4 | Desvios da spec A (R0.1d) | Sonnet | não medido (1% numa janela nova, na hora do relatório) | 2% (fim da S3) → 3% |
| S5 | F5 da spec A | Opus | não medido → 20% (49,2%/h nos últimos 24 min, incluindo a sessão acompanhada) | 3% (fim da S4) → 8% |
| S6 | Sincronia do harness (R0.2d) | Sonnet | 20% (fim da S5) → 25% (30%/h nos últimos 50 min) | 8% → 9% |
| S7 | F6 + F7 do #5 | Sonnet | não medido (a sessão atravessou o fim de semana) | 9% (fim da S6) → 10% |
| S8 | F6 + F7 do #6 | Sonnet | não medido → 16% (15,7%/h nos últimos 57 min) | 10% (fim da S7) → 12% |
| S9 | F6 + F7 do #7 | Opus | não medido → 71% (22,4%/h nas últimas 2 h 19 min; projeção de 100% antes da virada) | 12% (fim da S8) → 20% |
| S10 | F6 + F7 do #8 | Opus | não medido → 69% (36,6%/h nas últimas 1 h 52 min; projeção de 100% em cerca de 51 min, antes da virada das 14:50) | 20% (fim da S9) → 29% |

O `/usage` mede a conta inteira. Os números da S0b incluem a sessão acompanhada, que rodou em paralelo.

## Métricas por spec

As mesmas do registro do piloto (`docs/playbook.md`), preenchidas no F8 de cada fatia.

| Métrica | R0-A | R0-B | R1 | R2 | R3 | R4 | R5 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Cota usada (5 h / semana) | | | | | | | |
| Rodadas de grilling até o G1 | | | | | | | |
| Lacunas no F3 | 12, mais 1 rodada de complemento (registros e cotas) | | | | | | |
| Tickets / reabertos | 21 (#5 a #25; 13 com `model:opus`) / — | | | | | |
| Findings (verdadeiros / rejeitados) | | | | | | | |
| `ASSUMPTION:` que chegaram ao PR | | | | | | | |
| Escaladas Sonnet → Opus | | | | | | | |
| Bloqueios do verify-gate (úteis / ruído) | | | | | | | |

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

### 18/11/2026 · Sessão 1 · F1 Descoberta + F4 System design · R0 (preparação) · PR #1

- **Resumo:**
  - o PR #1 traz o `GLOSSARY.md`, as ADRs 0001 a 0010 e os requisitos v2.4, renomeados para `docs/requisitos/requisitos.md`, com a seção 1.6;
  - traz também o IP fora da sessão no `CONFIG.md` da `auth-identity` e a regra de lockfile do template;
  - grilling de 9 perguntas, Q1 a Q9, cada uma decidida pelo usuário.
- **Portão:** G1 e G3, mais o merge do PR #1. A sessão inferiu o G1 do aceite da Q9, sem a confirmação explícita do usuário; G1, G3 e merge aguardam o usuário.
- **Conferência:**
  - PR #1 `MERGEABLE`/`CLEAN`, com `ci`, `CodeQL` e os dois `Analyze` verdes → ok;
  - 10 ADRs com status: 0003 "Substituído pela 0008", as outras "Aceito", inclusive a 0005 → ok;
  - nenhum "Proposto" nos requisitos v2.4 → ok;
  - nenhum dado pessoal no diff do PR → ok;
  - DPs que bloqueiam o R0 (02, 04 e 11) listados no PR, com valor provisório e sem usuário real até a resposta → ok;
  - G1 confirmado pelo usuário → falta.
- **Decisões do usuário, registradas na seção 1.6 dos requisitos:**
  - ADR-0005 aceita, sem `unaccent`;
  - permissões no código;
  - IP fora da sessão, com o rate limit mantido;
  - `security_events` com IP, retenção a confirmar na DP-11;
  - `identity` renomeado para `auth`, com imports só pela interface pública;
  - validação feita por quem recebe a entrada;
  - 404 × 403 × reautenticação na seção 4;
  - Titular e Responsável separados no glossário.
- **Sinais:**
  - fato conferido no código do Better Auth 1.7.15: o `disableIpTracking` desliga também o rate limit, e o gancho `session.create.before` limpa o IP. Isso refez a verificação 3 da 10.4 e criou a verificação 8;
  - A8 a A10, na seção "Atritos do harness";
  - a S1 usou 31% de uma janela de 5 h nova e 5 pontos da semana, tudo em Opus, com 97% de acerto de cache.
- **Cota:** 5 h não medido → 31% · semana 31% → 36%.

### 19/11/2026 · Sessão acompanhada 1 · Encerramento

- **Portões:** o usuário fez o merge do PR #1 em 18/11, a última decisão da S1, e com ele aceitou o G1 e o G3. Se alguma pergunta do grilling ficou aberta, ela entra na S2.
- **Harness:** todos os commits publicados. O ritual de início passa a listar também os PRs abertos e os commits do harness sem push.
- **Próximo passo:** S2, F2 + F3 do R0, com o prompt já entregue. O passo 2 dele desliga as skills sincronizadas de Supabase no projeto (A7).
- **Pendente na próxima sessão acompanhada:** receber o relatório da S2. Manter a #2 no radar: grilling depois da retro do R0, antes da R1.1.

### 19/11/2026 · Sessão 2 · F2 Spec + F3 Lacunas · R0 (spec A) · #3

- **Resumo:**
  - o R0 virou duas specs, porque o escopo tinha 12 histórias. A spec A (identidade e dados) foi publicada como #3; a B (operação e cadeia de suprimentos) fica para uma sessão própria;
  - o F3 achou 12 lacunas. As lacunas 1 a 5 foram fechadas e entraram no corpo da #3; as lacunas 6 a 12 estão num comentário da #3. A sessão parou para economizar contexto e cota.
- **Portão:** G2 pendente. Faltam as lacunas 6 a 12, e a #3 continua com `needs-triage`.
- **Conferência:**
  - issue `type:spec`, sem `ready-for-agent` → ok;
  - critérios no formato Dado/Quando/Então e requisitos não funcionais (NF-1 a NF-3) → ok;
  - V1 a V8 e U1 a U9 no corpo da #3 → ok. A sessão acompanhada conferiu a tabela U1 a U10 → critério;
  - lacunas 6 a 12 no comentário → ok (1 comentário, 7 seções);
  - nenhum e-mail ou telefone no corpo da #3 → ok;
  - "Perguntas em aberto: nenhuma" → falta, depende do G2;
  - commits, reviews e `ASSUMPTION:` → não se aplica.
- **Decisões do usuário, com o motivo** (o detalhe está na #3):
  - R0 em duas specs, e a A fecha só com evidência local e do CI. Os critérios que dependem da Vercel ou do Supabase real vão para a B3, e o agendamento do job diário, para a B. Motivo: tamanho, e a A não fica esperando a B;
  - a S2 escreveu só a spec A. Motivo: o F3 da A mudaria a fronteira com a B, como mudou;
  - 5 seams de teste. O U1 é conferido por comando num schema descartável, porque o R0 não cria `courses`;
  - `APP_ENV` obrigatória e sem valor padrão. Motivo: `NODE_ENV` é `production` no `next start` do E2E, e a Vercel define `CI=1` no build;
  - convite numa transação do Drizzle, com perfil e auditoria. Motivo: uma conta de equipe sem auditoria é o caso que a auditoria existe para evitar;
  - aceite da equipe na tela de definição de senha. Motivo: a equipe assiste aulas, e o histórico de estudo é o dado da RPV-07;
  - `consents` sem `ip_hash` e com três tipos de documento. A pergunta sobre o IP como prova vai ao jurídico na DP-04;
  - a redefinição de senha funciona com o e-mail não verificado e o marca como verificado. Motivo: o convite e o titular ficariam presos;
  - bloqueio progressivo por conta, conferido antes da senha. Motivo: a 9.12.3 conta com ele no lugar do MFA da equipe;
  - os desvios dos requisitos e da skill vão para um PR `docs/` entre o G2 e o F5 (R0.1d).
- **Sinais:**
  - pela documentação do Better Auth 1.7.15, o gancho `after` roda depois do commit. Isso refez a lacuna 1 e criou o U10 (A14);
  - os itens "Unverified" subiram de 9 para 10, todos em autenticação e dados; nenhum foi resolvido;
  - 12 lacunas só na spec A, contra 11 no spec inteiro do piloto;
  - A7 parcial, A11 a A14 novos, na seção "Atritos do harness";
  - cota: a S2 e esta sessão acompanhada usaram 48% da janela de 5 h, a 22,7% por hora.
- **Cota:** 5 h não medido → 48% · semana 36% → 42%, incluindo a sessão acompanhada.

### 20/11/2026 · Sessão 3 · F3 Lacunas (continuação) + G2 · R0 (spec A) · #3

- **Resumo:**
  - as lacunas 6 a 12 fecharam numa rodada só, com as respostas da sessão acompanhada;
  - a pedido do usuário, a sessão acompanhada analisou registros e auditoria contra as cotas gratuitas. O registro de segurança crescia no ritmo do visitante, dentro da cota de 500 MB do Supabase, e o pior caso era a organização inteira restrita até a virada do ciclo. O complemento das lacunas 7 e 8 entrou na #3: agregação por minuto, teto diário e auditoria com hash para campos longos;
  - o G2 foi aprovado. O PR dos desvios ficou para a S4, porque o contexto estava perto de 60%.
- **Portão:** G2 aberto. A #3 tem `ready-for-agent` e `type:spec`, sem `needs-triage`, e um comentário registra a aprovação.
- **Conferência:**
  - lacunas 1 a 12 com critério ou decisão no corpo da #3 → ok;
  - "Perguntas em aberto: Nenhuma." → ok, conferido pela sessão acompanhada antes do G2;
  - critérios novos (A5.10 a A5.14, A4.22, A2.21, U11 e U12) no corpo → ok, conferido;
  - nenhum e-mail no corpo da #3 → ok, conferido;
  - 18 linhas em "Desvios dos requisitos", cada uma com o arquivo → ok, pelo relatório;
  - ASSUMPTION da A5.15 (e-mail inexistente, para o bloqueio da conta não gravar `account_locked`) → ok: o bloqueio tem critérios próprios;
  - PR dos desvios → falta: fica para a S4 (R0.1d);
  - commits e reviews → não se aplica.
- **Decisões do usuário, com o motivo** (o detalhe está na #3):
  - lacuna 6: só as rotas do R0 ficam ligadas, e as outras vão para `disabledPaths`. As 12 h da sessão de equipe ficam no `verifySession()`, sem ganchos de sessão. Motivo: o gancho de atualização não recebe a sessão, e devolver `false` desloga;
  - mínimo de senha da equipe mantido em 12 caracteres. A recomendação de 15, pela NIST SP 800-63B-4, não entrou;
  - lacuna 7 e complemento: registro de segurança agregado por minuto, com o motivo e o status na chave, e teto diário de 1 a 2.000 linhas novas (padrão 1.000, em UTC). Só ficam fora do teto os eventos que exigem credencial ou sessão, e um ataque contra conta de equipe vai para um transbordo com a conta. Motivo: o volume não pode depender do visitante. No pior caso, cerca de 100 MB em 6 meses;
  - lacuna 8: script de papéis em duas partes, com a parte 2 depois de toda migration; papel só de leitura restrito aos dois registros; diff da auditoria com tamanho e hash para campos longos;
  - lacuna 9: exceção só para o `.env.example`;
  - lacuna 10: bootstrap do primeiro admin no PC do responsável técnico, nunca por workflow, porque o repositório é público;
  - lacuna 11: `SIGNUP_ENABLED` só com "true" ou "false" exatos; o retorno do login aceita só caminho interno;
  - lacuna 12: projeto próprio do Vitest para o banco, com o script de papéis no `globalSetup`.
- **Sinais:**
  - A7 resolvido: os `skillOverrides` dos dois arquivos de configuração se somam;
  - A13 corrigido no template (917c7f1), com teste novo no `protect-paths`;
  - A15 a A18 novos. O A18 pesa mais: o prompt F3 não cobre capacidade e cotas, e o ponto fraco dos registros só apareceu por pergunta do usuário;
  - a spec A tem cerca de 92 mil caracteres (A16);
  - itens "Unverified": de 10 para 12 (U11 e U12), nenhum resolvido;
  - um aviso falso de limite da API do GitHub (`gh api rate_limit` mostrou 4.994 restantes). Caso isolado;
  - o que a análise deixou para a spec B e a R1 está em "Levar à spec B e à R1".
- **Cota:** 5 h não medido → 28% (6,8% por hora) · semana 42% → 2%, depois do reset de sexta às 13:00, incluindo a sessão acompanhada.

### 20/11/2026 · Sessão 4 · Desvios da spec A (R0.1d) · R0 (spec A) · #3, PR #4

- **Resumo:** as 18 linhas de "Desvios dos requisitos" da #3 viraram o PR #4 (branch `docs/r0-desvios-spec-a`, commit `fc4e9ee`): requisitos v2.5, glossário, skills `auth-identity` e `data-layer`, `CLAUDE.md`, `.gitignore` e o hook `protect-paths`. São 10 arquivos, com +85 e −25 linhas. A #3 não mudou.
- **Portão:** o merge do PR #4 está pendente e é do usuário. A sessão acompanhada recomenda o merge.
- **Conferência:**
  - PR numa branch `docs/`, fora da `/ship-ticket` → ok;
  - só os arquivos da tabela de desvios → ok pelo relatório. A sessão acompanhada conferiu os 10 arquivos com `gh pr view 4 --json files`;
  - `format:check`, `lint`, `typecheck` e `test`, com o comando e a saída → ok;
  - CI verde → ok, conferido pela sessão acompanhada: `ci`, CodeQL e os dois Analyze com SUCCESS, e `mergeStateStatus` CLEAN;
  - `protect-paths` igual ao do template → ok, conferido pela sessão acompanhada: o `diff` com `templates/project/.claude/hooks/protect-paths.mjs` não acusou diferença. No smoke test, o hook devolveu 0 para `.env.example` e 2 para `.env.sample`, `.env.template`, `.env` e `.env.local`;
  - `.env.example` versionado → ok (`.gitignore:35:!.env.example`);
  - varredura de dado pessoal e segredo → ok;
  - `ASSUMPTION:` → não se aplica, porque não há nenhuma nova. O corpo do PR traz duas escolhas fáceis de reverter: `at` e `last_at` em `security_events`, e os papéis do banco descritos pela função, já que a spec não dá nomes a eles. O ticket da A1 pode ajustar as duas;
  - reviews → não se aplica: o PR só mexe em documentação e regras, e o hook é cópia do template, que tem teste no harness (917c7f1);
  - linha `Métricas:` → não se aplica, porque não é ticket.
- **Sinais:**
  - A12 confirmado: o PR `docs/` entre o G2 e o F5 funcionou, mas sem receita de branch;
  - A16 com 2 ocorrências: o corpo da #3 tem 93.226 caracteres, e a S4 precisou de dois scripts próprios só para extrair trechos;
  - A17 se agravou: o contorno por script passa por fora do `format.mjs` e do `protect-paths`;
  - A19 é novo e vem do A17: o heredoc quebrou com crases e aspas;
  - itens "Unverified": continuam 12, e agora todos estão nas skills (U10 a U12 entraram na `auth-identity`). Nenhum foi resolvido. Como o `protect-paths` bloqueia `.claude/**` nas branches `feat/*`, o ticket registra o resultado do item, e a linha sai da skill num PR `docs/` depois;
  - o Sonnet bastou numa sessão só de documentação, sem nenhuma escalada.
- **Cota:** 5 h não medido (1% numa janela nova, na hora do relatório) · semana 2% → 3%.

### 21/11/2026 · Sessão 5 · F5 Tickets · R0 (spec A) · #3, tickets #5 a #25

- **Resumo:** a spec A virou 21 tickets (#5 a #25), sub-issues da #3 com `blocked-by` nativo, 13 deles com `model:opus`. A proposta tinha 19, e duas rodadas levaram a 21:
  - os três ajustes do usuário: o seed em duas partes, um dono para o helper das contas de equipe e o #13 sem Opus;
  - três mudanças derivadas, também aprovadas: os adaptadores de e-mail do servidor e a infraestrutura do E2E no #15; as partes de tela da A4.15, A4.16 e A4.19 no #24; e a renumeração, para o primeiro E2E rodar cedo.

  Cada corpo traz o texto literal dos critérios e das decisões da #3 de que o ticket depende.
- **Portão:** G4 aprovado pelo usuário em 21/11/2026. Motivos dos ajustes:
  - o primeiro E2E contra o servidor de produção só rodaria no 17º ticket;
  - a regra condicional "o primeiro dos dois cria o helper" geraria duas implementações;
  - o `after()` do U6 mora nos adaptadores do servidor, não na confirmação de e-mail.
- **Conferência:**
  - sub-issues `type:ticket` com `blocked-by` nativo → ok, conferido pela sessão acompanhada por GraphQL: 21 sub-issues, com bloqueadores e labels iguais ao aprovado no G4 e 13 com `model:opus`;
  - `ready-for-agent` nos 21 → ok, publicados depois do G4;
  - todo critério com um dono, sem ciclo e com U1 a U12 cobertos → ok pelo script da sessão (100 IDs);
  - Definition of Ready em cada ticket → ok pelo relatório: critérios literais, sem placeholder nem caminho;
  - #3 intacta → ok: mesmo sha do corpo, mesmos labels e `updatedAt` de 20/11;
  - corpo do #15 editado depois de publicar, para dizer como se confere o adaptador do Resend → ok, registrado;
  - commits, reviews e `ASSUMPTION:` → não se aplica. O #7, o #9 e o #15 devem gerar `ASSUMPTION:` na implementação: nomes dos papéis, `at` e `last_at`, e o banco do E2E.
- **Sinais:**
  - A16 na terceira ocorrência, agora com custo medido: o implementer lia cerca de 121 mil caracteres da #3 em cada ticket. Corrigido no template (00666f5); o projeto recebe a correção na R0.2d;
  - A20 a A24 novos: o critério do `model:opus`; a carga de regras do implementer; o `format.mjs` fora do projeto, já corrigido no template (ea8b7d8); a ordem de publicação como ordem de execução; e a regra de caminhos nas issues;
  - itens "Unverified": continuam 12, nenhum resolvido. O mapa de item para ticket está na seção dos itens;
  - cota: a janela de 5 h chegou a 20%, a 49,2% por hora nos últimos 24 min, incluindo a sessão acompanhada. A semana subiu 5 pontos numa sessão sem código.
- **Cota:** 5 h não medido → 20% · semana 3% (fim da S4) → 8%, incluindo a sessão acompanhada.

### 21/11/2026 · Sessão 6 · Sincronia do harness (R0.2d) · R0 · PR #26

- **Resumo:** o PR #26 (commit `bd4a803`) trouxe ao projeto a linha nova do implementer (00666f5) e o `format.mjs` do template (ea8b7d8). O classificador do modo auto negou à sessão a cópia do hook, com o motivo "Undermining Oversight". A pedido do usuário, a sessão acompanhada fez a cópia, e a sessão do projeto seguiu do smoke test.
- **Portão:** merge do PR #26 feito pelo usuário (MERGED, conferido pela sessão acompanhada).
- **Conferência:**
  - branch `docs/` criada a partir da main atualizada → ok;
  - só a linha do ticket trocada no implementer → ok, conferido no PR (`+1 −1`);
  - hook idêntico ao do template → ok, conferido pela sessão acompanhada antes do commit (`git diff --no-index` vazio);
  - smoke test: o arquivo do scratchpad ficou intacto (`cmp`) e o arquivo na raiz do projeto foi formatado, os dois com exit 0 → ok;
  - `format:check` → ok;
  - CI verde → ok, conferido: os 4 checks com SUCCESS;
  - reviews, `ASSUMPTION:` e `Métricas:` → não se aplica.
- **Sinais:**
  - A25 novo: no modo auto, sincronizar um hook do template no projeto é passo do usuário;
  - o `.prettierignore` do projeto ignora `.claude/`. Um controle do hook dentro de `.claude/hooks/` não prova nada, e a sessão usou um arquivo na raiz. Isso também quer dizer que o `format.mjs` nunca mexe em skills e agentes;
  - A17: a sessão trocou a linha do implementer por script, para fugir de um hook que nem age em `.claude/`;
  - as correções do A16 e do A22 chegaram ao projeto. A primeira `/ship-ticket` mostra se o implementer deixa de abrir a #3; a sessão acompanhada confere isso na transcrição do subagente.
- **Cota:** 5 h 20% (fim da S5) → 25% · semana 8% → 9%, incluindo a sessão acompanhada.

### 23/11/2026 · Sessão 7 · F6 + F7 · R0 (spec A) · ticket #5, PR #27

- **Resumo:** o #5 (fronteiras entre camadas e módulos no lint) saiu pela `/ship-ticket` no PR #27, com os commits `ca5d0e8` (feat) e `22ef65a` (fix). Os reviews deram 15 findings: 6 fix, 6 accept e 3 reject. Dois dos fix eram bugs de correção:
  - os padrões de `resend`, `next` e `next/*` casavam arquivos locais com o mesmo nome;
  - a regex de import interno pegava caminhos de outro módulo.
- **Portão:** o merge do PR #27 está pendente e é do usuário. A sessão acompanhada recomenda o merge.
- **Conferência (Definition of Done):**
  - teste vermelho → verde no seam → ok, conferido na transcrição: as duas execuções do implementer tiveram rodadas com testes falhando antes do verde;
  - `pnpm lint`, `pnpm typecheck` e `pnpm test` com o comando e a saída → ok (26 testes);
  - commit `feat(#5)` → ok (`ca5d0e8`), mais o `fix(#5)` dos findings;
  - `ASSUMPTION:` no ticket → ok, nenhuma;
  - todo finding com veredito → ok, tabela no corpo do PR;
  - PR com `Closes #5` e CI verde → ok, conferido: os 4 checks com SUCCESS. O CI roda `pnpm build` e `test:e2e`, então o build com `lint-examples/` fora também ficou provado;
  - linha `Métricas:` no ticket → ok: `modelo=sonnet · findings=6/6/3 · assumptions=0 · ci-vermelho=0`;
  - escalada para Opus → falta: o passo 7 da skill a exigia, porque houve bug de correção com veredito fix numa execução em Sonnet. A causa é a ordem dos passos da skill (A26), não a sessão. Os dois fixes têm teste de regressão e o CI passou; por isso, a recomendação é não refazer.
- **Sinais:**
  - A16 confirmado no uso: o implementer não abriu a #3;
  - A26 novo, já corrigido no template;
  - findings repetidos entre os dois reviews, sem regra na skill: entrou na mesma correção;
  - 15 findings num ticket de configuração de lint. No piloto, foram 29 em 5 tickets;
  - cota: um ticket em Sonnet custou cerca de 1 ponto da semana.
- **Cota:** 5 h não medido · semana 9% (fim da S6) → 10%.

### 23/11/2026 · Sessão 8 · F6 + F7 · R0 (spec A) · ticket #6, PR #28

- **Resumo:** o #6 (configuração validada na inicialização e inventário de variáveis) saiu no PR #28, com os commits `d8252bc` (feat) e `2512948` (fix). Os reviews deram 16 findings: 3 fix, 8 accept e 5 reject. A aplicação compilada recusa subir sem as variáveis e cita os nomes, sem os valores. A dependência `zod` entrou por `pnpm add`.
- **Portão:** o merge do PR #28 está pendente e é do usuário. A sessão acompanhada recomenda o merge.
- **Conferência (Definition of Done):**
  - teste vermelho → verde no seam → ok pelo relatório e pelo corpo do PR: cada fix descreve o vermelho e o verde;
  - `pnpm lint`, `pnpm typecheck` e `pnpm test` com o comando e a saída → ok (76 testes), mais `pnpm build` e `next start` sem variáveis;
  - commit `feat(#6)` → ok;
  - `ASSUMPTION:` no ticket → ok: 5, num comentário só;
  - todo finding com veredito → ok, tabela no corpo do PR. O finding que os dois reviews relataram recebeu um veredito só;
  - PR com `Closes #6` e CI verde → ok, conferido;
  - linha `Métricas:` → ok: `modelo=sonnet · findings=3/8/5 · assumptions=5 · ci-vermelho=0`;
  - escalada → não se aplica: os 3 fixes corrigem testes, não o comportamento do produto. A sessão acompanhada concorda.
- **Sinais:**
  - 5 `ASSUMPTION:` na mesma área (configuração). Todas são fáceis de reverter, mas uma pesa na segurança: aceitar `sslmode=require`. Foi para "Levar à spec B e à R1", com as fontes;
  - A27 e A28 novos: a definição de bug de correção e a montagem manual do review do Matt;
  - a ordem do prompt de abertura venceu a do passo 7 da skill do projeto, como previsto até a sincronia (A26);
  - acumulado na spec A: 2 tickets, 31 findings (9 fix, 14 accept, 8 reject), 5 `ASSUMPTION:` e nenhuma escalada.
- **Cota:** 5 h não medido → 16% · semana 10% (fim da S7) → 12%.

### 23/11/2026 · Sessão 9 · F6 + F7 · R0 (spec A) · ticket #7, PR #29

- **Resumo:** o #7 (Postgres local e de CI, migrations no schema `app` e papéis do banco) saiu no PR #29, com os commits `b8cd3a3` (feat) e `0384ae3` (fix). O implementer rodou em Opus, pelo label. Os reviews deram 29 findings: 10 fix, 13 accept e 6 reject. Oito dos fix eram bugs de correção, um deles de segurança: a porta do Postgres local ficava aberta em todas as interfaces. O U1 se confirmou.
- **Portão:** o merge do PR #29 está pendente e é do usuário. Antes dele, o usuário confirma no PR a ASSUMPTION das tabelas TEMP. A sessão acompanhada recomenda confirmar e fazer o merge.
- **Conferência (Definition of Done):**
  - teste vermelho → verde no seam → ok, pelo corpo do PR. Na A1.2 e na A1.14, os testes passaram antes do código; o implementer forçou a falha de propósito e reverteu;
  - `pnpm lint`, `pnpm typecheck` e `pnpm test` com o comando e a saída → ok (106 testes), mais `format:check`;
  - commit `feat(#7)` → ok (`b8cd3a3`), mais o `fix(#7)` dos findings;
  - `ASSUMPTION:` no ticket → ok: 9 itens, um deles substituído por um comentário novo (A29);
  - todo finding com veredito → ok, tabela no corpo do PR;
  - PR com `Closes #7` e CI verde → ok, conferido: os 4 checks com SUCCESS, agora com o Postgres no CI;
  - linha `Métricas:` → ok: `modelo=opus · findings=10/13/6 · assumptions=9 · ci-vermelho=0`;
  - U1 com comando e saída no PR → ok;
  - escalada → não se aplica: Opus desde o início.
- **Sinais:**
  - 9 `ASSUMPTION:`, o maior número até aqui. A maioria é convenção do ambiente local e fácil de reverter. Duas foram para "Levar à spec B e à R1" (variáveis dos scripts de banco e TEMP);
  - oito bugs de correção numa execução em Opus: os reviews continuam achando bug no modelo maior;
  - a dúvida da TLS saiu do código do postgres.js 3.4.9: `require` cifra sem conferir o certificado;
  - A29 novo e já corrigido no template (`3bfb08f`); A30, A31 e A32 novos. As divergências da `data-layer` e o NEEDS-DECISION do guia de migrations foram para "Levar à retro da spec A";
  - cota: o #7 em Opus custou 8 pontos da semana, contra 1 a 2 dos tickets em Sonnet, e levou a janela de 5 h a 71%, com projeção de 100% antes da virada. Restam 18 tickets, 12 com `model:opus`: pela média, cerca de 100 pontos da semana. A spec A atravessa ao menos uma virada semanal, e cada ticket em Opus pede uma janela de 5 h própria;
  - acumulado na spec A: 3 tickets, 60 findings (19 fix, 27 accept, 14 reject), 14 `ASSUMPTION:` e nenhuma escalada (uma devida no #5).
- **Cota:** 5 h não medido → 71% · semana 12% (fim da S8) → 20%, incluindo a sessão acompanhada.

### 24/11/2026 · Sessão 10 · F6 + F7 · R0 (spec A) · ticket #8, PR #30

- **Resumo:** o #8 (cadastro do titular com perfil do titular e aceite) saiu no PR #30, com o commit `812fe80` (feat) e seis `fix(#8)`, o último `a6133bc`. O implementer rodou em Opus, pelo label. Os reviews deram 18 findings: 11 fix, 7 accept e 0 reject. Houve um bug de correção: se o delete da compensação falhava, a Conta ficava com senha válida e sem perfil, e o cadastro respondia 500 sem corpo e sem log (`e2aa1c9`). Outros dois fix vieram de entradas que o Better Auth aceita do cliente sem validar: o nome vazio ou enorme e o `image`. O U2, o U7 e o U10 se confirmaram; o U3, não do jeito que a skill escreve.
- **Portão:** o merge do PR #30 está pendente e é do usuário. A sessão acompanhada recomenda o merge. Os dois NEEDS-DECISION do #8 não bloqueiam o PR.
- **Conferência (Definition of Done):**
  - teste vermelho → verde no seam → ok, pela tabela "Critérios: teste vermelho → verde" do corpo do PR;
  - `pnpm lint`, `pnpm typecheck` e `pnpm test` com o comando e a saída → ok (136 testes, 30 deles no arquivo de banco do cadastro), mais `format:check`;
  - commit `feat(#8)` → ok (`812fe80`), mais os seis `fix(#8)` dos findings;
  - `ASSUMPTION:` no ticket → ok: 14 itens em três comentários. Um item foi substituído por um comentário novo, como pede o A29;
  - todo finding com veredito → ok, tabela no corpo do PR. Os findings repetidos entre os reviews receberam um veredito só;
  - PR com `Closes #8` e CI verde → ok, conferido: `ci`, CodeQL e os dois Analyze com SUCCESS, e o PR está MERGEABLE e CLEAN no `a6133bc`;
  - linha `Métricas:` → ok: `modelo=opus · findings=11/7/0 · assumptions=14 · ci-vermelho=0`;
  - U2, U3, U7 e U10 com comando e saída no PR → ok, na seção "Itens não verificados";
  - escalada → não se aplica: Opus desde o início.
- **Sinais:**
  - 14 `ASSUMPTION:`, de novo o maior número (eram 9 no #7). Quase todas são regras do servidor que a spec não fixou: as declarações, a versão dos documentos, o limite do nome e a recusa da imagem;
  - os findings do nome e da imagem mostram uma lacuna do F3: a spec não perguntou quais campos o Better Auth grava como o cliente manda. A mesma lacuna vale para a rota `/update-user`, que o #12 vai ligar. Foi para "Levar à retro da spec A" e "Levar aos tickets seguintes da spec A";
  - NEEDS-DECISION dos logs (RNF-OBS-01): a sessão acompanhada conferiu no código instalado que o `onAPIError.onError` não evita o `console.error` do better-call. Só o `onAPIError.throw` tira o erro do roteador. A recomendação ao usuário parte disso;
  - U3: a regra da skill estava errada, e o código já segue a regra nova. É a segunda vez que o uso desmente uma afirmação de skill do projeto (A14);
  - A33 e A34 novos, com correção no prompt da sessão acompanhada e no template (`d6c4af9`). O A29 apareceu de novo, porque o projeto ainda não recebeu a correção;
  - os requisitos citam o Dependabot e o Renovate em lugares diferentes, e a ASSUMPTION 1 do #8 conta com o Renovate. Foi para "Levar à spec B e à R1";
  - acumulado na spec A: 4 tickets, 78 findings (30 fix, 34 accept, 14 reject), 28 `ASSUMPTION:` e nenhuma escalada (uma devida no #5);
  - cota: o #8 custou 9 pontos da semana, e a janela de 5 h chegou a 69%, com projeção de 100% antes da virada. Restam 17 tickets, 11 com `model:opus`: pela média, cerca de 100 pontos. Até a virada de sexta (27/11, 13:00), sobram 71.
- **Cota:** 5 h não medido → 69% · semana 20% (fim da S9) → 29%.

### 24/11/2026 · Sessão acompanhada · Decisões do relatório da S10

- **D1, merge do PR #30:** aprovado.
- **D2, dados pessoais nos logs (RNF-OBS-01):** aprovadas as propostas 1 e 2 no #12, com o `onAPIError.throw` ligado e um teste de falha forçada no banco; a proposta 3 vai para a spec B. Motivo: o #12 é o ticket que liga a rota, e o `onAPIError.onError` não evita o `console.error` do better-call.
- **D3, regra nova do U3:** aprovada. Entra na `auth-identity` na R0.3d.
- **D4, ordem:** a R0.3d vem antes do #9 e usa a sobra da janela de 5 h antes da virada das 14:50. Se o limite acabar no meio, a sessão continua depois da virada, sem `/clear`. Motivo: a sobra se perde na virada, e a janela nova fica inteira para o #9 em Opus.
- **D5, tirar o `model:opus` do #16 e do #24:** recusado. O usuário prefere uma saída mais robusta e elaborada nessas telas. O A20 segue aberto para a retro, com o custo medido.
- **Harness:** push do `d6c4af9`, do `ee406cc` e desta entrada, a pedido do usuário.
