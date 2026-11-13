# Next.js 16.4.6: arquitetura, cache, mutações e RBAC

Fonte de material para as skills `next-architecture` e de regras RBAC. Versão verificada: `next@16.4.6`.

Convenções de citação:
- `(docs: <caminho>)` = arquivo relativo a `node_modules/next/dist/docs/` (versão instalada em `f:\Projetos\reading-list`). Os caminhos abaixo omitem o prefixo `01-app/` apenas quando dito; por padrão ele está incluído.
- `(react.dev/...)` = página consultada em react.dev.
- `(owasp: ...)` = OWASP Authorization Cheat Sheet (cheatsheetseries.owasp.org).
- **Síntese:** = proposta deste documento, não afirmação das fontes.
- Marcador `[plataforma]` = comportamento que depende de Vercel vs Node self-hosted.

---

## Resumo para a skill

1. Habilite `cacheComponents: true` e defina `partialPrefetching` explicitamente (`true` em projeto novo); sem `cacheComponents`, nada de `"use cache"`.
2. Componentes são Server Components por padrão; ponha `"use client"` apenas em folhas interativas e passe Server Components como `children`/props para elas.
3. Todo dado dinâmico (`cookies()`, `headers()`, `params` dinâmico, `searchParams`, fetch sem cache) fica atrás de `<Suspense>` próximo ao ponto de acesso; `await` de `params`/`searchParams` dentro do boundary, não no topo de layout.
4. Cacheie dados compartilhados com `"use cache"` + `cacheLife(...)` explícito + `cacheTag(...)`; nunca leia `cookies()`/`headers()` dentro de `"use cache"` (passe o valor como argumento).
5. Após mutação em Server Action use `updateTag(tag)` (read-your-writes); em Route Handler/webhook use `revalidateTag(tag, 'max')`; `revalidateTag` com um argumento está deprecado.
6. Toda Server Action é endpoint público: autentique, autorize (inclusive posse do recurso), valide a entrada (schema) e devolva só um DTO mínimo, dentro de cada ação.
7. Erros esperados de formulário voltam como valor de retorno (`useActionState`); `throw` só para falhas inesperadas (vão para `error.js`).
8. Acesso a dados só por uma Data Access Layer `server-only` que verifica sessão e permissão e devolve DTOs; Client Components nunca importam a DAL nem recebem registros brutos.
9. `proxy.ts` (ex-`middleware.ts`) só faz checagem otimista (cookie/redirect), nunca é a única barreira; repita a autorização na DAL, nas Server Actions e nos Route Handlers; negue por padrão.
10. APIs removidas/renomeadas em 16: `params`, `searchParams`, `cookies()`, `headers()`, `draftMode()` são só assíncronos; `middleware` -> `proxy`; `experimental.ppr`/`dynamicIO`/`useCache` -> `cacheComponents`; `dynamic`/`revalidate`/`fetchCache`/`dynamicParams` não existem com Cache Components.

---

## 1. Modelo de renderização

### 1.1 Server vs Client Components

**Critério de decisão** (docs: 01-getting-started/05-server-and-client-components.md):
- Client Component quando precisa de estado e event handlers, lifecycle (`useEffect`), APIs de browser (`localStorage`, `window`) ou custom hooks.
- Server Component quando busca dados perto da fonte, usa segredos, quer reduzir JS enviado ou melhorar FCP/streaming.

**Padrão recomendado:** layouts e páginas são Server Components por padrão; empurre `"use client"` para as folhas interativas (ex.: `<Search />` num layout cujo resto é estático) (docs: 01-getting-started/05-server-and-client-components.md, "Reducing JS bundle size").

**Fatos do modelo:**
- `"use client"` declara a fronteira entre os grafos de módulos servidor e cliente. Tudo que o arquivo importa e os componentes que ele renderiza diretamente entram no bundle do cliente. Server Components passados como `children`/props não entram no grafo do cliente (docs: 01-getting-started/05-server-and-client-components.md).
- Client Components também renderizam no servidor (HTML) e no browser (hidratação). "Client" não significa "só no browser" (docs: 02-guides/server-and-client-boundary.md, "Rendering environments").
- Código atravessa a fronteira por `import`; dados por props, e precisam ser serializáveis. Passar função comum como prop de Server para Client Component lança erro; Server Function (`'use server'`) atravessa como referência. O plugin TypeScript aceita props de função nomeadas `action` ou terminadas em `Action` (docs: 02-guides/server-and-client-boundary.md, "Crossing the boundary").
- Providers de context: crie um Client Component que aceita `children` e renderize-o o mais fundo possível na árvore (não envolva `<html>`) (docs: 01-getting-started/05-server-and-client-components.md, "Context providers").
- Conteúdo atrás de interação não aparece no HTML para crawlers sem JS (docs: 02-guides/server-and-client-boundary.md, "Server Components and SEO"). Relevante para o catálogo público: o conteúdo indexável deve estar no render do servidor.

**Composição (Server Component dentro de Client Component):**

```tsx
// page.tsx (Server)  -> <Modal> é Client; <Cart> permanece Server
<Modal title={<div>Your cart</div>}>
  <Cart />
</Modal>
```
(docs: 02-guides/server-and-client-boundary.md; 01-getting-started/05-server-and-client-components.md, "Interleaving").

**Streaming de promise para Client Component:** o Server Component inicia a promise sem `await` e passa como prop; o Client Component lê com `use(promise)` dentro de `<Suspense>` (docs: 02-guides/server-and-client-boundary.md; react.dev/reference/rsc/server-components; react.dev/reference/react/use). Regra do React: nunca crie a promise durante o render de um Client Component (recria a cada render e o fallback nunca sai); crie em Server Component, handler ou cache (react.dev/reference/react/use). `use` não pode ficar em `try/catch`; use Error Boundary (react.dev/reference/react/use).

**Anti-padrões:**
- `"use client"` em layout/página inteira "por garantia".
- Passar o registro bruto do banco como prop a um Client Component (docs: 02-guides/data-security.md, "Component-level data access").
- Componente cliente `async` (regra ESLint `@next/next/no-async-client-component`, docs: 03-api-reference/05-config/03-eslint.md; "Async components are not supported on the client", react.dev/reference/rsc/server-components).
- Mutar o DOM de Server Components diretamente (docs: 02-guides/server-and-client-boundary.md).

**Verificação:** build falha ao importar módulo `server-only` em código cliente (docs: 02-guides/data-security.md); lint `@next/next/no-async-client-component`; revisão de arquivos `"use client"` para props largas demais (docs: 02-guides/data-security.md, "Auditing").

### 1.2 Streaming: Suspense e `loading.js`

- `loading.js` envolve automaticamente `page.js` e filhos num `<Suspense>`; não envolve o `layout.js`, `template.js` nem `error.js` do mesmo segmento (docs: 03-api-reference/03-file-conventions/loading.md).
- Critério: `loading.js` para páginas em que nada renderiza sem dados (fallback é prefetchado); `<Suspense>` explícito para a maioria das páginas, com controle granular (docs: 02-guides/streaming.md, "When to use loading.js vs Suspense").
- Padrão recomendado: boundary `<Suspense>` próximo ao acesso dinâmico ("push dynamic access down"). Sem boundary, o prerender falha com erro de blocking route; um `loading.js` alto é um boundary válido mas faz a página inteira cair num skeleton (docs: 02-guides/streaming.md).
- Contrato HTTP: após o início do stream o status `200` já foi enviado. `notFound()` depois disso não vira 404; Next injeta `<meta name="robots" content="noindex">`. Para 404 real, chame `notFound()` antes do boundary (docs: 02-guides/streaming.md, "The HTTP contract"). Importante para páginas de curso inexistentes no catálogo.
- Bots que só leem HTML estático: o Next detecta pelo user agent e resolve `generateMetadata` antes de enviar o conteúdo; com Cache Components eles pulam o shell prerenderizado e recebem render dinâmico. Dados usados pelo shell precisam estar disponíveis também em runtime (docs: 02-guides/streaming.md, "Bots and crawlers"; 01-getting-started/08-caching.md).
- `[plataforma]` self-hosted com nginx: desligue buffering (`X-Accel-Buffering: no`); load balancers precisam suportar chunked/HTTP2. Sem streaming as features funcionam, mas o response vai inteiro (docs: 02-guides/self-hosting.md, "Streaming and Suspense").

### 1.3 Estático vs dinâmico e Partial Prerendering (16.4)

Com Cache Components, a fronteira estático/dinâmico é por componente, não por rota (docs: 02-guides/rendering-philosophy.md). Em build, Next renderiza a árvore e cada parte é tratada assim (docs: 01-getting-started/08-caching.md, "Prerendering"):

| Parte | Resultado |
|---|---|
| `"use cache"` (vida longa o bastante) | entra no static shell |
| `<Suspense>` ao redor de dado não cacheado/runtime | só o fallback entra no shell; conteúdo faz stream em request |
| módulos importados, `fs.readFileSync`, computação pura | prerenderizado automaticamente |
| `Math.random()`, `Date.now()`, `crypto.randomUUID()` | exigem `connection()` + `<Suspense>` ou `"use cache"` |

- PPR é o comportamento padrão com `cacheComponents` (docs: 03-api-reference/05-config/01-next-config-js/cacheComponents.md). `experimental.ppr` e `experimental_ppr` foram removidos em 16.0 (docs: 02-guides/upgrading/version-16.md).
- **App Shell** = shell estático reutilizável independente da URL. Com `partialPrefetching: true` (16.3+) o router faz um prefetch do App Shell por rota; para pré-carregar conteúdo que depende de `params`/`searchParams`, use `<Link prefetch={true}>` (custa uma invocação de servidor por link) (docs: 03-api-reference/05-config/01-next-config-js/partialPrefetching.md; 01-getting-started/08-caching.md, "Prefetching").
- Dados dinâmicos sem boundary geram o insight `blocking-prerender-*` no dev overlay; ele não aparece na resposta HTTP (continua 200 em dev) (docs: 02-guides/migrating-to-cache-components.md, "Following validation").
- Validação de navegação instantânea: `export const instant = true | false | { level }` por segmento; por padrão (`validationLevel: 'warning'`) todo Page/Default é validado em dev. `instant = false` opta fora; não força a rota a ser dinâmica e não limpa erros de IO síncrono (`new Date()` etc.) (docs: 03-api-reference/03-file-conventions/02-route-segment-config/instant.md; 02-guides/migrating-to-cache-components.md).
- `export const ensureStatic = 'auto' | 'shell' | 'prefetch' | 'navigation' | false` (16.4+) falha o build se trabalho por request invadir a saída que deve ser estática (docs: 03-api-reference/03-file-conventions/02-route-segment-config/ensureStatic.md; 02-guides/migrating-to-cache-components.md). Útil para travar páginas do catálogo.
- Teste e2e de navegação instantânea: helper `instant()` do pacote `@next/playwright` (docs: 02-guides/instant-navigation.md, "Test it in CI").
- Navegação com `<Activity>`: com `cacheComponents`, rotas anteriores ficam `"hidden"` (estado preservado, effects limpos) em vez de desmontar (docs: 03-api-reference/05-config/01-next-config-js/cacheComponents.md).
- `[plataforma]` entrega do shell na latência do CDN exige integração de plataforma; em single `next start` tudo funciona, só sem a vantagem de TTFB do edge (docs: 02-guides/ppr-platform-guide.md, 02-guides/deploying-to-platforms.md).

**Síntese:** no catálogo, a regra prática é: shell e listas públicas em `"use cache"`; qualquer UI que dependa da sessão (botão "matricular", progresso) é uma folha dentro de `<Suspense>`.

---

## 2. Cache Components e caching

### 2.1 Configuração

```ts
// next.config.ts
const nextConfig: NextConfig = { cacheComponents: true, partialPrefetching: true }
```
(docs: 03-api-reference/05-config/01-next-config-js/cacheComponents.md). `partialPrefetching` exige `cacheComponents`; deixá-lo indefinido loga warning e age como `false`. `cacheComponents` exige runtime Node.js e não aceita export `runtime` (nem `'edge'`).

Apps novos criados por `create-next-app` já vêm com ambos habilitados (docs: 01-getting-started/08-caching.md).

### 2.2 `"use cache"` e variantes

| Diretiva | Onde guarda | Lê `cookies()`/`headers()`? | Quando usar |
|---|---|---|---|
| `"use cache"` | in-memory (ou `cacheHandlers.default`); entra no static shell | Não (passe como argumento) | padrão para dados compartilhados |
| `"use cache: remote"` | `cacheHandlers.remote`, compartilhado entre instâncias | Não | só com alta taxa de hit e backend lento/rate-limited |
| `"use cache: private"` | só no browser (nunca no servidor); excluído do shell | Sim | quando não dá para extrair o valor de runtime (ex.: sessão lida fundo no helper) |

(docs: 03-api-reference/01-directives/use-cache.md; use-cache-remote.md, tabela "How use cache: remote differs"; use-cache-private.md.)

Regras de `"use cache"` (docs: 03-api-reference/01-directives/use-cache.md):
- Funções/componentes devem ser `async`. No topo do arquivo cobre todos os exports (todos `async`).
- Chave de cache = build ID (ou `deploymentId`) + ID da função + argumentos serializáveis + variáveis capturadas de escopo externo. Chaves e tags ficam em texto puro: não use segredos nem dados pessoais (docs: 02-guides/authentication-with-cache-components.md, Step 4).
- Argumentos/retornos precisam ser serializáveis (sem instância de classe, função, `URL`, Symbol); `children`/Server Actions podem passar sem serem lidos (pass-through).
- `cookies()`, `headers()`, `searchParams` dentro de escopo cacheado lançam `next-request-in-use-cache`; isso pode passar no `next build` e falhar em `next start` em rota dinâmica.
- `React.cache` tem escopo isolado dentro de `"use cache"`; passe dados por argumento.
- Com Draft Mode ativo, funções cacheadas reexecutam a cada request.
- Proxy não aplica transformação de diretivas: `"use cache"` e `"use server"` não têm efeito em `proxy.ts`; `cacheLife`/`cacheTag` lançam lá.
- Nenhum cache sobrevive a novo deploy (a chave inclui o build ID), nem o `remote`.

**Recomendado:** sempre chame `cacheLife(...)` no próprio escopo; sem ele vale o perfil `default` (stale 5 min, revalidate 15 min, expire nunca) (docs: 03-api-reference/01-directives/use-cache.md, "Time-based revalidation"). Aninhar `"use cache"` de vida curta dentro de um sem `cacheLife` explícito falha o build no prerender.

### 2.3 `cacheLife`, `cacheTag`

`import { cacheLife, cacheTag } from 'next/cache'` (sem prefixo `unstable_`; docs: 02-guides/upgrading/version-16.md).

- Só dentro de escopo com diretiva de cache; não em escopo de módulo. Chame um `cacheLife` por invocação (docs: 03-api-reference/04-functions/cacheLife.md).
- Perfis (stale/revalidate/expire): `seconds` 30s/1s/1min; `minutes` 5min/1min/1h; `hours` 5min/1h/1d; `days` 5min/1d/1w; `weeks` 5min/1w/30d; `max` 5min/30d/1y; `default` 5min/15min/nunca. Perfis custom e inline (`cacheLife({ stale, revalidate, expire })`) são aceitos; props omitidas herdam de `default` (mesmo arquivo).
- Limiares de prerender: `revalidate: 0` ou `expire < 5 min` ficam fora do prerender (viram "dynamic hole"); `stale < 30s` também; `stale` entre 30s e 5min entra no prerender mas não no App Shell. Dos presets só `seconds` cai nisso (mesmo arquivo, "Prerendering behavior"). O router do cliente impõe `stale` mínimo de 30s.
- `cacheTag(...tags)`: até 128 tags por chamada, máx. 256 caracteres cada; tags maiores são ignoradas com warning (docs: 03-api-reference/04-functions/cacheTag.md). Para `revalidateTag`, tags são case-sensitive.

### 2.4 Invalidação: semântica exata e onde chamar

| API (`next/cache`) | Onde pode ser chamada | Semântica |
|---|---|---|
| `updateTag(tag)` | **somente Server Actions** (lança em Route Handler/outros) | expira a tag imediatamente; o próximo read espera dado novo (read-your-own-writes); re-renderiza a rota atual na mesma resposta |
| `revalidateTag(tag, profile)` | Server Functions e Route Handlers; não em Client Components nem Proxy | marca como stale; stale-while-revalidate; `profile` = `'max'` (recomendado), outro perfil de `cacheLife` ou `{ expire }`; `{ expire: 0 }` = expira sem servir stale |
| `revalidatePath(path, type?)` | Server Functions e Route Handlers; não em Client Components nem Proxy | invalida página/layout; `type` (`'page'`/`'layout'`) obrigatório com segmento dinâmico (`/product/[slug]`); caminho é o do arquivo de rota (destino de rewrites); não invalida outras páginas que usem a mesma tag |
| `refresh()` | **somente Server Actions** | refaz o RSC payload da rota atual sem invalidar cache |

Fontes: docs: 03-api-reference/04-functions/updateTag.md, revalidateTag.md, revalidatePath.md, refresh.md; 02-guides/server-actions.md ("Choosing a cache update").

Detalhes que importam:
- `revalidateTag` não re-renderiza na resposta da action; a página reflete a mudança numa leitura posterior (docs: 02-guides/server-actions.md). A revalidação é disparada por request, não pela chamada (docs: revalidateTag.md).
- `updateTag`, `revalidatePath` e `refresh` re-renderizam a rota atual na mesma ida e volta; nenhum deles lança (ao contrário de `redirect`). Chame revalidação antes de `redirect` (docs: 02-guides/server-actions.md).
- Chamar revalidação numa Server Action limpa todo o client cache imediatamente, ignorando `stale` (docs: cacheLife.md, "Client cache behavior").
- Em Server Functions, `revalidatePath` hoje também faz páginas já visitadas refrescarem ao serem revisitadas; os docs dizem que isso é temporário (docs: revalidatePath.md).
- Tags: máx. 256 caracteres; revalidatePath: máx. 1024.
- Não dispare revalidação nem altere cookies durante o render; o Next bloqueia isso (docs: 02-guides/data-security.md, "Avoiding side-effects during rendering").

### 2.5 O que é cacheado por padrão (e memoização)

- Com Cache Components, **nada é cacheado** a menos que esteja num escopo `"use cache"`. Fetch e dados são dinâmicos por padrão (docs: 03-api-reference/05-config/01-next-config-js/cacheComponents.md; 02-guides/migrating-to-cache-components.md, "fetchCache").
- `fetch` não é cacheado por padrão e bloqueia a renderização até terminar; `fetch` idêntico na mesma árvore de render é memoizado (docs: 01-getting-started/06-fetching-data.md).
- Fora de `fetch` (ORM/SQL) use `React.cache` para deduplicar dentro do request; escopo é só o request atual (docs: 01-getting-started/06-fetching-data.md, "Reusing data with React.cache"). Dentro de `"use cache"` ele é isolado.
- Preload: chame a função de dados sem `await` antes do trabalho bloqueante e depois no consumidor (docs: 01-getting-started/06-fetching-data.md).
- `unstable_cache` continua funcionando; migração é opcional (docs: 02-guides/migrating-to-cache-components.md). `unstable_noStore` não é mais necessário; use `connection()` + `<Suspense>`.
- O `fetch` Data Cache persiste entre deploys; `use cache` não (mesmo documento).

### 2.6 Como `params`/`searchParams`/`cookies`/`headers` interagem

- São "runtime APIs". Fora de `<Suspense>` geram erro/insight de blocking route; dentro, só aquele subárvore faz stream em request (docs: 01-getting-started/08-caching.md, "Working with runtime APIs").
- Padrão recomendado para manter o shell estático: passe a promise `params` ao filho e dê `await` dentro do boundary, em vez de `await` no topo do layout (docs: 01-getting-started/08-caching.md, "Maximizing the static shell").
- `params` conhecido por `generateStaticParams` é conteúdo concreto no shell; desconhecido gera App Shell + ISR após a primeira visita (docs: 01-getting-started/08-caching.md; 02-guides/incremental-static-regeneration-cache-components.md).
- Para cachear algo derivado do request: extraia o valor (`userId`) e passe a uma função `"use cache"` (docs: 01-getting-started/08-caching.md, "Passing runtime values"). O cache em memória em serverless pode não persistir entre requests.
- Client hooks: `useSearchParams` sempre precisa de `<Suspense>`; `usePathname`/`useParams` suspendem se o pathname depende de params ainda desconhecidos (docs: 02-guides/migrating-to-cache-components.md).
- Se cookie/header controla atributo de `<html>` no root layout, a subárvore inteira fica ligada ao request; use script inline no `<head>` (docs: 02-guides/migrating-to-cache-components.md, cita `preventing-flash-before-hydration`).

### 2.7 Self-hosted vs Vercel `[plataforma]`

- Cache padrão do servidor: memória (50 MB default) + disco local por instância. Em compute efêmero (serverless) é de curta duração; com Kubernetes cada pod tem sua cópia (docs: 02-guides/self-hosting.md, "Configuring Caching").
- `"use cache"` default: em serverless as entradas normalmente não persistem entre requests; em self-hosted persistem (LRU, limite por `cacheMaxMemorySize`). Hosts podem trocar o handler e alguns não guardam output de runtime; valores computados no prerender ainda são reutilizados (docs: 03-api-reference/01-directives/use-cache.md, "Runtime caching considerations").
- Várias instâncias: `revalidateTag` só invalida na instância que recebeu a chamada. Implemente `updateTags()` e `refreshTags()` num handler custom (`cacheHandlers` para `"use cache"`; `cacheHandler` singular para ISR/fetch/imagens) com store compartilhado (Redis, etc.) (docs: 02-guides/how-revalidation-works.md; 02-guides/self-hosting.md; 03-api-reference/05-config/01-next-config-js/cacheHandlers.md). `cacheHandlers` aceita chaves `default` e `remote`; `'use cache: private'` não aceita handler custom.
- Self-hosted multi-instância também precisa de: `NEXT_SERVER_ACTIONS_ENCRYPTION_KEY` igual em todas (senão "Failed to find Server Action"), `generateBuildId` consistente, `deploymentId` para proteção de version skew (docs: 02-guides/self-hosting.md, "Multi-Server Deployments").
- Entradas de cache devem manter HTML + RSC payload juntos; um CDN não deve cachear os dois com TTL diferente (docs: 02-guides/how-revalidation-works.md).
- Páginas dinâmicas saem com `Cache-Control: private, no-cache, no-store...`; totalmente estáticas com `public` (docs: 02-guides/self-hosting.md).
- Quem hospeda: um único `next start` entrega todas as features, incluindo Cache Components, Server Actions, Proxy e `after()`; o resto é "performance fidelity" (docs: 02-guides/deploying-to-platforms.md). Não há doc nesta versão que descreva o que a Vercel faz internamente além do que é dito como "plataforma"; ver Lacunas.

**Verificação (cache):** `next build` mostra tabela de rotas com `Revalidate`/`Expire` e símbolo `○ (Static)` (docs: 02-guides/public-static-pages.md); `NEXT_PRIVATE_DEBUG_CACHE=1` loga o cache (docs: 03-api-reference/01-directives/use-cache.md); dev overlay + MCP `get_errors` mostram insights (docs: 02-guides/migrating-to-cache-components.md); teste de que mutação invalida: asserção e2e depois de ação com `updateTag`.

---

## 3. Mutações de dados

### 3.1 Server Functions / Actions

- Server Function = função `async` com `'use server'` (inline no corpo ou no topo de arquivo). Em contexto de mutação/`action` prop chama-se Server Action (docs: 01-getting-started/07-mutating-data.md; react.dev/reference/rsc/server-functions).
- Não dá para *definir* Server Function dentro de Client Component; importe de arquivo `"use server"` (docs: 01-getting-started/07-mutating-data.md).
- `'use server'` só em funções `async`, no início da função/módulo, aspas simples ou duplas (react.dev/reference/rsc/use-server).
- Forms com `action={fn}` funcionam com progressive enhancement; o formulário pode ser enviado antes da hidratação (docs: 01-getting-started/07-mutating-data.md; react.dev/reference/rsc/server-functions).
- Despacho no cliente é sequencial (uma action por vez por cliente); não use `Promise.all` de actions. Paralelismo vai dentro de uma única action ou em Server Component (docs: 02-guides/server-actions.md).
- Request de action: POST, limite de body 1 MB (`serverActions.bodySizeLimit`), checagem `Origin` vs `Host` (`serverActions.allowedOrigins`); nos docs a opção aparece sob `experimental.serverActions` (docs: 02-guides/server-actions.md; 02-guides/data-security.md).
- Argumentos extra: `fn.bind(null, id)` (funciona em Server e Client, com progressive enhancement); campo hidden vai no HTML sem codificação (docs: 02-guides/forms.md). Mesmo assim o `id` vindo do cliente é não confiável.

### 3.2 `useActionState`, `useOptimistic`, `useFormStatus`

- `const [state, formAction, pending] = useActionState(action, initialState)`; a action recebe `(prevState, formData)`. Form precisa estar em Client Component para exibir `state` (docs: 02-guides/forms.md, "Validation errors"; react.dev/reference/rsc/server-functions).
- `useFormStatus` (de `react-dom`) precisa estar em componente filho do `<form>` (docs: 02-guides/forms.md).
- `useOptimistic(value, reducer?)` retorna `[optimisticState, set]`; chame `set` dentro de uma Action/`startTransition`; o estado otimista só dura enquanto a action está pendente e reverte se ela lançar (react.dev/reference/react/useOptimistic; exemplo em docs: 02-guides/forms.md, "Optimistic updates").
- `startTransition` não marca automaticamente updates de estado após `await` (react.dev/reference/rsc/server-functions).

### 3.3 Validação na fronteira

- Valide `FormData`, params, headers e searchParams: são não confiáveis (docs: 02-guides/data-security.md, "Validating client input"; react.dev/reference/rsc/use-server: "Arguments ... are fully client-controlled").
- Os docs usam Zod/Valibot com `safeParse` e retornam `validatedFields.error.flatten().fieldErrors` (docs: 02-guides/forms.md). Validar formato não basta: `Item` bem formado pode apontar para linha de outro usuário (docs: 02-guides/server-actions.md, "Security").
- Receba só uma referência (ID) + a mudança; derive identidade da sessão e releia o resto de fonte confiável (mesmo trecho).

### 3.4 Erros: retornar vs lançar

- Erros esperados (validação, falha de request): **modele como valor de retorno**, sem `try/catch`+`throw`, e exiba com `useActionState` (docs: 01-getting-started/10-error-handling.md, "Server Functions").
- Exceções inesperadas: `throw` e deixe o boundary `error.js` capturar. `error.js` recebe `{ error, retry }`; `retry()` refaz fetch+render dos filhos (estável desde 16.3.0; `unstable_retry` em 16.2.0); `reset()` limpa o estado sem refetch e é a exceção (docs: 03-api-reference/03-file-conventions/error.md). Em produção, `error.message` de Server Components é genérico; use `error.digest` para correlacionar com logs.
- `notFound()` + `not-found.js` para recurso inexistente (docs: 01-getting-started/10-error-handling.md).
- Nos exemplos dos docs, falha de autorização dentro de action é `throw new Error('Unauthorized'/'Forbidden')`; com `experimental.authInterrupts` pode-se lançar `unauthorized()`/`forbidden()` (docs: 02-guides/data-security.md; 02-guides/server-actions.md; 03-api-reference/05-config/01-next-config-js/authInterrupts.md, "experimental").

### 3.5 Revalidação após mutação

Ver §2.4. Receita: `await mutação; updateTag('x'); redirect(...)`. `updateTag` e `revalidatePath` podem ser usados juntos (`revalidatePath('/blog'); updateTag('posts')`) (docs: revalidatePath.md).

### 3.6 Segurança

- Actions são endpoints públicos por POST, mesmo sem uso na UI. IDs são criptografados e actions não usadas são removidas do bundle, mas isso "reduz o risco" e não substitui verificação (docs: 02-guides/data-security.md, "Built-in Server Actions security features").
- Checagem na página não vale para a action definida nela: reverifique dentro da action (docs: 02-guides/data-security.md, "Authentication and authorization").
- Variáveis fechadas por closure em actions inline são criptografadas, mas não conte só com isso para segredos (docs: 02-guides/data-security.md).
- Retorne só o necessário (nunca o registro do banco) (docs: 02-guides/data-security.md, "Controlling return values").
- Considere rate limiting em operações caras (docs: 02-guides/data-security.md).
- Deploy: IDs de action mudam entre builds (rotação em no máx. 14 dias); mostre retry para "Failed to find Server Action" (docs: 02-guides/server-actions.md, "Deployment considerations").

**Verificação:** teste que chama a action sem sessão e com sessão de outro usuário e espera falha; teste com payload inválido espera `errors`; grep/lint interno: todo arquivo `"use server"` chama a DAL (docs: 02-guides/data-security.md, "Auditing" lista essas perguntas).

---

## 4. Data Access Layer e camadas

### 4.1 O que os docs recomendam

(docs: 02-guides/data-security.md, "Data fetching approaches")
- Três abordagens: HTTP APIs externas (projetos grandes existentes), **Data Access Layer** (projetos novos), acesso no componente (protótipos). Escolha uma e não misture.
- A DAL: roda só no servidor, faz checagem de autorização, devolve **DTOs** mínimos. Centraliza acesso e permite cache em memória por request.
- Só a DAL lê `process.env` com segredos; marque módulos com `import 'server-only'` (build error se importado no cliente; o pacote é opcional, o Next o trata internamente).
- Use `React.cache` para helpers como `getCurrentUser`/`verifySession` (docs: 02-guides/data-security.md; 02-guides/authentication.md, "Creating a Data Access Layer").
- Para mutações, o mesmo padrão: funções `server-only` com auth+authz+DB; os arquivos `"use server"` ficam finos e só chamam a DAL e revalidam (docs: 02-guides/data-security.md, "Using a DAL for mutations").
- Opcional: `taintObjectReference`/`taintUniqueValue` com `experimental.taint`, como camada extra; não substitui filtrar na DAL (docs: 02-guides/data-security.md, "Tainting").
- Client Components não podem importar a DAL: rode no pai (Server Component) e passe dados por props ou por provider de context com `use()` (docs: 02-guides/authentication.md, "Auth and streaming"; 02-guides/authentication-with-cache-components.md, Step 3).
- Os docs não prescrevem onde fica "lógica de negócio" além de "centralizar na DAL"; a divisão abaixo é síntese.

### 4.2 Síntese: camadas estilo MVVM adaptadas a RSC

**Síntese:** (não é afirmação dos docs)

```
Model      = domínio puro (regras, tipos, políticas de permissão)  +  DAL server-only (queries, auth, DTOs, cache/tags)
Composição = Server Components (page/layout): leem a DAL, definem Suspense, passam DTOs/promises
ViewModel  = custom hook em client island ("use client"): estado de UI, otimista, chamadas a Server Actions
View       = componentes "burros": só props + JSX, sem fetch nem regra
```

Mapeamento de pastas sugerido:

```
src/
  domain/          # tipos, invariantes, policies (can(user,'course:edit',course)); sem I/O, sem next/*
  data/            # DAL: "server-only"; getCourseCatalog(), getLessonForUser(); DTOs; "use cache" + cacheTag aqui
  actions/         # "use server": validação (schema) -> DAL -> updateTag; retorna {ok|errors}
  app/             # rotas; Server Components compõem DAL + Suspense; nenhuma query inline
  ui/              # Views puras (podem ser Server ou Client); ui/<feature>/use-<feature>.ts = ViewModel
```

Regras da síntese:
1. `domain/` não importa `next/*` nem `server-only`: testável por unidade pura (política `canEditCourse(user, course)` é função pura).
2. Quem decide permissão: `domain` define a política; `data/` a aplica. O Server Component nunca decide sozinho.
3. Server Component chama `data/` e passa **DTO** (ou promise do DTO) à island; island nunca recebe entidade completa.
4. O ViewModel (hook) guarda estado de UI, `useOptimistic`/`useActionState` e invoca a Server Action recebida **por prop** ou importada; não contém regra de autorização (só otimização de UX).
5. View = componente que só recebe props; pode ser Server Component se não precisar de estado.
6. Cache e tags vivem na DAL (função `"use cache"` com `cacheTag`), as `actions/` só chamam `updateTag`/`revalidateTag`. Assim a convenção de nomes de tag fica num módulo (`data/tags.ts`).

**Verificação (síntese):** teste unitário de `domain/` e de políticas; teste de integração das funções de `data/` com sessões diferentes; regra de lint/`eslint-plugin-boundaries` ou `import/no-restricted-paths` (ferramenta de terceiros, não citada nos docs) proibindo `ui/` e `"use client"` de importar `data/`; o build falha se `server-only` vazar.

---

## 5. Roteamento relevante

### 5.1 Segmentos dinâmicos e `generateStaticParams`

- `app/courses/[slug]/page.tsx`; `params` é `Promise<{ slug: string }>` e precisa de `await` (ou `use()` em Client Component page) (docs: 03-api-reference/03-file-conventions/dynamic-routes.md).
- Helpers de tipo globais `PageProps<'/rota'>`, `LayoutProps<'/rota'>`, `RouteContext` são gerados por `next typegen` (docs: 02-guides/upgrading/version-16.md).
- `generateStaticParams` pode ser usado em page, layout e route handler; retorna array de objetos com todos os segmentos; filhos recebem `params` do pai; durante revalidação ISR não é chamado de novo (docs: 03-api-reference/04-functions/generate-static-params.md).
- **Com Cache Components `generateStaticParams` deve retornar pelo menos um param** (array vazio = erro `empty-generate-static-params`). Remover o export tira a rota do ISR. Caminhos não listados são servidos em request (docs: 02-guides/migrating-to-cache-components.md).
- `export const dynamicParams` **não é suportado** com Cache Components (erro de build). Para rejeitar params inválidos chame `notFound()` na página (mesmo doc).
- Catálogo (síntese): `generateStaticParams` com os N cursos mais populares (ou todos, se poucos); demais caminhos geram App Shell e viram ISR na primeira visita (docs: 02-guides/incremental-static-regeneration-cache-components.md). Para o ISR de caminhos não listados com shell imediato exige `partialPrefetching: true` e `await params` dentro de `<Suspense>`; sem ele, `await params` fora de qualquer Suspense (inclusive `loading.tsx`) (mesmo doc).
- Curso inexistente: `notFound()` antes do `<Suspense>` para obter 404 real (docs: 02-guides/streaming.md).
- Metadados do catálogo: `generateMetadata` segue as mesmas regras de cache; dado externo exige `"use cache"` ou erro (docs: 02-guides/migrating-to-cache-components.md).
- Parallel routes exigem `default.js` explícito, senão o build falha (docs: 02-guides/upgrading/version-16.md).

### 5.2 Route groups e layouts

- `(pasta)` não entra na URL; serve para organizar, compartilhar layout entre alguns segmentos e ter múltiplos root layouts. Navegar entre root layouts diferentes recarrega a página inteira; duas rotas de grupos distintos não podem resolver à mesma URL (docs: 03-api-reference/03-file-conventions/route-groups.md).
- Síntese: `app/(public)/courses/...` (catálogo indexável, estático/cacheado), `app/(app)/learn/...` (autenticado, aluno), `app/(admin)/...`. Grupos separam a organização, **não** protegem nada.
- Layouts não re-renderizam em navegação (partial rendering): não faça check de auth só no layout; o layout também não impede que slots/segmentos filhos rodem (docs: 02-guides/authentication.md, "Layouts and auth checks"). Padrão `return null` em layout "não é recomendado".
- Top-level `await` de sessão num layout segura todo o `{children}`; mova para componente aninhado dentro de `<Suspense>` (docs: 02-guides/authentication.md, "Auth and streaming").
- Com Cache Components, layout que acessa dado runtime sem boundary dá erro de build; `loading.js` não cobre o layout do mesmo segmento (docs: 03-api-reference/03-file-conventions/loading.md).

### 5.3 `proxy.ts` (ex-`middleware.ts`)

- Arquivo na raiz (ou `src/`), exporta `proxy` (nomeado ou default) e opcionalmente `config.matcher`. `middleware` e a exportação `middleware` estão deprecadas; flags `skipMiddlewareUrlNormalize` -> `skipProxyUrlNormalize` (docs: 03-api-reference/03-file-conventions/proxy.md; 02-guides/upgrading/version-16.md).
- Runtime é **Node.js**, não configurável; `runtime` em proxy lança erro; para continuar em `edge` mantenha `middleware` (docs: 02-guides/upgrading/version-16.md; proxy.md, "Runtime").
- Serve para: reescrever, redirecionar, alterar headers, responder direto. Para redirects simples prefira `redirects` do `next.config` (docs: 01-getting-started/16-proxy.md).
- **Não deve:** buscar dados lentos; ser solução completa de sessão/autorização; depender de `"use cache"`/`"use server"` (sem efeito); contar com `fetch` cache (`next.revalidate`/`tags` não cacheiam) (docs: 01-getting-started/16-proxy.md, "Limitations").
- Sem `matcher` roda em **toda** request, inclusive `_next/static`, `_next/image` e `public/`; use matcher negativo (docs: proxy.md, "Matcher"). Mesmo se `_next/data` for excluído, o proxy ainda é invocado nessas rotas por segurança (mesmo doc).
- Em requests RSC o Next remove headers internos (`rsc`, `next-router-state-tree`, `next-router-prefetch`) de `request.headers`; ao usar `fetch()` em vez de `NextResponse.rewrite()` você pode precisar repassá-los (mesmo doc).
- Proxy também roda em rotas prefetchadas: leia só o cookie (checagem otimista), nunca banco (docs: 02-guides/authentication.md, "Optimistic checks with Proxy").
- Um único arquivo `proxy.ts`; modularize por imports (docs: 01-getting-started/16-proxy.md). Teste com `unstable_doesMiddlewareMatch`, `isRewrite`, `getRewrittenUrl` de `next/experimental/testing/server` (docs: proxy.md, "Testing").
- `[plataforma]` Node server e Docker: suportado; static export: não; adapters: depende da plataforma (docs: proxy.md, "Platform support").

---

## 6. Autenticação e RBAC

### 6.1 O que o guia de autenticação diz

(docs: 02-guides/authentication.md)
- Três conceitos: autenticação, gestão de sessão, autorização. Os exemplos de username/senha são "educacionais"; recomenda-se uma **biblioteca** (que já traz social login, MFA e RBAC).
- Sessão: **stateless** (token/cookie assinado ou cifrado; mais simples, pode ser menos seguro se mal feito) ou **database** (cookie só com ID cifrado; mais seguro, mais caro). Libs de sessão citadas: Iron Session, Jose.
- Cookie de sessão: `HttpOnly`, `Secure`, `SameSite` (exemplo `lax`), `Max-Age`/`Expires`, `Path`; setado no servidor com `cookies()` de `next/headers` (mesmo doc).
- Autorização tem duas modalidades: **otimista** (dados da sessão no cookie; para esconder/mostrar UI e redirecionar) e **segura** (dados da sessão no banco; para dados e ações sensíveis).
- Onde checar: DAL (`verifySession()` com `React.cache`), Server Components (renderização por papel), leaf components, Server Actions, Route Handlers (401 sem sessão, 403 sem permissão), Proxy (só otimista).
- Libs de auth listadas nos docs: Auth0, Better Auth, Clerk, Descope, Kinde, Logto, NextAuth.js, Ory, Stack Auth, Supabase, Stytch, WorkOS (mesmo doc, "Auth Libraries").

### 6.2 Por que checar só no proxy é insuficiente

- Os próprios docs: Proxy "não deve ser sua única linha de defesa"; "a maioria das checagens deve ficar o mais perto possível da fonte de dados" (docs: 02-guides/authentication.md); "should not be used as a full session management or authorization solution" (docs: 01-getting-started/16-proxy.md).
- Proxy só vê cookie (otimista), não consulta banco por performance, e roda como arquivo separado do render, com sua própria exposição de matcher (docs: proxy.md; authentication.md).
- Existem múltiplas portas de entrada: segmentos aninhados, Server Actions (POST direto), Route Handlers, rotas `_next/data` (docs: authentication.md, "Layouts and auth checks" e Good to know; data-security.md, "Auditing": "proxy.ts and route.ts have a lot of power").
- Checagem de página não cobre a action definida nela (docs: data-security.md).

### 6.3 Princípios OWASP aplicáveis

(owasp: Authorization Cheat Sheet, cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html)
- **Enforce Least Privileges:** só o acesso mínimo do papel; revise para evitar privilege creep.
- **Deny by Default:** a aplicação sempre decide permitir/negar e o padrão é negar; não confie em defaults do framework, configure explicitamente.
- **Validate the Permissions on Every Request:** inclusive AJAX e chamadas server-side; uma checagem esquecida expõe o recurso.
- **Testes de autorização:** testes unitários e de integração que verificam negação por padrão, falha segura e imposição de políticas.
- **Prefer ABAC/ReBAC over RBAC:** RBAC puro sofre explosão de papéis; atributos e relações permitem decisões mais finas (relevante a "instrutor só edita seus cursos").
- **Static resources:** arquivos estáticos e storage em nuvem também ficam sob política de acesso (relevante a vídeos/PDFs de aula).
- **IDOR:** esconder ID não basta; cheque autorização para o objeto específico a cada request.
- **Server-side enforcement:** checagens no cliente melhoram UX, nunca decidem.
- **Exit safely:** falhas de autorização tratadas de forma consistente, sem vazar detalhes.
- **Logging:** registre eventos de autorização em formato parseável.

Os docs do Next fazem o mesmo mapeamento IDOR: checar `post.authorId !== session.user.id` na ação (docs: 02-guides/data-security.md) e `findFirst({ where: { id, ownerId: session.user.id } })` (docs: 02-guides/server-actions.md).

### 6.4 Auth + Cache Components

(docs: 02-guides/authentication-with-cache-components.md)
- Ler a sessão é leitura de request: sempre atrás de `<Suspense>`; `cookies()` fora de boundary é erro de build.
- `"use cache"` e `"use cache: remote"` não podem chamar `cookies()`; `"use cache: private"` pode e guarda o resultado só no browser.
- Dado derivado da sessão: resolva o usuário na função exportada e passe só o `userId` a uma função `"use cache"` **não exportada** (para que ninguém peça dados de outro id). `cacheTag(\`notes:${userId}\`)` + `updateTag` na action.
- Actions releem a sessão e se autorizam; não confiam no cliente.
- Compartilhar usuário com Client Components: promise via Context + `use()`, criada dentro do boundary (mesmo doc, Step 3).
- Migração gradual: `export const instant = false` na página/layout que lê sessão.

### 6.5 Síntese: modelo RBAC da plataforma

**Síntese:** (os docs não definem um modelo de papéis; libs de auth listadas oferecem RBAC, mas a escolha fica fora deste documento.)

**Papéis:** `student`, `instructor`, `admin` (e `anonymous` = sem sessão).

**Permissões como capabilities** (string `recurso:ação`), mapeadas por papel numa tabela única em `domain/`:

| Capability | anonymous | student | instructor | admin |
|---|---|---|---|---|
| `catalog:read` (curso publicado) | sim | sim | sim | sim |
| `lesson:read` | não | só se matriculado | próprios cursos | sim |
| `progress:write` | não | próprio, em aula acessível | não | não |
| `course:create` | não | não | sim | sim |
| `course:edit` | não | não | **somente se `course.instructorId === user.id`** | sim |
| `course:publish` | não | não | próprio | sim |
| `enrollment:manage` | não | próprio (matricular-se) | do próprio curso (leitura) | sim |
| `user:manage` | não | não | não | sim |

**Decisão em duas camadas:** `can(user, capability, resource?)` =
1. a capability está concedida ao papel? (RBAC; negar por padrão se não listada);
2. se a capability é de recurso: o atributo/relação de posse ou matrícula confere? (ABAC/ReBAC; ver OWASP "Prefer ABAC and ReBAC").

**Onde cada checagem roda:**

| Camada | Checagem | Tipo |
|---|---|---|
| `proxy.ts` | cookie de sessão presente para `/learn/*`, `/studio/*`, `/admin/*`; redireciona para `/login` | otimista, não é barreira |
| DAL `verifySession()` / `getCurrentUser()` (com `React.cache`) | sessão válida; devolve `{id, role}` mínimo | segura |
| DAL por recurso: `getLessonForUser(lessonId)`, `getCourseForEdit(courseId)` | `can(user, cap, recurso)` com posse/matrícula **dentro da query** (`where` com `instructorId`/matrícula) e retorna `null`/`forbidden` | segura (autoritativa) |
| Server Components | só *decidem UI* (mostrar botão "Editar") usando DTO que a DAL já filtrou; nunca única barreira | UX |
| Server Actions | autenticação + `can(...)` + schema de validação **dentro de cada ação** (via DAL); IDs vêm do cliente, identidade da sessão | segura |
| Route Handlers | 401 sem sessão, 403 sem permissão; mesma função da DAL | segura |
| Client islands | nenhuma segurança; só reflete capabilities recebidas por prop para esconder controles | UX |

Regras de implementação (síntese):
- **Deny by default:** `can` retorna `false` para capability/papel desconhecido; a DAL só devolve dados se houver uma regra que permita explicitamente.
- **Anti-IDOR:** nunca `findById(id)` seguido de checagem esquecida; use consultas já escopadas (`where: { id, instructorId: user.id }`), ou `findById` + `can()` obrigatório dentro da mesma função da DAL.
- **Aluno vê aula só de curso matriculado:** `getLessonForUser` junta `enrollment` com o `userId` da sessão; sem matrícula devolve `notFound()` (evita revelar existência) ou `forbidden`, decisão do projeto.
- **Catálogo público vs conteúdo pago:** o catálogo (título, descrição, lista de módulos/aulas sem URLs de vídeo) vem de função `"use cache"` sem sessão. O conteúdo da aula (vídeo/texto) vem de função separada, atrás de `<Suspense>`, com sessão e matrícula; nunca coloque URL do vídeo no DTO público. Se for proteger páginas estáticas compartilhadas, os docs citam Proxy para "static routes que compartilham dados entre usuários (ex. paywall)", sempre como otimista (docs: 02-guides/authentication.md).
- **Progresso ("watched"):** `markLessonWatched(lessonId)` é Server Action: sessão -> `can(user,'progress:write', lesson)` -> upsert idempotente `(userId, lessonId)` -> `updateTag(\`progress:${userId}\`)`. UI usa `useOptimistic`; falha reverte.
- **Papel no token vs banco:** papel em cookie stateless é só "otimista"; mudanças de papel (revogação) só valem em checagem segura que lê do banco ou sessão de banco (docs: authentication.md, "Optimistic" vs "Secure"). Para ações destrutivas/de admin, releia o papel do banco.
- **Logging:** registrar negações (OWASP: Implement Appropriate Logging).
- **Testes (OWASP: unit e integration tests de autorização):** matriz papel x capability x posse em testes de `can`; testes de DAL com 3 usuários (dono, outro instrutor, aluno não matriculado); teste de que Server Action sem sessão falha.

---

## 7. Armadilhas (o que um modelo treinado em Next 13-15 provavelmente erra em 16.4)

| # | Armadilha | Realidade em 16.4 | Fonte |
|---|---|---|---|
| 1 | `middleware.ts` / `export function middleware` | Renomeado para `proxy.ts` / `proxy`; runtime Node.js fixo; `edge` só continuando com `middleware`; `skipMiddlewareUrlNormalize` -> `skipProxyUrlNormalize` | docs: 02-guides/upgrading/version-16.md; 03-api-reference/03-file-conventions/proxy.md |
| 2 | `params`/`searchParams`/`cookies()`/`headers()`/`draftMode()` síncronos | Compatibilidade síncrona **removida**; só async (`await params`, `await cookies()`). Também `params` e `id` de `opengraph-image`, `icon`, `sitemap` | docs: 02-guides/upgrading/version-16.md |
| 3 | `revalidateTag('x')` com um argumento | Exige 2º argumento (perfil `'max'` recomendado); a forma de 1 arg é deprecada e dá erro de TypeScript | docs: 03-api-reference/04-functions/revalidateTag.md |
| 4 | Usar `revalidateTag` para read-your-writes em Server Action | Use `updateTag` (novo, só Server Actions); `revalidateTag` com `max` é stale-while-revalidate e não re-renderiza na resposta | docs: updateTag.md; 02-guides/server-actions.md |
| 5 | `unstable_cacheLife` / `unstable_cacheTag` | Estáveis: `import { cacheLife, cacheTag } from 'next/cache'` | docs: 02-guides/upgrading/version-16.md |
| 6 | `experimental.ppr`, `experimental_ppr`, `experimental.dynamicIO`, `experimental.useCache`, `experimental.cacheComponents` | Removidos; use `cacheComponents` no topo da config (substitui os três) | docs: 03-api-reference/05-config/01-next-config-js/cacheComponents.md; version-16.md |
| 7 | `export const dynamic`, `revalidate`, `fetchCache`, `dynamicParams` | Não existem com Cache Components (build falha); use `"use cache"`, `cacheLife`, `<Suspense>`, `notFound()` | docs: 03-api-reference/03-file-conventions/02-route-segment-config/index.md; 02-guides/migrating-to-cache-components.md |
| 8 | "`fetch` é cacheado por padrão" / "usar `cookies()` torna a rota inteira dinâmica" | Com Cache Components nada é cacheado sem `"use cache"`; ler `cookies()` dentro de `<Suspense>` faz stream só daquela subárvore; fora do boundary é erro | docs: 01-getting-started/08-caching.md; migrating-to-cache-components.md |
| 9 | `generateStaticParams` retornando `[]` para "tudo em runtime" | Com Cache Components precisa de >= 1 param (erro `empty-generate-static-params`) | docs: 02-guides/migrating-to-cache-components.md; generate-static-params.md |
| 10 | `await params` no topo do layout/página | Torna o layout dependente do request; passe a promise e dê `await` dentro de `<Suspense>` | docs: 01-getting-started/08-caching.md, "Maximizing the static shell" |
| 11 | `error.js` com `reset` como API principal | `retry()` (estável em 16.3.0; `unstable_retry` em 16.2.0) é o recomendado; `reset` só sem refetch | docs: 03-api-reference/03-file-conventions/error.md |
| 12 | Ler `cookies()`/`headers()` dentro de `"use cache"` | Lança `next-request-in-use-cache`; passe valor por argumento ou use `"use cache: private"` | docs: 03-api-reference/01-directives/use-cache.md |
| 13 | `next build --turbopack` / `next dev --turbopack` | Turbopack é default; projeto com `webpack` custom **falha** `next build` (use `--webpack` ou migre); `experimental.turbopack` -> `turbopack` no topo | docs: 02-guides/upgrading/version-16.md |
| 14 | `next lint` | Migrar para ESLint CLI; plugin usa Flat Config por padrão | docs: version-16.md |
| 15 | Parallel routes sem `default.js` | Build falha | docs: version-16.md |
| 16 | `images.domains`, `next/legacy/image`; imagens locais com query string; `qualities` livre | `domains` deprecado (use `remotePatterns`); query string exige `images.localPatterns.search`; `qualities` default `[75]`; `minimumCacheTTL` default 4h; `maximumRedirects` 3 | docs: version-16.md |
| 17 | Node 18, TS 4 | Mínimos: Node 20.9, TS 5.1 | docs: version-16.md |
| 18 | `runtime = 'edge'` em rotas com Cache Components | Não suportado; remova qualquer export `runtime` | docs: cacheComponents.md |
| 19 | `forbidden()`/`unauthorized()` sem flag | Exigem `experimental.authInterrupts: true` (doc marcada "canary", experimental) | docs: 03-api-reference/05-config/01-next-config-js/authInterrupts.md |
| 20 | `serverActions` na raiz da config | Os exemplos dos docs mostram `experimental.serverActions` (`allowedOrigins`, `bodySizeLimit`) | docs: 02-guides/server-actions.md; data-security.md (verificar `serverActions.md` ao implementar) |
| 21 | Cache de `"use cache"` persiste entre deploys/instâncias | Chave inclui build ID; em memória por instância; serverless não reaproveita; `remote` + handler para compartilhar | docs: use-cache.md; self-hosting.md |
| 22 | `React.cache` para passar dados para dentro de `"use cache"` | Escopo isolado, não visível | docs: use-cache.md |
| 23 | `unstable_noStore()` para forçar dinâmico | Desnecessário; use `connection()` + `<Suspense>` | docs: migrating-to-cache-components.md |
| 24 | Navegação desmonta a rota anterior | Com `cacheComponents` rotas ficam `<Activity mode="hidden">`: estado preservado, effects limpos/recriados | docs: cacheComponents.md; 02-guides/preserving-ui-state.md |
| 25 | `scroll-behavior: smooth` é sobrescrito na navegação | Não é mais; adicione `data-scroll-behavior="smooth"` em `<html>` para o comportamento antigo | docs: version-16.md |
| 26 | `revalidateTag` chamado em `proxy.ts` ou Client Component | Não permitido (`revalidateTag`/`revalidatePath`); `updateTag`/`refresh` só em Server Actions | docs: revalidateTag.md, revalidatePath.md, updateTag.md, refresh.md |

---

## Lacunas

1. **Vercel específico:** os docs 16.4.6 descrevem requisitos de plataforma (streaming, cache compartilhado, adapters), mas não detalham o que a Vercel faz com `"use cache"` em runtime nem o preço/limite do remote cache. Decidir Vercel vs self-hosted exige consultar a documentação da plataforma.
2. **Persistência de `"use cache"` em serverless:** não é dito como cada host decide guardar output em runtime ("check your hosting provider's documentation").
3. **Localização exata de `serverActions` na config 16.4:** os guias mostram `experimental.serverActions`; o arquivo `serverActions.md` não foi lido em detalhe.
4. **RBAC:** nem os docs do Next nem a OWASP prescrevem modelo de papéis/capabilities; a tabela da §6.5 é síntese e precisa de validação com o domínio real (ex.: instrutor co-autor, aluno em turma, papéis múltiplos).
5. **Escolha da lib de auth:** os docs listam opções mas não comparam; falta critério para sessão stateless vs de banco quando há revogação de papéis.
6. **`unauthorized()`/`forbidden()` estabilidade:** ainda sob `experimental.authInterrupts`; não está claro quando estabilizam.
7. **Lint específico de boundaries:** os docs listam regras `@next/next/*`, mas nenhuma impõe "client não importa DAL" ou "action chama DAL"; seria preciso regra de terceiros ou teste próprio.
8. **Verificação automática de cache:** não há doc de teste que afirme "esta tag foi invalidada"; só `instant()` (`@next/playwright`) para navegação instantânea e debug por `NEXT_PRIVATE_DEBUG_CACHE=1`.
9. **Limiar de ISR e `partialPrefetching` em produção:** a recomendação de ligar `partialPrefetching` vem do texto de config; o custo real de invocações por `<Link prefetch={true}>` em catálogo grande não é quantificado.
10. **Proteção de arquivos estáticos/vídeo (OWASP "Static resources"):** os docs do Next não cobrem URLs assinadas ou storage com autorização; depende do provedor de vídeo/storage.
11. **Tabela de 16.x no blog:** não consultei `nextjs.org/blog` pois os docs empacotados cobriram as mudanças necessárias (16.0 a 16.4).
