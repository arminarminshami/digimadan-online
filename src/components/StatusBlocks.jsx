import { useState, useEffect } from 'react'
import ErrorModal from './ErrorModal'
import './StatusBlocks.css'

export function LoadingBlock({ label = 'در حال بارگذاری...' }) {
  return (
    <div className="status-block">
      <div className="status-block__spinner" />
      <p>{label}</p>
    </div>
  )
}

export function EmptyBlock({ title = 'موردی یافت نشد', hint }) {
  return (
    <div className="status-block">
      <div className="status-block__icon">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
          <path d="M3 7h18M3 12h18M3 17h18" />
        </svg>
      </div>
      <p className="status-block__title">{title}</p>
      {hint && <p className="status-block__hint">{hint}</p>}
    </div>
  )
}

/**
 * هر خطای سایت به‌صورت یک پنجره‌ی سفید وسط صفحه با ضربدر قرمز نمایش
 * داده می‌شود. چون تمام صفحات از همین کامپوننت استفاده می‌کنند،
 * ظاهر خطاها در کل سایت یکدست است.
 *
 * بعد از بستن پنجره، یک پیام کوتاه در صفحه باقی می‌ماند تا کاربر
 * بداند بارگذاری ناموفق بوده و صفحه خالی به‌نظر نرسد.
 */
export function ErrorBlock({ message = 'مشکلی پیش آمد. لطفاً دوباره تلاش کنید.', title }) {
  const [open, setOpen] = useState(true)

  // با تغییر متن خطا، پنجره دوباره باز می‌شود
  useEffect(() => {
    setOpen(true)
  }, [message])

  return (
    <>
      <ErrorModal message={open ? message : null} title={title} onClose={() => setOpen(false)} />
      <div className="status-block status-block--error">
        <p>{message}</p>
      </div>
    </>
  )
}
