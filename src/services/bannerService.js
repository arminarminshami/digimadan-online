import { supabase } from '../lib/supabaseClient'

const TABLE = 'banners'

// بنرهای فعال، برای نمایش در اسلایدر صفحه‌ی اصلی (مرتب بر اساس ترتیب دلخواه ادمین)
export async function getActiveBanners() {
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .eq('is_active', true)
    .order('sort_order', { ascending: true })
  if (error) throw error
  return data
}

// همه‌ی بنرها (فعال و غیرفعال)، برای پنل ادمین
export async function getAllBanners() {
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .order('sort_order', { ascending: true })
  if (error) throw error
  return data
}

export async function createBanner({ image_url, link_url, sort_order, is_active }) {
  const { data, error } = await supabase
    .from(TABLE)
    .insert([{ image_url, link_url: link_url || null, sort_order: sort_order ?? 0, is_active: is_active ?? true }])
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateBanner(id, fields) {
  const { data, error } = await supabase
    .from(TABLE)
    .update(fields)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteBanner(id) {
  const { error } = await supabase.from(TABLE).delete().eq('id', id)
  if (error) throw error
}
