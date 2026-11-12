/**
 * Cloudflare Pages Middleware
 * ---------------------------------------------------------------
 * جایگزین کامل vercel.json (که Cloudflare آن را نادیده می‌گیرد).
 *
 * دو کار انجام می‌دهد:
 *  ۱) /sitemap.xml را از Supabase می‌گیرد و سرو می‌کند
 *  ۲) برای خزنده‌هایی که جاوااسکریپت اجرا نمی‌کنند (GPTBot، ClaudeBot،
 *     PerplexityBot و...) نسخه‌ی HTML کامل صفحه را می‌سازد.
 *
 * کاربران واقعی و Googlebot دست‌نخورده همان SPA را می‌گیرند.
 *
 * متغیرهای محیطی لازم (در Cloudflare Pages > Settings > Environment variables):
 *   VITE_SUPABASE_URL
 *   VITE_SUPABASE_ANON_KEY
 *   VITE_SITE_URL   (اختیاری، پیش‌فرض https://digimadan.com)
 */

const SITE_NAME = 'دیجی‌معدن'

const SITEMAP_URL =
  'https://gdafmztscwtqtjzgnhvp.supabase.co/functions/v1/sitemap'

const BOT_PATTERN = new RegExp(
  [
    'gptbot', 'oai-searchbot', 'chatgpt-user', 'oai-adsbot',
    'claudebot', 'claude-user', 'claude-searchbot', 'anthropic-ai',
    'perplexitybot', 'perplexity-user', 'bytespider', 'ccbot',
    'meta-externalagent', 'cohere-ai', 'youbot', 'diffbot', 'amazonbot',
    'bingbot', 'yandexbot', 'duckduckbot', 'baiduspider', 'applebot',
    'facebookexternalhit', 'twitterbot', 'linkedinbot', 'telegrambot',
    'whatsapp', 'discordbot',
  ].join('|'),
  'i'
)

const PRERENDER_PATHS = [
  /^\/$/,
  /^\/ads$/,
  /^\/ads\/[^/]+$/,
  /^\/articles\/[^/]+$/,
  /^\/minerals$/,
]

function esc(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function money(v) {
  if (v == null) return null
  return Number(v).toLocaleString('fa-IR') + ' تومان'
}

async function sb(env, path) {
  const url = env.VITE_SUPABASE_URL
  const key = env.VITE_SUPABASE_ANON_KEY
  if (!url || !key) return null
  try {
    const res = await fetch(`${url}/rest/v1/${path}`, {
      headers: { apikey: key, Authorization: `Bearer ${key}`, Accept: 'application/json' },
    })
    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
  }
}

function layout(SITE_URL, { title, description, canonical, image, bodyHtml, jsonLd }) {
  const fullTitle = `${title} | ${SITE_NAME}`
  const img = image || `${SITE_URL}/logo.png`
  return `<!doctype html>
<html lang="fa" dir="rtl">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(fullTitle)}</title>
<meta name="description" content="${esc(description)}">
<meta name="robots" content="index, follow, max-image-preview:large">
<link rel="canonical" href="${esc(canonical)}">
<meta property="og:site_name" content="${esc(SITE_NAME)}">
<meta property="og:type" content="article">
<meta property="og:locale" content="fa_IR">
<meta property="og:title" content="${esc(fullTitle)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${esc(canonical)}">
<meta property="og:image" content="${esc(img)}">
<meta name="twitter:card" content="summary_large_image">
${jsonLd ? `<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>` : ''}
</head>
<body>
<header>
  <a href="${SITE_URL}/"><strong>${esc(SITE_NAME)}</strong></a>
  <nav>
    <a href="${SITE_URL}/ads">آگهی‌ها</a>
    <a href="${SITE_URL}/minerals">مواد معدنی</a>
    <a href="${SITE_URL}/prices">قیمت‌ها</a>
    <a href="${SITE_URL}/articles">مقالات</a>
    <a href="${SITE_URL}/about">درباره ما</a>
    <a href="${SITE_URL}/contact">تماس با ما</a>
  </nav>
</header>
<main>
${bodyHtml}
</main>
<footer><p>${esc(SITE_NAME)} — بازار آنلاین آگهی‌های معدنی ایران</p></footer>
</body>
</html>`
}

async function renderAd(env, SITE_URL, id) {
  const rows = await sb(env, `ads?id=eq.${encodeURIComponent(id)}&select=*&limit=1`)
  const ad = rows?.[0]
  if (!ad) return null

  const facts = [
    ['استان', ad.province],
    ['نوع ماده معدنی', ad.mineral_type],
    ['نام معدن', ad.mine_name],
    ['نوع ماشین‌آلات', ad.machine_type],
    ['برند', ad.machine_brand],
    ['سال ساخت', ad.machine_year],
    ['تناژ', ad.tonnage != null ? `${Number(ad.tonnage).toLocaleString('fa-IR')} تن` : null],
    ['درصد خلوص', ad.purity_percent != null ? `٪${ad.purity_percent}` : null],
    ['عیار', ad.ore_grade],
    ['رطوبت', ad.humidity_percent != null ? `٪${ad.humidity_percent}` : null],
    ['دانه‌بندی', ad.granularity],
    ['قیمت', money(ad.base_price)],
    ['شرایط تحویل', ad.delivery_terms],
  ].filter(([, v]) => v !== null && v !== undefined && v !== '')

  const adTypeLabel = ad.ad_type === 'buy' ? 'آگهی خرید' : 'آگهی فروش'
  const description = `${adTypeLabel}${ad.mineral_type ? ' ' + ad.mineral_type : ''} در ${
    ad.province || 'ایران'
  } — ${(ad.description || '').replace(/\s+/g, ' ').slice(0, 140)}`

  const bodyHtml = `
<article>
  <h1>${esc(ad.title)}</h1>
  <p><strong>${esc(adTypeLabel)}</strong>${ad.province ? ` — ${esc(ad.province)}` : ''}</p>
  ${(ad.images || []).slice(0, 5).map((s) => `<img src="${esc(s)}" alt="${esc(ad.title)}" width="600">`).join('\n  ')}
  <h2>مشخصات</h2>
  <dl>
${facts.map(([k, v]) => `    <dt>${esc(k)}</dt><dd>${esc(v)}</dd>`).join('\n')}
  </dl>
  <h2>توضیحات کامل</h2>
  <p>${esc(ad.description).replace(/\n/g, '<br>')}</p>
  ${ad.contact_name ? `<p>فروشنده: ${esc(ad.contact_name)}</p>` : ''}
</article>`

  return layout(SITE_URL, {
    title: ad.title,
    description,
    canonical: `${SITE_URL}/ads/${ad.id}`,
    image: ad.images?.[0],
    bodyHtml,
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: ad.title,
      description: (ad.description || '').slice(0, 500),
      image: ad.images?.length ? ad.images : [`${SITE_URL}/logo.png`],
      category: ad.mineral_type || undefined,
      url: `${SITE_URL}/ads/${ad.id}`,
      ...(ad.base_price
        ? {
            offers: {
              '@type': 'Offer',
              price: Number(ad.base_price),
              priceCurrency: 'IRR',
              availability:
                ad.status === 'sold' || ad.is_archived
                  ? 'https://schema.org/SoldOut'
                  : 'https://schema.org/InStock',
              url: `${SITE_URL}/ads/${ad.id}`,
            },
          }
        : {}),
    },
  })
}

async function renderAdsList(env, SITE_URL, searchParams) {
  const mineralType = searchParams.get('mineralType')
  let query =
    'ads?select=id,title,province,mineral_type,base_price,ad_type&status=in.(published,live)&is_archived=eq.false&order=created_at.desc&limit=100'
  if (mineralType) query += `&mineral_type=eq.${encodeURIComponent(mineralType)}`

  const ads = (await sb(env, query)) || []
  const pageTitle = mineralType ? `آگهی‌های ${mineralType}` : 'تمام آگهی‌های معدن و مواد معدنی'

  const bodyHtml = `
<h1>${esc(pageTitle)}</h1>
<p>${ads.length.toLocaleString('fa-IR')} آگهی فعال در دیجی‌معدن</p>
<ul>
${ads
  .map(
    (a) =>
      `  <li><a href="${SITE_URL}/ads/${a.id}"><strong>${esc(a.title)}</strong></a>` +
      `${a.mineral_type ? ` — ${esc(a.mineral_type)}` : ''}` +
      `${a.province ? ` — ${esc(a.province)}` : ''}` +
      `${a.base_price ? ` — ${esc(money(a.base_price))}` : ''}</li>`
  )
  .join('\n')}
</ul>`

  return layout(SITE_URL, {
    title: pageTitle,
    description: mineralType
      ? `خرید و فروش ${mineralType} در ایران — فهرست آگهی‌های ${mineralType} با قیمت و تناژ مشخص در دیجی‌معدن.`
      : 'فهرست آگهی‌های خرید و فروش مواد معدنی، معادن و ماشین‌آلات معدنی در سراسر ایران.',
    canonical: mineralType
      ? `${SITE_URL}/ads?mineralType=${encodeURIComponent(mineralType)}`
      : `${SITE_URL}/ads`,
    bodyHtml,
    jsonLd: ads.length
      ? {
          '@context': 'https://schema.org',
          '@type': 'ItemList',
          name: pageTitle,
          numberOfItems: ads.length,
          itemListElement: ads.slice(0, 30).map((a, i) => ({
            '@type': 'ListItem',
            position: i + 1,
            url: `${SITE_URL}/ads/${a.id}`,
            name: a.title,
          })),
        }
      : null,
  })
}

async function renderArticle(env, SITE_URL, slug) {
  const rows = await sb(
    env,
    `articles?slug=eq.${encodeURIComponent(slug)}&status=eq.published&select=*&limit=1`
  )
  const a = rows?.[0]
  if (!a) return null

  return layout(SITE_URL, {
    title: a.title,
    description: (a.content || '').replace(/\s+/g, ' ').slice(0, 155),
    canonical: `${SITE_URL}/articles/${a.slug}`,
    image: a.cover_image_url,
    bodyHtml: `
<article>
  <h1>${esc(a.title)}</h1>
  ${a.cover_image_url ? `<img src="${esc(a.cover_image_url)}" alt="${esc(a.title)}" width="600">` : ''}
  <p>${esc(a.content).replace(/\n/g, '<br>')}</p>
  <p>نویسنده: ${esc(a.author_name || SITE_NAME)}</p>
</article>`,
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: a.title,
      image: a.cover_image_url || `${SITE_URL}/logo.png`,
      datePublished: a.created_at,
      dateModified: a.updated_at || a.created_at,
      author: { '@type': 'Person', name: a.author_name || SITE_NAME },
      publisher: {
        '@type': 'Organization',
        name: SITE_NAME,
        logo: { '@type': 'ImageObject', url: `${SITE_URL}/logo.png` },
      },
      mainEntityOfPage: `${SITE_URL}/articles/${a.slug}`,
    },
  })
}

async function renderHome(env, SITE_URL) {
  const ads =
    (await sb(
      env,
      'ads?select=id,title,province,mineral_type&status=in.(published,live)&is_archived=eq.false&order=created_at.desc&limit=20'
    )) || []

  return layout(SITE_URL, {
    title: 'بازار آگهی معدن و خرید و فروش مواد معدنی ایران',
    description:
      'دیجی‌معدن، بازار آنلاین آگهی‌های معدنی ایران: خرید و فروش مواد معدنی مثل خاک طلا، سنگ آهن، مس، کائولن و فلورین، معادن، ماشین‌آلات معدنی و قیمت لحظه‌ای فلزات.',
    canonical: `${SITE_URL}/`,
    bodyHtml: `
<h1>دیجی‌معدن — بازار آگهی معدن و مواد معدنی ایران</h1>
<p>
  دیجی‌معدن پلتفرم آنلاین خرید و فروش مواد معدنی، معادن، ماشین‌آلات معدنی و
  مشارکت در پروژه‌های اکتشاف و استخراج در سراسر ایران است.
</p>
<h2>تازه‌ترین آگهی‌ها</h2>
<ul>
${ads
  .map(
    (a) =>
      `  <li><a href="${SITE_URL}/ads/${a.id}">${esc(a.title)}</a>` +
      `${a.mineral_type ? ` — ${esc(a.mineral_type)}` : ''}` +
      `${a.province ? ` — ${esc(a.province)}` : ''}</li>`
  )
  .join('\n')}
</ul>`,
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: SITE_NAME,
      alternateName: 'DigiMadan',
      url: SITE_URL,
      logo: `${SITE_URL}/logo.png`,
      areaServed: { '@type': 'Country', name: 'ایران' },
    },
  })
}

export async function onRequest(context) {
  const { request, next, env } = context
  const url = new URL(request.url)
  const SITE_URL = (env.VITE_SITE_URL || url.origin).replace(/\/$/, '')

  // ۱) نقشه‌ی سایت
  if (url.pathname === '/sitemap.xml') {
    try {
      const res = await fetch(SITEMAP_URL)
      return new Response(await res.text(), {
        headers: {
          'Content-Type': 'application/xml; charset=utf-8',
          'Cache-Control': 'public, max-age=3600',
        },
      })
    } catch {
      return next()
    }
  }

  // ۲) پیش‌رندر فقط برای خزنده‌های بدون جاوااسکریپت
  const ua = request.headers.get('user-agent') || ''
  const isBot = BOT_PATTERN.test(ua)
  const isGoogle = /googlebot|google-inspectiontool/i.test(ua)

  if (isBot && !isGoogle && PRERENDER_PATHS.some((re) => re.test(url.pathname))) {
    try {
      let html = null
      const adMatch = url.pathname.match(/^\/ads\/([^/?]+)/)
      const articleMatch = url.pathname.match(/^\/articles\/([^/?]+)/)

      if (adMatch) html = await renderAd(env, SITE_URL, adMatch[1])
      else if (articleMatch) html = await renderArticle(env, SITE_URL, articleMatch[1])
      else if (url.pathname === '/ads' || url.pathname === '/minerals')
        html = await renderAdsList(env, SITE_URL, url.searchParams)
      else if (url.pathname === '/') html = await renderHome(env, SITE_URL)

      if (html) {
        return new Response(html, {
          headers: {
            'Content-Type': 'text/html; charset=utf-8',
            'Cache-Control': 'public, s-maxage=3600',
            'X-Prerendered': '1',
          },
        })
      }
    } catch {
      // در صورت هر خطا، صفحه‌ی عادی سرو می‌شود تا سایت هرگز از کار نیفتد
    }
  }

  return next()
}
