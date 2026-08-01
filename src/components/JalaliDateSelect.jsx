import { useEffect, useState } from 'react'
import { isoToJalali, jalaliToIso, jalaliMonthLength, PERSIAN_MONTHS } from '../lib/jalali'
import './JalaliDateSelect.css'

const CURRENT_JALALI_YEAR = isoToJalali(new Date().toISOString().slice(0, 10)).jy

/**
 * انتخاب تاریخ شمسی (روز / ماه / سال)
 * ---------------------------------------------------------------
 * مقدار ورودی و خروجی همیشه تاریخ میلادی به شکل 'YYYY-MM-DD' است،
 * چون دیتابیس تاریخ را میلادی ذخیره می‌کند؛ تبدیل فقط برای نمایش
 * انجام می‌شود. کاربر هیچ‌وقت تاریخ میلادی نمی‌بیند.
 *
 * yearsBack / yearsForward بازه‌ی سال‌های قابل انتخاب را تعیین می‌کنند
 * (برای تاریخ تولد به عقب، برای مزایده به جلو).
 */
export default function JalaliDateSelect({
  value,
  onChange,
  yearsBack = 100,
  yearsForward = 0,
}) {
  // نکته‌ی مهم: سه بخش تاریخ در state داخلی نگه داشته می‌شوند.
  // اگر مستقیم از روی value خوانده می‌شدند، انتخابِ «روز» در حالی که
  // ماه و سال هنوز خالی‌اند باعث onChange('') و پاک‌شدن فوری همان
  // انتخاب می‌شد و عملا هیچ تاریخی قابل انتخاب نبود.
  const parsed = isoToJalali(value)
  const [parts, setParts] = useState({
    jy: parsed?.jy || '',
    jm: parsed?.jm || '',
    jd: parsed?.jd || '',
  })

  // اگر مقدار از بیرون عوض شد (مثلا بارگذاری پروفایل)، state هماهنگ شود
  useEffect(() => {
    const p = isoToJalali(value)
    setParts({ jy: p?.jy || '', jm: p?.jm || '', jd: p?.jd || '' })
  }, [value])

  function pick(field, raw) {
    const v = raw === '' ? '' : Number(raw)
    const next = { ...parts, [field]: v }

    // اگر روزِ انتخاب‌شده از طول ماه جدید بیشتر بود، اصلاح می‌شود
    if (next.jy && next.jm && next.jd) {
      const maxDay = jalaliMonthLength(Number(next.jy), Number(next.jm))
      if (Number(next.jd) > maxDay) next.jd = maxDay
    }

    setParts(next)

    // فقط وقتی هر سه بخش کامل شد، مقدار میلادی به والد داده می‌شود
    if (next.jy && next.jm && next.jd) {
      onChange(jalaliToIso(next.jy, next.jm, next.jd))
    } else if (value) {
      onChange('')
    }
  }

  const daysInMonth =
    parts.jy && parts.jm ? jalaliMonthLength(Number(parts.jy), Number(parts.jm)) : 31

  const years = []
  for (let y = CURRENT_JALALI_YEAR + yearsForward; y >= CURRENT_JALALI_YEAR - yearsBack; y -= 1) {
    years.push(y)
  }

  return (
    <div className="jalali-date-select">
      <select value={parts.jd} onChange={(e) => pick('jd', e.target.value)}>
        <option value="">روز</option>
        {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((d) => (
          <option key={d} value={d}>{d}</option>
        ))}
      </select>
      <select value={parts.jm} onChange={(e) => pick('jm', e.target.value)}>
        <option value="">ماه</option>
        {PERSIAN_MONTHS.map((name, idx) => (
          <option key={name} value={idx + 1}>{name}</option>
        ))}
      </select>
      <select value={parts.jy} onChange={(e) => pick('jy', e.target.value)}>
        <option value="">سال</option>
        {years.map((y) => (
          <option key={y} value={y}>{y}</option>
        ))}
      </select>
    </div>
  )
}

// تاریخ محلی را به 'YYYY-MM-DD' تبدیل می‌کند.
// نکته‌ی مهم: از toISOString استفاده نمی‌شود چون آن تاریخ را به UTC
// می‌برد و در ایران (+۳:۳۰) ساعت‌های ابتدای شبانه‌روز یک روز به عقب
// می‌پرند؛ همین باعث می‌شد انتخاب تاریخ درست کار نکند.
function toLocalDateString(d) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function JalaliDateTimeSelect({ value, onChange, yearsForward = 3 }) {
  const d = value ? new Date(value) : null
  const valid = d && !isNaN(d)
  const isoDate = valid ? toLocalDateString(d) : ''
  const hh = valid ? String(d.getHours()).padStart(2, '0') : '00'
  const mm = valid ? String(d.getMinutes()).padStart(2, '0') : '00'

  function emit(nextIsoDate, nextHH, nextMM) {
    if (!nextIsoDate) {
      onChange('')
      return
    }
    // ساعت به وقت محلی کاربر ساخته و به شکل ISO ذخیره می‌شود
    const [y, m, day] = nextIsoDate.split('-').map(Number)
    const dt = new Date(y, m - 1, day, Number(nextHH), Number(nextMM), 0)
    if (isNaN(dt)) return
    onChange(dt.toISOString())
  }

  return (
    <div className="jalali-datetime">
      <JalaliDateSelect
        value={isoDate}
        onChange={(v) => emit(v, hh, mm)}
        yearsBack={1}
        yearsForward={yearsForward}
      />
      <div className="jalali-datetime__time">
        <select value={hh} onChange={(e) => emit(isoDate, e.target.value, mm)}>
          {Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0')).map((h) => (
            <option key={h} value={h}>{h}</option>
          ))}
        </select>
        <span className="jalali-datetime__colon">:</span>
        <select value={mm} onChange={(e) => emit(isoDate, hh, e.target.value)}>
          {['00', '15', '30', '45'].map((m) => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
      </div>
    </div>
  )
}

// نمایش تاریخ و ساعت شمسی در متن (برای صفحات نمایشی)
export function formatJalaliDateTime(value) {
  if (!value) return '—'
  const d = new Date(value)
  if (isNaN(d)) return '—'
  const date = d.toLocaleDateString('fa-IR', { year: 'numeric', month: 'long', day: 'numeric' })
  const time = d.toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })
  return `${date} ساعت ${time}`
}

export function formatJalaliDate(value) {
  if (!value) return '—'
  const d = new Date(value)
  if (isNaN(d)) return '—'
  return d.toLocaleDateString('fa-IR', { year: 'numeric', month: 'long', day: 'numeric' })
}
