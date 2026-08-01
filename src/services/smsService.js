import { supabase } from '../lib/supabaseClient'

const FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/otp-auth`

async function callOtpFunction(payload) {
  const res = await fetch(FUNCTION_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
    },
    body: JSON.stringify(payload),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'خطای ناشناخته در سرویس پیامک.')
  return data
}

// ارسال کد تایید به شماره موبایل
export async function sendOtp(phone) {
  return callOtpFunction({ action: 'send', phone })
}

// تایید کد و ورود خودکار کاربر
export async function verifyOtpAndLogin(phone, code) {
  const result = await callOtpFunction({ action: 'verify', phone, code })
  const { access_token, refresh_token } = result.session
  const { data, error } = await supabase.auth.setSession({ access_token, refresh_token })
  if (error) throw new Error('ورود با خطا مواجه شد. لطفاً دوباره تلاش کنید.')
  return { ...result, session: data.session }
}

// ------------------------------------------------------------
// ادمین: تنظیمات پنل پیامک (نام provider، کلید API، شماره فرستنده)
// همین که اطلاعات واقعی پنل را اینجا وارد کنید، ارسال واقعی فعال می‌شود.
// ------------------------------------------------------------
// گزارش‌های پنل پیامک ملی‌پیامک: اعتبار / لیست پیامک‌ها / تعداد دریافتی / وضعیت ارسال
// (فقط ادمین؛ توکن پنل هیچ‌وقت به مرورگر افشا نمی‌شود)
export async function getSmsReport(action, body) {
  const { data, error } = await supabase.functions.invoke(`sms-reports?action=${action}`, {
    method: 'POST',
    body: body || {},
  })
  if (error) throw new Error('دریافت گزارش با خطا مواجه شد.')
  if (data?.error) throw new Error(data.error)
  return data.result
}

export async function getSmsConfig() {
  const { data, error } = await supabase.from('sms_config').select('*').limit(1).single()
  if (error) throw error
  return data
}

export async function updateSmsConfig(updates) {
  const config = await getSmsConfig()
  const { data, error } = await supabase
    .from('sms_config')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', config.id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function getSmsLog({ limit = 50 } = {}) {
  const { data, error } = await supabase
    .from('sms_log')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) throw error
  return data
}
