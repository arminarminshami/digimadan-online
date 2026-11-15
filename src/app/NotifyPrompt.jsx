import { useEffect, useRef, useState } from 'react'
import AppIcon from './AppIcons'
import { useGuide } from './GuideContext'
import { enablePush, pushPermission, pushSupported } from './push'

const DISMISS_KEY = 'dm_notify_dismissed_at'
const DISMISS_DAYS = 7

function dismissedRecently() {
  try {
    const t = Number(localStorage.getItem(DISMISS_KEY) || 0)
    return t && Date.now() - t < DISMISS_DAYS * 86400e3
  } catch {
    return false
  }
}
function welcomeSeen(key) {
  try {
    return Boolean(JSON.parse(localStorage.getItem('dm_guides_seen') || '{}')[key])
  } catch {
    return false
  }
}

// پنجره‌ی منحنی: اجازه‌ی فعال‌کردن اعلان‌ها (بعد از راهنمای اولیه)
export default function NotifyPrompt({ variant = 'user' }) {
  const admin = variant === 'admin'
  const welcomeKey = admin ? 'adminWelcome' : 'welcome'
  const { guideOpen } = useGuide()
  const [eligible, setEligible] = useState(false)
  const [show, setShow] = useState(false)
  const [state, setState] = useState('idle') // idle | busy | done | denied | error
  // بعد از فعال‌شدن، رد‌کردن یا «بعداً» این پنجره دیگر هرگز خودکار باز نمی‌شود
  const finished = useRef(false)

  useEffect(() => {
    if (finished.current || !pushSupported() || pushPermission() !== 'default' || dismissedRecently()) return undefined
    const t = setTimeout(() => setEligible(true), 4000)
    return () => clearTimeout(t)
  }, [])

  // فقط وقتی راهنما بسته است و راهنمای خوش‌آمدگویی دیده شده
  useEffect(() => {
    // فقط وقتی هنوز اجازه‌ای داده نشده و کاربر این پنجره را تمام نکرده
    if (finished.current || !eligible || guideOpen || !welcomeSeen(welcomeKey) || pushPermission() !== 'default') {
      if (state === 'idle') setShow(false)
      return undefined
    }
    const t = setTimeout(() => setShow(true), 1200)
    return () => clearTimeout(t)
  }, [eligible, guideOpen, state, welcomeKey])

  if (!show) return null

  function close() {
    finished.current = true
    setEligible(false)
    setShow(false)
  }

  function later() {
    finished.current = true
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now()))
    } catch {
      /* ignore */
    }
    setEligible(false)
    setShow(false)
  }

  async function enable() {
    setState('busy')
    try {
      const r = await enablePush()
      finished.current = true
      if (r.ok) setState('done')
      else if (r.reason === 'denied') setState('denied')
      else {
        setState('idle')
        later()
      }
    } catch {
      finished.current = true
      setState('error')
    }
  }

  const done = state === 'done'
  const bad = state === 'denied' || state === 'error'

  return (
    <div className="guide-overlay" onClick={state === 'busy' ? undefined : later}>
      <div className="guide-sheet" role="dialog" aria-modal="true" aria-label="فعال‌سازی اعلان‌ها" onClick={(e) => e.stopPropagation()}>
        <div className="guide-sheet__hero" style={{ '--g': done ? '#2E8B4F' : bad ? '#B5483A' : '#D9A21B' }}>
          <span className="guide-sheet__handle" />
          <span className="guide-sheet__icon">
            <AppIcon name={done ? 'check' : 'bell'} size={38} stroke={1.7} />
          </span>
        </div>

        <div className="guide-sheet__body">
          {state === 'idle' || state === 'busy' ? (
            <>
              <h2 className="guide-sheet__title">اعلان‌ها را فعال کنید</h2>
              <p className="guide-sheet__text">هر اتفاق مهم را همان لحظه، حتی وقتی اپلیکیشن بسته است، ببینید.</p>
              <ul className="guide-sheet__points">
                {admin ? (
                  <li>
                    <span className="guide-sheet__point-icon" style={{ '--g': '#C2703D' }}><AppIcon name="tag" size={17} /></span>
                    آگهی جدیدی که منتظر تأیید شماست
                  </li>
                ) : (
                  <>
                    <li>
                      <span className="guide-sheet__point-icon" style={{ '--g': '#C2703D' }}><AppIcon name="tag" size={17} /></span>
                      انتشار آگهی‌های تازه
                    </li>
                    <li>
                      <span className="guide-sheet__point-icon" style={{ '--g': '#2E8B4F' }}><AppIcon name="shield" size={17} /></span>
                      تأیید آگهی شما توسط ادمین
                    </li>
                    <li>
                      <span className="guide-sheet__point-icon" style={{ '--g': '#3E7CB1' }}><AppIcon name="message" size={17} /></span>
                      پیام‌های جدید در پنل کاربری
                    </li>
                  </>
                )}
              </ul>
            </>
          ) : done ? (
            <>
              <h2 className="guide-sheet__title">اعلان‌ها فعال شد</h2>
              <p className="guide-sheet__text">یک اعلان آزمایشی برای شما فرستادیم. از این به بعد اتفاق‌های مهم را همین‌جا می‌بینید.</p>
            </>
          ) : (
            <>
              <h2 className="guide-sheet__title">اعلان‌ها فعال نشد</h2>
              <p className="guide-sheet__text">
                {state === 'denied'
                  ? 'اجازه‌ی اعلان داده نشد. هر وقت خواستید، از تنظیمات گوشی (بخش اعلان‌های دیجی‌معدن) آن را فعال کنید.'
                  : 'مشکلی پیش آمد. بعداً از بخش «حساب من» دوباره تلاش کنید.'}
              </p>
            </>
          )}
        </div>

        <div className="guide-sheet__actions">
          {state === 'idle' || state === 'busy' ? (
            <>
              <button type="button" className="guide-btn guide-btn--primary" onClick={enable} disabled={state === 'busy'}>
                {state === 'busy' ? 'در حال فعال‌سازی...' : 'فعال‌سازی اعلان‌ها'}
              </button>
              <button type="button" className="guide-btn guide-btn--ghost" onClick={later} disabled={state === 'busy'}>
                بعداً
              </button>
            </>
          ) : (
            <button type="button" className="guide-btn guide-btn--primary" onClick={close}>
              بستن
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
