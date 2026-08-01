import { supabase } from '../lib/supabaseClient'

// فهرست ثابت صفحات اصلی سایت که در دیتابیس ذخیره نمی‌شوند (مثل تماس با ما)
// تا با جست‌وجوی سراسری، ساختار سایت هم قابل پیدا شدن باشد.
const STATIC_PAGES = [
  { title: 'خانه', keywords: ['خانه', 'صفحه اصلی', 'دیجی معدن'], url: '/' },
  { title: 'همه آگهی‌ها', keywords: ['آگهی', 'آگهی ها', 'مزایده', 'فروش'], url: '/ads' },
  { title: 'مواد معدنی', keywords: ['مواد معدنی', 'دسته بندی', 'معدن'], url: '/minerals' },
  { title: 'قیمت‌های بازار', keywords: ['قیمت', 'طلا', 'دلار', 'سکه', 'ارز', 'فلزات'], url: '/prices' },
  { title: 'اخبار معدن', keywords: ['اخبار', 'خبر'], url: '/news' },
  { title: 'مقالات', keywords: ['مقاله', 'مقالات', 'آموزش'], url: '/articles' },
  { title: 'درباره ما', keywords: ['درباره', 'درباره ما', 'دیجی معدن چیست'], url: '/about' },
  { title: 'تماس با ما', keywords: ['تماس', 'شماره تماس', 'تماس با ما', 'آدرس', 'واتساپ'], url: '/contact' },
  { title: 'ثبت آگهی جدید', keywords: ['ثبت آگهی', 'آگهی جدید', 'فروش محصول'], url: '/submit-ad' },
  { title: 'ورود / ثبت‌نام', keywords: ['ورود', 'ثبت نام', 'لاگین'], url: '/login' },
]

function searchStaticPages(query) {
  const q = query.trim().toLowerCase()
  if (!q) return []
  return STATIC_PAGES.filter(
    (p) => p.title.toLowerCase().includes(q) || p.keywords.some((k) => k.toLowerCase().includes(q))
  ).map((p) => ({
    result_type: 'صفحه سایت',
    ref_id: p.url,
    ref_title: p.title,
    snippet: '',
    url: p.url,
  }))
}

export async function globalSearch(query) {
  const trimmed = query.trim()
  if (!trimmed) return []

  const staticResults = searchStaticPages(trimmed)

  const { data, error } = await supabase.rpc('global_search', { search_term: trimmed })
  if (error) {
    console.warn('global_search rpc failed:', error.message)
    return staticResults
  }

  return [...staticResults, ...(data || [])]
}
