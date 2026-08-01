import { supabase } from '../lib/supabaseClient'

const TABLE = 'ads'

// ------------------------------------------------------------
// عمومی: همه‌ی آگهی‌های قابل‌نمایش برای صفحه‌ی لیست آگهی‌ها
// ------------------------------------------------------------
export async function getPublicListings({ category, province, mineralType, machineType, adType, limit } = {}) {
  let query = supabase
    .from(TABLE)
    .select('*')
    .in('status', ['published', 'live'])
    .eq('is_archived', false)
    // ranked_at = بزرگ‌ترینِ (زمان نردبان، زمان ثبت).
    // یعنی نردبان آگهی را به همان لحظه می‌آورد، نه برای همیشه بالای لیست؛
    // پس آگهی جدیدتر بعد از آن، بالاتر از آگهی نردبان‌شده قرار می‌گیرد.
    .order('ranked_at', { ascending: false })

  if (category) query = query.eq('category', category)
  if (province) query = query.eq('province', province)
  if (mineralType) query = query.eq('mineral_type', mineralType)
  if (machineType) query = query.eq('machine_type', machineType)
  if (adType) query = query.eq('ad_type', adType)
  if (limit) query = query.limit(limit)

  const { data, error } = await query
  if (error) throw error
  return data
}

export async function getMyAds(authUserId) {
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .eq('owner_user_id', authUserId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

// نردبان کردن آگهی: آگهی را به ابتدای لیست می‌آورد (در همان لحظه).
// با ثبت آگهی جدیدتر، این آگهی به‌طور طبیعی پایین‌تر می‌رود و برای
// بالا آمدن دوباره باید دوباره نردبان شود.
// فعلاً رایگان و در دسترس خود کاربر (بدون نیاز به تایید ادمین یا کیف‌پول).
export async function boostAd(adId) {
  const { data, error } = await supabase
    .from(TABLE)
    .update({ boosted_at: new Date().toISOString() })
    .eq('id', adId)
    .select()
    .single()
  if (error) throw error
  return data
}

// افزایش تعداد بازدید (هربار کسی صفحه‌ی جزئیات را باز کرد)
export async function incrementViews(adId) {
  const { error } = await supabase.rpc('increment_ad_views', { ad_id: adId })
  // اگر تابع rpc هنوز ساخته نشده باشد، این خطا را نادیده می‌گیریم تا صفحه نشکند
  if (error) console.warn('increment_ad_views rpc not available yet:', error.message)
}
