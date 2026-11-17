import { useEffect, useState } from 'react'
import AppIcon from './AppIcons'
import { useGuide } from './GuideContext'
import { setUpdateOpen } from './overlays'
import { applyUpdate, laterRecently, remindLater, useAppUpdate } from './updater'

// پنجره‌ی منحنی «نسخه‌ی جدید آماده است»؛ برنامه فقط بعد از تأیید کاربر به‌روز می‌شود
export default function UpdatePrompt() {
  const { available, latest, checkedAt } = useAppUpdate()
  const { guideOpen } = useGuide()
  const [show, setShow] = useState(false)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (busy) return undefined
    if (!available || guideOpen || laterRecently(latest)) {
      setShow(false)
      return undefined
    }
    const t = setTimeout(() => setShow(true), 900)
    return () => clearTimeout(t)
  }, [available, guideOpen, latest, busy, checkedAt])

  useEffect(() => {
    setUpdateOpen(show)
    return () => setUpdateOpen(false)
  }, [show])

  if (!show) return null

  function later() {
    remindLater(latest)
    setShow(false)
  }

  async function update() {
    setBusy(true)
    await applyUpdate()
  }

  return (
    <div className="guide-overlay" onClick={busy ? undefined : later}>
      <div className="guide-sheet" role="dialog" aria-modal="true" aria-label="به‌روزرسانی برنامه" onClick={(e) => e.stopPropagation()}>
        <div className="guide-sheet__hero" style={{ '--g': '#3E7CB1' }}>
          <span className="guide-sheet__handle" />
          <span className="guide-sheet__icon">
            <AppIcon name="refresh" size={38} stroke={1.7} />
          </span>
        </div>

        <div className="guide-sheet__body">
          <h2 className="guide-sheet__title">نسخه‌ی جدید آماده است</h2>
          <p className="guide-sheet__text">
            برای دریافت امکانات تازه و رفع اشکال‌ها، برنامه را به‌روزرسانی کنید. فقط چند ثانیه طول می‌کشد.
          </p>
          <ul className="guide-sheet__points">
            <li>
              <span className="guide-sheet__point-icon" style={{ '--g': '#2E8B4F' }}><AppIcon name="shield" size={17} /></span>
              رفع اشکال‌ها و پایداری بیشتر
            </li>
            <li>
              <span className="guide-sheet__point-icon" style={{ '--g': '#C2703D' }}><AppIcon name="sparkle" size={17} /></span>
              امکانات و بهبودهای تازه
            </li>
          </ul>
        </div>

        <div className="guide-sheet__actions">
          <button type="button" className="guide-btn guide-btn--primary" onClick={update} disabled={busy}>
            {busy ? 'در حال به‌روزرسانی...' : 'به‌روزرسانی'}
          </button>
          <button type="button" className="guide-btn guide-btn--ghost" onClick={later} disabled={busy}>
            بعداً
          </button>
        </div>
      </div>
    </div>
  )
}
