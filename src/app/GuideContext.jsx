import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import AppIcon from './AppIcons'
import { GUIDES } from './guides'
import './GuideSheet.css'

const SEEN_KEY = 'dm_guides_seen'
const GuideCtx = createContext({ openGuide: () => {}, autoGuide: () => {}, guideOpen: false })

function readSeen() {
  try {
    return JSON.parse(localStorage.getItem(SEEN_KEY) || '{}')
  } catch {
    return {}
  }
}
function markSeen(...keys) {
  try {
    const seen = readSeen()
    keys.forEach((k) => (seen[k] = 1))
    localStorage.setItem(SEEN_KEY, JSON.stringify(seen))
  } catch {
    /* ignore */
  }
}

export function useGuide() {
  return useContext(GuideCtx)
}

export function GuideProvider({ children }) {
  const [open, setOpen] = useState(null) // { key, index }
  const timer = useRef(null)

  const openGuide = useCallback((key) => {
    if (GUIDES[key]) setOpen({ key, index: 0 })
  }, [])

  // راهنمای هر بخش فقط بار اول خودکار باز می‌شود
  const autoGuide = useCallback((key) => {
    clearTimeout(timer.current)
    if (!key || !GUIDES[key] || readSeen()[key]) return
    timer.current = setTimeout(() => setOpen((cur) => cur || { key, index: 0 }), 650)
  }, [])

  const close = useCallback(() => {
    setOpen((cur) => {
      if (cur) {
        // راهنمای خوش‌آمدگویی، راهنمای صفحه‌ی اصلی را هم پوشش می‌دهد
        markSeen(
          cur.key,
          ...(cur.key === 'welcome' ? ['home'] : []),
          ...(cur.key === 'adminWelcome' ? ['adminHome'] : [])
        )
      }
      return null
    })
  }, [])

  const value = useMemo(() => ({ openGuide, autoGuide, guideOpen: Boolean(open) }), [openGuide, autoGuide, open])

  return (
    <GuideCtx.Provider value={value}>
      {children}
      {open && <GuideSheet open={open} setOpen={setOpen} onClose={close} />}
    </GuideCtx.Provider>
  )
}

// بار اول اجرای اپلیکیشن: راهنمای خوش‌آمدگویی
export function useFirstRunWelcome(enabled, key = 'welcome') {
  const { openGuide } = useGuide()
  useEffect(() => {
    if (!enabled || readSeen()[key]) return undefined
    const t = setTimeout(() => openGuide(key), 700)
    return () => clearTimeout(t)
  }, [enabled, key, openGuide])
}

function GuideSheet({ open, setOpen, onClose }) {
  const guide = GUIDES[open.key]
  const slides = guide.slides
  const slide = slides[open.index]
  const last = open.index === slides.length - 1

  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="guide-overlay" onClick={onClose}>
      <div
        className="guide-sheet"
        role="dialog"
        aria-modal="true"
        aria-label={slide.title}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="guide-sheet__hero" style={{ '--g': slide.color }}>
          <span className="guide-sheet__handle" />
          <span className="guide-sheet__icon">
            <AppIcon name={slide.icon} size={38} stroke={1.6} />
          </span>
        </div>

        <div className="guide-sheet__body" key={open.index}>
          <h2 className="guide-sheet__title">{slide.title}</h2>
          <p className="guide-sheet__text">{slide.text}</p>
          {slide.points && (
            <ul className="guide-sheet__points">
              {slide.points.map((p) => (
                <li key={p.text}>
                  <span className="guide-sheet__point-icon" style={{ '--g': slide.color }}>
                    <AppIcon name={p.icon} size={17} />
                  </span>
                  {p.text}
                </li>
              ))}
            </ul>
          )}
        </div>

        {slides.length > 1 && (
          <div className="guide-sheet__dots" aria-hidden="true">
            {slides.map((s, i) => (
              <span key={s.title} className={i === open.index ? 'is-active' : ''} />
            ))}
          </div>
        )}

        <div className="guide-sheet__actions">
          {last ? (
            <button type="button" className="guide-btn guide-btn--primary" onClick={onClose}>
              بستن راهنمایی
            </button>
          ) : (
            <>
              <button
                type="button"
                className="guide-btn guide-btn--primary"
                onClick={() => setOpen({ key: open.key, index: open.index + 1 })}
              >
                بعدی
              </button>
              <button type="button" className="guide-btn guide-btn--ghost" onClick={onClose}>
                بستن راهنمایی
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
