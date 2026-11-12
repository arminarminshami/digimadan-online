import { useNavigate, useLocation } from 'react-router-dom'
import './BackButton.css'

/**
 * دکمه‌ی بازگشت زیر هدر
 * ---------------------------------------------------------------
 * در صفحه‌ی اصلی نمایش داده نمی‌شود (جایی برای بازگشت وجود ندارد).
 *
 * اگر کاربر تاریخچه‌ی مرور داشته باشد به صفحه‌ی قبلی برمی‌گردد؛ در غیر
 * این صورت (مثلا وقتی لینک آگهی را مستقیم از گوگل یا تلگرام باز کرده)
 * به صفحه‌ی اصلی می‌رود تا دکمه هیچ‌وقت بی‌اثر نباشد.
 */
export default function BackButton() {
  const navigate = useNavigate()
  const location = useLocation()

  if (location.pathname === '/') return null

  function handleBack() {
    if (window.history.length > 1) navigate(-1)
    else navigate('/')
  }

  return (
    <div className="back-bar">
      <div className="container">
        <button type="button" className="back-bar__btn" onClick={handleBack}>
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            {/* فلش به سمت راست، چون چیدمان سایت راست‌به‌چپ است */}
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
          بازگشت
        </button>
      </div>
    </div>
  )
}
