// ------------------------------------------------------------------
// اتصال به وب‌سرویس بیرونی قیمت priceto.day برای جدول قیمت صفحه اول.
//
// نکته‌ی مهم برای توسعه‌دهنده: مستندات رسمی این API در دسترس نبود، پس این
// سرویس عمداً «بردبار» (defensive) نوشته شده: چند نام رایج فیلد را امتحان
// می‌کند و اگر پاسخ API با چیزی که پیش‌بینی شده فرق داشت، فقط آن ردیف را
// نادیده می‌گیرد و کل صفحه خراب نمی‌شود. اگر بعد از اجرا دیدید مقداری از
// آیتم‌ها نمایش داده نمی‌شوند، کافیست یک بار در Network تب مرورگر پاسخ
// واقعی /v1/symbols و /v1/latest/irr/<symbol> را ببینید و نگاشت فیلدها را
// در توابع normalizeSymbol() و normalizeLatest() پایین همین فایل اصلاح کنید.
// ------------------------------------------------------------------

const PRICE_API_BASE = 'https://api.priceto.day/v1'
const PRICE_API_TOKEN = 'UFapzVf6YMrSpnvpE8Ayod63mJmwUEnKlua8RG6ScJ'

// نمادهایی که برای یک بازار معدن/مواد معدنی معنادار هستند. هر آیتم چند
// نام مستعار (alias) دارد چون کد دقیق نماد در این API مشخص نبود؛ اولین
// alias ای که در لیست symbols پیدا شود استفاده می‌شود.
const CURATED_SYMBOLS = [
  { aliases: ['usd', 'dollar', 'dollar_rl'], label_fa: 'دلار آمریکا', unit: 'تومان' },
  { aliases: ['eur', 'euro'], label_fa: 'یورو', unit: 'تومان' },
  { aliases: ['aed', 'aed_dubai'], label_fa: 'درهم امارات', unit: 'تومان' },
  { aliases: ['gold_ounce', 'ounce', 'xau', 'gold_gram_ounce'], label_fa: 'انس جهانی طلا', unit: 'دلار' },
  { aliases: ['gold_18k', 'geram18', 'gold_gram18'], label_fa: 'طلای ۱۸ عیار (هر گرم)', unit: 'تومان' },
  { aliases: ['silver', 'noghre'], label_fa: 'نقره', unit: 'تومان' },
  { aliases: ['copper', 'mes'], label_fa: 'مس', unit: 'تومان' },
  { aliases: ['sekee', 'emami', 'coin'], label_fa: 'سکه امامی', unit: 'تومان' },
]

let cache = { data: null, at: 0 }
const CACHE_TTL_MS = 3 * 60 * 1000 // ۳ دقیقه، برای جلوگیری از درخواست زیاد به API بیرونی

async function fetchJson(url) {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`priceto.day request failed: ${res.status}`)
  return res.json()
}

// لیست نمادهای موجود در سرویس را برمی‌گرداند: [{ code, name }]
async function fetchSymbolsList() {
  const raw = await fetchJson(`${PRICE_API_BASE}/symbols?token=${PRICE_API_TOKEN}`)
  const list = Array.isArray(raw) ? raw : raw?.symbols || raw?.data || raw?.result || []
  return list
    .map((item) => {
      if (typeof item === 'string') return { code: item, name: item }
      const code = item.symbol || item.code || item.key || item.id
      const name = item.name || item.name_fa || item.title || code
      return code ? { code: String(code).toLowerCase(), name } : null
    })
    .filter(Boolean)
}

// آخرین قیمت یک نماد را می‌گیرد و به شکل { value, change_percent } برمی‌گرداند
async function fetchLatest(code) {
  const raw = await fetchJson(`${PRICE_API_BASE}/latest/irr/${code}?token=${PRICE_API_TOKEN}`)
  const node = raw?.data || raw?.result || raw
  const value =
    node?.price ?? node?.value ?? node?.rate ?? node?.amount ?? node?.close ?? node?.last ?? null
  const change_percent =
    node?.change_percent ?? node?.changePercent ?? node?.percent_change ?? node?.change ?? null
  if (value == null) throw new Error(`priceto.day: unrecognized response shape for ${code}`)
  return { value: Number(value), change_percent: change_percent != null ? Number(change_percent) : null }
}

function pickCuratedMatches(availableSymbols) {
  const byCode = new Map(availableSymbols.map((s) => [s.code, s]))
  const matches = []
  for (const item of CURATED_SYMBOLS) {
    const foundCode = item.aliases.find((alias) => byCode.has(alias))
    if (foundCode) matches.push({ ...item, code: foundCode })
  }
  return matches
}

/**
 * قیمت‌های لحظه‌ای را از priceto.day می‌گیرد و برای جدول صفحه اول آماده می‌کند.
 * در صورت هر نوع خطا (شبکه، تغییر ساختار پاسخ و...) یک آرایه‌ی خالی
 * برمی‌گرداند تا صدا زننده بتواند به منبع داخلی fallback کند.
 */
export async function getExternalPrices() {
  const now = Date.now()
  if (cache.data && now - cache.at < CACHE_TTL_MS) return cache.data

  try {
    const symbols = await fetchSymbolsList()
    const curated = pickCuratedMatches(symbols)
    const targets = curated.length > 0 ? curated : symbols.slice(0, 8).map((s) => ({ ...s, label_fa: s.name, unit: '' }))

    const results = await Promise.all(
      targets.map(async (item) => {
        try {
          const latest = await fetchLatest(item.code)
          return {
            id: item.code,
            label_fa: item.label_fa,
            unit: item.unit,
            price_values: { current_value: latest.value, change_percent: latest.change_percent },
          }
        } catch {
          return null
        }
      })
    )

    const priced = results.filter(Boolean)
    if (priced.length > 0) {
      cache = { data: priced, at: now }
      return priced
    }
    return []
  } catch (err) {
    console.warn('priceto.day: falling back to internal price list —', err.message)
    return []
  }
}
