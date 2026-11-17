import { useCallback, useEffect, useState } from 'react'

// نسخه‌ی همین برنامه (هنگام ساخت تعیین می‌شود) و آخرین نسخه‌ی منتشرشده (version.json)
// eslint-disable-next-line no-undef
export const APP_VERSION = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : 'dev'

const LATER_KEY = 'dm_update_later'
const LATER_HOURS = 6

async function fetchLatestVersion() {
  try {
    const r = await fetch('/version.json?t=' + Date.now(), { cache: 'no-store' })
    if (!r.ok) return null
    const j = await r.json()
    return typeof j.version === 'string' ? j.version : null
  } catch {
    return null
  }
}

export function laterRecently(version) {
  try {
    const x = JSON.parse(localStorage.getItem(LATER_KEY) || 'null')
    return Boolean(x && x.version === version && Date.now() - x.at < LATER_HOURS * 3600e3)
  } catch {
    return false
  }
}
export function remindLater(version) {
  try {
    localStorage.setItem(LATER_KEY, JSON.stringify({ version, at: Date.now() }))
  } catch {
    /* ignore */
  }
}

// هر بار که برنامه باز می‌شود، به اینترنت وصل می‌شود یا کاربر به برنامه برمی‌گردد
// (و هر ۱۵ دقیقه) بررسی می‌کند نسخه‌ی تازه‌ای منتشر شده یا نه
export function useAppUpdate() {
  const [latest, setLatest] = useState(null)
  const [checkedAt, setCheckedAt] = useState(0)

  const check = useCallback(async () => {
    if (!import.meta.env.PROD) return
    const v = await fetchLatestVersion()
    if (v && v !== APP_VERSION) setLatest(v)
    // هر بررسی، «بعداً»ی قبلی را دوباره می‌سنجد؛ بعد از ۶ ساعت پنجره دوباره می‌آید
    setCheckedAt(Date.now())
    try {
      const reg = await navigator.serviceWorker.getRegistration()
      if (reg) reg.update()
    } catch {
      /* ignore */
    }
  }, [])

  useEffect(() => {
    check()
    const timer = setInterval(check, 15 * 60e3)
    const onVis = () => document.visibilityState === 'visible' && check()
    document.addEventListener('visibilitychange', onVis)
    window.addEventListener('online', check)
    return () => {
      clearInterval(timer)
      document.removeEventListener('visibilitychange', onVis)
      window.removeEventListener('online', check)
    }
  }, [check])

  return { available: Boolean(latest), latest, checkedAt }
}

// بعد از تأیید کاربر: سرویس‌ورکر تازه فعال می‌شود و برنامه از نو باز می‌شود
export async function applyUpdate() {
  let reloaded = false
  const reload = () => {
    if (reloaded) return
    reloaded = true
    window.location.reload()
  }
  try {
    const reg = await navigator.serviceWorker.getRegistration()
    if (reg) {
      if (!reg.waiting) await reg.update().catch(() => {})
      if (reg.waiting) {
        navigator.serviceWorker.addEventListener('controllerchange', reload)
        reg.waiting.postMessage({ type: 'SKIP_WAITING' })
        setTimeout(reload, 2500)
        return
      }
    }
  } catch {
    /* ignore */
  }
  reload()
}
