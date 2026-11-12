import { useEffect, useRef, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { sendOtp, verifyOtpAndLogin } from '../services/smsService'
import { ensurePhoneOnLogin, getMyProfile, isIdentityComplete } from '../services/profileService'
import './Login.css'

const PHONE_REGEX = /^09\d{9}$/
const OTP_MAX_LENGTH = 10
const OTP_MIN_LENGTH = 4
const OTP_AUTO_SUBMIT_DEBOUNCE_MS = 600

export default function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const redirectTo = location.state?.redirectTo || '/'

  const [step, setStep] = useState('phone') // 'phone' | 'code'
  const [phone, setPhone] = useState('')
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)
  const [error, setError] = useState(null)
  const [info, setInfo] = useState(null)

  // برای جلوگیری از ارسال/تایید تکراری وقتی کاربر همچنان تایپ می‌کند
  const otpSentForPhone = useRef(null)
  const verifiedForCode = useRef(null)

  // به محض این‌که شماره موبایل معتبر (۱۱ رقمی) کامل شد، خودکار کد را بفرست
  useEffect(() => {
    if (step !== 'phone') return
    if (!PHONE_REGEX.test(phone)) return
    if (otpSentForPhone.current === phone) return

    otpSentForPhone.current = phone
    handleSendOtp()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phone, step])

  // وقتی کاربر تایپ کردن کد را متوقف کرد (و حداقل طول لازم را وارد کرده)، خودکار تایید کن
  useEffect(() => {
    if (step !== 'code') return
    if (code.length < OTP_MIN_LENGTH) return
    if (verifiedForCode.current === code) return

    const timer = setTimeout(() => {
      verifiedForCode.current = code
      handleVerify()
    }, OTP_AUTO_SUBMIT_DEBOUNCE_MS)

    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code, step])

  async function handleSendOtp(e) {
    e?.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const result = await sendOtp(phone)
      setStep('code')
      setInfo(
        result.smsProviderActive
          ? 'کد تایید برای شما ارسال شد.'
          : 'سرویس پیامک هنوز فعال نشده؛ کد تست در پنل ادمین (بخش لاگ پیامک) قابل مشاهده است.'
      )
    } catch (err) {
      setError(err.message)
      otpSentForPhone.current = null // اجازه بده دوباره تلاش خودکار انجام شود
    } finally {
      setLoading(false)
    }
  }

  async function handleVerify(e) {
    e?.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const result = await verifyOtpAndLogin(phone, code)
      // خطای ساخت پروفایل دیگر بی‌صدا نادیده گرفته نمی‌شود؛ قبلا اگر
      // این مرحله شکست می‌خورد کاربر بدون پروفایل وارد می‌شد و ذخیره‌ی
      // مشخصات تا خروج و ورود دوباره کار نمی‌کرد.
      try {
        await ensurePhoneOnLogin(result.session.user.id, phone)
      } catch (e) {
        setError('ورود انجام شد اما ساخت پروفایل ناموفق بود. لطفاً صفحه را تازه کنید.')
        setLoading(false)
        return
      }

      // اگر کاربر هنوز اطلاعات هویتی‌اش (نام، نام خانوادگی، کدملی) را کامل نکرده،
      // اول باید به صفحه‌ی تکمیل اطلاعات برود؛ بعد از ذخیره، خودش به صفحه‌ی اصلی می‌رود.
      const profile = await getMyProfile(result.session.user.id).catch(() => null)
      if (!isIdentityComplete(profile)) {
        navigate('/dashboard?tab=profile&needsIdentity=1', { replace: true })
      } else {
        navigate(redirectTo, { replace: true })
      }
    } catch (err) {
      setError(err.message)
      verifiedForCode.current = null // اجازه بده با کد درست دوباره تلاش خودکار انجام شود
    } finally {
      setLoading(false)
    }
  }

  function handleChangePhone() {
    setStep('phone')
    setCode('')
    setError(null)
    setInfo(null)
    otpSentForPhone.current = null
    verifiedForCode.current = null
  }

  // کد به گوشی نرسیده -- بدون برگشتن به مرحله‌ی شماره، دوباره درخواست ارسال بده
  async function handleResend() {
    setError(null)
    setResending(true)
    try {
      const result = await sendOtp(phone)
      setCode('')
      verifiedForCode.current = null
      setInfo(
        result.smsProviderActive
          ? 'کد تایید دوباره برای شما ارسال شد.'
          : 'سرویس پیامک هنوز فعال نشده؛ کد تست در پنل ادمین (بخش لاگ پیامک) قابل مشاهده است.'
      )
    } catch (err) {
      setError(err.message)
    } finally {
      setResending(false)
    }
  }

  return (
    <div className="container login-page">
      <div className="login-card">
        <h1>ثبت نام / ورود به دیجی‌معدن</h1>
        <p className="login-card__subtitle">
          شماره موبایل خود را وارد کنید؛ کد تایید به‌صورت خودکار ارسال و بررسی می‌شود.
        </p>

        {step === 'phone' && (
          <form onSubmit={handleSendOtp} className="login-form">
            <label htmlFor="phone">شماره موبایل</label>
            <input
              id="phone"
              type="tel"
              inputMode="numeric"
              maxLength={11}
              placeholder="09xxxxxxxxx"
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
              autoFocus
              required
            />
            {error && <p className="login-form__error">{error}</p>}
            {loading && <p className="login-form__info">در حال ارسال کد تایید...</p>}
          </form>
        )}

        {step === 'code' && (
          <form onSubmit={handleVerify} className="login-form">
            {info && <p className="login-form__info">{info}</p>}
            <label htmlFor="code">کد تایید ارسال‌شده به {phone}</label>
            <input
              id="code"
              type="text"
              inputMode="numeric"
              maxLength={OTP_MAX_LENGTH}
              placeholder="------"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, OTP_MAX_LENGTH))}
              autoFocus
              required
            />
            {loading && <p className="login-form__info">در حال بررسی کد...</p>}
            {error && <p className="login-form__error">{error}</p>}
            <div className="login-form__code-actions">
              <button
                type="button"
                className="btn btn-outline btn-sm"
                disabled={resending}
                onClick={handleResend}
              >
                {resending ? 'در حال ارسال مجدد...' : 'کد را دریافت نکردید؟ ارسال مجدد'}
              </button>
              <button
                type="button"
                className="btn btn-outline btn-sm login-form__change-phone"
                onClick={handleChangePhone}
              >
                تغییر شماره موبایل
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
