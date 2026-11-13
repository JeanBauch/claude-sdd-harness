# SEO, Core Web Vitals e Lighthouse em Next.js 16: material-fonte para a skill `seo`

Pesquisa feita em 2026-11-13. Versão instalada: `next@16.4.6` (`f:\Projetos\reading-list\node_modules\next`). Fontes primárias apenas: docs embutidas do Next, Google Search Central, schema.org, web.dev, developer.chrome.com e docs do Lighthouse CI.

Convenções de citação:
- `(docs: <caminho>)` é relativo a `node_modules/next/dist/docs/`. Os arquivos são `.md`, não `.mdx`.
- `(google: <caminho>)` é relativo a `developers.google.com/search/`.
- `Síntese:` marca recomendação minha, não afirmação da fonte.

## Resumo para a skill

1. Exporte `metadata` ou `generateMetadata` somente de Server Components (`page.tsx`/`layout.tsx`); nunca use `next/head` no App Router.
2. Defina `metadataBase` no root layout e `alternates.canonical` em toda página pública indexável; o canonical deve ser absoluto, sem parâmetros de rastreio, e autorreferente.
3. Gere o catálogo com `generateStaticParams`, retorne `notFound()` para slugs inexistentes e nunca renderize "não encontrado" com status 200 sem `noindex`.
4. Use `app/sitemap.ts` (com `generateSitemaps` acima de 50.000 URLs) e `app/robots.ts`; não instale `next-sitemap`; liste só URLs canônicas e indexáveis.
5. Páginas de aluno, login e duplicatas (filtros, ordenação) recebem `robots: { index: false }`; nunca bloqueie com `robots.txt` uma página que precisa ser vista como `noindex`.
6. Injete JSON-LD com `<script type="application/ld+json">` nativo e `JSON.stringify(...).replace(/</g, '\\u003c')`; o JSON-LD deve espelhar conteúdo visível na página.
7. Em páginas de curso, marque `Course` com `name`, `description` e `provider` (Organization); no catálogo, `ItemList` com `position` e `url`; adicione `BreadcrumbList` com pelo menos 2 itens.
8. Imagem LCP: `next/image` com `width`/`height` (ou `fill` + `sizes`) e `preload` (ou `loading="eager"`/`fetchPriority="high"`); a prop `priority` está deprecada desde o Next 16.
9. Reduza JS no cliente: componentes de servidor por padrão, `'use client'` só nas folhas interativas, `next/font` para fontes e `next/script` com `lazyOnload`/`afterInteractive` para terceiros.
10. Verifique tudo: Playwright asserta title, canonical, description, robots e JSON-LD parseável; Lighthouse CI roda contra `next build && next start` com asserções (SEO, acessibilidade, LCP/CLS/TBT); Lighthouse (lab) não substitui CrUX (campo).

---

## 1. Metadata API no Next 16

### 1.1 Estática vs dinâmica

- `metadata` (objeto) e `generateMetadata` (função) são suportados **apenas em Server Components**; não se pode exportar os dois no mesmo segmento (docs: 01-app/03-api-reference/04-functions/generate-metadata.md).
- Use `metadata` quando o valor não depende de dados ou parâmetros (home, `/cursos`). Use `generateMetadata({ params, searchParams }, parent)` quando depende de `params`, de dados externos ou de metadata do pai. Em Next 16 `params` e `searchParams` são `Promise` (docs: 01-app/03-api-reference/03-file-conventions/page.md).
- `fetch` dentro de `generateMetadata` é memoizado automaticamente; para ORM/DB use `cache` do React para buscar o curso uma vez só (docs: 01-app/01-getting-started/14-metadata-and-og-images.md, seção "Memoizing data requests").
- `redirect()` e `notFound()` podem ser chamados dentro de `generateMetadata` (docs: generate-metadata.md).
- Metadata de arquivo (`opengraph-image`, `icon`, etc.) tem prioridade sobre o objeto/função (docs: generate-metadata.md).

Padrão para a página de curso:

```tsx
// app/cursos/[slug]/page.tsx
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getCourse } from '@/lib/courses' // envolvida em cache() do React

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const course = await getCourse(slug)
  if (!course) notFound()
  return {
    title: course.title,
    description: course.summary,
    alternates: { canonical: `/cursos/${slug}` },
    openGraph: { type: 'website', title: course.title, description: course.summary },
  }
}
```

### 1.2 Title template, `metadataBase`, canonical

- `title.template` (ex.: `'%s | Acme'`) vale para segmentos **filhos**, não para o segmento onde está definido; `title.default` é obrigatório quando há `template`; `title.absolute` ignora o template do pai; `template` em `page.tsx` não tem efeito (docs: generate-metadata.md, seção `template`).
- `metadataBase: new URL('https://acme.com')` deve ficar no root layout; campos de URL relativos sem `metadataBase` causam **erro de build**; URL absoluta ignora `metadataBase` (docs: generate-metadata.md, seção `metadataBase`).
- `alternates.canonical` gera `<link rel="canonical">`; `alternates.languages` gera `hreflang` (docs: generate-metadata.md, seção `alternates`).
- Com `'use cache'` em `generateMetadata`, o retorno precisa ser serializável: `URL` não é suportada, devolva string (docs: generate-metadata.md, nota em `metadataBase`).
- O merge entre segmentos é **raso**: um `openGraph` definido numa página substitui por inteiro o do layout, não faz merge campo a campo (docs: generate-metadata.md, seção "Merging").

Google: o canonical deve ser absoluto; use HTML **ou** header, não ambos; aponte sempre para um canonical autorreferente; redirecionamento é sinal forte, `rel=canonical` é sinal forte, sitemap é sinal fraco; em sites JS o canonical deve estar no HTML inicial e não ser alterado por JS; não use `noindex` nem robots.txt para escolher canonical (google: crawling-indexing/consolidate-duplicate-urls).

### 1.3 `openGraph`, `twitter`, `robots`

- `openGraph` e `twitter` têm campos tipados em `Metadata`; para imagens prefira o arquivo `opengraph-image` (estático `.jpg/.png` ou `opengraph-image.tsx` com `ImageResponse` de `next/og`, `size`, `contentType`) em vez de sincronizar o objeto com arquivos (docs: 01-app/01-getting-started/14-metadata-and-og-images.md; generate-metadata.md). O arquivo mais profundo na árvore vence.
- `robots` por página: `robots: { index: false, follow: false }` gera `<meta name="robots" content="noindex, nofollow">`; também há `googleBot: { 'max-image-preview': 'large', 'max-snippet': -1, ... }` (docs: generate-metadata.md, seção `robots`).
- Google reconhece `noindex`, `nofollow`, `none`, `nosnippet`, `max-snippet`, `max-image-preview`, `max-video-preview`, `unavailable_after`, `indexifembedded`; ignora `noarchive` e `nocache` (google: crawling-indexing/robots-meta-tag). Os campos `nocache` do tipo `Robots` do Next, portanto, não têm efeito no Google.
- `noindex` só funciona se a página for rastreável: página bloqueada por `robots.txt` nunca é buscada e a regra é ignorada (google: crawling-indexing/robots-meta-tag).

### 1.4 File conventions

| Arquivo | O que faz | Fonte |
|---|---|---|
| `app/sitemap.ts` | `export default function sitemap(): MetadataRoute.Sitemap`; campos `url`, `lastModified`, `changeFrequency`, `priority`, `alternates.languages`, `images`, `videos` | docs: 01-app/03-api-reference/03-file-conventions/01-metadata/sitemap.md |
| `generateSitemaps()` | devolve `[{ id }]`; URLs em `/.../sitemap/[id].xml`; desde 16.0.0 o `id` chega como `Promise<string>` | docs: 01-app/03-api-reference/04-functions/generate-sitemaps.md |
| `app/robots.ts` | `MetadataRoute.Robots` com `rules` (`userAgent`, `allow`, `disallow`, `crawlDelay`, `other` desde 16.3.0), `sitemap`, `host` | docs: .../01-metadata/robots.md |
| `opengraph-image`, `twitter-image` | estático ou gerado com `ImageResponse`; `params` é `Promise` desde 16 | docs: 01-getting-started/14-metadata-and-og-images.md; 02-guides/upgrading/version-16.md |
| `favicon.ico`, `icon`, `apple-icon` | ícones por convenção | docs: .../01-metadata/app-icons.md |

Notas:
- `sitemap.js` e `robots.js` são Route Handlers especiais, **cacheados por padrão** a menos que usem API de tempo de requisição ou config dinâmica (docs: sitemap.md, robots.md). Para um catálogo que muda, o sitemap precisa de revalidação; o doc não mostra um exemplo de revalidar sitemap (ver Lacunas).
- Limite do Google: 50 MB (descompactado) ou 50.000 URLs por sitemap; `lastmod` só é usado se for consistentemente verdadeiro; `priority` e `changefreq` são **ignorados** pelo Google; URLs absolutas e canônicas apenas; enviar sitemap é só uma dica (google: crawling-indexing/sitemaps/build-sitemap). O exemplo do Next com `priority`/`changeFrequency` é válido para o tipo, mas Síntese: omitir esses campos, pois não têm efeito no Google.
- `generateSitemaps` divide em vários arquivos; as docs do Next não descrevem a geração automática de um sitemap index (ver Lacunas). Síntese: liste cada `/.../sitemap/[id].xml` em `robots.ts` (`sitemap` aceita `string | string[]`).
- O exemplo de `generateSitemaps` nas docs usa `id * 50000` com `id` string; em 16 converta com `Number(await props.id)` (docs: sitemap.md, tabela de versão: `v16.0.0`).

### 1.5 Streaming de metadata e bots

- Em páginas **dinâmicas**, o Next faz streaming da metadata: as tags são anexadas ao `<body>` quando `generateMetadata` resolve. O Next afirma ter verificado que bots que executam JS, como Googlebot, interpretam isso corretamente (docs: generate-metadata.md, "Streaming metadata").
- Para bots "HTML-limited" (ex.: `facebookexternalhit`, `Twitterbot`, `Slackbot`, `Bingbot`), o Next **espera** `generateMetadata` e coloca as tags no `<head>`. A detecção é pelo User-Agent; configurável com `htmlLimitedBots` no `next.config` (docs: 01-getting-started/14-metadata-and-og-images.md; 01-app/03-api-reference/05-config/01-next-config-js/htmlLimitedBots.md).
- Desabilitar totalmente: `htmlLimitedBots: /.*/`; custo: respostas mais lentas (docs: generate-metadata.md).
- Páginas pré-renderizadas (estáticas) resolvem a metadata no build e não usam streaming (docs: 14-metadata-and-og-images.md).
- Síntese: para o catálogo, prefira páginas estáticas/ISR; assim title, canonical e JSON-LD estão no HTML inicial sem depender de renderização JS do Google.
- Com `cacheComponents: true`, se a metadata usa dados de runtime (`cookies()`, `headers()`, `params`, `searchParams`) ou fetch sem cache numa página que seria totalmente pré-renderizável, o Next lança erro pedindo `'use cache'` na `generateMetadata` ou um marcador dinâmico (docs: generate-metadata.md, "With Cache Components"). `cacheComponents` é opt-in em `next.config`, com `partialPrefetching` (docs: 05-config/01-next-config-js/cacheComponents.md). `dynamicParams` não está disponível com Cache Components (docs: 03-file-conventions/02-route-segment-config/dynamicParams.md).

### 1.6 `noindex` para autenticadas ou duplicadas

- Páginas de login/área do aluno/aulas: `robots: { index: false, follow: false }` no layout do segmento. Síntese: coloque a metadata no `layout.tsx` do grupo de rotas `(app)`; como o merge é raso, um `robots` definido numa página filha substitui o do layout.
- Google: para páginas protegidas devolva status 401 (ou redirecione ao login); 401 e 403 são tratados como 404 pela indexação (google: crawling-indexing/http-network-errors). Em SPAs, indica 401 para páginas com login (google: crawling-indexing/javascript/javascript-seo-basics).
- Não bloqueie `/aluno` só no `robots.txt` se quiser `noindex` efetivo: URLs bloqueadas podem ser indexadas sem conteúdo (google: consolidate-duplicate-urls; robots-meta-tag). Síntese: para áreas privadas, status de autenticação + `noindex`; `Disallow` em `robots.ts` é aceitável apenas para economizar rastreio de áreas que nunca devem aparecer.
- Variações de filtro/ordenação (`?ordem=preco`): `noindex` ou limitar o rastreio por robots.txt (google: specialty/ecommerce/pagination-and-incremental-page-loading).

**Verificação:** Playwright lê `await page.locator('link[rel=canonical]').getAttribute('href')`, `head > title`, `meta[name=description]`, `meta[name=robots]`; Lighthouse audits `canonical`, `meta-description`, `document-title`, `is-crawlable`, `robots-txt` (ver seção 5).

---

## 2. Renderização para SEO

### 2.1 O que o Google precisa

- Google processa em três fases: rastreio, renderização (Chromium headless numa fila) e indexação; só páginas com status 200 vão para a fila de renderização; respostas não-200 podem não ser renderizadas (google: crawling-indexing/javascript/javascript-seo-basics).
- SSR ou pré-renderização continuam recomendados; JS pode definir title, description e canonical, mas HTML é preferível; um canonical por JS deve coincidir com o do HTML; o Google pode pular a renderização ao ver `noindex`, então remover `noindex` por JS pode não funcionar (google: javascript-seo-basics).
- Só `<a href>` é descoberto como link; roteamento por History API, não por fragmentos (`#/rota`) (google: javascript-seo-basics). Síntese: no catálogo use `next/link` (renderiza `<a href>`); evite botões com `router.push` para navegação indexável.
- Status: 200 passa para indexação; 301/308 sinal forte; 302/307 sinal fraco; 404/410 removem do índice; 5xx reduz o rastreio; página 2xx que mostra erro/vazia é **soft 404** (google: crawling-indexing/http-network-errors).

### 2.2 `notFound`, `redirect`, soft 404 no Next

- `notFound()` lança `NEXT_HTTP_ERROR_FALLBACK;404` e o Next injeta `<meta name="robots" content="noindex">`. Antes do streaming começar o status é 404; **depois** que o streaming começou, o status permanece 200 e a UI de not-found é renderizada, ainda com `noindex` (docs: 01-app/03-api-reference/04-functions/not-found.md; 03-file-conventions/not-found.md; 03-file-conventions/loading.md, "Status codes"). As docs reconhecem que alguns crawlers podem rotular essas respostas como soft 404 e dizem que o `noindex` as mantém fora dos resultados.
- Síntese: para obter 404 real nas páginas de curso, resolva a existência do curso **antes** de qualquer `loading.tsx`/Suspense que inicie o streaming, ou seja, chame `notFound()` no topo do `page.tsx` e na `generateMetadata` (como no snippet 1.1) e evite `loading.tsx` no segmento `[slug]` do catálogo. Verifique com `curl -I`/Playwright `response.status()`.
- `global-not-found.js` serve rotas que não casam com nada e também recebe `noindex` automático; exporta `metadata` próprio (docs: 03-file-conventions/not-found.md).
- `redirect()` usa 307 (temporário) e `permanentRedirect()` usa 308; em contexto de streaming insere meta tag de redirecionamento no cliente (docs: 04-functions/redirect.md; permanentRedirect.md). Para URLs de curso renomeadas, use `permanentRedirect` (ou `redirects` no `next.config` com `permanent: true`); 308 equivale a 301 para o Google (google: http-network-errors).
- Google sobre filtros: devolver 404 para combinações vazias/inexistentes/duplicadas, não redirecionar para uma página genérica de not-found (google: crawling-indexing/crawling-managing-faceted-navigation).

### 2.3 Geração estática do catálogo

- `generateStaticParams` pré-renderiza rotas dinâmicas no build; com `dynamicParams = true` (padrão), slugs fora da lista são gerados sob demanda; `false` devolve 404 (docs: 04-functions/generate-static-params.md; 02-route-segment-config/dynamicParams.md). Para ISR em runtime, devolver `[]` ou usar `dynamic = 'force-static'` (docs: generate-static-params.md).
- Páginas públicas compartilhadas entre usuários podem ser pré-renderizadas; um componente com dados externos fora de cache vira dinâmico, e a doc recomenda isolar a parte por usuário (banner, "continuar curso") num componente com Suspense sem tornar a página inteira dinâmica (docs: 01-app/02-guides/public-static-pages.md; keeping-pages-static.md).
- Síntese: a página de curso deve ler só dados públicos no render principal; "matriculado?" e progresso entram num componente cliente/Suspense separado.
- Ler `searchParams` (ou `cookies()`/`headers()`) torna a página dinâmica (docs: page.md; glossary de request-time APIs). Síntese: a listagem `/cursos` com `?pagina=2` e filtros exige render dinâmico ou `use cache` por combinação; ISR/estático é mais simples se a paginação for por segmento de path (`/cursos/pagina/2`).

### 2.4 Canonical com filtros e paginação

Google:
- Cada página da sequência tem URL própria (`?page=n`), nunca fragmento; canonical autorreferente em cada página, não tudo apontando para a página 1; `rel=next/prev` não é mais usado; links `<a href>` entre páginas; infinite scroll/"carregar mais" precisam de URLs rastreáveis (google: specialty/ecommerce/pagination-and-incremental-page-loading).
- Filtros/ordenação que só reordenam: `noindex` ou restringir rastreio; use `&` e `chave=valor` nos parâmetros (google: pagination...; crawling-managing-faceted-navigation). Para facetas, `robots.txt` Disallow é mais eficaz a longo prazo que `rel=canonical` ou `nofollow`, ao custo de essas URLs nunca serem rastreadas (google: crawling-managing-faceted-navigation).
- Síntese: default para a plataforma: `/cursos` (canonical = ele mesmo, sem query); `/cursos?pagina=N` (canonical autorreferente, indexável); `?categoria=`, `?ordem=`, `?q=` (canonical para a URL sem parâmetro e `robots: { index: false }`; em Google duas dicas conflitantes, canonical+noindex, é desencorajado, então escolha uma: `noindex` para ordenação/busca interna; canonical para tracking como `utm_*`). Categorias com valor de busca real viram path (`/cursos/categoria/js`) e entram no sitemap.
- No `generateMetadata`, ao ler `searchParams`, derive o canonical apenas de parâmetros permitidos (lista fechada), nunca ecoe a query inteira.

### 2.5 hreflang (só ponteiro)

- Next: `alternates.languages` em metadata, ou `alternates.languages` por entrada de `sitemap.ts` (docs: generate-metadata.md; sitemap.md "Generate a localized Sitemap"). Guia geral de i18n: docs: 01-app/02-guides/internationalization.md.
- Google: links recíprocos, auto-referência, `x-default`, URLs absolutas; códigos ISO 639-1 com região ISO 3166-1 opcional (google: specialty/international/localized-versions).
- Fora de escopo para a primeira versão monolíngue.

---

## 3. Dados estruturados (JSON-LD)

### 3.1 Como injetar no Next

- A recomendação das docs é renderizar `<script type="application/ld+json">` num `layout.js` ou `page.js`, com `JSON.stringify` e substituição de `<` por `\u003c` para evitar XSS; sanitização extra ou `serialize-javascript` são alternativas; `schema-dts` (comunidade) pode tipar o objeto; use `<script>` nativo, não `next/script`, porque JSON-LD não é código executável (docs: 01-app/02-guides/json-ld.md).
- Google: JSON-LD é o formato recomendado; microdata e RDFa são equivalentes se válidos; só marque conteúdo visível ao usuário; a página não pode estar bloqueada por robots/noindex/login; faltando propriedade obrigatória o item não é elegível; abuso pode gerar ação manual (google: appearance/structured-data/intro-structured-data; sd-policies).

```tsx
// components/json-ld.tsx (Server Component)
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, '\\u003c'),
      }}
    />
  )
}
```

Anti-padrões: concatenar string de JSON à mão; passar `description` vinda do usuário sem o `replace`; usar `next/script`; gerar JSON-LD por `useEffect` (só existe depois da hidratação).

### 3.2 Tipos relevantes e propriedades

**Course (lista de cursos, "Course list")** (google: appearance/structured-data/course):
- Obrigatórias: `name` ("o título do curso") e `description` (limite de exibição de 60 caracteres). Recomendada: `provider` (Organization). A seção técnica diz que cada curso precisa de `name` e `provider` válidos.
- Para o carrossel: ao menos 3 cursos, em páginas de detalhe separadas ou numa página única; `ItemList` numa página-resumo, com `itemListElement` de `ListItem` com `position` (inteiro) e `url` (URL canônica, única por item).
- Nomes não podem ter frases promocionais, preços, descontos ou ofertas.
- Use `Course` só para conteúdo educacional com "série ou unidade de currículo com palestras, aulas ou módulos", resultado educacional explícito e "liderado por instrutor(es) com uma turma de alunos"; a doc exclui eventos públicos gerais e vídeos curtos isolados. Síntese: cursos 100% gravados e self-paced podem ficar na fronteira desse critério; a doc não define "roster of students"; ver Lacunas.
- Disponibilidade: inglês, todas as regiões onde há Google Search; a página deve estar acessível ao Google, sem login, robots.txt ou noindex.
- **Aviso importante (Armadilha):** o rich result **Course info** (com `offers`, `hasCourseInstance`, etc.) foi **descontinuado**: a documentação foi removida em 9 de setembro de 2025 e o tipo saiu do Rich Results Test e dos relatórios do Search Console (google: search/blog/2025/06/simplifying-search-results; google: search/docs/appearance/structured-data/... changelog "Latest documentation updates", entradas de 12/06/2025 e 09/09/2025). O mesmo anúncio diz que o uso desses tipos fora do Google Search não é afetado e que isso não altera o ranking. O **Course list** continua documentado (sem aviso de descontinuação na página) em google: appearance/structured-data/course. Síntese: não gaste ticket em `CourseInstance`/`offers` para ganhar rich result.
- schema.org: `Course` é `Thing > CreativeWork > Course` e também `LearningResource`; propriedades próprias: `courseCode`, `coursePrerequisites`, `hasCourseInstance`, `educationalCredentialAwarded`, `numberOfCredits`, `availableLanguage`, `syllabusSections`, etc.; `provider`, `offers`, `timeRequired`, `inLanguage` vêm de `CreativeWork` e `teaches` de `LearningResource` (schema.org/Course). `CourseInstance` é `Event` com `courseMode`, `courseSchedule`, `courseWorkload`, `instructor` (schema.org/CourseInstance).

**BreadcrumbList** (google: appearance/structured-data/breadcrumb):
- `itemListElement` obrigatório, com pelo menos 2 `ListItem`; cada `ListItem` exige `item` (URL; pode ser omitido no último), `name` e `position` (começa em 1). Sem propriedades recomendadas.
- Siga um caminho típico do usuário, não necessariamente a estrutura da URL.

**Organization** (google: appearance/structured-data/organization):
- Nenhuma propriedade obrigatória; recomendadas incluem `name`, `url`, `logo`, `sameAs`, `description`, `contactPoint`, `legalName`.
- Coloque na home ou numa página "sobre"; não é necessário em todas as páginas.
- Síntese: o `provider` do `Course` pode ser um objeto Organization inline com `name` e `sameAs`, como no exemplo do Google.

**VideoObject** (só se prévias de aula forem públicas) (google: appearance/structured-data/video):
- Obrigatórias: `name`, `thumbnailUrl`, `uploadDate` (ISO 8601 com fuso).
- Recomendadas: `contentUrl` (preferida) ou `embedUrl`, `description`, `duration`, `creator`/`author`, `interactionStatistic`, `expires`, `hasPart` (Clip), entre outras.
- A página tem de ser acessível ao Google (sem login) e o usuário deve poder assistir ao vídeo nela. Síntese: aulas atrás de login **não** recebem `VideoObject`; só a prévia pública.
- O `sitemap.ts` do Next suporta `videos` com `title`, `thumbnail_loc`, `description` (docs: sitemap.md "Video Sitemaps").

**Instrutor:** o Google não tem rich result para `Person` de instrutor. Síntese: use `Person` (schema.org) como `author`/`instructor` apenas se for útil para clareza, sem esperar rich result; na página do instrutor, `ProfilePage`/`Person` é opcional e não coberto por esta pesquisa (ver Lacunas).

### 3.3 Verificação

- Rich Results Test (search.google.com/test/rich-results) e Schema Markup Validator (validator.schema.org) (docs: json-ld.md; google: intro-structured-data). Após o deploy: relatórios de rich results, URL Inspection (google: intro-structured-data).
- Lighthouse: a auditoria "Structured data is valid" é **manual** e tem peso 0 (developer.chrome.com/docs/lighthouse/seo; default-config.js do repo GoogleChrome/lighthouse: `structured-data` com peso 0). Portanto, validação de JSON-LD em CI precisa ser teste próprio (seção 6).
- Rich Results Test aceita URL pública ou código; ele não alcança `localhost`. Síntese: em CI use Playwright para validar estrutura e deixe o Rich Results Test como passo manual em staging público.

---

## 4. Core Web Vitals no Next

### 4.1 Métricas e limiares

- LCP bom ≤ 2,5 s; INP bom ≤ 200 ms (pobre > 500 ms); CLS bom ≤ 0,1; avaliação no percentil 75 das visitas, separado por mobile e desktop; passar exige as três (web.dev/articles/vitals; web.dev/articles/inp).
- Campo: CrUX, PageSpeed Insights, Search Console, DevTools (campo). Lab: Lighthouse, DevTools. Lighthouse não mede INP (não há interação); o proxy de laboratório é o TBT, que "não substitui" o INP (web.dev/articles/vitals; web.dev/articles/inp; web.dev/articles/lab-and-field-data-differences).
- Lab vs campo: lab é um único dispositivo/rede/local com cache frio, bom para depurar; campo é distribuição de usuários reais, agregada em 28 dias no CrUX; CLS no lab captura só o que ocorre acima da dobra no carregamento; LCP varia por tamanho de tela, login, A/B (web.dev/articles/lab-and-field-data-differences). Recomendação oficial: priorizar campo para decidir, usar lab para depurar e validar mudanças, e coletar RUM próprio.

### 4.2 `next/image`

- `width`/`height` definem proporção intrínseca para reservar espaço e evitar CLS; com `style` de largura customizada defina `height: 'auto'` (docs: 01-app/03-api-reference/02-components/image.md).
- `fill` exige contêiner posicionado; sem `sizes` o Next gera `srcset` só com `deviceSizes`, como se a imagem ocupasse a viewport inteira. Sem `sizes` o navegador assume `100vw` e pode baixar imagem grande demais. Use `sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"` conforme o layout (docs: image.md).
- **`priority` está deprecada no Next 16 em favor de `preload`**. `preload={true}` insere `<link>` no `<head>`; use para a imagem LCP acima da dobra; **não** use quando várias imagens podem ser o LCP conforme o viewport, nem junto com `loading` ou `fetchPriority`. As docs dizem que "na maioria dos casos" se deve usar `loading="eager"` ou `fetchPriority="high"` em vez de `preload` (docs: image.md, seções `preload` e `priority`).
- `placeholder="blur"` exige `blurDataURL`, que é automático em importações estáticas de jpg/png/webp/avif; para imagens remotas/dinâmicas (capas de curso, avatar de instrutor do banco) é preciso fornecer o `blurDataURL` (docs: image.md).
- `alt` serve a leitores de tela e buscadores (docs: image.md); Lighthouse audita `image-alt`.
- Mudanças de config no Next 16 que quebram quem vem do 15: `images.qualities` agora exige lista (padrão `[75]`; `quality` fora da lista é arredondado para o mais próximo e `q` não suportado em `/_next/image` devolve 400); `minimumCacheTTL` padrão passou de 60 s para 4 h; `16` saiu de `imageSizes`; `localPatterns.search` é necessário para imagens locais com query string; `remotePatterns` continua obrigatório para hosts externos; `next/legacy/image` deprecado (docs: 02-guides/upgrading/version-16.md; image.md, seção `qualities`).
- Síntese: uma capa de curso acima da dobra na página de detalhe recebe `preload`/`fetchPriority="high"`; em listagens (cards) nenhuma recebe `preload`; só as primeiras linhas visíveis podem usar `loading="eager"`.

### 4.3 `next/font`

- `next/font/google` e `next/font/local` fazem self-hosting dos arquivos junto aos assets estáticos, sem requisições externas, e "sem layout shift"; aplique no root layout para valer em toda a app (docs: 01-app/01-getting-started/13-fonts.md; 02-guides/production-checklist.md).
- Anti-padrão: `<link href="https://fonts.googleapis.com/...">` manual ou `@import` de CSS externo (perde self-hosting e causa CLS/LCP pior).

### 4.4 `next/script`

- Estratégias: `beforeInteractive` (injetado no HTML inicial, só no root layout, para scripts críticos), `afterInteractive` (padrão, depois de alguma hidratação), `lazyOnload` (ocioso, depois que tudo carregou), `worker` (experimental) (docs: 02-components/script.md; 02-guides/scripts.md).
- Síntese: analytics e chat/widgets: `lazyOnload` ou `afterInteractive`; nunca `beforeInteractive` para terceiros. JSON-LD não passa por `next/script` (docs: json-ld.md).

### 4.5 CLS

- Reservar espaço: `width`/`height` em imagens, `next/font`, dimensões fixas em embeds/vídeos, skeletons com a mesma altura do conteúdo final, banners dinâmicos inseridos com espaço reservado (docs: production-checklist.md; image.md; web.dev/articles/lab-and-field-data-differences, que lista conteúdo lazy-loaded sem dimensões e personalização como causas de CLS em campo).
- Síntese: o bloco "personalizado" (progresso, botão "continuar") carregado por Suspense deve ter altura reservada.

### 4.6 INP e custo de hidratação

- Server Components não adicionam JS ao bundle do cliente; posicione `'use client'` só nos componentes folha que precisam de interatividade para não inflar o bundle (docs: production-checklist.md; 01-getting-started/05-server-and-client-components.md, "reducing JS bundle size"; 02-guides/lazy-loading.md para `next/dynamic`).
- INP mede a latência de cliques, toques e teclado (web.dev/articles/inp). Síntese: evite hidratar listas grandes (módulos/aulas do outline) só para um acordeão; renderize o outline como HTML nativo (`<details>`) ou isole só o toggle.
- Analisar bundles com `@next/bundle-analyzer` (docs: production-checklist.md).

### 4.7 Medir em campo: `useReportWebVitals`

- `import { useReportWebVitals } from 'next/web-vitals'` em um Client Component isolado (`'use client'`), montado no root layout; o callback deve ter referência estável para não duplicar dados. O objeto `metric` traz `id`, `name` (TTFB, FCP, LCP, CLS, INP), `value`, `delta`, `rating` (`good`/`needs-improvement`/`poor`), `navigationType` e outros (docs: 01-app/03-api-reference/04-functions/use-report-web-vitals.md).
- Síntese: envie as métricas para um endpoint próprio ou analytics; sem tráfego real o CrUX não terá dados do site; um lançamento novo só terá campo depois de acumular volume (Lacunas).
- Páginas de aula e área do aluno atrás de login não entram em CrUX por URL pública do mesmo jeito; Síntese: medir RUM por rota com `useReportWebVitals`.

---

## 5. Lighthouse em CI

### 5.1 O que o Lighthouse é

- Categorias: performance, accessibility, best practices e SEO (a página de visão geral da Chrome cita performance, acessibilidade e SEO e "mais" (developer.chrome.com/docs/lighthouse/overview); a lista de audits de best practices está em `core/config/default-config.js` do repositório GoogleChrome/lighthouse, ex.: `is-on-https`, `errors-in-console`, `image-aspect-ratio`, `csp-xss`).
- Pontuação de performance (Lighthouse 10): FCP 10%, Speed Index 10%, LCP 25%, TBT 30%, CLS 25%; nota por curva log-normal calibrada no HTTP Archive; faixas 0–49 vermelho, 50–89 laranja, 90–100 verde; variabilidade vem de A/B, anúncios, rede, extensões, antivírus, então trate como distribuição (developer.chrome.com/docs/lighthouse/performance/performance-scoring).
- INP não é parte da nota de performance do Lighthouse (pesos acima); TBT é o proxy.
- Auditorias de SEO no config oficial: `is-crawlable` (peso alto, ≈4), `document-title`, `meta-description`, `http-status-code`, `link-text`, `crawlable-anchors`, `robots-txt`, `image-alt`, `hreflang`, `canonical` (peso 1 cada) e `structured-data` (peso 0, manual) (github.com/GoogleChrome/lighthouse, `core/config/default-config.js`). A doc de SEO da Chrome só descreve `meta-description`, que checa presença e não qualidade, e a auditoria manual de dados estruturados.
- O Lighthouse vê só o que está no HTML da URL testada; DevTools consegue auditar páginas autenticadas, a extensão e o CI público não (developer.chrome.com/docs/lighthouse/overview). A doc do Next lembra que é um teste simulado e deve ser combinado com dados de campo (docs: production-checklist.md).

### 5.2 Lighthouse CI

Instalação e fluxo (github.com/GoogleChrome/lighthouse-ci, `docs/getting-started.md`):
- `npm install -g @lhci/cli@0.16.x`; no CI: instalar dependências, `npm run build`, depois `lhci autorun` (roda 3 vezes por URL por padrão e envia o resultado).
- Para um app com servidor próprio: `collect.startServerCommand` + `collect.url`; `startServerReadyPattern` (padrão `listen|ready`) e `startServerReadyTimeout` (padrão 10000 ms).
- `staticDistDir` serve para sites estáticos sem servidor; não é nosso caso a menos que se use `output: 'export'` (docs: 01-app/02-guides/static-exports.md).

Configuração, asserções e agregação (github.com/GoogleChrome/lighthouse-ci, `docs/configuration.md`):
- Arquivo `lighthouserc.js|json|yml` com chave raiz `ci`, subdividida em `collect`, `assert`, `upload`.
- Níveis: `off`, `warn`, `error` (só `error` falha o job). Opções: `minScore` (scores), `maxNumericValue` (ms ou bytes), `maxLength`; `aggregationMethod`: `median`, `optimistic`, `pessimistic`, `median-run`; padrão `optimistic` com `minScore: 1`.
- Chaves de asserção: id de audit (`largest-contentful-paint`) ou `categories:<id>` (`categories:seo`).
- `assertMatrix` aplica asserções por `matchingUrlPattern` (regex); `budgetsFile` aponta um `budget.json`, mas não pode ser combinado com outras opções de `assert`.
- Presets: `lighthouse:recommended` (exige que audits não-performance sejam perfeitos, avisa em métricas abaixo de 90), `lighthouse:no-pwa`, `lighthouse:all` (tudo perfeito, irreal).
- `upload.target`: `temporary-public-storage` (relatórios públicos por poucos dias; **não use** com conteúdo sensível), `filesystem` (`outputDir`), `lhci` (servidor próprio).

### 5.3 Exemplo recomendado (Síntese:)

Síntese: o Lighthouse CI deve rodar contra um build de produção (`next build` + `next start`) com dados semelhantes aos reais; `next dev` distorce LCP/TBT.

```js
// lighthouserc.cjs
module.exports = {
  ci: {
    collect: {
      startServerCommand: 'npm run start', // next start (após next build)
      startServerReadyPattern: 'Ready|started server|Local',
      startServerReadyTimeout: 30000,
      url: [
        'http://localhost:3000/',
        'http://localhost:3000/cursos',
        'http://localhost:3000/cursos/<slug-de-seed>',
        'http://localhost:3000/instrutores/<slug-de-seed>',
      ],
      numberOfRuns: 3,
    },
    assert: {
      assertions: {
        'categories:seo': ['error', { minScore: 1, aggregationMethod: 'median-run' }],
        'categories:accessibility': ['error', { minScore: 0.95 }],
        'categories:best-practices': ['warn', { minScore: 0.9 }],
        'categories:performance': ['warn', { minScore: 0.85 }],
        'largest-contentful-paint': ['error', { maxNumericValue: 2500, aggregationMethod: 'median' }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1, aggregationMethod: 'median' }],
        'total-blocking-time': ['warn', { maxNumericValue: 300, aggregationMethod: 'median' }],
        'canonical': 'error',
        'meta-description': 'error',
        'is-crawlable': 'error',
        'document-title': 'error',
        'http-status-code': 'error',
      },
    },
    upload: { target: 'filesystem', outputDir: '.lighthouseci' },
  },
}
```

Sobre os limiares:
- Síntese: 1,0 em SEO é viável porque são auditorias determinísticas (HTML), sem ruído de rede; 0,95 em acessibilidade; performance como `warn` ≥ 0,85 porque a nota varia entre execuções (developer.chrome.com/docs/lighthouse/performance/performance-scoring); transforme em `error` só depois de uma semana de baseline estável.
- Os limiares de LCP/CLS espelham os "bons" do Core Web Vitals (2,5 s, 0,1), mas em lab simulado; o TBT de 300 ms é um valor inicial meu, não vem de documento do Google (Lacunas).
- `lighthouse:recommended` falharia por tudo que não for perfeito; Síntese: prefira lista explícita de asserções.
- CI: `npm ci && npm run build && npx @lhci/cli@0.16.x autorun`, com Chrome disponível no runner (a doc de overview diz que Chrome precisa estar instalado) (developer.chrome.com/docs/lighthouse/overview).
- Auditar só URLs públicas; lições e área do aluno exigem login, que o `collect` padrão não faz (Lacunas sobre script de autenticação).

---

## 6. Checklist e verificações automatizadas (Síntese:)

Tudo desta seção é **Síntese:** (proposta minha, montada a partir das seções 1 a 5).

### 6.1 Checklist por tipo de página pública

**Qualquer página pública**
- [ ] `<title>` único, gerado via `title.template`; `meta description` presente (`description`).
- [ ] `alternates.canonical` absoluto (via `metadataBase`), autorreferente, sem `utm_*`/filtros.
- [ ] Status HTTP correto: 200 para existente, 404 real para inexistente (e `noindex`), 308 para URL renomeada.
- [ ] Links internos como `<a href>` (`next/link`); sem navegação indexável só por botão.
- [ ] Presente em `sitemap.ts` somente se canônica e indexável; ausente se `noindex`.
- [ ] Imagens com `alt`, `width`/`height` ou `fill`+`sizes`; LCP com `preload` ou `fetchPriority="high"`.
- [ ] Open Graph (`og:title`, `og:description`, `og:image`) para compartilhamento.

**Página de curso (`/cursos/[slug]`)**
- [ ] `generateStaticParams` + `notFound()` para slug inexistente.
- [ ] JSON-LD `Course` com `name`, `description`, `provider` (Organization com `name`, `sameAs`) e `BreadcrumbList` (Início > Cursos > Curso), refletindo texto visível.
- [ ] Outline de módulos/aulas renderizado como HTML no servidor (títulos das aulas visíveis, sem conteúdo da aula).
- [ ] Prévia em vídeo pública: `VideoObject` (`name`, `thumbnailUrl`, `uploadDate`, `contentUrl` ou `embedUrl`); sem prévia pública, sem `VideoObject`.
- [ ] Sem preço/desconto/promoção em `name` do JSON-LD.
- [ ] Parte por usuário (matrícula/progresso) isolada em Suspense/cliente com espaço reservado.

**Catálogo (`/cursos`)**
- [ ] `ItemList` com `ListItem.position` e `url` canônica, uma linha por curso visível na página (o Google exige pelo menos 3 cursos para o carrossel).
- [ ] Paginação com URL própria (`?pagina=N` ou path), canonical autorreferente, links `<a href>` entre páginas.
- [ ] Filtros/ordenação/busca interna: `noindex` ou fora do rastreio; combinação sem resultado devolve 404.
- [ ] LCP: primeiras capas acima da dobra com `loading="eager"`/`fetchPriority="high"`; demais lazy.

**Instrutor (`/instrutores/[slug]`)**
- [ ] `title`/`description`/canonical próprios; 404 real se inexistente.
- [ ] Lista de cursos do instrutor com links `<a href>`; JSON-LD `Person` opcional; `BreadcrumbList`.
- [ ] Foto com `alt`, `sizes` correto, dimensões definidas.

**Home**
- [ ] JSON-LD `Organization` (nome, `url`, `logo`, `sameAs`).

**Áreas privadas (aluno, aulas, login, checkout)**
- [ ] `robots: { index: false, follow: false }` no layout; ausentes do sitemap; 401/redirect ao login para anônimos.
- [ ] Sem JSON-LD de `VideoObject`/`Course` nelas.

### 6.2 Testes Playwright que o agente pode escrever

```ts
// e2e/seo.spec.ts
import { test, expect } from '@playwright/test'

const base = process.env.BASE_URL ?? 'http://localhost:3000'

async function jsonLd(page) {
  const raw = await page.locator('script[type="application/ld+json"]').allTextContents()
  return raw.map((t) => JSON.parse(t)) // lança se o JSON for inválido
}

test('curso: metadata e JSON-LD', async ({ page }) => {
  const res = await page.goto('/cursos/<slug-de-seed>')
  expect(res?.status()).toBe(200)
  await expect(page).toHaveTitle(/.+ \| .+/)
  await expect(page.locator('meta[name=description]')).toHaveAttribute('content', /.{50,}/)
  await expect(page.locator('link[rel=canonical]')).toHaveAttribute(
    'href', `${base}/cursos/<slug-de-seed>`)
  await expect(page.locator('meta[name=robots]')).toHaveCount(0) // ou sem noindex
  const blocks = (await jsonLd(page)).flatMap((b) => (Array.isArray(b) ? b : [b]))
  const course = blocks.find((b) => b['@type'] === 'Course')
  expect(course?.name).toBeTruthy()
  expect(course?.description).toBeTruthy()
  expect(course?.provider?.name).toBeTruthy()
  const crumbs = blocks.find((b) => b['@type'] === 'BreadcrumbList')
  expect(crumbs.itemListElement.length).toBeGreaterThanOrEqual(2)
  await expect(page.locator('h1')).toContainText(course.name)
})

test('slug inexistente devolve 404 e noindex', async ({ page }) => {
  const res = await page.goto('/cursos/nao-existe-xyz')
  expect(res?.status()).toBe(404)
  await expect(page.locator('meta[name=robots]')).toHaveAttribute('content', /noindex/)
})

test('área do aluno: noindex ou redirecionamento ao login', async ({ page }) => {
  await page.goto('/aluno')
  const robots = await page.locator('meta[name=robots]').getAttribute('content')
  expect(page.url().includes('/login') || /noindex/.test(robots ?? '')).toBe(true)
})

test('filtro/ordenação: noindex e canonical limpo', async ({ page }) => {
  await page.goto('/cursos?ordem=preco')
  await expect(page.locator('meta[name=robots]')).toHaveAttribute('content', /noindex/)
})

test('sitemap e robots', async ({ request }) => {
  const sm = await request.get('/sitemap.xml')
  expect(sm.status()).toBe(200)
  const xml = await sm.text()
  expect(xml).toContain('/cursos/<slug-de-seed>')
  expect(xml).not.toContain('/aluno')
  const robots = await (await request.get('/robots.txt')).text()
  expect(robots).toMatch(/Sitemap:\s*https?:\/\//)
})

test('JSON-LD não contém "<" cru', async ({ request }) => {
  const html = await (await request.get('/cursos/<slug-de-seed>')).text()
  for (const m of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
    expect(m[1]).not.toMatch(/</)
  }
})
```

Pontos de atenção:
- O teste de status 404 depende de o `notFound()` rodar antes do streaming; se o teste receber 200 com `noindex`, ajustar a rota (seção 2.2).
- Para simular bots, `test.use({ userAgent: 'Twitterbot/1.0' })` e verificar que `<title>` e `og:` estão no `<head>` do HTML bruto (via `request.get`, não `page`), pois bots "HTML-limited" recebem metadata bloqueante (docs: generate-metadata.md).
- Validar o HTML bruto (com `request.get`) mostra o que um crawler sem JS vê, ao contrário de `page`, que já executou JS.
- Teste unitário para a função que monta o JSON-LD (`buildCourseJsonLd(course)`) e para a função que decide o canonical a partir de `searchParams`.

### 6.3 Orçamento de Lighthouse CI

Usar o `lighthouserc.cjs` da seção 5.3; versionar no repositório e rodar em PR. Síntese: começar com SEO e acessibilidade como `error`, performance como `warn`.

### 6.4 Passos manuais

- Rich Results Test na URL de staging pública com a página de curso e o catálogo (docs: json-ld.md).
- Search Console: enviar sitemap, ver relatórios de indexação, Core Web Vitals e Inspeção de URL após o deploy (google: intro-structured-data; web.dev/articles/vitals).

---

## 7. Armadilhas (o que um LLM treinado em Next 12 a 15 erraria)

1. **`next/head` no App Router.** `next/head` é do Pages Router; no App Router use `metadata`/`generateMetadata` (docs: 02-guides/production-checklist.md lista `<Head>` apenas sob Pages Router; 01-getting-started/14-metadata-and-og-images.md). `<meta http-equiv>`, `<base>`, `<style>`, `<script>` não têm campo no Metadata API e devem ser renderizados no layout/página (docs: generate-metadata.md, "Unsupported Metadata").
2. **`next-sitemap` quando já existe `sitemap.ts`.** O Next tem `sitemap.(xml|js|ts)`, `generateSitemaps` e `robots.(txt|js|ts)` nativos (docs: 03-file-conventions/01-metadata/sitemap.md; robots.md). Instalar `next-sitemap` gera arquivos duplicados/conflitantes. (O pacote não aparece na documentação; a regra é uma Síntese: sem motivo para a dependência.)
3. **Prop `priority` do `next/image`.** Deprecada no 16 em favor de `preload`; e as docs ainda recomendam `loading="eager"` ou `fetchPriority="high"` na maioria dos casos (docs: 02-components/image.md).
4. **Metadata em Client Component.** `metadata` e `generateMetadata` só funcionam em Server Components; mantenha a página como servidor e mova a interatividade para um componente filho com `'use client'` (docs: generate-metadata.md, "Why generateMetadata is Server Component only").
5. **`params`/`searchParams` síncronos.** Em 15+ são `Promise` (o acesso síncrono era só compatibilidade temporária no 15); em 16 a seção "Async Request APIs (breaking change)" trata o acesso assíncrono como o padrão: use `await params` (docs: page.md; 02-guides/upgrading/version-16.md). Também em `opengraph-image`, `twitter-image`, `icon`, `apple-icon` (`params` e `id` como Promise) e no `sitemap` com `generateSitemaps` (`id` como `Promise<string>`) (docs: version-16.md; sitemap.md tabela de versão).
6. **Imagens: `images.qualities`, `minimumCacheTTL`, `localPatterns`.** Valores padrão mudaram no 16: `qualities` agora `[75]`, `minimumCacheTTL` 4 h, `imageSizes` sem 16 (docs: version-16.md; image.md).
7. **`middleware.ts`.** Renomeado para `proxy.ts` no 16 (com export `proxy`), runtime Node; `next lint` saiu em favor do ESLint CLI (docs: version-16.md; 03-file-conventions/proxy.md). Relevante se o agente colocar redirecionamentos canônicos (www, barra final) em middleware.
8. **`priority`/`changeFrequency` no sitemap como se influenciassem o Google.** O Google ignora ambos; só `lastmod` confiável conta (google: sitemaps/build-sitemap).
9. **Course info / `CourseInstance`/`offers` para rich result.** O rich result Course info foi descontinuado em set/2025; o Course list (carrossel) segue documentado (google: blog/2025/06/simplifying-search-results; appearance/structured-data/course). Um modelo treinado antes de 2025 tende a pedir `hasCourseInstance` + `offers` como "obrigatório".
10. **`rel="next"`/`"prev"` para paginação.** O Google não usa mais (google: ecommerce/pagination-and-incremental-page-loading).
11. **Canonical de toda página paginada apontando para a página 1.** O Google orienta canonical autorreferente em cada página da sequência (google: pagination...).
12. **`robots.txt` Disallow + `noindex` na mesma URL.** O `noindex` não é lido se o rastreio estiver bloqueado (google: robots-meta-tag).
13. **`dangerouslySetInnerHTML` com `JSON.stringify` cru no JSON-LD.** Sem o `replace(/</g, '\\u003c')` há risco de XSS (docs: json-ld.md).
14. **Assumir 404 de status real com `notFound()` sob streaming.** Se o streaming já começou, o status permanece 200 com `noindex` injetado (docs: not-found.md; loading.md "Status codes").
15. **Assumir que metadata sempre vai no `<head>`.** Em páginas dinâmicas, para clientes não-bot, a metadata é transmitida em streaming e anexada ao `<body>`; bots HTML-limited recebem no `<head>` (docs: generate-metadata.md, "Streaming metadata"; desde v15.2.0).
16. **Docs `.mdx`.** No pacote instalado as docs são `.md`; caminhos com `.mdx` nas anotações de tarefa não existem (verificado em `node_modules/next/dist/docs/01-app/03-api-reference/04-functions/`).
17. **`title.template` no mesmo segmento.** O template não se aplica ao título do `page.tsx`/`layout.tsx` do mesmo segmento onde foi definido, só aos filhos (docs: generate-metadata.md).
18. **Merge raso de `openGraph`.** Redefinir `openGraph` numa página apaga os campos herdados do layout (docs: generate-metadata.md, "Merging").
19. **Confiar na nota de performance do Lighthouse como prova de CWV.** INP não é medido pelo Lighthouse (proxy TBT) e campo (CrUX, 28 dias) prevalece sobre lab (web.dev/articles/lab-and-field-data-differences; web.dev/articles/vitals).
20. **Cache Components e `generateMetadata`.** Com `cacheComponents`, metadata dependente de runtime numa página pré-renderizável gera erro de build; use `'use cache'` ou marcador dinâmico; `dynamicParams` não existe nesse modo (docs: generate-metadata.md; dynamicParams.md).

---

## Lacunas

Perguntas que as fontes primárias consultadas não responderam:

1. O Next gera automaticamente um **sitemap index** quando se usa `generateSitemaps`? As docs só dizem que os arquivos ficam em `/.../sitemap/[id].xml`; não há menção a um índice. Como o robots lista os sitemaps filhos?
2. Como **revalidar** `sitemap.ts` (cacheado por padrão) quando um curso é publicado: `revalidatePath('/sitemap.xml')`, `revalidate` no segmento ou `use cache` com `cacheLife`? As páginas consultadas não trazem um exemplo.
3. Com o streaming iniciado, existe forma documentada de **garantir status 404 real** para `notFound()` dentro de uma rota com `loading.tsx`? As docs descrevem só o comportamento (404 antes do streaming, 200 depois).
4. Quais **User-Agents exatos** estão na lista padrão de `htmlLimitedBots` na 16.4.6 (a lista está em código-fonte do Next, não nas docs)? A lista completa não foi lida.
5. O Google considera um **curso gravado e self-paced** (sem "roster of students" e sem instrutor presente) elegível ao Course list? A doc só define o critério em termos de instrutor e turma.
6. Quanto ao Course list: **qual a elegibilidade para provedores que não são instituições** (plataforma independente)? A doc de Course list não restringe, mas os exemplos usam universidades.
7. **Lighthouse CI contra páginas autenticadas** (aulas, área do aluno): a documentação do `collect` consultada não cobre autenticação (há `puppeteerScript` em outra seção que não foi lida).
8. **Valores de referência para TBT e performance score** em CI: o Google não publica limiares de TBT "bons" na página de scoring consultada; os 300 ms e 0,85 sugeridos são escolha minha.
9. **Status do INP no cálculo do Lighthouse atual** (versão 12/13): a página de scoring consultada mostra pesos do Lighthouse 10; não foi verificado se versões mais novas alteraram pesos ou categorias.
10. **Dados estruturados para instrutores** (`Person`, `ProfilePage`): não há rich result documentado para esse caso nas páginas consultadas; recomendação do Google para perfis não foi pesquisada.
11. **Volume mínimo** de tráfego para o CrUX reportar dados de um site novo: a documentação consultada fala em agregação de 28 dias, mas não em limiar de amostra.
12. **`fetchPriority` e `loading` na `next/image`**: as docs listam `loading` e recomendam `fetchPriority="high"`, mas esta pesquisa não verificou a assinatura exata da prop `fetchPriority` na tabela de props (apenas na seção `preload`).
13. Como o **Rich Results Test** trata páginas servidas com metadata/JSON-LD por streaming (anexados ao `<body>`) em contraste com páginas estáticas: não testado, apenas inferido das docs do Next.
