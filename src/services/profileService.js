import { supabase } from '../lib/supabaseClient'

const TABLE = 'user_profiles'

// پروفایل کاربر جاری را برمی‌گرداند؛ اگر هنوز ساخته نشده، null
// آیا اطلاعات هویتی ضروری (نام، نام خانوادگی، کد ملی) تکمیل شده؟
export function isIdentityComplete(profile) {
  if (!profile) return false
  return Boolean(profile.first_name?.trim() && profile.last_name?.trim() && profile.national_id?.trim())
}

// بلافاصله بعد از ورود با موبایل، شماره را در اطلاعات تماس پروفایل ثبت می‌کند
// (اگر پروفایلی وجود نداشت، یک رکورد خالی با همین شماره می‌سازد)
export async function ensurePhoneOnLogin(authUserId, phone) {
  // upsert اتمیک: بخوان-سپس-بنویس باعث می‌شد اگر همان لحظه‌ی ورود
  // رکورد ساخته نشود، پروفایل کاربر اصلا وجود نداشته باشد و ذخیره‌ی
  // مشخصات خطا بدهد تا وقتی کاربر یک بار خارج و دوباره وارد شود.
  const { data, error } = await supabase
    .from(TABLE)
    .upsert([{ auth_user_id: authUserId, phone }], { onConflict: 'auth_user_id' })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function getMyProfile(authUserId) {
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .eq('auth_user_id', authUserId)
    .maybeSingle()
  if (error) throw error
  return data
}

// اگر پروفایل وجود نداشت می‌سازد، اگر وجود داشت آپدیت می‌کند
export async function upsertMyProfile(authUserId, fields) {
  const existing = await getMyProfile(authUserId)

  const payload = {
    ...fields,
    auth_user_id: authUserId,
    updated_at: new Date().toISOString(),
  }

  if (existing) {
    const { data, error } = await supabase
      .from(TABLE)
      .update(payload)
      .eq('auth_user_id', authUserId)
      .select()
      .single()
    if (error) throw error
    return data
  }

  const { data, error } = await supabase
    .from(TABLE)
    .insert([{ ...payload, profile_completed: true }])
    .select()
    .single()
  if (error) throw error
  return data
}
