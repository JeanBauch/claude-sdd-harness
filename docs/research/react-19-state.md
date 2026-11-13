# React 19 e estado em Next.js 16: material-fonte para a skill `react-state`

Versões instaladas em `f:\Projetos\reading-list`: **react 19.3.0**, **next 16.4.6** (`node_modules/*/package.json`). O compilador (`babel-plugin-react-compiler`) e o `eslint-plugin-react-hooks` não estão em `node_modules` desse projeto na data da pesquisa; não há `reactCompiler` em `next.config.*`.

Fontes: react.dev (Learn, Reference, blog), docs do Next embutidas em `node_modules/next/dist/docs/01-app` (citadas como `next:<arquivo>`), docs oficiais de TanStack Query, Zustand e nuqs. Pesquisa feita em 2026-11-13. Afirmações marcadas "Síntese:" são recomendação deste documento, não afirmação das docs.

## Resumo para a skill

1. Busque dados em Server Components e passe por props; não use `useEffect` para buscar dados no App Router (react.dev/reference/react/Suspense, next:01-getting-started/06-fetching-data).
2. Filtros, ordenação e paginação compartilháveis vivem na URL: leia `searchParams` na page (Server) e navegue com `router.push`/`<Link>` dentro de `startTransition` (next:03-file-conventions/page, next:02-guides/interactive-apps).
3. Mutações e formulários: Server Function em `<form action>` + `useActionState` (estado/erros) + `useFormStatus` (botão, em componente filho) + `useOptimistic` (feedback imediato) (react.dev/blog/2024/12/05/react-19).
4. Não guarde o que pode ser calculado: derive no render; nada de `useEffect` + `setState` para dado derivado (react.dev/learn/you-might-not-need-an-effect).
5. Resete estado com `key`, não com effect; guarde `selectedId`, não o objeto (react.dev/learn/preserving-and-resetting-state, react.dev/learn/choosing-the-state-structure).
6. Suba para `useReducer` só quando as transições têm regras; Context só depois de props/`children` falharem; separe contexto de estado e de dispatch (react.dev/learn/extracting-state-logic-into-a-reducer, react.dev/learn/passing-data-deeply-with-context).
7. React 19: use `<Context value>` (sem `.Provider`), `ref` como prop (sem `forwardRef`) e `use()` para ler promise/context (react.dev/blog/2024/12/05/react-19).
8. Com React Compiler ligado (`reactCompiler: true`), não escreva `useMemo`/`useCallback`/`memo` por padrão; só como escape hatch medido; siga as Rules of React e rode `eslint-plugin-react-hooks` `recommended` (react.dev/blog/2025/10/07/react-compiler-1, next:05-config/reactCompiler).
9. Filtro/busca pesados: `useTransition` ou `useDeferredValue` com o input controlado em estado síncrono; mantenha o resultado visível (stale) em vez de cair no fallback (react.dev/reference/react/useDeferredValue).
10. TanStack Query/Zustand só com gatilho claro (cache cliente compartilhado com refetch; estado cliente global entre árvores não relacionadas); nunca estado de store em Server Component (next:02-guides/client-side-data-fetching, github.com/pmndrs/zustand).

---

## 1. Árvore de decisão de estado

Princípio geral: "faça o estado fácil de atualizar sem introduzir erros"; agrupe, evite contradições, redundância, duplicação e aninhamento profundo (react.dev/learn/choosing-the-state-structure). Cada pedaço de estado tem um único dono (react.dev/learn/sharing-state-between-components).

### Nível 0: dado de servidor em Server Component (padrão)

- Page/layout são Server Components por padrão e buscam dados perto da fonte, sem expor segredos e sem JS no cliente (next:01-getting-started/05-server-and-client-components).
- Passe só dados serializáveis aos Client Components (idem).
- Dado que o cliente lê uma vez: passe a **promise** e leia com `use()` dentro de `<Suspense>` (next:01-getting-started/06-fetching-data; react.dev/reference/react/use).
- Suspense granular: aninhe boundaries para revelar progressivamente; "não mais granular que a sequência de carregamento que o usuário deve ver" (react.dev/reference/react/Suspense).
- **Gatilho para o nível 1:** o valor precisa ser compartilhável por link, sobreviver a reload ou mudar a query do servidor.
- Anti-padrão: `useEffect(() => fetch(...).then(setX))`. O Suspense não enxerga fetch em effect, então o fallback nunca aparece (react.dev/reference/react/Suspense). Effects que buscam exigem flag `ignore` contra race condition, e as docs dizem que frameworks têm algo melhor (react.dev/learn/you-might-not-need-an-effect).
- Verificar: teste de componente Server com `await Page({searchParams: Promise.resolve({...})})`; lint `react-hooks/set-state-in-effect` (react.dev/reference/eslint-plugin-react-hooks/lints/set-state-in-effect).

### Nível 1: estado na URL (searchParams)

- Server: `searchParams` da page é uma **Promise**: `const { page = '1', sort = 'asc', query = '' } = await searchParams` (next:03-file-conventions/page, seção "Handling filtering with `searchParams`").
- Client Component que precisa ler: `useSearchParams()` (read-only `URLSearchParams`; envolver em `<Suspense>`; o build falha em página estática sem Suspense) (next:03-functions/use-search-params). Se já está na page, a doc prefere passar o valor por props. Em Client Component *page* use `use(searchParams)` (next:03-file-conventions/page).
- Atualização: `router.push` monta `new URLSearchParams(searchParams.toString())`, `set`/`delete`, e navega (next:02-guides/interactive-apps, Step 3). Envolva a navegação em `startTransition` para ter estado pendente local; a doc mostra um `ChipGroup` com `useOptimistic` para o chip selecionado e `data-pending` para atenuar a lista.
- Convenção: props com nome `action` ou sufixo `Action` indicam que o componente chama o callback dentro de uma transition (react.dev/reference/react/useTransition#exposing-action-props-from-components, via next:02-guides/interactive-apps).
- **Quando nuqs se justifica** (nuqs.dev/docs): muitos parâmetros tipados, parse/serialização repetida, defaults, `useQueryState`/`useQueryStates`. API: `useQueryState('count', parseAsInteger.withDefault(0))`; `null` remove a chave (nuqs.dev/docs/basic-usage). Defaults: `shallow: true` (não notifica o servidor); para re-render do servidor use `shallow: false` e passe `startTransition` de `useTransition` para obter `isLoading`; em v2 isso é explícito (nuqs.dev/docs/options). No servidor: `createSearchParamsCache` + `parse(searchParams)` na page, `get`/`all` em filhos (nuqs.dev/docs/server-side). Suporta Next `>=14.2.0`, React `^18.3 || ^19` (nuqs.dev/docs). A doc de adapters (`NuqsAdapter`) não foi lida; ver Lacunas.
- Anti-padrões: copiar `searchParams` para `useState`; `history: 'push'` a cada tecla (nuqs.dev/docs/options avisa que quebra o botão Voltar); input de texto dentro de transition (ver seção 4).
- **Gatilho para o nível 2:** o estado é resultado de uma ação do usuário que escreve no servidor (formulário/mutação).

### Nível 2: formulário e mutação

- Server Action é "uma função async usada com `startTransition`", automaticamente quando passada a `<form action>` ou prop de ação (next:01-getting-started/07-mutating-data).
- `useActionState(action, initialState, permalink?)` retorna `[state, dispatchAction, isPending]`. A action recebe `(prevState, formData)`; esquecer `prevState` é erro comum. Ações são **sequenciais** (fila); erro lançado cancela a fila e vai ao Error Boundary, então retorne erros esperados (validação) como estado (react.dev/reference/react/useActionState).
- `useFormStatus()` retorna `{pending, data, method, action}`, mas só enxerga o `<form>` **pai**: chamar no mesmo componente que renderiza o `<form>` nunca dá `pending: true` (react.dev/reference/react-dom/hooks/useFormStatus). Importa de `react-dom`.
- `useOptimistic(value, reducer?)` precisa rodar dentro de uma Action/transition; o valor otimista reverte ao fim ou em falha (react.dev/reference/react/useOptimistic).
- Formulário uncontrolled é resetado automaticamente após Action com sucesso; `requestFormReset` reseta manualmente (react.dev/blog/2024/12/05/react-19).
- Progressive enhancement: formulário que chama Server Action em Server Component funciona sem JS; em Client Component as submissões ficam em fila até hidratar (next:01-getting-started/07-mutating-data).
- Next despacha Server Actions **uma por vez** no cliente: não paralelize com `Promise.all` (next:02-guides/server-actions). Depois da mutação: `revalidatePath`/`revalidateTag`/`updateTag`/`refresh()` de `next/cache` (next:01-getting-started/07-mutating-data, 02-guides/client-side-data-fetching).
- Validação de servidor com schema (Zod/Valibot); sempre autorize dentro da action (next:02-guides/forms, 02-guides/authentication).
- Anti-padrão: `isSending`/`isSent` booleanos separados (contradição possível); use `status` único (react.dev/learn/choosing-the-state-structure).
- **Gatilho para o nível 3:** o estado é puramente de UI (aberto/fechado, rascunho, seleção) e não vem de form nem URL.

### Nível 3: estado local

- `useState` para valores simples; **`useReducer` quando as transições têm regras** ou quando você tem bugs frequentes de atualização e quer estrutura; o reducer é função pura testável isoladamente, e log por ação ajuda a depurar (react.dev/learn/extracting-state-logic-into-a-reducer). Reducer deve lançar erro em ação desconhecida e não mutar (react.dev/reference/react/useReducer).
- Modele em 5 passos: estados visuais, gatilhos, `useState`, remover o não essencial, ligar handlers (react.dev/learn/reacting-to-input-with-state).
- Verificar: teste do reducer como função pura; lint `react-hooks/immutability`.
- **Gatilho para o nível 4:** dois irmãos precisam do mesmo estado.

### Nível 4: estado compartilhado na subárvore

- Primeiro **suba o estado** ao pai comum (controlled vs uncontrolled) e passe handlers (react.dev/learn/sharing-state-between-components).
- Depois, passar props e **extrair componentes passando JSX como `children`** antes de Context (react.dev/learn/passing-data-deeply-with-context). Detalhes na seção 2.
- **Gatilho para o nível 5:** os dados são lidos no cliente, mudam sem navegação e precisam de cache/refetch/dedup entre componentes.

### Nível 5: cache de server-state no cliente (TanStack Query)

- A doc do Next: muitos apps não precisam; se o Client Component lê dado uma vez, passe promise + `use()`. Use SWR/TanStack Query quando Client Components precisam de **cache compartilhado no navegador**: revalidação em foco, polling, dedupe de requests, updates otimistas entre componentes (next:02-guides/client-side-data-fetching).
- TanStack Query trata "server state": cache, dedupe, atualização em background, detecção de dado velho (tanstack.com/query/latest/docs/framework/react/overview).
- Setup no App Router: `QueryClient` novo por request no servidor e um só no browser; `'use client'` no provider; `staleTime` padrão > 0 (o guia usa 60s) para não refetchar logo após o SSR; prefetch em Server Component + `<HydrationBoundary state={dehydrate(queryClient)}>` (next:02-guides/client-side-data-fetching/tanstack-query; tanstack.com/query/latest/docs/framework/react/guides/advanced-ssr).
- Avisos do TanStack: não use Server Action como `queryFn` (execução serial, pode travar queries); não renderize resultado da query em Server Components ("trate Server Components como lugar de prefetch, nada mais"); "comece com as ferramentas do framework e adicione React Query só quando precisar" (advanced-ssr).
- Várias `useSuspenseQuery` no mesmo componente rodam em sequência (waterfall) (next:.../tanstack-query).
- Após mutação, invalide a leitura de servidor em cache (`updateTag`, `revalidateTag`) *e* o cache da lib; reverta o otimista se a escrita falhar (next:02-guides/client-side-data-fetching).
- **Gatilho para o nível 6:** estado puramente de cliente (não vem do servidor) usado por árvores sem ancestral comum.

### Nível 6: store global de cliente (Zustand ou similar)

- React: `useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot?)` existe para integrar fontes externas (libs de store, `navigator.onLine`); `getSnapshot` deve devolver valor em cache/imutável (senão loop infinito); `subscribe` fora do componente; **"sempre que possível prefira `useState` e `useReducer`"** (react.dev/reference/react/useSyncExternalStore).
- Zustand: `create` devolve hook sem provider; use **seletores** (sem seletor assina o store inteiro); `useShallow` para vários campos (github.com/pmndrs/zustand).
- Em Next: não leia/escreva o store em Server Components; crie **store por request** com `createStore` (`zustand/vanilla`) dentro de um provider `'use client'` via `useState(() => createStore())` e context; evite store global no servidor (README do Zustand cita bugs e problemas de privacidade; a página zustand.docs.pmnd.rs/learn/guides/nextjs confirma o padrão por request e que RSC "não deve ler nem escrever no store").
- Síntese: para esta plataforma o nível 6 provavelmente não é necessário no MVP (ver seção 6).

---

## 2. Context bem feito

- **Antes de Context:** props explícitas; depois extrair componentes e passar `children` (`<Layout><Posts posts={posts}/></Layout>`) para que o dado não atravesse intermediários (react.dev/learn/passing-data-deeply-with-context). Em Next isso também mantém Server Components como `children` de Client Components (next:01-getting-started/05-server-and-client-components, "Interleaving").
- **Dois contexts:** `TasksContext` (estado) e `TasksDispatchContext` (dispatch) com `useReducer`; hooks `useTasks()`/`useTasksDispatch()` encapsulam `useContext`; reducer, contexts, provider e hooks no mesmo arquivo (react.dev/learn/scaling-up-with-reducer-and-context). `dispatch` é estável (react.dev/reference/react/useReducer), então quem só dispara não re-renderiza com o estado. Síntese: só vale separar se há consumidores que só despacham.
- **Provider baixo na árvore:** o Next diz para renderizar providers "o mais fundo possível"; `ThemeProvider` envolve só `{children}`, não `<html>` (next:01-getting-started/05-server-and-client-components, "Context providers").
- **Providers são Client Components:** context não é suportado em Server Components; crie um Client Component com `'use client'` que aceita `children` e importe-o no layout (idem). Novidade do 19.3: Server Components podem renderizar diretamente um Context importado de um módulo `'use client'` com `<UserContext value={...}>`, sem componente wrapper (react.dev/blog/2026/09/09/react-19-3).
- **Sintaxe React 19:** `<LevelContext value={level}>`; `.Provider` ainda funciona e será depreciado (react.dev/blog/2024/12/05/react-19, react.dev/reference/react/useContext). Os exemplos da doc do Next (05-server-and-client-components) ainda usam `<ThemeContext.Provider>`: não copie.
- **Memoizar o value:** `useContext` re-renderiza todos os consumidores quando `value` muda por `Object.is`; `memo` não impede. A doc mostra `useMemo` no objeto e `useCallback` nas funções, chamando isso de otimização desnecessária em apps pequenos (react.dev/reference/react/useContext). **Com o React Compiler**, a doc de `useContext` não menciona o compilador; a doc de `memo` diz que o compilador cobre `memo` e valores (react.dev/reference/react/memo). Síntese: com compilador ativo e código dentro das Rules of React, não escreva `useMemo` no value por reflexo; sem compilador (ou componente com `"use no memo"`), memoize quando o value é objeto criado no render.
- **Ler context condicionalmente:** `use(Context)` pode vir após early return, ao contrário de `useContext`; não funciona em Server Components (react.dev/reference/react/use).
- **Provider no mesmo componente do consumidor não funciona:** o `useContext` vê só providers acima (react.dev/reference/react/useContext).
- **Promise via context:** padrão documentado: o provider recebe `userPromise` (criada no servidor) e `useUser()` faz `use(userPromise)` (next:02-guides/single-page-applications, "Using React's `use` within a Context Provider").
- Verificar: teste que renderiza o hook sem provider e espera erro explícito (padrão `throw` do hook em zustand.docs.pmnd.rs/learn/guides/nextjs); contar renders de consumidores com `React.Profiler` se houver suspeita.

---

## 3. Derivar em vez de guardar

Fonte central: react.dev/learn/you-might-not-need-an-effect. Regra: "Effect só para sincronizar com sistema externo".

| Situação | Fazer | Não fazer |
|---|---|---|
| valor calculável de props/state | `const fullName = first + ' ' + last` | `useEffect(() => setFullName(...))` |
| filtro/ordenação de lista | calcular no render (e `useMemo` só se medir >=1ms, react.dev/reference/react/useMemo) | `useEffect` + `setVisible` |
| resetar estado quando prop muda | `<Profile key={userId} />` | effect que chama `setComment('')` |
| ajustar parte do estado quando prop muda | guardar **id** e derivar: `items.find(i => i.id === selectedId) ?? null` | espelhar objeto em state |
| lógica causada por clique | no handler | em effect reagindo ao state |
| notificar pai | chamar `onChange` no mesmo handler, ou levantar o estado | effect chamando `onChange` |
| fonte externa | `useSyncExternalStore` | `useEffect` + `addEventListener` + `setState` |
| buscar dados | Server Component / `use()` / lib de cache | fetch em effect |

- Pergunta-guia: por que este código roda? Se foi uma ação do usuário, handler; se o componente apareceu na tela, effect (react.dev/learn/you-might-not-need-an-effect).
- Se precisar de effect de fetch, guarde `ignore` no cleanup (mesma fonte).
- `key` também reinicia árvore por posição/tipo; nunca declare componente dentro de outro (reseta estado a cada render) (react.dev/learn/preserving-and-resetting-state). Idem `lazy()` dentro de componente (react.dev/reference/react/lazy).
- Para formulário de edição ao trocar de item: `<EditContact key={selectedId} .../>` (react.dev/learn/preserving-and-resetting-state).
- Next 16 com Cache Components preserva estado entre navegações via `<Activity>` (até 3 rotas); use `key`/`bfcacheId` ou `useLayoutEffect` cleanup para resetar estado transitório (next:02-guides/preserving-ui-state). Só se `cacheComponents: true`.
- `useEffectEvent` (React 19.2): para lógica de evento disparada de dentro de Effect que deve ver props/state recentes sem re-sincronizar; só chamável dentro de effects; não use para suprimir dependências (react.dev/reference/react/useEffectEvent, react.dev/blog/2025/10/01/react-19-2).
- Lint: `react-hooks/set-state-in-effect` (setState síncrono em effect), `set-state-in-render`, `exhaustive-deps`, `rules-of-hooks` (react.dev/reference/eslint-plugin-react-hooks).
- Verificar: teste que muda a prop e confere o valor derivado sem `act` extra de effect; se o teste precisa de `waitFor` para um valor derivado, provavelmente há effect desnecessário.

---

## 4. Performance

### React Compiler

- É uma ferramenta de build que memoiza automaticamente **componentes e hooks** (não toda função); reaproveita JSX para evitar re-render em cascata e pula cálculos caros dentro de componentes/hooks; a memoização não é compartilhada entre componentes (react.dev/learn/react-compiler/introduction).
- Estável desde 1.0 (2025-10-07), compatível com React 17+; no 19 funciona sem config de target (react.dev/blog/2025/10/07/react-compiler-1; react.dev/learn/react-compiler/installation).
- **Next 16:** `reactCompiler` é estável e foi movido de `experimental`, mas **não vem ligado por padrão**. Instalar `babel-plugin-react-compiler` e `reactCompiler: true` em `next.config.ts`. Next aplica via SWC só nos arquivos relevantes (JSX/hooks). Opt-in: `reactCompiler: { compilationMode: 'annotation' }` + `"use memo"` por função; opt-out: `"use no memo"`. Defina `environment.enablePreserveExistingMemoizationGuarantees` explicitamente porque os defaults variam por versão (next:03-api-reference/05-config/01-next-config-js/reactCompiler, next:02-guides/upgrading/version-16).
- **Código novo:** confie no compilador; use `useMemo`/`useCallback` "onde precisar de controle preciso". **Código existente:** deixe a memoização existente (remover pode mudar a saída) ou teste antes de remover. Escape hatch típico: valor memoizado usado como dependência de effect para o effect não disparar repetidamente (react.dev/blog/2025/10/07/react-compiler-1). Recomenda fixar versão exata do compilador se a cobertura de testes for fraca (idem).
- **Quando `useMemo`/`memo` ainda importa:** cálculo lento (>=1ms medido em build de produção com throttling) com deps raras; valor passado a componente `memo`; dependência de outro Hook (react.dev/reference/react/useMemo). Nunca para corretude: "se seu código não funciona sem ele, conserte o problema de fundo" (idem). `useDeferredValue` precisa de `memo` no componente lento para ter efeito; com compilador isso tende a ser coberto, mas a doc de `useDeferredValue` não diz isso (Lacunas).
- **Rules of React** que o compilador exige: componentes/hooks puros e idempotentes; efeitos colaterais fora do render; props, state, args de hooks e valores JSX imutáveis; React chama componentes (nunca `Comp()`); hooks só no topo e só em componentes/hooks (react.dev/reference/rules). Violação: o compilador pula o componente e o resto continua otimizado (react.dev/learn/react-compiler/installation).
- **Lint:** `eslint-plugin-react-hooks` com preset `recommended` (flat: `reactHooks.configs.flat.recommended`); regras de compilador: `purity`, `refs`, `immutability`, `static-components`, `set-state-in-effect`, `set-state-in-render`, `preserve-manual-memoization`, `incompatible-library`, `use-memo`, `error-boundaries`, `globals`, entre outras (react.dev/reference/eslint-plugin-react-hooks, react.dev/blog/2025/10/07/react-compiler-1). `eslint-plugin-react-compiler` não é mais necessário. `preserve-manual-memoization` avisa quando deps de `useMemo`/`useCallback` estão incompletas (react.dev/reference/eslint-plugin-react-hooks/lints/preserve-manual-memoization).
- **Verificar que compilou:** badge "✨" no React DevTools; se um bug some com `"use no memo"`, é violação das Rules of React (react.dev/learn/react-compiler/debugging). Quebras típicas: effects que dependem de igualdade referencial, deps instáveis, `===` como cache (idem).

### Transitions e deferred values (filtros e busca)

- `useTransition()` → `[isPending, startTransition]`. **Não controla input de texto**: o `value` do input fica em estado síncrono e a parte pesada em estado de transição, ou use `useDeferredValue` (react.dev/reference/react/useTransition).
- Após `await` dentro de `startTransition(async ...)`, cada `setState` precisa de outro `startTransition` (idem). Ordem entre Actions concorrentes não é garantida; `useActionState`/form actions enfileiram (idem).
- Transition mantém conteúdo já revelado em vez de voltar ao fallback do Suspense (react.dev/reference/react/Suspense).
- `useDeferredValue(value, initialValue?)`: o input usa o valor vivo e a lista o deferido; compara `query !== deferredQuery` para indicar stale. Diferente de debounce: sem atraso fixo e interrompível; debounce ainda serve para reduzir *requests* (react.dev/reference/react/useDeferredValue). Passe primitivos ou objetos criados fora do render. Se o update está dentro de Transition, o hook devolve o valor novo (idem).
- 19.3: transitions agora renderizam de forma independente e `useDeferredValue` não fica preso em valor antigo (react.dev/blog/2026/09/09/react-19-3).
- Verificar: teste de que o input reflete a digitação imediatamente enquanto a lista atualiza depois (`userEvent.type` + asserção do input antes da lista); medir INP/Profiler.

### Lazy loading

- `lazy(() => import('./X'))` no **topo do módulo**, `default` export, dentro de `<Suspense>` (react.dev/reference/react/lazy).
- `next/dynamic` é composição de `React.lazy` + Suspense; opções `loading`, `ssr: false`; `ssr: false` **só em Client Components** (erro em Server Components); import precisa estar dentro de `dynamic()` e no topo do módulo; Server Component importado dinamicamente só lazy-loada os Client Components filhos; Server Component importando Client Component dinamicamente não faz code-splitting automático (next:02-guides/lazy-loading).
- Bibliotecas pesadas: `await import('fuse.js')` dentro do handler (idem).
- Posição do Suspense: abaixo do shell interativo (input/filtros fora, resultados dentro) (next:02-guides/client-side-data-fetching/tanstack-query; react.dev/reference/react/Suspense). `loading.js` envolve a page inteira; `<Suspense>` perto do dado dinâmico é recomendado (next:01-getting-started/06-fetching-data).
- `useSearchParams` em rota prerenderizada obriga Suspense acima do componente; sem ele o build falha (next:03-functions/use-search-params).

### Virtualização

- Ponteiro apenas: listas com milhares de itens exigem janelamento (ex. bibliotecas de virtualização). **Não coberto por react.dev nem Next nas fontes lidas** (Lacunas). O catálogo e a lista de aulas devem paginar antes de virtualizar (Síntese).

---

## 5. APIs do React 19 para usar

| API | Uso | Fonte |
|---|---|---|
| `use(promise)` | lê promise em render; suspende; erro vai ao Error Boundary; **promise criada no render de Client Component não é suportada** (use promise vinda de Server Component ou cache); pode ser condicional; não use em `try/catch` | react.dev/reference/react/use |
| `use(Context)` | como `useContext`, mas condicional; não em Server Components | react.dev/reference/react/use |
| Actions | funções async em transitions; pending, erro, otimismo automáticos | react.dev/blog/2024/12/05/react-19 |
| `<form action={fn}>` | também `formAction` em `<input>`/`<button>`; reset automático em sucesso | idem |
| `useActionState` | `[state, action, isPending]`; sem reset embutido (passe payload de reset, `key`, ou reset do form) | react.dev/reference/react/useActionState |
| `useFormStatus` (`react-dom`) | `pending` do `<form>` pai | react.dev/reference/react-dom/hooks/useFormStatus |
| `useOptimistic` | dentro de Action; forma reducer para listas | react.dev/reference/react/useOptimistic |
| `ref` como prop | `function MyInput({ref, ...props})`; `forwardRef` será depreciado; callback de ref pode devolver cleanup; não devolva outra coisa (use `{ instance = el }` com chaves) | react.dev/blog/2024/12/05/react-19, react.dev/reference/react/forwardRef |
| `<Context value>` | substitui `.Provider` | react.dev/blog/2024/12/05/react-19 |
| Metadata nativa | `<title>`, `<meta>`, `<link>` renderizados em componentes são içados ao `<head>` | react.dev/blog/2024/12/05/react-19 |
| `useEffectEvent`, `<Activity>` | 19.2 | react.dev/blog/2025/10/01/react-19-2 |
| `<ViewTransition>`, `addTransitionType`, Fragment refs, `browser()` | 19.3 | react.dev/blog/2026/09/09/react-19-3 |

Notas:

- **Metadata:** o Next diz que `metadata`/`generateMetadata` só funcionam em Server Components e geram as tags `<head>` (next:01-getting-started/14-metadata-and-og-images). As fontes lidas **não explicam** a interação entre `<title>` nativo do React e a Metadata API do Next. Síntese: em Next use a Metadata API para páginas/rotas (título, OG, canonical); não espalhe `<title>` em componentes, para ter uma só fonte de verdade.
- **`browser()`:** a página de referência da API usa exemplos com build canary `19.3.0-canary`, mas o blog do 19.3 a lista como API de `react-dom` e o Next (`02-guides/single-page-applications`) diz que "React 19.3 inclui a API `browser`". `use(browser())` num Client Component dentro de `<Suspense>` evita hydration mismatch com `localStorage`/fuso horário: no servidor deixa o fallback; no browser renderiza normal (react.dev/reference/react-dom/browser). Síntese: útil para persistência local do player (volume, posição), mas o fallback é o que crawlers veem; mantenha fora dele conteúdo indexável.
- **Passar promise de Server a Client:** valor resolvido deve ser serializável (react.dev/reference/react/use).
- **Estado de formulário e `useState` em transição:** setters de `useState` dentro de transition são adiados até o fim; `useOptimistic` e chamadas DOM diretas (`formRef.current.reset()`) aplicam no frame atual (next:02-guides/interactive-apps, Step 4).

---

## 6. Aplicação à plataforma de cursos (Síntese)

Tudo nesta seção é **Síntese:** recomendação deste documento, derivada das fontes acima, não afirmação das docs.

### Catálogo e filtros

- Síntese: a page `/courses` é Server Component que lê `searchParams` (`q`, `level`, `category`, `page`, `sort`), valida/normaliza e busca cursos. Filtros ficam na URL (nível 1); sem `useState` espelhando.
- Síntese: a ilha de cliente `CourseFilters` usa `useTransition` + `router.push`; chips com `useOptimistic` para resposta imediata e `isPending` para atenuar a lista (padrão do guia `interactive-apps`). O input de busca mantém `useState` síncrono local e só empurra para a URL após debounce (debounce serve para reduzir requests, react.dev/reference/react/useDeferredValue).
- Síntese: nuqs só quando houver cerca de 4+ parâmetros tipados com defaults; para 1-2 filtros, `URLSearchParams` à mão basta.
- Síntese: resultados em `<Suspense key={serializedFilters} fallback={...}>`? Cuidado: `key` no Suspense mostra o fallback em vez do conteúdo antigo (react.dev/reference/react/Suspense); para filtros prefira **não** usar `key` e deixar a transition manter o conteúdo antigo.
- Verificar: teste de integração da page com `searchParams` variados; teste do componente de filtros com `router.push` mockado conferindo a URL gerada.

### Player de aula e progresso ("watched")

- Síntese: a page da aula (Server) carrega aula + progresso inicial; o `LessonPlayer` é um Client Component, carregado com `next/dynamic` (`ssr: false` dentro de Client Component) se a lib de vídeo for pesada (next:02-guides/lazy-loading).
- Síntese: estado do player (tempo, volume, buffering) é local e imperativo (ref do `<video>`); não vai para Context nem store. `ref` como prop em wrappers (sem `forwardRef`).
- Síntese: "marcar como assistida" é Server Action chamada dentro de `startTransition` com `useOptimistic(watched)`; o checkmark muda na hora e reverte em falha (react.dev/reference/react/useOptimistic). Chamadas repetidas enfileiram (Server Actions são sequenciais, next:02-guides/server-actions), então não envie progresso a cada `timeupdate`; envie em marcos (ex. >=90% ou fim) ou com throttle.
- Síntese: se o progresso do módulo/curso (contadores) aparece em outros pontos da árvore, derive no render a partir de `lessons`+`watchedIds` do servidor; após a action, `revalidateTag`/`refresh()` para o servidor reenviar.
- Síntese: TanStack Query só se o progresso precisar ser compartilhado e atualizado em vários componentes cliente sem navegação (polling, múltiplas abas); caso contrário props + `useOptimistic` bastam.
- Verificar: teste que simula a action lenta e confere o estado otimista, e outro com a action rejeitando e conferindo reversão.

### UI por papel (role-based)

- Síntese: decida **no servidor** o que renderizar por papel (Server Component lê a sessão via DAL) e envie ao cliente só o necessário. As docs do Next distinguem verificação *otimista* (ocultar/mostrar UI, redirect) de *segura* (dados/mutações) e recomendam um Data Access Layer; mutações sempre reautorizam (next:02-guides/authentication, seção Authorization; next:01-getting-started/07-mutating-data).
- Síntese: se componentes cliente precisam do papel, passe `role` por props; se muitos, um `SessionProvider` baixo na árvore (só em layouts da área logada) com valor primitivo/pequeno. Não use store global para sessão.
- Síntese: botões "Editar curso" ocultos para não-instrutores são apenas UX; a Server Action valida o papel.

### Editor de curso do instrutor

- Síntese: formulário com `<form action>` + `useActionState` (erros de validação por campo vindos do servidor, valores devolvidos em `state`) + botão de submit em componente filho com `useFormStatus` (react.dev/reference/react/useActionState, next:02-guides/forms).
- Síntese: edição de estrutura (reordenar módulos/aulas, adicionar/remover) é o caso de `useReducer` (transições com regras: mover, inserir, remover, desfazer) e/ou `useOptimistic` com reducer sobre a lista do servidor (padrão do Step 5 de `interactive-apps`). Guarde estrutura normalizada (`moduleIds`, `lessonsById`) conforme react.dev/learn/choosing-the-state-structure.
- Síntese: trocar de curso/aula em edição: `<CourseForm key={courseId} />` para resetar (react.dev/learn/preserving-and-resetting-state).
- Síntese: rascunho local: `useState` simples; persistência em `localStorage` só via `use(browser())` ou effect com cleanup, nunca no render.
- Verificar: teste do reducer puro (inserir, mover, remover); teste do formulário com action que devolve erro de campo.

### MVVM: hook customizado como ViewModel de uma ilha cliente

- Síntese: cada ilha cliente (`'use client'`) tem uma **View** (componente de apresentação, só JSX, recebe um objeto) e um **ViewModel** (`useCourseEditorViewModel(initialCourse)`: custom hook que encapsula `useReducer`, `useOptimistic`, `useActionState`, `useTransition` e devolve estado derivado + comandos nomeados como `addLesson`, `moveModule`, `save`). O Model é o dado vindo do servidor + Server Actions. As docs endossam custom hooks para encapsular lógica e trocar a implementação sem mexer nos consumidores (react.dev/learn/scaling-up-with-reducer-and-context), reducers testáveis isolados (react.dev/learn/extracting-state-logic-into-a-reducer), e o Next lista custom hooks entre os motivos para Client Component (next:01-getting-started/05-server-and-client-components).
- Síntese: regras do ViewModel: sem JSX; só valores serializáveis/primitivos nos comandos; derivar (`canSave`, `progressPct`) em vez de guardar; props `initial*` só sementes (e `key` para resetar); retornar objeto novo a cada render é aceitável com o compilador, senão memoizar o retorno se a View for `memo`.
- Síntese: o hook é testável com `renderHook`; a View testada com um ViewModel falso. Não é MVVM de binding: React segue unidirecional; o hook só organiza.
- Anti-padrão: ViewModel global em Context/store para estado que é de uma ilha só.

---

## 7. Armadilhas (o que um LLM treinado em React 17/18 erra)

1. **`forwardRef`**: em 19, `ref` é prop de função; `forwardRef` será depreciado (react.dev/blog/2024/12/05/react-19, react.dev/reference/react/forwardRef). Ref callback não deve devolver valor implícito (TypeScript rejeita) (mesma fonte).
2. **`<Context.Provider>`**: use `<Context value>`; `.Provider` será depreciado (react.dev/blog/2024/12/05/react-19). **As docs do Next 16.4 ainda mostram `.Provider`** em `01-getting-started/05-server-and-client-components`: aqui a doc do React vence.
3. **`useFormState`**: renomeado para `useActionState` (importa de `react`); `useFormStatus` continua em `react-dom` (react.dev/blog/2024/12/05/react-19).
4. **Effect para buscar dados**: o Suspense não vê fetch em effect; preferir Server Components/`use()`; effect de fetch precisa de `ignore` (react.dev/reference/react/Suspense, react.dev/learn/you-might-not-need-an-effect).
5. **`useEffect` + `setState` para dado derivado/reset**: calcular no render ou usar `key`; o lint `set-state-in-effect` existe por isso (react.dev/reference/eslint-plugin-react-hooks/lints/set-state-in-effect).
6. **Memoização em tudo**: com compilador, código novo não precisa; remover memoização existente pode mudar o resultado; `useMemo` é só otimização (react.dev/blog/2025/10/07/react-compiler-1, react.dev/reference/react/useMemo). Memoizar também não protege de context: consumidor `memo` re-renderiza quando o context muda (react.dev/reference/react/memo).
7. **`searchParams` e `params` síncronos**: no Next 16 são **Promises** (`await searchParams`; em Client Component `use(searchParams)`) (next:03-file-conventions/page).
8. **`useSearchParams` sem Suspense**: build de produção falha em página estática; em dev funciona e engana (next:03-functions/use-search-params).
9. **Promise criada no render e passada a `use()` em Client Component**: ressuspende a cada render; crie no servidor ou use cache (react.dev/reference/react/use). `use()` não vai em `try/catch`.
10. **`useFormStatus` no mesmo componente do `<form>`**: nunca fica `pending` (react.dev/reference/react-dom/hooks/useFormStatus).
11. **`useOptimistic` fora de Action**: aviso e flash; setar durante o render lança erro (react.dev/reference/react/useOptimistic).
12. **Input de texto dentro de `startTransition`**: não funciona; separe estado síncrono (react.dev/reference/react/useTransition).
13. **`setState` após `await` em transition**: precisa de novo `startTransition` (react.dev/reference/react/useTransition).
14. **Server Action como fetch de leitura / paralela**: sequencial no cliente; não use como `queryFn` (next:02-guides/server-actions, tanstack.com/query/latest/docs/framework/react/guides/advanced-ssr).
15. **`useEffect` + listener manual para store/`navigator.onLine`**: `useSyncExternalStore` (react.dev/learn/you-might-not-need-an-effect).
16. **`getSnapshot` devolvendo objeto novo**: loop infinito (react.dev/reference/react/useSyncExternalStore).
17. **Store global Zustand no servidor / lido em RSC**: bugs e vazamento entre requests; store por request em provider (zustand.docs.pmnd.rs/learn/guides/nextjs, github.com/pmndrs/zustand).
18. **`QueryClient` global/estático no servidor**: um por request no servidor, singleton no browser; `staleTime` > 0 (next:02-guides/client-side-data-fetching/tanstack-query, advanced-ssr).
19. **`ssr: false` em Server Component**: erro; mover para Client Component (next:02-guides/lazy-loading).
20. **Declarar `lazy`/`dynamic`/componente dentro de outro componente**: reseta estado a cada render (react.dev/reference/react/lazy, react.dev/learn/preserving-and-resetting-state).
21. **`eslint-plugin-react-compiler`**: obsoleto; as regras vivem em `eslint-plugin-react-hooks` `recommended` (react.dev/blog/2025/10/07/react-compiler-1). Config legada: `recommended-legacy` (react.dev/blog/2025/10/01/react-19-2).
22. **Next 16 não liga o compilador sozinho**: `reactCompiler` é opt-in (next:02-guides/upgrading/version-16).
23. **Provider no topo envolvendo `<html>`**: o Next recomenda providers baixos (next:01-getting-started/05-server-and-client-components).
24. **Guardar o objeto selecionado em vez do id**: duplicação que fica velha (react.dev/learn/choosing-the-state-structure).

---

## Lacunas

1. **nuqs + Next 16:** não li `nuqs.dev/docs/adapters` (`NuqsAdapter` no layout) nem confirmei compatibilidade explícita com Next 16 / React 19.3; a página lida cita só Next `>=14.2.0` e React `^18.3 || ^19`.
2. **Metadata nativa do React vs Metadata API do Next:** as fontes não dizem como convivem (precedência, duplicação de `<title>`) quando ambos são usados.
3. **React Compiler e Context:** a doc de `useContext` não menciona o compilador; não há afirmação oficial de que o compilador torna `useMemo`/`useCallback` do `value` desnecessários (só inferência da doc de `memo`/introdução).
4. **React Compiler e `useDeferredValue`:** não ficou claro se o compilador substitui `memo` no componente lento para o benefício do deferred value.
5. **`eslint-plugin-react-hooks` e compilador não estão instalados no projeto-alvo** (`reading-list`); versões mínimas e comportamento do SWC do Next vs Babel não foram verificados na prática. A página do 1.0 diz que o suporte SWC ainda era experimental; a doc do Next descreve a otimização SWC sem ressalva.
6. **Estabilidade de `browser()`:** página de referência usa exemplos canary; o blog do 19.3 a apresenta como API disponível. Confirmar no changelog que está estável em 19.3.0.
7. **Virtualização de listas:** nenhuma fonte primária lida (react.dev/Next) cobre; sem recomendação de biblioteca.
8. **Persistência de progresso do vídeo:** as docs não prescrevem frequência/estratégia para gravar progresso com Server Actions sequenciais; a sugestão de marcos/throttle é Síntese.
9. **Cache Components (`cacheComponents`) + `searchParams`:** não li como a leitura de `searchParams` na page afeta prerender/cache do catálogo em Next 16 (só o comportamento de `useSearchParams`).
10. **Zustand:** README não cobre SSR/hidratação em profundidade; a página `zustand.docs.pmnd.rs/learn/guides/ssr-and-hydration` não foi lida. A URL `zustand.docs.pmnd.rs/guides/nextjs` retornou 404 (a correta foi `/learn/guides/nextjs`).
11. **Testes:** as fontes lidas não prescrevem ferramenta de teste para Server Components async nem para Server Actions; as formas de teste sugeridas aqui são práticas gerais, não citação.
12. **`useActionState` com `permalink` em Next:** não confirmado nas docs do Next como se comporta em páginas dinâmicas.
