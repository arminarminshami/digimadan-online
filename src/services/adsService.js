import { supabase } from '../lib/supabaseClient'

const TABLE = 'ads'

// Public: only published ads, newest first
export async function getPublishedAds({ category, province, limit } = {}) {
  let query = supabase
    .from(TABLE)
    .select('*')
    .eq('status', 'published')
    .order('created_at', { ascending: false })

  if (category) query = query.eq('category', category)
  if (province) query = query.eq('province', province)
  if (limit) query = query.limit(limit)

  const { data, error } = await query
  if (error) throw error
  return data
}

export async function getAdById(id) {
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .eq('id', id)
    .single()
  if (error) throw error
  return data
}

// Admin: all ads regardless of status
// فهرست آگهی‌ها برای پنل ادمین، همراه با مشخصات صاحب آگهی.
// چون بین ads و user_profiles رابطه‌ی کلید خارجی تعریف نشده، نمی‌توان از
// join مستقیم PostgREST استفاده کرد؛ پروفایل‌ها جداگانه خوانده و در حافظه
// به آگهی‌ها وصل می‌شوند. (خواندن پروفایل دیگران فقط برای ادمین مجاز است)
export async function getAllAds() {
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error

  const ownerIds = [...new Set((data || []).map((a) => a.owner_user_id).filter(Boolean))]
  if (ownerIds.length === 0) return data

  const { data: profiles } = await supabase
    .from('user_profiles')
    .select('auth_user_id, first_name, last_name, full_name, phone')
    .in('auth_user_id', ownerIds)

  const byId = Object.fromEntries((profiles || []).map((p) => [p.auth_user_id, p]))

  return (data || []).map((ad) => {
    const p = ad.owner_user_id ? byId[ad.owner_user_id] : null
    const ownerName =
      p?.full_name || [p?.first_name, p?.last_name].filter(Boolean).join(' ') || null
    return { ...ad, owner_name: ownerName, owner_phone: p?.phone || null }
  })
}

export async function createAd(ad) {
  const { data, error } = await supabase.from(TABLE).insert([ad]).select().single()
  if (error) throw error
  return data
}

export async function updateAd(id, updates) {
  const { data, error } = await supabase
    .from(TABLE)
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteAd(id) {
  const { error } = await supabase.from(TABLE).delete().eq('id', id)
  if (error) throw error
  return true
}

export async function toggleAdStatus(id, currentStatus) {
  const newStatus = currentStatus === 'published' ? 'draft' : 'published'
  return updateAd(id, { status: newStatus })
}

export async function getAdsStats() {
  const { count: total, error: e1 } = await supabase
    .from(TABLE)
    .select('*', { count: 'exact', head: true })
  if (e1) throw e1

  const { count: published, error: e2 } = await supabase
    .from(TABLE)
    .select('*', { count: 'exact', head: true })
    .eq('status', 'published')
  if (e2) throw e2

  return { total: total ?? 0, published: published ?? 0 }
}
