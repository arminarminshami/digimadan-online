import { useEffect, useState } from 'react'
import './InstallPrompt.css'

const DISMISS_KEY = 'dm_install_dismissed_at'
const DISMISS_DAYS = 14

function isStandalone() {
  return (
    (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) ||
    window.navigator.standalone === true
  )
}

function isIOS() {
  const ua = window.navigator.userAgent || ''
  const iPadOS = ua.includes('Macintosh') && 'ontouchend' in document
  return /iPhone|iPad|iPod/.test(ua) || iPadOS
}

function recentlyDismissed() {
  try {
    const t = Number(localStorage.getItem(DISMISS_KEY) || 0)
    return t && Date.now() - t < DISMISS_DAYS * 86400e3
  } catch {
    return false
  }
}

// پیشنهاد نصب وب‌اپلیکیشن؛ فقط روی گوشی و وقتی هنوز نصب نشده
export default function InstallPrompt() {
  const [deferred, setDeferred] = useState(null) // رویداد نصب اندروید/کروم
  const [visible, setVisible] = useState(false)
  const ios = typeof window !== 'undefined' && isIOS()

  useEffect(() => {
    if (isStandalone() || recentlyDismissed()) return undefined
    if (!window.matchMedia('(max-width: 820px)').matches) return undefined

    let timer
    function onBefore(e) {
      e.preventDefault()
      setDeferred(e)
      timer = setTimeout(() => setVisible(true), 4000)
    }
    function onInstalled() {
      setVisible(false)
      setDeferred(null)
    }
    window.addEventListener('beforeinstallprompt', onBefore)
    window.addEventListener('appinstalled', onInstalled)

    // آیفون رویداد نصب ندارد؛ راهنمای «افزودن به صفحه اصلی» نشان داده می‌شود
    if (isIOS()) timer = setTimeout(() => setVisible(true), 4000)

    return () => {
      clearTimeout(timer)
      window.removeEventListener('beforeinstallprompt', onBefore)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])

  function dismiss() {
    setVisible(false)
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now()))
    } catch {
      /* بدون ذخیره‌سازی هم مشکلی نیست */
    }
  }

  async function install() {
    if (!deferred) return
    deferred.prompt()
    try {
      await deferred.userChoice
    } catch {
      /* نادیده */
    }
    setDeferred(null)
    setVisible(false)
  }

  if (!visible) return null
  if (!deferred && !ios) return null

  return (
    <div className="install-prompt" role="dialog" aria-label="نصب اپلیکیشن دیجی‌معدن">
      <img src="/icon-192.png" alt="" className="install-prompt__icon" />
      <div className="install-prompt__text">
        <strong>اپلیکیشن دیجی‌معدن</strong>
        {ios ? (
          <span>
            در Safari دکمه‌ی اشتراک‌گذاری
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M12 16V4M8 8l4-4 4 4M6 12v7a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1v-7" />
            </svg>
            را بزنید و «افزودن به صفحه اصلی» را انتخاب کنید.
          </span>
        ) : (
          <span>با نصب، دیجی‌معدن را مثل یک اپلیکیشن از صفحه اصلی گوشی باز کنید.</span>
        )}
      </div>
      {!ios && (
        <button type="button" className="install-prompt__btn" onClick={install}>
          نصب
        </button>
      )}
      <button type="button" className="install-prompt__close" onClick={dismiss} aria-label="بستن">
        ×
      </button>
    </div>
  )
}
