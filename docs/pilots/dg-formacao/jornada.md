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
| R0.4d | Sincronia do harness, depois do #11 | PR `docs/` com o verify-gate do A40, a `/ship-ticket` do A37, A38 e A41, a `relatorio-sessao` lendo o `/usage` (A10), e U8, U9 parcial e a regra do IP na `auth-identity` | Feito: PR #35 (S15), mergeado antes do #12 |
| R0.5d | `auth-identity` depois do #12, entre o #15 e o #16 | PR `docs/` na `CONFIG.md`: o envoltório do handler (o bloqueio `rate_limited` gravado nele, o 404 do retorno do login social), o `onAPIError.throw` com o `logger.log` e o caminho base explícito, cada um com a razão (NEEDS-DECISION do #12, issuecomment-7165798068); a recusa `cross-site` antes do rate limit, com a exceção dos links do e-mail, também com a razão; a linha do U9 sai do "Unverified", e o fato de o rate limit usar o caminho sem o caminho base vai para o corpo (A14); a regra do IP nomeia o módulo, e não o arquivo; resposta no #12. Depois do #13 (aprovado em 25/11): no exemplo e nas razões, o envio dos callbacks de e-mail começa sem esperar e registra a falha só com o nome e o código, e os dois prazos dos links e o `requireEmailVerification: false` ficam explícitos (issuecomment-7171403121); o envio automático do cadastro sai do exemplo e dá lugar ao gancho posterior em `/sign-up/email`, com a razão "o e-mail do cadastro sai depois do commit e do gancho do perfil" (issuecomment-7172160543); o U6 fica parcial no "Unverified"; resposta no #13; e um gotcha no `CLAUDE.md` do projeto: a suíte de banco nunca roda em segundo plano, porque o banco de teste é único e o verify-gate também roda testes (A40) | Merge do usuário, antes do #16 e do #17 |
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
| U1 | data-layer | O drizzle-kit emite `.op('extensions.gin_trgm_ops')` no SQL do índice exatamente como escrito | #3 A1.9 (schema descartável, fora do commit; o índice real entra na R1) → #7 | Confirmado no #7 (S9, PR #29): o SQL gerado traz `extensions.gin_trgm_ops` exatamente como escrito. A linha saiu da skill no PR #31 (S11) |
| U2 | data-layer | O tipo de coluna que o CLI do Better Auth gera para `user.id` quando `generateId` devolve UUID | #3 A2.6 → #8 | Confirmado no #8 (S10, PR #30): o CLI 1.7.15 gera `text` para `user.id`, e o `generateId` grava UUIDv7. O tipo `text` vale para toda chave que aponta para a Conta. A linha saiu da skill no PR #31 (S11) |
| U3 | auth-identity | `schemaName: 'app'` no adapter põe todas as tabelas do Better Auth em `app`, inclusive os campos do plugin admin e `rateLimit` | #3 A2.5 → #8 | Não se confirmou como a skill escreve (#8, S10, NEEDS-DECISION). No adaptador do Drizzle, só o gerador do CLI lê o `schemaName`. Em tempo de execução, as tabelas ficam no `app` porque o schema do Drizzle as declara em `pgSchema('app')`. O resultado da A2.5 vale, e o código já segue a regra proposta. A regra nova, aprovada pelo usuário em 24/11, entrou na `CONFIG.md` da skill no PR #31 (S11) |
| U4 | auth-identity | O plugin admin guarda vários papéis separados por vírgula em `role` e respeita todos | #3 A4.8 → #19 | — |
| U5 | auth-identity | O pedido de reset de senha devolve a mesma resposta para e-mail desconhecido | #3 A3.5 → #17 | — |
| U6 | auth-identity | `after()` funciona dentro dos callbacks de e-mail do Better Auth | #3 A3.12 (seam 5, contra `next start`) → #13 (A3.7, seam 1), #15 (primeira prova, no E2E pelo HTTP) e #23 (A3.12, dono) | Parcial no #13 (S17, PR #37), só no seam 1: a resposta do cadastro, do pedido de nova confirmação e do pedido de redefinição volta com o envio ainda pendente (A3.7; `email-delivery.db.test.ts`, 11 testes). O `after()` dentro de uma Route Handler de verdade fica com o #15 e o #23 |
| U7 | auth-identity | `databaseHooks.user.create.after` roda na requisição do cadastro, de modo que perfil principal e consentimentos podem ser gravados ali | #3 A2.1 → #8 | Confirmado no #8 (S10, PR #30): o gancho roda na requisição do cadastro, depois do commit da Conta e fora da transação dela. A linha saiu da skill no PR #31 (S11) |
| U8 | auth-identity | Um after-hook em `/sign-in/email` alcança e revoga a sessão que acabou de criar (STAFF.md) | #3 A4.11 → #18 | Confirmado no #11 (S14, PR #34): o gancho posterior de `/sign-in/email` alcança e apaga a sessão que acabou de criar (teste do registro falhando, `80dc97e`). O #18 continua dono da A4.11 |
| U9 | auth-identity | Os nomes de rota do rate limit na 1.7: `/sign-in/email`, `/sign-up/email`, `/request-password-reset` e `/send-verification-email` | #3 A2.11 e A3.8 → #12 (A2.11) e #17 (A3.8) | Parcial no #11 (S14): `/sign-in/email` confirmado pela chave do rate limit. No #12 (S16, PR #36), o teste "the names of the routes in the rate limit of Better Auth 1.7 (U9)" acha a chave `<ip>\|<rota>` em `app.rate_limit` nas quatro rotas, e o rate limit usa o caminho do pedido sem o caminho base. Os quatro nomes estão confirmados; a linha sai da skill no PR `docs/` da R0.5d, e o fato passa para o corpo da `CONFIG.md` (A14). As regras da A3.8 seguem com o #17 (CR7, reject) |
| U10 | auth-identity (da S2) | Com `transaction: true` no `drizzleAdapter`, o gancho `after` roda depois do commit e é pulado no rollback. A documentação do Better Auth 1.7.15 já afirma isso; o teste confirma no código | #3 A2.12 → #8 | Confirmado no #8 (S10, PR #30): uma sonda com `xmin` mostra que a linha da Conta já está commitada quando o gancho roda, e invertida, a sonda falha. No rollback da Conta, o gancho não roda. A linha saiu da skill no PR #31 (S11) |
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

- **Dados sensíveis no log, a mesma categoria em quatro tickets:** o #8 (NEEDS-DECISION dos logs, decisão D2), o #10 (alerta `js/clear-text-logging` do CodeQL, o CI vermelho da S13), o #11 (R1: IP e e-mail no log, PR #34) e o #12 (CR3: token da sessão no log pelo `cause`, em código do #11; CR4: um 500 sem nenhuma linha de log; SP1: o teste do critério (a) não forçava a falha que leva e-mail e nome; PR #36). Os reviews pegaram todos, mas o review do #11 não pegou o CR3. Candidato: trazer da spec B para o R0 o logger com lista fechada de chaves, ou um auxiliar de teste que capture o console nas suítes de banco e falhe ao achar e-mail, IP ou token.
- **Exemplo da skill que leva ao bug (A14 de novo):** a `CONFIG.md` da `auth-identity` liga o envio automático da confirmação no cadastro, que na 1.7.15 começa dentro da transação, antes do commit e do gancho do perfil. Isso contraria a regra da `data-layer` (e-mail depois do commit) e foi o bug de correção do #13, que levou à escalada. O mesmo exemplo chama o envio sem esperar e sem tratar a falha, o que contraria a A3.9 (NEEDS-DECISION do #13, issuecomment-7171403121 e issuecomment-7172160543). As evals da `auth-identity` (R0.e) não rodaram ainda. Candidato: um exemplo de skill que liga um comportamento da biblioteca vem com o teste que o prova, ou fica marcado como não verificado.
- **Caminhos de arquivo nas skills envelhecem rápido:** a regra do IP que o PR #35 (S15) pôs na `CONFIG.md` da `auth-identity` aponta `src/data/auth/sign-in.ts` para a leitura do IP. Um ticket depois, o #12 levou a leitura para `requester.ts` (relatório da S16). Candidato: a skill nomeia o módulo ou a função, e não o arquivo.
- **Para a skill `testing-stack` (R0.s):** no Docker Desktop do Windows, cada commit do banco de teste levava cerca de 80 ms, e o teste de volume da NF-5 estourava o tempo limite. O banco de teste passou a usar `synchronous_commit = off` (ASSUMPTION 11 do #9, `src/test/db/setup.ts`).

## Levar aos tickets seguintes da spec A

O que um ticket descobriu e outro precisa receber. Cada item entra no prompt de abertura do ticket indicado.

- **#12, logs sem dados pessoais (NEEDS-DECISION do #8, RNF-OBS-01):** no Better Auth 1.7.15, o roteador repassa ao better-call 1.4.4 todo erro que não é `APIError`, e o better-call o imprime inteiro com `console.error("# SERVER_ERROR: ", error)` (`better-call/dist/router.mjs:93`). O `onAPIError.onError` não evita isso, porque devolve nada e o better-call segue para o `console.error` (`better-auth/dist/api/index.mjs:196-205`). Só o `onAPIError.throw` tira o erro do roteador, e o `APIError` continua virando resposta. O `DrizzleQueryError` do Drizzle 0.45.4 põe os parâmetros da consulta na mensagem (`drizzle-orm/errors.js:12`). O `logger.log` próprio substitui o console nas chamadas internas da biblioteca (`@better-auth/core/dist/env/logger.mjs:63-69`). Decidido pelo usuário em 24/11 (D2): o #12 liga o `onAPIError.throw`, a rota do Next captura o erro e registra só o nome e o código do Postgres, um `logger.log` próprio reduz do mesmo jeito os erros que a biblioteca registra, e um teste força uma falha no banco e confere a saída do console.
- **#12, rota `/update-user`:** a rota da 1.7.15 aceita `name` e `image` do cliente (`better-auth/dist/api/routes/update-user.mjs:14-41`). Quando o #12 ligar o handler, ela vai aceitar o que o cadastro do #8 recusa: imagem de terceiros (RNF-SEG-12) e nome vazio ou com mais de 100 caracteres. O #12 desliga a rota com `disabledPaths`, se nenhum ticket da spec A a usar, ou aplica nela as regras do cadastro. Correção na S11: a A4.17 da spec, que é do #12, já desliga a rota (404). O critério (b) que a S11 publicou no #12 (issuecomment-7136201442) pede "a mesma resposta que o cadastro" (400) e contradiz a A4.17. O erro é da sessão acompanhada (A33). A A4.17 vale, e o comentário de correção saiu na continuação da S11 (issuecomment-7138444046).
- **#11, #12, #17, #18 e #19, IP no registro de segurança:** passam ao gravador do #9 o IP bruto do cliente, que o gravador reduz à faixa e grava com o IPv4 mapeado na forma IPv4 (notas e findings do PR #32; ASSUMPTION 6 e 7 do #9).
- **#25, expurgo (A5.7):** a regra de lint da A5.6 isenta só o arquivo que grava no registro de segurança. O expurgo acrescenta o seu arquivo à isenção (ASSUMPTION 10 do #9, substituída; "Risco do merge" do PR #32).
- **#14, #20 e #22, Contas criadas fora do cadastro:** o gancho do #8 lê as declarações do pedido de cadastro e apaga a Conta que não as traz (ASSUMPTION 5 do #8). Os seeds e o convite precisam de um caminho próprio para criar a Conta.
- **#12, #17, #18 e #19, IP dos ganchos que gravam no registro de segurança (NEEDS-DECISION do #11):** a leitura de IP do Better Auth corta o IPv6 na rede /64 e, em desenvolvimento e nos testes, troca um valor que não é IP pelo endereço local, o que quebra a A5.11. O #11 passa ao gravador o IP como a requisição o mandou, no cabeçalho que o rate limit lê, separado como o Better Auth o separa (finding R5 do PR #34); o módulo `audit` valida e reduz à faixa. Resolvido na S15: o usuário aprovou, a regra entrou na `CONFIG.md` da `auth-identity` (PR #35, mergeado), e o comentário de resposta no #11 (issuecomment-7164757526) aponta os tickets que gravam eventos.
- **#16, renovação da sessão (A2.7, ASSUMPTION 11 do #11):** o portão de sessão lê sem renovar, porque um Server Component não regrava o cookie (finding R4/E4 do PR #34). A renovação diária do "Lembrar de mim" acontece só na leitura HTTP da sessão, então a A2.7 só vale no app se as telas do #16 fizerem essa leitura. O mecanismo se decide antes do #16, com pesquisa.
- **#16, mensagens de erro (ASSUMPTION 8 do #11):** o erro HTTP mantém o código e o texto em inglês do Better Auth, e a tela mostra o texto em português a partir do código.
- **#18 e o ticket do rate limit (ASSUMPTION 2 e 5 do #11):** o #11 grava `sign_in_failed` só na recusa por e-mail ou senha errados e `sign_in_succeeded` para toda Conta. A recusa por rate limit, a por suspensão e o `staff_sign_in_succeeded` (A4.13, do #18) ficam com os tickets donos.
- **#13 e #17, o que o handler do #12 mudou para os fluxos de e-mail:** (1) as páginas próprias do Better Auth, de sucesso e de erro, ficaram desligadas, porque não estão na lista da A4.17; um erro dos fluxos de confirmação e de redefinição que caia no redirecionamento padrão do Better Auth chega a um 404, então os dois tickets apontam os erros para uma página do app (ASSUMPTION 3, issuecomment-7165797451). (2) O handler recusa com 403, antes do rate limit, todo pedido marcado `Sec-Fetch-Site: cross-site`; os links do e-mail passam só quando o navegador os abre como página, na aba (ASSUMPTION 1, issuecomment-7166871397). (3) Para o #17: o log de um 500 leva o padrão da rota, nunca o caminho, porque o caminho do link de redefinição traz o token (ASSUMPTION 2, mesmo comentário). Publicado, com aprovação do usuário, como comentário no #13 (issuecomment-7171007566) e no #17 (issuecomment-7171007989).
- **#14, seed do titular, depois do #13:** a confirmação do cadastro sai por um gancho posterior em `/sign-up/email`, só quando o cadastro termina bem, e a resposta volta com o envio ainda pendente (A3.7; ASSUMPTION de issuecomment-7172159354). O seed espera o e-mail falso receber o link antes de abri-lo. O link leva à página inicial (ASSUMPTION 4 de issuecomment-7171401608).
- **#15, adaptadores do servidor (ASSUMPTION 1 do #13):** até o #15, o envio de e-mail da aplicação falha de propósito, e a falha vai para o log como erro. O #15 troca esse envio pela escolha do adaptador pela configuração, e faz a primeira prova do `after()` numa Route Handler (U6).
- **#17, redefinição (ASSUMPTION 2 e 5 do #13):** o prazo de 30 minutos já entrou no #13, num só lugar que a configuração e o texto do e-mail leem; o teste da A3.6 continua no #17. O link de redefinição depende do destino que o pedido manda, e a exigência desse destino fica com o #17.
- **#16 e #23, telas (ASSUMPTION 4 e 5 do #13):** as telas mandam sempre o destino no pedido de redefinição, porque sem ele o link termina numa página desligada do Better Auth (404). O link de confirmação leva à página inicial, e um link vencido ou inválido volta para ela com o código do erro; o #23 pode passar outro destino no cadastro e tratar o erro.
- **#18, bloqueio por conta (ASSUMPTION 1 do #12):** a linha `rate_limited` não traz a conta, porque o rate limit recusa antes de o Better Auth ler o corpo. As tentativas com falha anteriores ao bloqueio já trazem a conta.
- **#19, papéis da equipe no registro de segurança:** o #10 fixou os papéis da equipe no domínio de auditoria, e o gravador lê o `user.role` atual no banco para decidir se a Conta é de equipe (finding 5 do PR #33, accept; ASSUMPTION 1 do #10). Quando o #19 criar a matriz de permissões, o gravador passa a ler dela.

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
- **URL base do Better Auth em staging e produção (finding 9 do PR #37, accept):** hoje só os testes definem `BETTER_AUTH_URL`. Sem `baseURL` nem a variável, o Better Auth monta a URL base pela requisição, e um cabeçalho de host forjado pode fazer o link de redefinição apontar para outro domínio. A documentação diz para não depender da inferência; para vários domínios, como os previews da Vercel, há a lista `allowedHosts`, e o `fallback` pode esconder um proxy mal configurado (docs "Options" e "Dynamic Base URL" do Better Auth; advisory GHSA-569q-mpph-wgww, corrigido na 1.4.2). Proposta: a validação de ambiente do #6 exige a URL base em staging e produção, sem `fallback`, e a spec B decide os previews. Vem antes de qualquer ambiente hospedado mandar esses e-mails. Aprovado pelo usuário em 25/11 como critério da spec B.
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
| A10 | A skill `relatorio-sessao` do projeto manda preencher a cota "com /quota", mas o valor certo vem do `/usage`, como o playbook diz | `.claude/skills/relatorio-sessao` do projeto; relatório da S1 | Corrigido no projeto pelo PR #35 (S15): a skill lê a cota do `/usage`, e `grep -n "/quota"` não acha mais nada. Eram 3 ocorrências (S1, S13, S14). A skill é do projeto, não do template |
| A7 | A skill `anthropic-skills:supabase`, sincronizada do claude.ai, aparece nas sessões do projeto, embora o template desligue o plugin `supabase@synced`. A descrição dela pede uso em "ANY task involving Supabase", o que concorre com a `data-layer` no R0 | transcrição da S0b (lista de skills); relatório da S3, passo 1 | Resolvido na S3: `supabase`, `supabase-postgres-best-practices` e o `to-spec` avulso ficaram fora da lista, com o `skillOverrides` dividido entre o `settings.json` e o `settings.local.json`. Os dois arquivos se somam. Candidato: o template desliga as duas no `settings.json`, onde já desliga o `to-spec` avulso |
| A11 | A `to-spec` do Matt manda aplicar `ready-for-agent` ao publicar, mas o playbook só aplica o label no G2. A regra do projeto venceu | relatório da S2 | Aberto, 1 ocorrência. Candidato: o playbook avisa, no F2, que o label do `to-spec` fica para o G2 |
| A12 | O playbook não tem um passo para as correções de requisitos e de skills que aparecem no F3. O `protect-paths` bloqueia `.claude/**` nas branches `feat/*`, então um ticket não consegue corrigir a skill que o implementer pré-carrega | relatório da S2; #3, seção "Desvios dos requisitos" | Confirmado na S4: o PR `docs/` (#4) passou com o CI verde. Sem receita no playbook, a sessão improvisou a branch: o `git checkout -b … origin/main` deixou o upstream em `origin/main`, e o `push -u` corrigiu. O relatório também não achou uma fase do playbook para citar. Candidato: o playbook ganha esse passo, com a mesma receita de branch da `/ship-ticket` (`git switch main`, `git pull --ff-only`, `git switch -c`) |
| A13 | `.env.example`: o `CLAUDE.md` do template proíbe editar `.env*`, o `protect-paths` libera e pede para editar o `.env.example`, e o `.env*` do `.gitignore` gerado pelo create-next-app ignora o `.env.example` | `templates/project/CLAUDE.md:21`; `templates/project/.claude/hooks/protect-paths.mjs:12-13`; `.gitignore:34` do projeto; lacuna 9 da #3 | Corrigido no template (917c7f1): o hook libera só o `.env.example`, o `CLAUDE.md` abre a exceção e o `gitignore.append` traz `!.env.example`. O projeto recebe as mesmas linhas no PR da R0.1d |
| A14 | A skill `auth-identity` afirmava como fato coisas que a spec teve de desfazer: o `after()` no callback de e-mail e o convite pelo plugin admin. A linha do U7 (`SKILL.md:53`) levava a supor que o gancho `after` grava na mesma transação da conta | `auth-identity/SKILL.md:53` e `STAFF.md` do projeto; lacunas 1 e 2 da #3 | Corrigido na spec; a skill muda no PR da R0.1d. Para a retro: rever como as skills de projeto separam o que é fato conferido do que é suposição. Na S11, o comportamento confirmado do U7 e do U10 saiu da seção "Unverified" sem ficar escrito em outro trecho da skill. Ele voltou como fato na continuação da S11 (`22861ee`, na `CONFIG.md`), antes do merge do PR #31. Candidato para a retro: o que se confirma muda de lugar, não some |
| A15 | O passo 1 do prompt da S3 esperava o `mattpocock-skills:to-spec` na lista de skills do modelo. Uma skill com `disable-model-invocation: true` não aparece nessa lista; só o menu `/` do usuário ou o manifesto do plugin confirmam que ela existe | relatório da S3; prompt da S3, passo 1 | Corrigido nos prompts da sessão acompanhada: a lista do modelo serve só para as skills que o modelo invoca. Liga com o A4 |
| A16 | O corpo da spec A tem cerca de 92 mil caracteres. Cada leitura da issue inteira pesa no contexto, inclusive no F5 | relatório da S3 | 3 ocorrências. Na S4, o corpo tinha 93.226 caracteres, e a sessão precisou de dois scripts próprios para extrair a seção e os critérios citados. Na S5, a maior carga na conta de "cabe na janela" foi o passo 1 do implementer, que lia a #3 com os comentários (cerca de 121 mil caracteres) em cada ticket. Corrigido no template (00666f5): o implementer lê o ticket e só abre o corpo da spec quando o ticket deixa uma dúvida, e o F5 do playbook pede tickets autocontidos. O projeto recebeu a linha no PR #26 (S6). Na S7, pela transcrição dos subagentes, as duas execuções do implementer do #5 não abriram a #3. Ainda candidato para a retro da A: um orçamento de tamanho para a spec |
| A17 | O `format.mjs` roda `prettier --write` em cada arquivo editado, e o prettier realinha as tabelas Markdown. A edição seguinte de uma linha de tabela não casa mais com o texto lido; a S3 contornou com um script Node que casa pelo começo da linha | `templates/project/.claude/hooks/format.mjs:13`; relatório da S3 | Aberto. Na S4, as edições por script Node passaram por fora do `format.mjs` e do `protect-paths`, cujo matcher é `Edit|Write|NotebookEdit`; o `prettier --check` passou. Esse contorno contradiz o gotcha de edição do `CLAUDE.md` do template e escapa das travas. Na S6, a sessão trocou uma linha de `.claude/agents/` por script para fugir do hook, que nem age em `.claude/` (a pasta está no `.prettierignore`): o hábito do contorno se espalha. Candidato mais barato: depois de editar uma tabela, reler só as linhas dela antes da edição seguinte, sem script |
| A18 | O prompt F3 do playbook não pede capacidade e cotas: o que cresce sem limite, quem controla o volume e qual cota ele consome. O F3 da spec A não viu o registro de segurança como amplificador de ataque; a pergunta veio do usuário | `docs/playbook.md:35-42`; entrada da S3 | Aberto, 1 ocorrência. O prompt F3 da spec B leva a categoria. Candidato para a retro da A: entrar no prompt F3 do playbook |
| A19 | O script Node do contorno do A17 quebrou duas vezes no heredoc do Bash: `unexpected EOF` e escapes perdidos no template literal, por causa de crases e aspas. A S4 passou a gravar o `.mjs` com a ferramenta Write | relatório da S4 (`patch-req.mjs` e `crit.mjs` no scratchpad da sessão) | Aberto, 2 ocorrências. Em 21/11, a sessão acompanhada viu o mesmo `unexpected EOF` num heredoc com aspas, fora do contorno do A17, e também resolveu com o Write. O problema vale para qualquer script longo passado por heredoc, não só para o A17. Terceira ocorrência na S17 (#13): o heredoc quebrou no parse ao escrever o corpo do PR em português, e a sessão usou o Write. Candidato: um gotcha no `CLAUDE.md` do template, dizendo para gravar o script com o Write e rodar em seguida |
| A20 | O critério do `model:opus` no G4 ("autenticação") marca quase tudo numa spec de autenticação: a proposta do F5 tinha 14 de 19 tickets com Opus; depois do G4, 13 de 21 | proposta da S5; labels dos #5 a #25 | Aberto. A medir: as escaladas dos 8 tickets em Sonnet. No #5, a escalada era devida e não aconteceu (A26), então a medida começa no #6. Candidato para a retro da A: separar o ticket que toca credencial, sessão, transação ou SQL do que só usa um fluxo já testado. Custo medido: na S9 e na S10, cada ticket em Opus custou 8 a 9 pontos da semana, contra 1 a 2 em Sonnet (S7 e S8). Em 24/11, a sessão acompanhada propôs passar o #16 e o #24 (telas sobre fluxos que outros tickets testam) para Sonnet. O usuário manteve o Opus, para uma saída mais robusta e elaborada nas telas. Medida até o #13: dos 4 tickets em Sonnet (#5, #6, #10 e #13), 3 tiveram bug de correção no review. O #10 e o #13 escalaram só o fix, e o #5 devia ter escalado |
| A21 | Antes do primeiro código, o implementer lê cerca de 91 mil caracteres de regras, skills, ADRs e glossário, inclusive a skill `seo` pré-carregada num ticket de autenticação | `templates/project/.claude/agents/implementer.md:5-9` e o passo 1; proposta revisada da S5 | Aberto, 1 ocorrência. Candidato para a retro da A: pré-carregar só as skills que o ticket toca |
| A22 | O `format.mjs` rodava o prettier em qualquer arquivo editado, inclusive no scratchpad, fora do projeto. Duas substituições por script falharam sem aviso na S5 | relatório da S5; `templates/project/.claude/hooks/format.mjs` | Corrigido no template (ea8b7d8), com teste novo: o hook só formata arquivo dentro da raiz do projeto. O projeto recebeu o hook no PR #26 (S6), com smoke test dentro e fora da raiz. O teste do A22 falhou no runner Windows do CI do harness de 21/11 a 24/11, em 6 pushes (A35): o `TEMP` do runner usa nome curto 8.3 (`RUNNER~1`), o git devolve o nome longo, e o hook tomava o arquivo por um de fora. Corrigido no template (`ed22825`), com teste de junction: o hook compara os caminhos reais. O caminho do projeto não tem nome curto, e o smoke test da S6 passou; o hook novo vai na próxima sincronia de hooks, feita pelo usuário (A25) |
| A23 | A `/ship-ticket` propõe o ticket desbloqueado de menor número, então a ordem de publicação do F5 define a ordem de execução. A `to-tickets` não diz isso | relatório da S5; `templates/project/.claude/skills/ship-ticket/SKILL.md:14` | Aberto, 1 ocorrência. Na S5, a renumeração contornou o problema. Candidato: o F5 do playbook avisa que a ordem de publicação é a de execução |
| A24 | A regra "sem caminho de arquivo nem código" nas issues fica ambígua quando o critério literal da spec cita identificadores (`.env.example`, `databaseHooks`). A S5 manteve o texto literal | relatório da S5; `templates/project/CLAUDE.md`, regras do fluxo | Aberto, 1 ocorrência. Candidato: a regra vale para a implementação, e o texto citado da spec fica como está |
| A25 | No modo auto, o classificador nega ao agente a escrita num hook: o `Copy-Item` para `.claude/hooks/` saiu com o motivo "Undermining Oversight". Sincronizar um hook do template no projeto vira passo do usuário, e o prompt da S6 não marcou isso. O `apply-template --force` não serve, porque sobrescreve as personalizações do projeto | relatório da S6; `scripts/apply-template.mjs:3-4` | Aberto, 2 ocorrências (S6 e S15). Na S15, o hook novo do A40 parou na mesma escrita: a sessão ficou no passo 2 até o usuário copiar o arquivo, que o prompt já marcava como passo do usuário. Na S6, o primeiro comando dado ao usuário usava caminho relativo e falhou no PowerShell do PC; a sessão acompanhada fez a cópia a pedido dele. Candidato: o `apply-template` ganha uma opção para copiar só os caminhos indicados, rodada pelo usuário, e os prompts marcam a sincronia de hook como passo do usuário |
| A26 | A `/ship-ticket` não escalava para Opus quando o review de uma execução em Sonnet achava bug de correção. O passo 6 fazia a chamada de fix com o modelo do passo 4, e a regra ficava no passo 7, que o fluxo só alcança quando o implementer volta `stuck`. No #5, dois bugs de correção foram corrigidos em Sonnet | relatório da S7; `templates/project/.claude/skills/ship-ticket/SKILL.md`, passos 6 e 7 | Corrigido no template (e5c9cd6): o passo 6 confere o passo 7 antes da chamada de fix, e um finding que os dois reviews relatam recebe um veredito só. O projeto recebe a skill num PR `docs/` junto com a limpeza dos primeiros itens "Unverified". Até lá, os prompts de abertura reforçam a regra. Sincronizado no projeto pelo PR #31 (S11). Na prática: o #10 (S13) e o #13 (S17) escalaram o fix para Opus, como o passo 6 manda, com o comentário "Escalado para Opus" no ticket |
| A27 | A `/ship-ticket` não define "bug de correção", e é isso que decide a escalada. No #6, três fixes de qualidade de teste (isolamento do `VERCEL`, cobertura da A1.7 e parser do inventário) ficaram fora da escalada por julgamento da sessão | relatório da S8; corpo do PR #28 | Aberto, 1 ocorrência. A sessão acompanhada concorda com a classificação. Candidato: a skill define bug de correção como comportamento errado do produto, e falha de teste fica de fora |
| A28 | O `mattpocock-skills:code-review` exige que a sessão monte à mão a lista das fontes de padrões e os dois prompts de subagente, enquanto o `/code-review` embutido devolve os findings direto | relatório da S8 | Aberto, 1 ocorrência. Candidato: a `/ship-ticket` lista as fontes de padrões do projeto (`CODING_STANDARDS.md`, `CLAUDE.md` e as skills pré-carregadas) na chamada do review |
| A29 | O implementer mandava editar a ASSUMPTION antiga, com `gh api` quando o comentário já não é o último. O `settings.json` do projeto só libera `gh issue *`, e o sistema de permissões negou a edição no #7 | relatório da S9; comentários do #7 | Corrigido no template (`3bfb08f`): a ASSUMPTION nova vai num comentário novo, que começa com `ASSUMPTION (substitui <url>):`, e a `/ship-ticket` conta itens, com o substituído uma vez só. No #7, o usuário escolheu o mesmo caminho. O projeto recebe a correção no PR `docs/` do A26. Liberar o `gh api` ficou descartado, porque ele alcança merge e ruleset. No #8 (S10), o implementer do projeto mandou editar o comentário de novo, e a `/ship-ticket` do projeto contava comentários, não itens. O prompt de abertura segurou a regra. Sincronizado no projeto pelo PR #31 (S11) |
| A30 | O verify-gate roda `vitest related`, que segue o grafo de imports. Quando só mudam arquivos fora dele, como o script de papéis (rodado como processo) ou o SQL das migrations, os testes de banco não rodam no ciclo rápido. O passo 5 da `/ship-ticket` e o CI rodam a suíte inteira | relatório da S9 | Aberto, 1 ocorrência. Candidato, a pesquisar antes: o projeto associa caminhos fora do grafo a um projeto do Vitest, e o verify-gate roda esse projeto. Mudança de hook, teste primeiro |
| A31 | Com o banco desligado, o `vitest related` imprime "No affected test files found, exiting with code 0" antes do erro da A1.10, embora saia com 1. A saída engana quem lê só o começo | relatório da S9 | Aberto, 1 ocorrência. Conferir junto do A30, que mexe na mesma chamada |
| A32 | O `ci.yml` do template fixa as actions por tag (`actions/checkout@v7`, `pnpm/action-setup@v6` e `actions/setup-node@v7`), e o `CODING_STANDARDS.md` do projeto exige SHA (RNF-SEG-13). O projeto herdou a divergência | relatório da S9; `templates/project/.github/workflows/ci.yml:21-23` | Aberto. Candidato: o template fixa por SHA, com a tag em comentário. No projeto, a correção é um PR próprio |
| A33 | O prompt de abertura da S10, escrito pela sessão acompanhada, listou a A2.11, a A2.14, a A2.20 e a A2.21 como critérios do #8. Elas são do #12, do #25 e de outros tickets (#16, #17 e #20). A sessão corrigiu o escopo com o implementer já rodando | relatório da S10; corpo do #8; tabela "Itens Unverified" (U9 → #12, U12 → #25) | Corrigido no prompt da sessão acompanhada: o prompt de um ticket cita o número e não copia critérios, porque o ticket é autocontido (A16). Segunda ocorrência na S11: a sessão acompanhada propôs o critério (b) para o #12 (a rota de atualização da Conta recusa o que o cadastro recusa) conferindo o código do Better Auth, mas não a spec. A A4.17, do próprio #12, já desliga a rota, e o ajuste "mesma resposta que o cadastro" virou contradição (400 × 404). A regra do prompt passou a valer também para critério novo: antes de propor, ler o ticket e os critérios da spec que ele cita |
| A34 | O preflight da `/ship-ticket` não sobe os serviços locais. Desde o #7, os testes de banco precisam do Postgres no Docker, e o implementer do #8 teve de rodar `pnpm db:up` por conta própria. O `CLAUDE.md` do projeto não lista o comando | relatório da S10; `templates/project/.claude/skills/ship-ticket/SKILL.md`, passo 2 | Corrigido no template (`d6c4af9`): o preflight roda o comando de serviços locais que o `CLAUDE.md` do projeto listar. O projeto recebeu o passo e a linha do `pnpm db:up` no `CLAUDE.md` pelo PR #31 (S11) |
| A35 | O CI do harness ficou vermelho de 21/11 a 24/11, em 6 pushes, sem que ninguém notasse. O ritual da sessão acompanhada não conferia o CI do harness, e os pushes foram feitos sem olhar o run | `gh run list` do harness (primeira falha no `1ee8b0c`, que levou o `ea8b7d8` ao GitHub); A22 | Corrigido no prompt da sessão acompanhada: o ritual lista o último run do harness, e cada push confere o run do commit |
| A36 | O prompt de abertura da S11 dizia "Rode em Sonnet", mas a sessão não troca o próprio modelo. Ela rodou em Opus, e o modelo é escolhido pelo usuário antes de colar o prompt | relatório da S11 | Corrigido no formato de abertura: o modelo vira passo do usuário, antes de colar |
| A37 | O `gh pr checks --watch` logo depois do `gh pr create` sai com 1 e "no checks reported", porque o GitHub ainda não registrou os checks. O passo 9 da `/ship-ticket` não prevê isso; a S11 esperou os checks aparecerem e repetiu | relatório da S11 | Corrigido no template (`1ede57c`): o passo 9 diz que "no checks reported" logo depois de um push não é falha, e manda repetir quando os checks aparecerem. O projeto recebeu o passo no PR #35 (S15). A S15 teve o mesmo "no checks reported" no push do #35 e repetiu até os checks aparecerem; os prompts de abertura deixam de avisar |
| A38 | O passo 5 da `/ship-ticket` roda `lint`, `typecheck` e `test` sem `CI=true` e sem `format:check`, e o CI roda os dois. No #9, o typescript-eslint mudou de comportamento com `CI=true` (inferência de passada única), e o primeiro CI ficou vermelho depois do verde local | relatório da S12; corpo do PR #32 ("Round vermelho do CI"); `templates/project/.github/workflows/ci.yml:28-31` | Corrigido no template (`1ede57c`): o passo 5 roda os quatro comandos com `CI=true`. O projeto recebeu o passo no PR #35 (S15), e a S15 rodou os quatro comandos com `CI=true`, cada um com saída 0 (277 testes); os prompts de abertura deixam de pedir |
| A39 | O lembrete "GitHub API rate limit exceeded" do Claude Code apareceu na S12 e na sessão acompanhada logo depois de ler o #9, com a cota quase cheia (`gh api rate_limit`: 4956/5000 e 4992/5000). Nas duas vezes, a saída lida falava de rate limit (o evento `rate_limited` do #9). Hipótese: o lembrete reage ao texto da saída, não à cota | relatório da S12; sessão acompanhada de 24/11 | Aberto, fora do template: é comportamento do Claude Code. Os prompts dos tickets que falam de rate limit (#12, #17, #18) mandam conferir com `gh api rate_limit`, que não gasta cota, e seguir. Na S14 (#11), mais duas ocorrências depois de `gh issue view`, com 4834 e 5000 chamadas restantes. Na sessão acompanhada de 25/11, mais duas, depois do `gh issue view` do #11 e do #12; as duas saídas falam de rate limit, e as chamadas seguintes funcionaram, o que reforça a hipótese. Na S16 (#12), mais duas, com 4885 e 4998 restantes. Na sessão acompanhada de 25/11, depois do relatório da S16, mais uma, logo após ler os comentários do #12, com 4989 restantes |
| A40 | O verify-gate (Stop) roda cada vez que a sessão principal encerra o turno, inclusive quando ela só espera o implementer, que trabalha em segundo plano na mesma árvore. No #10, o `vitest related` do hook rodou junto da suíte do implementer, e o `globalSetup` do projeto apaga e recria o banco de teste a cada execução. O hook relatou falhas falsas em 3 disparos (`database "dg_formacao_test" does not exist`, `schema "app" does not exist`, linhas de outra execução nas asserções), e o implementer teve quedas de conexão. O classificador do modo auto negou à sessão e ao implementer a listagem dos processos `vitest` ("Undermining Oversight") | relatório da S13; `templates/project/.claude/hooks/verify-gate.mjs:109-113`; `src/test/db/setup.ts:64-65` do projeto | Lado do harness corrigido no template (`058fee2`): a entrada do `Stop` traz `background_tasks`, só com o trabalho em andamento (documentação dos hooks e binário da extensão 2.1.331). O verify-gate deixa passar sem checar o `Stop` com um `subagent`, `teammate` ou `workflow` na lista, e checa o `Stop` seguinte à volta do agente. O projeto recebeu o hook no PR #35 (S15), copiado pelo usuário (A25), com a prova: o `Stop` com um subagente na lista saiu com 0 em 115 ms, sem saída, e com `background_tasks` vazio saiu com 2 e o erro de tipo do arquivo de prova. Fica aberto o lado do projeto: duas execuções simultâneas da suíte de banco se destroem (um banco só, papéis do cluster), item da skill `testing-stack`. Com o hook novo, o bloqueio falso não deveria mais aparecer: o prompt da S16 pede que a sessão anote o texto e a hora de qualquer bloqueio do verify-gate com o implementer rodando, como evidência da correção. Na S16 (#12), o primeiro ticket com o hook novo, implementer em Opus em duas execuções: nenhum bloqueio falso (relatório da S16). Na S17 (#13), um bloqueio falso com o implementer parado: a sessão rodava o próprio `pnpm test` em segundo plano (um `shell`, que o hook não conta), e o `vitest related` do hook recriou o mesmo banco junto (`duplicate key … pg_database_datname_index` em `recreateTestDatabase`). A execução da sessão também saiu corrompida (92 falhas), e a notificação dizia "exit code 0", que era do `tail`. Sozinho, o `pnpm test` passou. A sessão guardou uma memória local (`db-tests-never-in-background`) e propôs um gotcha no `CLAUDE.md` do projeto. É a segunda colisão do lado do projeto (S13 e S17): a correção de fundo continua na `testing-stack`, e o gotcha está proposto para a R0.5d |
| A41 | O passo 9 da `/ship-ticket` não dizia com que modelo corrigir o CI, nem como ler um check do GitHub sem log de job. No #10, o CodeQL ficou vermelho com um alerta alto ("Clear-text logging of sensitive information"); a S13 tratou como rodada vermelha, corrigiu em Sonnet e não dispensou o alerta | relatório da S13; `issuecomment-7146243844` do #10 | Corrigido no template (`4d4188c`, filtro trocado depois): o passo 9 lê os alertas abertos do PR com `gh api .../code-scanning/alerts?pr=<pr>&state=open`, corrige com o modelo do passo 4 (o passo 7 escala o bug de correção) e deixa a dispensa do alerta para o humano. O projeto recebeu o passo no PR #35 (S15) |
| A42 | O `/usage` de 24/11 (últimas 24 h, só esta máquina) atribui 35% do uso aos subagentes da `ship-ticket`, 15% ao implementer, 12% ao `/code-review` e 7% ao `mattpocock-skills:code-review`. Hipótese: os subagentes da `ship-ticket` são os revisores do `/code-review`, que rodam no modelo da sessão, e o review custa mais que a implementação. O passo 6 chama o `/code-review` sem nível, e o nível vem do último que o usuário digitou | `/usage` colado na sessão acompanhada de 24/11; `templates/project/.claude/skills/ship-ticket/SKILL.md`, passo 6 | Aberto, a medir. A retro da spec A confere pelo `retro-evidence.mjs` o modelo e o número de subagentes de cada review, e decide um nível explícito no passo 6. Os reviews acharam os bugs de correção do #7 ao #10, então um nível mais baixo tem custo de qualidade. Segundo ponto, no `/usage` de 25/11: `ship-ticket` 28%, implementer 18%, `/code-review` 14%, `mattpocock-skills:code-review` 8%. Terceiro ponto, no `/usage` do fim da S16 (25/11): `ship-ticket` 34%, implementer 19%, `/code-review` 14%, `mattpocock-skills:code-review` 8%. O próprio `/usage` passou a sugerir "Check which model ship-ticket subagents use" (34%) e "Run /code-review on a cheaper model" (14%). Na S17 (#13, sessão em Sonnet), os `meta.json` dos subagentes confirmam a hipótese do modelo: os dois revisores e um terceiro `general-purpose` rodaram em `claude-sonnet-5-5`, o modelo da sessão, sem modelo pedido (`modelNotNamed`); só o fix do implementer rodou em Opus. O ticket custou 6 pontos da semana, com a sessão acompanhada |
| A45 | O rótulo `NEEDS-DECISION:` tem dois sentidos. O `CLAUDE.md` do template diz que ele para o trabalho (escolha difícil de reverter), e o `implementer.md` o usa também para propor mudança num arquivo de regras, seguindo o trabalho quando o ticket não depende dela. No #12, a proposta para a `auth-identity` saiu como `NEEDS-DECISION:` sem bloquear, e o relatório marcou a contradição. A `/ship-ticket` seguiu certo, porque lê o status do implementer, e não o rótulo | relatório da S16; issuecomment-7165798068 do #12; `templates/project/CLAUDE.md:22`; `templates/project/.claude/agents/implementer.md:35-37`; `templates/project/.claude/hooks/protect-paths.mjs:55` | Aberto, 1 ocorrência apontada. O mesmo uso, para propor mudança de skill, aparece no #7 (guia de migrations da `data-layer`) e no #8 (regra do U3), sem atrito anotado. Candidato para a retro da A: um rótulo próprio para a proposta de regra que não bloqueia (por exemplo, `RULE-PROPOSAL:`), no `implementer.md`, no `protect-paths` (com teste primeiro), no playbook (linha 28) e na `retro-evidence.mjs`, que conta os rótulos. Na S17 (#13), mais duas propostas sem bloqueio como `NEEDS-DECISION:` (issuecomment-7171403121 e issuecomment-7172160543). O prompt da S17 pediu para separar, e o relatório e o PR #37 ("Propostas para o `/retro`") marcaram as duas como proposta: o contorno pelo prompt funciona |
| A46 | O fix escalado não passa por review de novo. O passo 6 da `/ship-ticket` termina quando os fixes estão commitados e o passo 5 está verde. No #13, o fix em Opus trocou o mecanismo do envio (desligou o envio automático do cadastro e criou um gancho posterior em `/sign-up/email`), e a sessão só leu o diff, rodou os quatro comandos e um teste mutante | relatório da S17; `templates/project/.claude/skills/ship-ticket/SKILL.md`, passo 6 (linha 64 no projeto); ASSUMPTION de issuecomment-7172159354 do #13 | Aberto, 1 ocorrência. Pesa contra o A42: um review a mais custa cota. Candidato para a retro da A: um review curto, só do diff do fix, quando o fix muda o desenho, e não só as linhas do finding |
| A43 | O prompt de abertura da S14, escrito pela sessão acompanhada, mandava a sessão rodar a `/ship-ticket`, que tem `disable-model-invocation` e só abre pelo comando do usuário. O usuário digitou `/ship-ticket 11`. É o mesmo erro do A9 e do A15, agora na `/ship-ticket` | relatório da S14 | Corrigido no formato de abertura (`prompt-sessao-acompanhada.md`): as skills que só o usuário abre entram como passo do usuário, com o comando completo |
| A44 | No modo auto, a sessão recebeu a orientação de usar Bash em vez de Edit e Write, e o `CLAUDE.md` do projeto (Gotchas) manda o contrário para edição de várias linhas: o formatador só age em Edit e Write, e o splicing por linha desloca código. A S15 seguiu o `CLAUDE.md` | relatório da S15; `templates/project/CLAUDE.md:29` | Aberto, 1 ocorrência, fora do template: a orientação vem do Claude Code. O gotcha do template resolve, porque a sessão o seguiu. Liga com o A17 e o A19. A confirmar nas próximas sessões antes de virar candidato |

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
| S11 | R0.3d, sincronia e "Unverified" | Opus (o prompt pedia Sonnet, A36) | 69% (fim da S10) → 88% (23,4%/h nas últimas 3 h 43 min, incluindo a sessão acompanhada; projeção de 100% em cerca de 31 min, antes da virada das 14:50) | 29% (fim da S10) → 32% |
| S12 | F6 + F7 do #9 | Opus | janela nova (virada às 14:50; outra às 21:30) → 61% (34,2%/h nas últimas 1 h 45 min; projeção de 100% em cerca de 1 h 08 min) | 32% (fim da S11) → 41% |
| S13 | F6 + F7 do #10 | Sonnet → Opus (fix do review) | não medido (a S13 rodou na janela anterior; a nova estava em 7% na hora do `/usage`, com virada às 2:50) | 41% (fim da S12) → 47%, incluindo a sessão acompanhada |
| S14 | F6 + F7 do #11 | Opus | não medido (a S14 rodou na janela anterior; a nova estava em 4% no `/usage`, com virada às 15:30) | 47% (fim da S13) → 57%, incluindo a sessão acompanhada (pesquisa e correção do A40) |
| S15 | R0.4d, sincronia do harness | Sonnet | 4% (fim da S14, janela com virada às 15:30) → 14%, incluindo a sessão acompanhada | 57% (fim da S14) → 58%, incluindo a sessão acompanhada |
| S16 | F6 + F7 do #12 | Opus | 14% (fim da S15, mesma janela, virada às 15:30) → 78%, incluindo o ritual da sessão acompanhada | 58% (fim da S15) → 67% |
| S17 | F6 + F7 do #13 | Sonnet → Opus (fix do review) | janela nova às 15:29 → 39% (virada às 20:29), incluindo a sessão acompanhada (comentários no #13 e no #17) | 67% (fim da S16) → 73%, incluindo a sessão acompanhada |

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

### 24/11/2026 · Sessão 11 · R0.3d Sincronia do harness e "Unverified" · R0 (spec A) · PR #31, #8, #12

- **Resumo:** o PR #31 (commit `3064681`) trouxe ao projeto as correções A26, A29 e A34 da `/ship-ticket`, do implementer e do `CLAUDE.md`. A seção "Unverified" saiu da `data-layer`, e a da `auth-identity` ficou com U4, U5, U6, U8, U9, U11 e U12. A regra do U3 entrou na `CONFIG.md`. Saíram três comentários, cada um confirmado pelo usuário: os critérios do #8 no #12 (issuecomment-7136201442) e as duas respostas aos NEEDS-DECISION do #8 (issuecomment-7136207184 e issuecomment-7136207910).
- **Portão:** o merge do PR #31 está pendente e é do usuário, antes do #9. A sessão acompanhada recomenda primeiro a continuação da S11 (comentário de correção no #12 e o fato do U7 e do U10 na `auth-identity`) e o merge depois dela.
- **Conferência (critérios do prompt):**
  - PR #30 MERGED, Docker no ar e branch nova sem mudanças → ok;
  - `/ship-ticket` igual ao template e implementer com só as linhas do `data-layer` de diferença → ok, pelos `diff`;
  - linha do Postgres no `CLAUDE.md` e `pnpm db:up` com saída 0 → ok;
  - seções "Unverified" e regra do U3 → ok, pelos `grep`;
  - `format:check`, `lint`, `typecheck` e `test` com o comando e a saída → ok (136 testes);
  - PR com CI verde → ok: `gh pr checks 31` com saída 0, e o PR estava CLEAN quando conferi;
  - comentários com as URLs → ok, mas o critério (b) do #12 contradiz a A4.17 (ver "Sinais").
- **Sinais:**
  - o critério (b) pede para a rota de atualização da Conta a resposta do cadastro (400), mas a A4.17 do #12 a põe no `disabledPaths` (404). O erro é da sessão acompanhada, que conferiu o código do Better Auth e não a spec: segunda ocorrência do A33. A A4.17 vale, e a correção sai num comentário no #12;
  - o comportamento do U7 e do U10 saiu da skill e não ficou escrito em outro trecho dela (A14). Os tickets #14, #20 e #22, que criam Contas fora do cadastro, precisam dele;
  - A36 (modelo pedido no prompt) e A37 (checks ainda não registrados) novos;
  - cota: a S11 rodou em Opus, e não em Sonnet; a janela de 5 h foi a 88%, contando a sessão acompanhada.
- **Cota:** 5 h 69% (fim da S10) → 88% · semana 29% → 32%.

### 24/11/2026 · Sessão 11 (continuação) · R0.3d · R0 (spec A) · PR #31, #12

- **Resumo:** o comentário de correção do critério (b) saiu no #12 (issuecomment-7138444046), com o texto aprovado pelo usuário. O commit `22861ee` pôs o comportamento confirmado do U7 e do U10 na `CONFIG.md:65` da `auth-identity`, como fato.
- **Portão:** o merge do PR #31 está pendente e é do usuário. A sessão acompanhada recomenda o merge, e depois a S12 (#9) numa janela nova.
- **Conferência:** URL do comentário → ok; `grep -rn "outside its transaction"` mostra a linha → ok; `pnpm format:check` com saída 0 → ok; `gh pr checks 31 --watch` com os 4 checks verdes e saída 0 → ok.
- **Sinais:** a sessão esperou os checks aparecerem antes do `gh pr checks`, e o aviso do A37 no prompt funcionou. Nenhum sinal novo.
- **Cota:** não informada.

### 24/11/2026 · Sessão 12 · F6 + F7 · R0 (spec A) · ticket #9, PR #32

- **Resumo:** o #9 (registro de segurança agregado e registro de auditoria) saiu no PR #32, com os commits `b362704` (feat), `3fde89a` (fix dos findings) e `278a5e4` (fix do CI). Implementer em Opus, pelo label. Os reviews deram 17 findings: 9 fix, 6 accept e 2 reject. Foram quatro bugs de correção: o `first_at` podia ficar depois de uma ocorrência contada; o IPv4 mapeado era gravado na forma IPv6 e a busca pelo IPv4 não o achava; a regra de lint da A5.6 deixava passar chave computada, desestruturação, reexportação e arquivos JS; e o `afterAll` do teste de papéis não fechava as conexões se o truncate falhasse. O primeiro CI ficou vermelho (A38).
- **Portão:** o merge do PR #32 está pendente e é do usuário. A sessão acompanhada recomenda o merge.
- **Conferência (Definition of Done):**
  - teste vermelho → verde no seam → ok, pelo corpo do PR: cada critério no seam 2, e a A5.6 no seam 4;
  - `pnpm lint`, `pnpm typecheck` e `pnpm test` com o comando e a saída → ok (197 testes), mais `format:check` e `CI=true pnpm test`;
  - commit `feat(#9)` → ok (`b362704`), mais os dois `fix(#9)`;
  - `ASSUMPTION:` no ticket → ok: 11 itens, um deles substituído por comentário novo (A29);
  - todo finding com veredito → ok, tabela no corpo do PR;
  - PR com `Closes #9` e CI verde → ok, conferido: os 4 checks com SUCCESS, e o PR está CLEAN;
  - linha `Métricas:` → ok: `modelo=opus · findings=9/6/2 · assumptions=11 · ci-vermelho=1`;
  - escalada → não se aplica: Opus desde o início.
- **Sinais:**
  - primeiro `ci-vermelho` da spec A: o passo 5 da `/ship-ticket` não roda como o CI (A38, corrigido no template);
  - quatro bugs de correção numa execução em Opus. Nos tickets em Opus, os reviews acharam 8 (#7), 1 (#8) e 4 (#9);
  - o lembrete falso de rate limit (A39) apareceu também na sessão acompanhada, com a mesma causa provável;
  - o #9 deixou notas para o #11, o #12, o #17, o #18, o #19 e o #25 (IP bruto e isenção da regra de lint). Foram para "Levar aos tickets seguintes da spec A";
  - o banco de teste lento no Docker Desktop foi para a lista da skill `testing-stack`;
  - acumulado na spec A: 5 tickets, 95 findings (39 fix, 40 accept, 16 reject), 39 `ASSUMPTION:`, nenhuma escalada (uma devida no #5) e 1 CI vermelho;
  - cota: o #9 custou 9 pontos da semana. Restam 16 tickets, 10 com `model:opus`: cerca de 94 pontos pela média, contra 59 até a virada de sexta.
- **Cota:** 5 h janela nova → 61% · semana 32% (fim da S11) → 41%.

### 24/11/2026 · Sessão 13 · F6 + F7 · R0 (spec A) · ticket #10, PR #33

- **Resumo:** o #10 (teto diário do registro de segurança, com transbordo e aviso) saiu no PR #33, com os commits `9637750` (feat), `aedb021` (fix dos findings) e `eaf1838` (fix do CodeQL). A implementação rodou em Sonnet, porque o ticket não tem `model:opus`; o fix do review rodou em Opus, por escalada; o fix do CodeQL rodou em Sonnet. Os reviews deram 20 findings: 6 fix, 13 accept e 1 reject. O bug de correção: o aviso de teto atingido saía uma vez por evento simultâneo, e não uma vez por dia; o `code-review` e o eixo Spec o acharam. O CodeQL ficou vermelho em `aedb021` com um alerta alto de log em texto claro, corrigido com a retirada do teto do contexto do aviso, sem dispensar o alerta.
- **Portão:** o merge do PR #33 está pendente e é do usuário. A sessão acompanhada recomenda o merge.
- **Conferência (Definition of Done):**
  - teste vermelho → verde no seam → ok, pelo corpo do PR: a A5.14 no seam 3 (configuração do teto) e no seam 2 (teto, transbordo, exceções e aviso);
  - `format:check`, `lint`, `typecheck` e `test` com `CI=true`, com o comando e a saída → ok (247 testes), em `eaf1838`;
  - commit `feat(#10)` → ok (`9637750`), mais os dois `fix(#10)`;
  - `ASSUMPTION:` no ticket → ok: 6 itens (`issuecomment-7145468564`), dois deles substituídos por comentários novos (A29);
  - todo finding com veredito → ok, tabela no corpo do PR;
  - PR com `Closes #10` e CI verde → ok, conferido: os 4 checks com SUCCESS, e o PR está CLEAN;
  - linha `Métricas:` → ok, conferida no #10: `modelo=sonnet→opus · findings=6/13/1 · assumptions=6 · ci-vermelho=1`;
  - escalada → ok: comentário `Escalado para Opus` no #10 (`issuecomment-7145821421`), pelos passos 6 e 7 da `/ship-ticket` que o PR #31 sincronizou.
- **Sinais:**
  - primeira escalada da spec A, e ela funcionou como a correção do A26 previa: o bug de concorrência veio da execução em Sonnet, o review o achou e o fix rodou em Opus. É um dado para o A20, que segue para a retro: num ticket sem `model:opus`, o review e a escalada pegaram o bug de correção;
  - segundo `ci-vermelho` da spec A, com causa nova: o CodeQL, que o passo 5 não reproduz (A41, corrigido no template em `4d4188c`);
  - o verify-gate bloqueou 3 vezes com falhas falsas, por rodar a suíte de banco junto do implementer (A40). Na métrica "Bloqueios do verify-gate", o #10 conta 0 úteis e 3 de ruído;
  - o passo 5 da `/ship-ticket` do projeto ainda não tem `CI=true` nem `format:check`, e o aviso do prompt cobriu a lacuna (A38). A próxima sincronia leva o A37, o A38, o A41 e, se já estiver corrigido, o A40;
  - o relatório manda preencher a cota com `/quota` de novo (A10, segunda ocorrência);
  - o #10 deixou uma nota para o #19 (papéis da equipe no gravador), que foi para "Levar aos tickets seguintes da spec A";
  - acumulado na spec A: 6 tickets, 115 findings (45 fix, 53 accept, 17 reject), 45 `ASSUMPTION:`, 1 escalada (mais uma devida no #5) e 2 CI vermelhos.
- **Cota:** não informada no relatório. O usuário informa pelo `/usage`, e a linha da S13 em "Cota por fase" recebe os números.

### 24/11/2026 · Sessão acompanhada · Alerta do CodeQL e cota da S13

- **Alerta do CodeQL (pergunta do usuário):** o alerta 1 (`js/clear-text-logging`, alto) em `src/infra/telemetry/index.ts:13` é o `ci-vermelho` da S13 e está corrigido. A única ocorrência, em `refs/pull/33/head`, nasceu no `aedb021` e aparece como corrigida desde o `eaf1838`, que tirou do aviso o teto lido do ambiente. A sugestão do Copilot Autofix apaga valores pelo nome da chave e não pegaria a chave `cap`, por isso não foi aplicada.
- **Correção do harness:** o filtro `ref=refs/pull/<n>/merge` do `4d4188c` não acha alertas neste repositório, porque o CodeQL analisa o ref `head`. O `83d2e44` troca o filtro por `pr=<n>`, conferido no PR #33. O prompt da S14 foi reenviado com o passo 6 corrigido.
- **Cota da S13:** a semana foi de 41% (fim da S12) a 47%, contando esta sessão. A S13 rodou na janela de 5 h anterior, que não foi medida. Restam 53 pontos até sexta, 27/11, às 13:00. Pela média do #9 (9 pontos) e do #10 (6 pontos), cabem de 6 a 7 tickets até a virada; os 15 que faltam (10 com `model:opus`, cerca de 120 pontos) passam dela.
- **Sinal novo:** A42, o custo dos reviews no `/usage`.

### 24/11/2026 · Sessão acompanhada · Correção do A40 no template

- **Decisão do usuário:** corrigir o A40 agora, enquanto a S14 (#11) roda com o aviso do passo 4 do prompt.
- **Pesquisa:** a referência de hooks (code.claude.com/docs/en/hooks) põe na entrada do `Stop` o campo `background_tasks`, com o trabalho em segundo plano ainda em andamento, para o hook separar "sessão terminou" de "sessão esperando". O binário da extensão 2.1.331, a que roda as sessões do projeto, tem o campo e traduz os tipos internos para `subagent`, `teammate`, `workflow`, `shell` e `cloud session`.
- **Correção (`058fee2`):** o verify-gate deixa passar sem checar, e sem guardar o estado como verde, o `Stop` que tem um agente na lista. Shell (um servidor de dev) e sessão na nuvem não contam. O `Stop` do turno em que o agente devolve o relatório é checado como antes. Teste primeiro: o caso novo ficou vermelho e depois verde, com 107 testes passando.
- **Sincronia:** o hook do projeto é igual à versão anterior do template, então a sincronia R0.4d copia o arquivo inteiro. A cópia é passo do usuário no PC (A25) e vai no mesmo PR do A37, do A38 e do A41, entre o #11 e o #12. O lado do projeto do A40 (suítes de banco simultâneas) segue para a skill `testing-stack`.

### 25/11/2026 · Sessão 14 · F6 + F7 · R0 (spec A) · ticket #11, PR #34

- **Resumo:** o #11 (login, sessão e saída do titular) saiu no PR #34, com os commits `1eb74d1` (feat) e `80dc97e` (fix dos findings). Implementer em Opus, pelo label, sem escalada. Os reviews deram 24 findings: 11 fix, 5 accept e 8 reject. Foram cinco bugs de correção: IP completo e e-mail no log da aplicação quando a gravação do registro falha (R1); sessão órfã num login que responde 500 (R2/E5); renovação feita pelo portão que não chega ao cookie, de modo que o titular com "Lembrar de mim" sai no 7º dia (R4/E4); registro e rate limit lendo IPs diferentes do mesmo `x-forwarded-for` (R5); e o portão lançando erro quando a sessão é apagada durante a renovação (R8).
- **Portão:** o merge do PR #34 está pendente e é do usuário. A sessão acompanhada recomenda o merge.
- **Conferência (Definition of Done):**
  - teste vermelho → verde no seam → ok, pelo corpo do PR ("Antes e depois, nos testes que ficaram vermelhos primeiro");
  - `format:check`, `lint`, `typecheck` e `test` com `CI=true`, com o comando e a saída → ok (277 testes em `80dc97e`);
  - commit `feat(#11)` → ok (`1eb74d1`), mais o `fix(#11)`;
  - `ASSUMPTION:` no ticket → ok: 11 itens, um substituído (o 6);
  - todo finding com veredito → ok, tabela no corpo do PR;
  - PR com `Closes #11` e CI verde → ok, conferido: os 4 checks com SUCCESS, e o PR está CLEAN;
  - linha `Métricas:` → ok, conferida no #11: `modelo=opus · findings=11/5/8 · assumptions=11 · ci-vermelho=0`;
  - escalada → não se aplica: Opus desde o início.
- **Verificações:** U8 confirmado; U9 parcial (`/sign-in/email`). A tabela "Unverified" foi atualizada.
- **Sinais:**
  - NEEDS-DECISION para a `auth-identity`: de onde os ganchos tiram o IP que vai ao registro de segurança. Afeta o #12, o #17, o #18 e o #19, então a decisão vem antes do #12, não na retro;
  - a A2.7 passa a depender do #16: o portão não renova a sessão, e a renovação só acontece na leitura HTTP. Foi para "Levar aos tickets seguintes da spec A", com decisão e pesquisa antes do #16;
  - `ASSUMPTION:` se acumulando na mesma área: das 11 do #11, quatro tratam de IP e de sessão (4, 6, 7 e 11), a mesma área do NEEDS-DECISION;
  - cinco bugs de correção numa execução em Opus. Nos tickets em Opus, os reviews acharam 8 (#7), 1 (#8), 4 (#9) e 5 (#11);
  - a sessão não conseguiu abrir a `/ship-ticket` pelo prompt (A43, corrigido no formato de abertura); A39 de novo; A38 e A10 seguem até a sincronia R0.4d;
  - segundo ponto do `/usage` para o A42: os subagentes da `ship-ticket` e o `/code-review` somam 42% do uso das últimas 24 h, contra 18% do implementer;
  - acumulado na spec A: 7 tickets, 139 findings (56 fix, 58 accept, 25 reject), 56 `ASSUMPTION:`, 1 escalada (mais uma devida no #5) e 2 CI vermelhos;
  - cota: o #11 custou 10 pontos da semana, contando a correção do A40 nesta sessão. Restam 43 pontos até sexta às 13:00: cabem a sincronia R0.4d e mais 3 ou 4 tickets. Os 14 que faltam (9 com `model:opus`) somam cerca de 115 pontos.
- **Cota:** 5 h: a S14 rodou na janela anterior, não medida; a nova estava em 4% · semana 47% (fim da S13) → 57%.

### 25/11/2026 · Sessão 15 · R0.4d Sincronia do harness · R0 (spec A) · PR #35

- **Resumo:** a S15 (Sonnet) trouxe do harness o verify-gate e a `/ship-ticket` corrigidos, tirou o `/quota` da `relatorio-sessao` e registrou na `auth-identity` o U8, o U9 (parcial) e a regra do IP dos ganchos que gravam no registro de segurança. Saiu no PR #35 (`0844df7`), mergeado, com `ci`, CodeQL e as duas Analyze em SUCCESS. Respondeu o NEEDS-DECISION do #11 num comentário (issuecomment-7164757526).
- **Portão:** merge do PR #35, decidido pelo usuário, que seguiu a recomendação da sessão acompanhada. O campo "Portão" do relatório diz "aberto", mas o próprio relatório mostra o PR em MERGED; vale o MERGED. Decisão da regra do IP: o usuário aprovou a proposta e mandou reescrever a última frase do comentário para "Vale para todo gancho que grave no registro de segurança, hoje os dos #12, #17, #18 e #19", porque outros tickets (#13, #20, #21 e #23 a #25) também citam o registro, e não se confirmou se algum grava por gancho.
- **Conferência (sincronia, sem DoD de ticket):**
  - `verify-gate.mjs` e `ship-ticket/SKILL.md` do projeto iguais aos de `templates/project/` → ok, diff vazio (conferido pela sessão acompanhada antes do merge);
  - prova do hook, com comando e saída (exit 0 em 115 ms com subagente; exit 2 com `background_tasks` vazio e o erro TS2322) → ok;
  - `format:check`, `lint`, `typecheck` e `test` com `CI=true`, cada um sozinho, exit 0, 277 testes → ok;
  - A10: `grep -n "/quota"` sem resultado → ok;
  - PR com CI verde → ok;
  - `relatorio-sessao` contra o template → não se aplica: a skill é só do projeto, e a conferência foi pelo diff do PR;
  - cláusula sobre o `set-cookie` no fato do U8 (`STAFF.md`, linha 28), que o prompt não pedia → aceita: confere com o teste "leaves no session and no cookie" do #11 (`80dc97e`) e com o finding R2/E5 do PR #34;
  - campo "Cota" do relatório → falta menor: veio o `/usage` colado, sem o "antes → depois"; a linha da tabela abaixo foi montada a partir dele e da jornada.
- **Verificações:** U8 confirmado, já removido de "Unverified" no PR #35. U9 segue parcial: `/sign-in/email` confirmado no #11; o #12 confirma `/sign-up/email`, e `/request-password-reset` e `/send-verification-email` ficam com o #17 (a tabela da jornada já diz isso).
- **Sinais:**
  - A25, 2ª ocorrência: a escrita do hook parou de novo no classificador do modo auto;
  - A44 novo: a orientação do modo auto (Bash) contra o gotcha do `CLAUDE.md` (Edit/Write). A sessão seguiu o `CLAUDE.md`;
  - A37, A38, A40 e A41 passam a "recebido no projeto" pelo PR #35, e A10 fecha. Os prompts de abertura deixam de levar os quatro avisos "até lá" (`CI=true`, "no checks reported", alerta do CodeQL, verify-gate). O A40 muda de aviso para evidência: a S16 anota qualquer bloqueio falso;
  - A39: o lembrete de rate limit apareceu duas vezes na sessão acompanhada de 25/11, depois de ler o #11 e o #12, que falam de rate limit;
  - nenhum review, finding ou escalada: PR de documentação.
- **Cota:** 5 h: 4% (fim da S14) → 14%, incluindo a sessão acompanhada · semana 57% (fim da S14) → 58%. Restam 42 pontos até sexta, 27/11, às 13:00. Pelas medidas da spec A (Opus: 8 a 10 pontos por ticket; Sonnet: 1 a 2), a ordem de publicação, #12 (Opus) e depois #13, #14 e #15 (Sonnet), cabe com folga, e o #16 (Opus) deve caber; o #17 e o #18 (Opus) dependem de como o #12 sair. É estimativa, e supõe que a `/ship-ticket` não ache bloqueio entre eles.

### 25/11/2026 · Sessão 16 · F6 + F7 · R0 (spec A) · ticket #12, PR #36

- **Resumo:** o #12 (rotas ligadas e rate limit no handler de autenticação) saiu no PR #36, com os commits `c56ae80` (feat) e `01a713e` (fix dos findings). Implementer em Opus, pelo label, sem escalada. Os reviews deram 23 findings: 10 fix, 9 accept e 4 reject. Foram quatro bugs de correção:
  - um POST de outro site gastava o contador do IP antes da checagem de origem (CR1);
  - o bloqueio de `/sign-in/email/` era registrado com a rota `other` (CR2);
  - numa falha de leitura do portão de sessão, o token ia ao log pelo `cause`, em código do #11 (CR3);
  - com o `onAPIError.throw`, um `APIError` 500 ficava sem log (CR4).
- **Portão:** o merge do PR #36 está pendente e é do usuário. A sessão acompanhada recomenda o merge.
- **Conferência (Definition of Done):**
  - teste vermelho → verde no seam → ok, pelo corpo do PR ("cada teste visto vermelho antes de verde"; o caso novo do SP1 fica vermelho sem o filtro do log);
  - `format:check`, `lint`, `typecheck` e `test` com `CI=true`, com o comando e a saída → ok (365 testes; 21 na suíte do rate limit);
  - commit `feat(#12)` → ok (`c56ae80`), mais o `fix(#12)`;
  - `ASSUMPTION:` no ticket → ok: 6 itens em 2 comentários; o item 2 do segundo complementa o item 4 do primeiro, sem substituí-lo;
  - todo finding com veredito → ok, conferido: as 23 linhas da tabela do PR têm veredito (10/9/4);
  - PR com `Closes #12` e CI verde → ok, conferido: os 4 checks com SUCCESS, e o PR está CLEAN;
  - linha `Métricas:` → ok, conferida no #12 (issuecomment-7167096801): `modelo=opus · findings=10/9/4 · assumptions=6 · ci-vermelho=0`;
  - escalada → não se aplica: Opus desde o início.
- **Verificações:** U9 confirmado nas quatro rotas, pelo teste do rate limit (evidência no corpo do PR). O relatório deixa a "confirmação formal" de duas rotas com o #13 e o #17. Mas o U9 só pede os nomes, e o próprio NEEDS-DECISION do #12 diz que a linha sai da skill. A tabela "Unverified" registra o U9 como confirmado; as regras da A3.8 seguem com o #17.
- **Decisões que a sessão tomou:**
  - a recusa com 403 do pedido `cross-site` antes do rate limit (ASSUMPTION 1 de issuecomment-7166871397). Ela segue a Resource Isolation Policy do web.dev, só que mais estrita: a política de exemplo deixa passar toda navegação vinda de outro site, e o #12 deixa passar só os links do e-mail. Pedidos sem o cabeçalho passam, como a política recomenda;
  - a correção do CR3, que era código do #11, neste ticket.
- **Sinais:**
  - NEEDS-DECISION do #12 (issuecomment-7165798068), com a proposta para a `CONFIG.md` da `auth-identity`: o envoltório do handler, o `onAPIError.throw` com o `logger.log`, o caminho base explícito e a linha do U9. Não bloqueia; a decisão é do usuário, e o destino é um PR `docs/`;
  - A45 novo: o `NEEDS-DECISION:` tem dois sentidos;
  - findings repetidos na mesma categoria: dado sensível no log, no #8, no #10, no #11 e no #12 (foi para "Levar à retro da spec A");
  - a `CONFIG.md` aponta um arquivo que o ticket seguinte mudou (foi para "Levar à retro da spec A");
  - `ASSUMPTION:` na mesma área: 4 dos 6 itens tratam do handler HTTP e dos erros dele, a mesma área da proposta para a `CONFIG.md`;
  - quatro bugs de correção numa execução em Opus. Nos tickets em Opus, os reviews acharam 8 (#7), 1 (#8), 4 (#9), 5 (#11) e 4 (#12);
  - A40: nenhum bloqueio falso com o hook novo. A39: mais duas ocorrências. A42: terceiro ponto, e o `/usage` agora sugere conferir o modelo dos subagentes da `ship-ticket`;
  - as consequências do #12 para o #13, o #17 e o #18 foram para "Levar aos tickets seguintes da spec A";
  - acumulado na spec A: 8 tickets, 162 findings (66 fix, 67 accept, 29 reject), 62 `ASSUMPTION:`, 1 escalada (mais uma devida no #5) e 2 CI vermelhos.
- **Cota:** 5 h: 14% (fim da S15) → 78%, na mesma janela, com virada às 15:30; um ticket em Opus ocupa quase uma janela inteira · semana: 58% → 67%, 9 pontos, dentro dos 8 a 10 medidos. Restam 33 pontos até sexta, 27/11, às 13:00. Cabem o #13, o #14 e o #15 (Sonnet), a R0.5d e o #16 (Opus); o #17 (Opus) deve caber, e o #18 fica no limite. É estimativa.

### 25/11/2026 · Sessão acompanhada · Contexto do #12 no #13 e no #17

- **Decisão do usuário:** publicar as consequências do #12 como comentário nos tickets que as recebem, porque o implementer lê o ticket com os comentários, e o #13 não tinha nenhum.
- **Publicado:** no #13 (issuecomment-7171007566), as páginas do Better Auth desligadas e a exceção dos links do e-mail na recusa `cross-site`; no #17 (issuecomment-7171007989), os mesmos dois itens e o log do 500 sem o caminho, que traz o token. Os comentários dizem que não mudam os critérios de aceite (A33).
- **Pendentes do relatório da S16:** o merge do PR #36, a proposta para a `CONFIG.md` (NEEDS-DECISION do #12, R0.5d recomendada entre o #15 e o #16) e a ASSUMPTION da recusa `cross-site`, com aceite recomendado.

### 25/11/2026 · Sessão acompanhada · Decisões do relatório da S16

- **NEEDS-DECISION do #12 (issuecomment-7165798068):** aprovado pelo usuário, como a sessão acompanhada recomendou. A proposta para a `CONFIG.md` da `auth-identity` sai num PR `docs/`, a R0.5d, em Sonnet, entre o #15 e o #16. Motivo do momento: o #13, o #14 e o #15 não dependem dela, e o #17 é o primeiro que depende da regra do IP. A resposta no #12 sai na própria R0.5d, como a S15 fez com o #11. Ajustes da sessão acompanhada, que entram no mesmo PR: a regra do IP nomeia o módulo, e não o arquivo; e o fato do U9 vai para o corpo da skill quando a linha sair do "Unverified" (A14).
- **ASSUMPTION 1 de issuecomment-7166871397 (recusa `cross-site` com 403 antes do rate limit):** aceita pelo usuário, como a sessão acompanhada recomendou. Motivo: segue a Resource Isolation Policy do web.dev (Fetch Metadata), só que mais estrita, e se reverte tirando a recusa do handler. Para que um ticket seguinte não a tire sem saber por quê, a regra e a razão entram na `CONFIG.md` na R0.5d.
- **Pendente:** o merge do PR #36, do usuário, antes da S17.

### 25/11/2026 · Sessão 17 · F6 + F7 · R0 (spec A) · ticket #13, PR #37

- **Portão anterior:** o usuário fez o merge do PR #36 (`dac1ac6`, 25/11), e o #12 fechou.
- **Resumo:** o #13 (confirmação de e-mail atrás da interface mailer) saiu no PR #37, com os commits `713dbd5` (feat) e `dcd3a69` (fix dos findings). O implementer rodou em Sonnet, e o fix escalou para Opus. Os reviews deram 18 findings: 6 fix, 8 accept e 4 reject. Houve um bug de correção: um cadastro que falhava depois de criar a conta ainda mandava o e-mail, porque o envio automático do Better Auth começa dentro da transação, antes do commit e do gancho do perfil. O fix desligou o envio automático e manda a confirmação por um gancho posterior em `/sign-up/email`.
- **Portão:** o merge do PR #37 está pendente e é do usuário. A sessão acompanhada recomenda o merge.
- **Conferência (Definition of Done):**
  - teste vermelho → verde no seam → ok. O corpo do PR mostra o vermelho só do fix, num teste mutante (`3 failed | 5 passed` com o envio automático religado). Para os critérios, a transcrição do implementer mostra as execuções vermelhas antes do verde (`agent-ae25afdd…`: `1 failed (1)`, `1 failed | 3 passed (4)` e `1 failed | 4 passed (5)`). É uma falta menor no corpo do PR, não no trabalho;
  - `format:check`, `lint`, `typecheck` e `test` com `CI=true`, com o comando e a saída → ok (385 testes, em `dcd3a69`, com a suíte rodada sozinha);
  - commit `feat(#13)` → ok (`713dbd5`), mais o `fix(#13)`;
  - `ASSUMPTION:` no ticket → ok: 6 itens em 2 comentários (issuecomment-7171401608 e issuecomment-7172159354);
  - todo finding com veredito → ok, conferido: as 18 linhas da tabela do PR têm veredito (6/8/4);
  - PR com `Closes #13` e CI verde → ok, conferido: os 4 checks com SUCCESS, e o PR está CLEAN;
  - linha `Métricas:` → ok, conferida no #13 (issuecomment-7172867655): `modelo=sonnet→opus · findings=6/8/4 · assumptions=6 · ci-vermelho=0`. O relatório não a cita;
  - escalada → ok: o comentário "Escalado para Opus" está no #13 (issuecomment-7171831562).
- **Verificações:** o U6 está parcial, confirmado no seam 1 (tabela "Unverified").
- **Sinais:**
  - dois NEEDS-DECISION de proposta para a `CONFIG.md` da `auth-identity`, sem bloqueio: o envio sem tratar a falha (issuecomment-7171403121) e o envio automático do cadastro (issuecomment-7172160543). O exemplo da skill levou ao bug de correção (A14 de novo, em "Levar à retro da spec A"). A decisão é do usuário, e o destino proposto é a R0.5d;
  - A45: 2ª ocorrência, contornada pelo prompt;
  - A46 novo: o fix escalado mudou o desenho e não passou por review;
  - A40: um bloqueio falso, por colisão de duas suítes de banco (a da sessão, em segundo plano, e a do hook). É a 2ª colisão do lado do projeto;
  - A42: os revisores rodaram no modelo da sessão (Sonnet), pelos `meta.json`;
  - A20: 3 dos 4 tickets em Sonnet tiveram bug de correção no review;
  - A19: 3ª ocorrência;
  - finding 9 do PR #37 (accept): `BETTER_AUTH_URL` sem validação. A pesquisa e a proposta estão em "Levar à spec B e à R1";
  - consequências do #13 para o #14, o #15, o #16, o #17 e o #23, em "Levar aos tickets seguintes da spec A";
  - caso isolado: `gh issue view --comments --json` falha, porque as duas opções não se combinam;
  - nenhuma ocorrência do A39;
  - acumulado na spec A: 9 tickets, 180 findings (72 fix, 75 accept, 33 reject), 68 `ASSUMPTION:`, 2 escaladas (mais uma devida no #5) e 2 CI vermelhos.
- **Cota (S17):** 5 h: janela nova às 15:29 → 39%, com virada às 20:29 · semana: 67% → 73%, 6 pontos, incluindo a sessão acompanhada. Um ticket em Sonnet com o fix em Opus custou mais que os 1 a 2 pontos dos tickets só em Sonnet. Restam 27 pontos até sexta, 27/11, às 12:59. Cabem o #14 e o #15 (Sonnet, de 2 a 6 pontos cada) e a R0.5d; o #16 (Opus, de 8 a 10) deve caber; o #17 fica para depois da virada. É estimativa.

### 25/11/2026 · Sessão acompanhada · Decisões do relatório da S17

- **Propostas do #13 para a `CONFIG.md` (issuecomment-7171403121 e issuecomment-7172160543):** aprovadas pelo usuário, como a sessão acompanhada recomendou. Entram na R0.5d (escopo no mapa do R0). Motivo: o exemplo atual da skill leva ao mesmo bug do #13 no próximo ticket que o seguir.
- **Gotcha no `CLAUDE.md` do projeto:** aprovado. A suíte de banco nunca roda em segundo plano. Entra na R0.5d; a correção de fundo segue na `testing-stack` (A40).
- **URL base do Better Auth:** aprovado como critério da spec B ("Levar à spec B e à R1").
- **Comentários "Contexto do #13":** aprovados e publicados no #14 (issuecomment-7175875157), no #15 (issuecomment-7175875616), no #16 (issuecomment-7175876062), no #23 (issuecomment-7175876475) e no #17 (issuecomment-7175876872). Cada um diz que não muda os critérios de aceite (A33).
- **Pendente:** o merge do PR #37, do usuário, antes da S18.
