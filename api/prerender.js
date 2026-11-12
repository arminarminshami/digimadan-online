/**
 * پیش‌رندر (Prerender) برای خزنده‌ها
 * ---------------------------------------------------------------
 * سایت دیجی‌معدن یک SPA است؛ یعنی HTML اولیه خالی است و محتوا با
 * جاوااسکریپت در مرورگر ساخته می‌شود. گوگل جاوااسکریپت را اجرا می‌کند
 * و مشکلی ندارد، اما خزنده‌های هوش مصنوعی (GPTBot، ClaudeBot،
 * PerplexityBot و...) جاوااسکریپت اجرا نمی‌کنند و صفحه را خالی می‌بینند.
 *
 * این تابع فقط برای همان خزنده‌ها اجرا می‌شود (تشخیص از روی User-Agent)،
 * داده را مستقیم از Supabase می‌خواند و یک HTML کامل و ایستا برمی‌گرداند.
 * کاربران واقعی هیچ تغییری حس نمی‌کنند و همان SPA را می‌گیرند.
 */

const SUPABASE_URL = process.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY
const SITE_URL = (process.env.VITE_SITE_URL || 'https://digimadan.com').replace(/\/$/, '')
const SITE_NAME = 'دیجی‌معدن'

function esc(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

async function sb(path) {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return null
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        Accept: 'application/json',
      },
    })
    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
  }
}

function money(v) {
  if (v == null) return null
  return Number(v).toLocaleString('fa-IR') + ' تومان'
}

function layout({ title, description, canonical, image, bodyHtml, jsonLd }) {
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
<footer>
  <p>${esc(SITE_NAME)} — بازار آنلاین آگهی‌های معدنی ایران</p>
</footer>
</body>
</html>`
}

// ---------------- صفحه‌ی جزئیات یک آگهی ----------------
async function renderAd(id) {
  const rows = await sb(`ads?id=eq.${encodeURIComponent(id)}&select=*&limit=1`)
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
  ${(ad.images || [])
    .slice(0, 5)
    .map((src) => `<img src="${esc(src)}" alt="${esc(ad.title)}" width="600">`)
    .join('\n  ')}
  <h2>مشخصات</h2>
  <dl>
${facts.map(([k, v]) => `    <dt>${esc(k)}</dt><dd>${esc(v)}</dd>`).join('\n')}
  </dl>
  <h2>توضیحات کامل</h2>
  <p>${esc(ad.description).replace(/\n/g, '<br>')}</p>
  ${ad.contact_name ? `<p>فروشنده: ${esc(ad.contact_name)}</p>` : ''}
</article>`

  const jsonLd = {
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
  }

  return layout({
    title: ad.title,
    description,
    canonical: `${SITE_URL}/ads/${ad.id}`,
    image: ad.images?.[0],
    bodyHtml,
    jsonLd,
  })
}

// ---------------- فهرست آگهی‌ها ----------------
async function renderAdsList(searchParams) {
  const mineralType = searchParams.get('mineralType')
  let query = 'ads?select=id,title,province,mineral_type,base_price,ad_type&status=in.(published,live)&is_archived=eq.false&order=created_at.desc&limit=100'
  if (mineralType) query += `&mineral_type=eq.${encodeURIComponent(mineralType)}`

  const ads = (await sb(query)) || []
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

  const jsonLd = ads.length
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
    : null

  return layout({
    title: pageTitle,
    description: mineralType
      ? `خرید و فروش ${mineralType} در ایران — فهرست آگهی‌های ${mineralType} با قیمت و تناژ مشخص در دیجی‌معدن.`
      : 'فهرست آگهی‌های خرید و فروش مواد معدنی، معادن و ماشین‌آلات معدنی در سراسر ایران.',
    canonical: mineralType
      ? `${SITE_URL}/ads?mineralType=${encodeURIComponent(mineralType)}`
      : `${SITE_URL}/ads`,
    bodyHtml,
    jsonLd,
  })
}

// ---------------- مقاله ----------------
async function renderArticle(slug) {
  const rows = await sb(
    `articles?slug=eq.${encodeURIComponent(slug)}&status=eq.published&select=*&limit=1`
  )
  const a = rows?.[0]
  if (!a) return null

  const bodyHtml = `
<article>
  <h1>${esc(a.title)}</h1>
  ${a.cover_image_url ? `<img src="${esc(a.cover_image_url)}" alt="${esc(a.title)}" width="600">` : ''}
  <p>${esc(a.content).replace(/\n/g, '<br>')}</p>
  <p>نویسنده: ${esc(a.author_name || SITE_NAME)}</p>
</article>`

  return layout({
    title: a.title,
    description: (a.content || '').replace(/\s+/g, ' ').slice(0, 155),
    canonical: `${SITE_URL}/articles/${a.slug}`,
    image: a.cover_image_url,
    bodyHtml,
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

// ---------------- صفحه‌ی اصلی ----------------
async function renderHome() {
  const ads =
    (await sb(
      'ads?select=id,title,province,mineral_type,base_price&status=in.(published,live)&is_archived=eq.false&order=created_at.desc&limit=20'
    )) || []

  const bodyHtml = `
<h1>دیجی‌معدن — بازار آگهی معدن و مواد معدنی ایران</h1>
<p>
  دیجی‌معدن پلتفرم آنلاین خرید و فروش مواد معدنی، معادن، ماشین‌آلات معدنی و
  مشارکت در پروژه‌های اکتشاف و استخراج در سراسر ایران است. در دیجی‌معدن
  می‌توانید آگهی‌های خاک طلا، سنگ آهن، مس، کائولن، فلورین، زغال‌سنگ،
  سنگ‌های تزئینی و ده‌ها ماده معدنی دیگر را ببینید یا آگهی خود را ثبت کنید.
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
</ul>`

  return layout({
    title: 'بازار آگهی معدن و خرید و فروش مواد معدنی ایران',
    description:
      'دیجی‌معدن، بازار آنلاین آگهی‌های معدنی ایران: خرید و فروش مواد معدنی مثل خاک طلا، سنگ آهن، مس، کائولن و فلورین، معادن، ماشین‌آلات معدنی و قیمت لحظه‌ای فلزات.',
    canonical: `${SITE_URL}/`,
    bodyHtml,
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

export default async function handler(req, res) {
  // مسیر واقعی درخواست‌شده از هدر یا کوئری خوانده می‌شود
  const rawPath = req.query?.path || req.headers['x-original-path'] || req.url || '/'
  const url = new URL(rawPath, SITE_URL)
  const pathname = url.pathname
  const searchParams = url.searchParams

  let html = null
  try {
    const adMatch = pathname.match(/^\/ads\/([^/?]+)/)
    const articleMatch = pathname.match(/^\/articles\/([^/?]+)/)

    if (adMatch) html = await renderAd(adMatch[1])
    else if (articleMatch) html = await renderArticle(articleMatch[1])
    else if (pathname === '/ads' || pathname === '/minerals') html = await renderAdsList(searchParams)
    else if (pathname === '/' || pathname === '') html = await renderHome()
  } catch (e) {
    html = null
  }

  // اگر به هر دلیلی پیش‌رندر ممکن نبود، محتوای عمومی سایت برگردانده می‌شود
  // تا خزنده هرگز صفحه‌ی خالی یا خطا نبیند.
  if (!html) {
    html = layout({
      title: 'بازار آگهی معدن و مواد معدنی ایران',
      description:
        'دیجی‌معدن، بازار آنلاین آگهی‌های معدنی ایران برای خرید و فروش مواد معدنی، معادن و ماشین‌آلات معدنی.',
      canonical: `${SITE_URL}${pathname}`,
      bodyHtml: `<h1>${SITE_NAME}</h1><p>بازار آنلاین آگهی‌های معدنی ایران.</p>`,
      jsonLd: null,
    })
  }

  res.setHeader('Content-Type', 'text/html; charset=utf-8')
  res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400')
  res.setHeader('X-Prerendered', '1')
  res.status(200).send(html)
}
