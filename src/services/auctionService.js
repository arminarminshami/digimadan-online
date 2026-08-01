import { supabase } from '../lib/supabaseClient'

const TABLE = 'auctions'

// ---------------- عمومی ----------------

// مزایده‌های قابل نمایش برای کاربران (منتشرشده و پایان‌یافته)
export async function getPublicAuctions() {
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .in('status', ['published', 'closed'])
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function getAuctionById(id) {
  const { data, error } = await supabase.from(TABLE).select('*').eq('id', id).single()
  if (error) throw error
  return data
}

/**
 * دریافت لینک موقت دانلود یک مدرک مزایده.
 * بررسی بازه‌ی زمانی مجاز سمت سرور انجام می‌شود (Edge Function)، نه اینجا،
 * تا دستکاری در مرورگر بی‌اثر باشد.
 */
export async function getAuctionDocumentUrl(auctionId, docUrl) {
  const { data, error } = await supabase.functions.invoke('auction-doc-access', {
    body: { auctionId, docUrl },
  })
  if (error) throw new Error('دریافت فایل با خطا مواجه شد.')
  if (data?.error) throw new Error(data.error)
  return data.url
}

// ---------------- شرکت در مزایده ----------------

export async function getMyParticipation(auctionId, userId) {
  const { data, error } = await supabase
    .from('auction_participations')
    .select('*')
    .eq('auction_id', auctionId)
    .eq('user_id', userId)
    .maybeSingle()
  if (error) throw error
  return data
}

export async function getMyParticipations(userId) {
  const { data, error } = await supabase
    .from('auction_participations')
    .select('*, auctions(id, title, category, held_at_text, result_text, status)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function submitParticipation({ auctionId, userId, offeredPrice, documents, paymentStatus = 'unpaid', paymentRef = null }) {
  const { data, error } = await supabase
    .from('auction_participations')
    .insert([
      {
        auction_id: auctionId,
        user_id: userId,
        offered_price: offeredPrice ? Number(offeredPrice) : null,
        documents: documents || [],
        payment_status: paymentStatus,
        payment_ref: paymentRef,
        status: 'pending',
      },
    ])
    .select()
    .single()
  if (error) throw error
  return data
}

// ---------------- ادمین ----------------

export async function getAllAuctions() {
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function createAuction(fields) {
  const { data, error } = await supabase.from(TABLE).insert([fields]).select().single()
  if (error) throw error
  return data
}

export async function updateAuction(id, fields) {
  const { data, error } = await supabase
    .from(TABLE)
    .update({ ...fields, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteAuction(id) {
  const { error } = await supabase.from(TABLE).delete().eq('id', id)
  if (error) throw error
  return true
}

// درخواست‌های شرکت در یک مزایده، همراه با مشخصات کاربر
export async function getAuctionParticipations(auctionId) {
  const { data, error } = await supabase
    .from('auction_participations')
    .select('*')
    .eq('auction_id', auctionId)
    .order('created_at', { ascending: false })
  if (error) throw error

  const ids = [...new Set((data || []).map((p) => p.user_id).filter(Boolean))]
  if (!ids.length) return data

  // پروفایل‌ها جداگانه خوانده می‌شوند (کلید خارجی به user_profiles تعریف نشده)
  const { data: profiles } = await supabase
    .from('user_profiles')
    .select('auth_user_id, first_name, last_name, full_name, phone, national_id')
    .in('auth_user_id', ids)

  const byId = Object.fromEntries((profiles || []).map((p) => [p.auth_user_id, p]))
  return (data || []).map((p) => {
    const pr = byId[p.user_id]
    return {
      ...p,
      user_name: pr?.full_name || [pr?.first_name, pr?.last_name].filter(Boolean).join(' ') || null,
      user_phone: pr?.phone || null,
      user_national_id: pr?.national_id || null,
    }
  })
}

export async function setParticipationStatus(id, status, { adminNote, result } = {}) {
  const patch = { status, updated_at: new Date().toISOString() }
  if (adminNote !== undefined) patch.admin_note = adminNote
  if (result !== undefined) patch.result = result

  const { data, error } = await supabase
    .from('auction_participations')
    .update(patch)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

// لینک موقت برای دیدن مدارک آپلودشده‌ی کاربر (فقط ادمین)
export async function getParticipationDocUrl(path) {
  const { data, error } = await supabase.storage
    .from('participation-documents')
    .createSignedUrl(path, 300)
  if (error) throw error
  return data.signedUrl
}
