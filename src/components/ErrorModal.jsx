import { useEffect } from 'react'
import './ErrorModal.css'

/**
 * پنجره‌ی خطای سراسری سایت
 * ---------------------------------------------------------------
 * یک کارت سفید کوچک وسط صفحه با علامت ضربدر قرمز، متن خطا و دکمه‌ی
 * بستن. همه‌ی خطاهای سایت از همین کامپوننت استفاده می‌کنند تا تجربه‌ی
 * کاربر یکدست باشد و کاربر دقیقا متوجه شود چه اتفاقی افتاده است.
 *
 * بستن با: دکمه‌ی «بستن»، کلیک روی پس‌زمینه، یا کلید Esc
 */
export default function ErrorModal({ message, title = 'خطا', onClose }) {
  useEffect(() => {
    if (!message) return
    function onKey(e) {
      if (e.key === 'Escape') onClose?.()
    }
    document.addEventListener('keydown', onKey)
    // جلوگیری از اسکرول پس‌زمینه وقتی پنجره باز است
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [message, onClose])

  if (!message) return null

  return (
    <div className="error-modal__backdrop" onClick={() => onClose?.()}>
      <div
        className="error-modal"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="error-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="error-modal__icon" aria-hidden="true">
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </div>

        <h2 className="error-modal__title" id="error-modal-title">{title}</h2>
        <p className="error-modal__message">{message}</p>

        <button type="button" className="error-modal__close" onClick={() => onClose?.()} autoFocus>
          بستن
        </button>
      </div>
    </div>
  )
}
