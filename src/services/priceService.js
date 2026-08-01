import { supabase } from '../lib/supabaseClient'

// همه‌ی اقلام قیمت همراه با آخرین مقدار ثبت‌شده (دیده‌شده توسط بازدیدکننده‌ی عمومی)
export async function getAllPrices() {
  const { data, error } = await supabase
    .from('price_items')
    .select('*, price_values(*)')
    .eq('is_active', true)
    .order('sort_order', { ascending: true })
  if (error) throw error
  return data
}

export async function getPriceHistory(priceItemId, { days = 30 } = {}) {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()
  const { data, error } = await supabase
    .from('price_history')
    .select('*')
    .eq('price_item_id', priceItemId)
    .gte('recorded_at', since)
    .order('recorded_at', { ascending: true })
  if (error) throw error
  return data
}

// ------------------------------------------------------------
// علاقه‌مندی‌ها و هشدارهای قیمت کاربر
// ------------------------------------------------------------
export async function getUserPriceFavorites(authUserId) {
  const { data, error } = await supabase
    .from('user_price_favorites')
    .select('price_item_id')
    .eq('auth_user_id', authUserId)
  if (error) throw error
  return data.map((r) => r.price_item_id)
}

export async function togglePriceFavorite(authUserId, priceItemId, isFavorite) {
  if (isFavorite) {
    const { error } = await supabase
      .from('user_price_favorites')
      .delete()
      .eq('auth_user_id', authUserId)
      .eq('price_item_id', priceItemId)
    if (error) throw error
  } else {
    const { error } = await supabase
      .from('user_price_favorites')
      .insert([{ auth_user_id: authUserId, price_item_id: priceItemId }])
    if (error) throw error
  }
}

export async function createPriceAlert({ authUserId, priceItemId, targetValue, direction }) {
  const { data, error } = await supabase
    .from('user_price_alerts')
    .insert([{ auth_user_id: authUserId, price_item_id: priceItemId, target_value: targetValue, direction }])
    .select()
    .single()
  if (error) throw error
  return data
}

export async function getUserPriceAlerts(authUserId) {
  const { data, error } = await supabase
    .from('user_price_alerts')
    .select('*, price_items(label_fa, unit)')
    .eq('auth_user_id', authUserId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

// ------------------------------------------------------------
// ادمین: تنظیمات سرویس‌دهنده‌ی قیمت (کلید API بعدا از همینجا وارد می‌شود)
// و ویرایش دستی قیمت‌های ایرانی که API عمومی ندارند
// ------------------------------------------------------------
export async function getPriceProviderConfig() {
  const { data, error } = await supabase.from('price_provider_config').select('*').limit(1).single()
  if (error) throw error
  return data
}

export async function updatePriceProviderConfig(updates) {
  const config = await getPriceProviderConfig()
  const { data, error } = await supabase
    .from('price_provider_config')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', config.id)
    .select()
    .single()
  if (error) throw error
  return data
}

// ادمین قیمت یک قلم (معمولا قلم‌های ایرانی بدون API) را دستی به‌روزرسانی می‌کند
export async function manuallyUpdatePrice(priceItemId, { currentValue, dayLow, dayHigh }) {
  const { data: existing } = await supabase
    .from('price_values')
    .select('current_value')
    .eq('price_item_id', priceItemId)
    .maybeSingle()

  const { data, error } = await supabase
    .from('price_values')
    .update({
      previous_value: existing?.current_value ?? null,
      current_value: currentValue,
      day_low: dayLow,
      day_high: dayHigh,
      updated_at: new Date().toISOString(),
    })
    .eq('price_item_id', priceItemId)
    .select()
    .single()
  if (error) throw error

  await supabase.from('price_history').insert([{ price_item_id: priceItemId, value: currentValue }])

  return data
}
