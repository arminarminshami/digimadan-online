import { useEffect, useMemo, useRef, useState } from 'react'
import './SearchableSelect.css'

// یکسان‌سازی متن فارسی برای جست‌وجو: حروف عربی (ي/ك) به فارسی (ی/ک)،
// حذف نیم‌فاصله و اعراب، تا «فلوريت» هم «فلوریت» را پیدا کند.
function normalizeFa(s) {
  return String(s || '')
    .toLowerCase()
    .replace(/\u064a/g, '\u06cc')
    .replace(/\u0643/g, '\u06a9')
    .replace(/[\u200c\u200f\u200e]/g, ' ')
    .replace(/[\u064b-\u0652]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function toItems(items) {
  return items.map((it) => (typeof it === 'string' ? { value: it, label: it } : it))
}

/**
 * انتخابگر قابل جست‌وجو
 * ---------------------------------------------------------------
 * جایگزین <select> برای فهرست‌های طولانی (مثل ۲۵۱ ماده معدنی).
 * کاربر می‌تواند تایپ کند و فهرست فیلتر شود.
 *
 * groups: [{ group, label, items: [string | {value,label}] }]
 */
export default function SearchableSelect({
  groups = [],
  value = '',
  onChange,
  placeholder = 'انتخاب کنید',
  searchPlaceholder = 'جست‌وجو...',
  extraOption = null, // مثلا { value: 'سایر', label: 'سایر' }
  disabled = false,
  id,
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const wrapRef = useRef(null)
  const inputRef = useRef(null)

  // برچسب گزینه‌ی انتخاب‌شده را از میان همه‌ی گروه‌ها پیدا می‌کند
  const selectedLabel = useMemo(() => {
    if (!value) return ''
    if (extraOption && extraOption.value === value) return extraOption.label
    for (const g of groups) {
      const found = toItems(g.items).find((it) => it.value === value)
      if (found) return found.label
    }
    return value
  }, [value, groups, extraOption])

  const filtered = useMemo(() => {
    const q = normalizeFa(query)
    if (!q) return groups
    return groups
      .map((g) => ({ ...g, items: toItems(g.items).filter((it) => normalizeFa(it.label).includes(q)) }))
      .filter((g) => g.items.length > 0)
  }, [groups, query])

  const totalFound = filtered.reduce((n, g) => n + g.items.length, 0)

  useEffect(() => {
    function onDocClick(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false)
    }
    function onKey(e) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDocClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDocClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [])

  useEffect(() => {
    if (open) inputRef.current?.focus()
    else setQuery('')
  }, [open])

  function pick(v) {
    onChange?.(v)
    setOpen(false)
  }

  return (
    <div className={'ss' + (disabled ? ' ss--disabled' : '')} ref={wrapRef}>
      <button
        type="button"
        id={id}
        className="ss__trigger"
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className={selectedLabel ? 'ss__value' : 'ss__value ss__value--empty'}>
          {selectedLabel || placeholder}
        </span>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {/*
        توضیح: stopPropagation جلوی رسیدن کلیک به عنصر والد را می‌گیرد؛
        وگرنه انتخاب یک گزینه باعث باز شدن دوباره‌ی فهرست می‌شد.
      */}
      {open && (
        <div className="ss__panel" onClick={(e) => e.stopPropagation()}>
          <div className="ss__search">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="7" />
              <path d="m21 21-4.3-4.3" />
            </svg>
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={searchPlaceholder}
            />
          </div>

          <div className="ss__list" role="listbox">
            <button type="button" className="ss__option ss__option--clear" onClick={() => pick('')}>
              {placeholder}
            </button>

            {totalFound === 0 && <p className="ss__empty">موردی پیدا نشد.</p>}

            {filtered.map((g) => (
              <div key={g.group ?? g.label} className="ss__group">
                <span className="ss__group-label">{g.label}</span>
                {toItems(g.items).map((it) => (
                  <button
                    type="button"
                    key={it.value}
                    className={'ss__option' + (it.value === value ? ' ss__option--active' : '')}
                    onClick={() => pick(it.value)}
                    role="option"
                    aria-selected={it.value === value}
                  >
                    {it.label}
                  </button>
                ))}
              </div>
            ))}

            {extraOption && !query && (
              <button
                type="button"
                className={'ss__option' + (extraOption.value === value ? ' ss__option--active' : '')}
                onClick={() => pick(extraOption.value)}
              >
                {extraOption.label}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
