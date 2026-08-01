// Supabase Edge Function: otp-auth
// مسیر: /functions/v1/otp-auth
// بدنه‌ی درخواست: { action: 'send', phone } یا { action: 'verify', phone, code }
//
// این تابع روی سرور اجرا می‌شود (نه در مرورگر کاربر)، پس کلید پنل پیامک
// و service role هیچ‌وقت برای کاربر قابل‌مشاهده نیست.

import { createClient } from 'jsr:@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const OTP_LENGTH = 6
const OTP_TTL_MINUTES = 5
const RESEND_COOLDOWN_SECONDS = 60
const MAX_VERIFY_ATTEMPTS = 5

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  }
}

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders(), 'Content-Type': 'application/json' },
  })
}

function generateOtpCode() {
  const min = 10 ** (OTP_LENGTH - 1)
  const max = 10 ** OTP_LENGTH - 1
  return String(Math.floor(min + Math.random() * (max - min + 1)))
}

function normalizeIranianPhone(phone) {
  // ورودی‌های رایج (09xxxxxxxxx یا 9xxxxxxxxx یا +989xxxxxxxxx) را یکسان می‌کند
  const digits = phone.replace(/\D/g, '')
  if (digits.startsWith('98')) return '0' + digits.slice(2)
  if (digits.startsWith('0')) return digits
  return '0' + digits
}

// ------------------------------------------------------------
// نقطه‌ی اتصال ماژولار به پنل پیامک. هر سرویس‌دهنده‌ی ایرانی
// (کاوه‌نگار، ملی‌پیامک و غیره) ساختار API متفاوتی دارد؛ وقتی کلید و
// نام provider واقعی را در پنل ادمین وارد کردید، بدنه‌ی این تابع برای
// همان سرویس‌دهنده تکمیل می‌شود. تا آن زمان، کد فقط در sms_log ثبت
// می‌شود تا بتوانید جریان ورود را بدون پیامک واقعی تست کنید.
// ------------------------------------------------------------
async function sendViaSmsProvider({ smsConfig, phone, code }) {
  if (!smsConfig?.is_enabled || !smsConfig?.api_key) {
    return { sent: false, providerResponse: `SMS_DISABLED — کد تست (فقط در پنل ادمین قابل مشاهده): ${code}` }
  }

  // مثال ساختار برای کاوه‌نگار (هنگام تکمیل تنظیمات واقعی، uncomment و provider_name را 'kavenegar' بگذارید):
  // if (smsConfig.provider_name === 'kavenegar') {
  //   const url = `https://api.kavenegar.com/v1/${smsConfig.api_key}/verify/lookup.json`
  //   const params = new URLSearchParams({
  //     receptor: phone,
  //     token: code,
  //     template: smsConfig.otp_template_name || 'verify',
  //   })
  //   const res = await fetch(`${url}?${params}`)
  //   const data = await res.json()
  //   return { sent: res.ok, providerResponse: JSON.stringify(data) }
  // }

  // مثال ساختار برای ملی‌پیامک (هنگام تکمیل، uncomment و provider_name را 'melipayamak' بگذارید):
  // if (smsConfig.provider_name === 'melipayamak') {
  //   const res = await fetch(`https://rest.payamak-panel.com/api/SendSMS/SendSMS`, {
  //     method: 'POST',
  //     headers: { 'Content-Type': 'application/json' },
  //     body: JSON.stringify({
  //       username: smsConfig.provider_name,
  //       password: smsConfig.api_key,
  //       to: phone,
  //       from: smsConfig.sender_number,
  //       text: `کد ورود دیجی‌معدن: ${code}`,
  //     }),
  //   })
  //   const data = await res.json()
  //   return { sent: res.ok, providerResponse: JSON.stringify(data) }
  // }

  return { sent: false, providerResponse: `نام provider ("${smsConfig.provider_name}") هنوز در این تابع پیاده‌سازی نشده است.` }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders() })

  let body
  try {
    body = await req.json()
  } catch {
    return jsonResponse({ error: 'بدنه‌ی درخواست نامعتبر است.' }, 400)
  }

  const { action } = body
  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

  // ============================================================
  // ارسال کد
  // ============================================================
  if (action === 'send') {
    const phone = normalizeIranianPhone(String(body.phone || ''))
    if (!/^09\d{9}$/.test(phone)) {
      return jsonResponse({ error: 'شماره موبایل نامعتبر است.' }, 400)
    }

    const { data: recent } = await supabase
      .from('sms_otp_codes')
      .select('created_at')
      .eq('phone', phone)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (recent) {
      const secondsSinceLast = (Date.now() - new Date(recent.created_at).getTime()) / 1000
      if (secondsSinceLast < RESEND_COOLDOWN_SECONDS) {
        return jsonResponse(
          { error: `لطفا ${Math.ceil(RESEND_COOLDOWN_SECONDS - secondsSinceLast)} ثانیه دیگر دوباره تلاش کنید.` },
          429
        )
      }
    }

    const code = generateOtpCode()
    const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000).toISOString()

    const { error: insertError } = await supabase
      .from('sms_otp_codes')
      .insert([{ phone, code, expires_at: expiresAt }])
    if (insertError) return jsonResponse({ error: 'خطا در ساخت کد تایید.' }, 500)

    const { data: smsConfig } = await supabase.from('sms_config').select('*').limit(1).maybeSingle()
    const { sent, providerResponse } = await sendViaSmsProvider({ smsConfig, phone, code })

    await supabase.from('sms_log').insert([
      {
        phone,
        message_type: 'otp',
        status: sent ? 'sent' : 'failed',
        provider_response: providerResponse,
      },
    ])

    return jsonResponse({ ok: true, smsProviderActive: Boolean(smsConfig?.is_enabled) })
  }

  // ============================================================
  // تایید کد + صدور نشست ورود
  // ============================================================
  if (action === 'verify') {
    const phone = normalizeIranianPhone(String(body.phone || ''))
    const code = String(body.code || '').trim()

    const { data: otpRow } = await supabase
      .from('sms_otp_codes')
      .select('*')
      .eq('phone', phone)
      .is('consumed_at', null)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (!otpRow) return jsonResponse({ error: 'کد تایید یافت نشد. دوباره درخواست بدهید.' }, 400)

    if (otpRow.attempt_count >= MAX_VERIFY_ATTEMPTS) {
      return jsonResponse({ error: 'تعداد تلاش‌های مجاز تمام شده. کد جدید بگیرید.' }, 429)
    }

    if (new Date(otpRow.expires_at) < new Date()) {
      return jsonResponse({ error: 'کد تایید منقضی شده است.' }, 400)
    }

    if (otpRow.code !== code) {
      await supabase
        .from('sms_otp_codes')
        .update({ attempt_count: otpRow.attempt_count + 1 })
        .eq('id', otpRow.id)
      return jsonResponse({ error: 'کد تایید نادرست است.' }, 400)
    }

    await supabase.from('sms_otp_codes').update({ consumed_at: new Date().toISOString() }).eq('id', otpRow.id)

    // پیدا کردن یا ساختن حساب کاربری بر اساس شماره موبایل
    const { data: identity } = await supabase
      .from('phone_identities')
      .select('auth_user_id')
      .eq('phone', phone)
      .maybeSingle()

    // ------------------------------------------------------------------
    // صدور Session بدون وابستگی به Phone Auth Provider
    //
    // OTP این پروژه توسط Edge Function + ملی‌پیامک مدیریت می‌شود، نه توسط
    // Supabase Phone Auth. بنابراین signInWithPassword({ phone }) باعث می‌شود
    // GoTrue تنظیم Phone Provider را بررسی کند و در صورت خاموش بودن آن
    // خطای "Phone logins are disabled" بدهد.
    //
    // برای ورود داخلی، یک email غیرقابل‌استفاده و یکتا بر اساس شماره می‌سازیم
    // و Session را با email + password موقت صادر می‌کنیم. کاربر این ایمیل را
    // در UI نمی‌بیند و ایمیل نیز از قبل تأییدشده علامت‌گذاری می‌شود.
    // ------------------------------------------------------------------
    const randomPassword = crypto.randomUUID()
    const internalEmail = `phone-${phone}@auth.digimadan.local`
    let authUserId

    if (identity) {
      authUserId = identity.auth_user_id

      const { error: updateError } = await supabase.auth.admin.updateUserById(authUserId, {
        email: internalEmail,
        email_confirm: true,
        password: randomPassword,
      })

      if (updateError) {
        console.error('Failed to prepare existing auth user for session:', updateError)
        return jsonResponse({ error: 'خطا در آماده‌سازی حساب کاربری برای ورود.' }, 500)
      }
    } else {
      const { data: created, error: createError } = await supabase.auth.admin.createUser({
        phone,
        email: internalEmail,
        email_confirm: true,
        password: randomPassword,
        phone_confirm: true,
      })

      if (createError || !created?.user) {
        console.error('Failed to create auth user:', createError)
        return jsonResponse({ error: 'خطا در ساخت حساب کاربری.' }, 500)
      }

      authUserId = created.user.id

      const { error: identityError } = await supabase
        .from('phone_identities')
        .insert([{ phone, auth_user_id: authUserId }])

      if (identityError) {
        console.error('Failed to save phone identity:', identityError)
        return jsonResponse({ error: 'حساب ساخته شد اما ثبت هویت شماره موبایل ناموفق بود.' }, 500)
      }
    }

    // از اینجا به بعد با email داخلی وارد می‌شویم؛ بنابراین Phone Provider
    // Supabase لازم نیست فعال باشد و Session عادی Supabase صادر می‌شود.
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: internalEmail,
      password: randomPassword,
    })

    if (signInError || !signInData.session) {
      console.error('Session issuance failed:', signInError)
      return jsonResponse({ error: 'خطا در صدور نشست ورود.' }, 500)
    }

    return jsonResponse({
      ok: true,
      session: {
        access_token: signInData.session.access_token,
        refresh_token: signInData.session.refresh_token,
      },
    })
  }

  return jsonResponse({ error: 'action نامعتبر است.' }, 400)
})
