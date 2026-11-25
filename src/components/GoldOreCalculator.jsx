import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import './GoldOreCalculator.css'

const FA = '۰۱۲۳۴۵۶۷۸۹'
const AR = '٠١٢٣٤٥٦٧٨٩'

// ارقام فارسی/عربی و جداکننده‌ها را به عدد معمولی تبدیل می‌کند
function parseNum(s) {
  if (s == null) return NaN
  const t = String(s)
    .replace(/[۰-۹]/g, (d) => FA.indexOf(d))
    .replace(/[٠-٩]/g, (d) => AR.indexOf(d))
    .replace(/[٬,،\s]/g, '')
    .replace(/٫/g, '.')
  return t === '' ? NaN : Number(t)
}

const fmt = (n, digits = 0) => Number(n).toLocaleString('fa-IR', { maximumFractionDigits: digits })

// «۱۲۳ میلیون تومان» برای خواناتر شدن عددهای بزرگ
function toWords(n) {
  if (!Number.isFinite(n)) return ''
  const abs = Math.abs(n)
  if (abs >= 1e12) return `${fmt(n / 1e12, 2)} هزار میلیارد تومان`
  if (abs >= 1e9) return `${fmt(n / 1e9, 2)} میلیارد تومان`
  if (abs >= 1e6) return `${fmt(n / 1e6, 2)} میلیون تومان`
  return `${fmt(n)} تومان`
}

const PRESETS = [1, 2, 5, 10]

// ماشین‌حساب ارزش خاک طلا: عیار (گرم در تن) × قیمت روز طلای ۲۴ عیار
export default function GoldOreCalculator({ pricePerGram, updatedAt }) {
  const [grade, setGrade] = useState('')
  const [tons, setTons] = useState('1')
  const [recovery, setRecovery] = useState('85')
  const [price, setPrice] = useState('')
  const priceTouched = useRef(false)

  // قیمت زنده به‌صورت پیش‌فرض وارد می‌شود؛ اگر کاربر دستی تغییر داد، دست نمی‌زنیم
  useEffect(() => {
    if (!priceTouched.current && pricePerGram > 0) setPrice(String(Math.round(pricePerGram)))
  }, [pricePerGram])

  const r = useMemo(() => {
    const g = parseNum(grade)
    const t = parseNum(tons)
    const rec = parseNum(recovery)
    const p = parseNum(price)
    const ok = g > 0 && t > 0 && p > 0
    if (!ok) return { ok: false, g, t, rec, p }
    const goldGrams = g * t
    const perTon = g * p
    const total = goldGrams * p
    const recPct = Number.isFinite(rec) && rec > 0 && rec <= 100 ? rec : null
    return { ok: true, g, t, rec: recPct, p, goldGrams, perTon, total, recovered: recPct ? total * (recPct / 100) : null }
  }, [grade, tons, recovery, price])

  const warnHigh = r.g > 1000
  const usingLive = pricePerGram > 0 && Math.round(parseNum(price)) === Math.round(pricePerGram)

  return (
    <section className="gold-calc" id="calculator" aria-label="ماشین‌حساب ارزش خاک طلا">
      <header className="gold-calc__head">
        <h2>ماشین‌حساب ارزش خاک طلا</h2>
        <p>عیار خاک را (به گرم در تن) وارد کنید تا ارزش تقریبی آن را بر اساس قیمت روز طلای ۲۴ عیار ببینید.</p>
      </header>

      <div className="gold-calc__fields">
        <label className="gold-calc__field gold-calc__field--main">
          <span>عیار خاک طلا (گرم در تن)</span>
          <input
            type="text"
            inputMode="decimal"
            autoComplete="off"
            placeholder="مثلاً ۳٫۵"
            value={grade}
            onChange={(e) => setGrade(e.target.value)}
          />
          <div className="gold-calc__chips" role="group" aria-label="عیارهای پیشنهادی">
            {PRESETS.map((n) => (
              <button type="button" key={n} onClick={() => setGrade(String(n))}>
                {fmt(n)} گرم در تن
              </button>
            ))}
          </div>
        </label>

        <label className="gold-calc__field">
          <span>مقدار خاک (تن)</span>
          <input type="text" inputMode="decimal" autoComplete="off" value={tons} onChange={(e) => setTons(e.target.value)} />
        </label>

        <label className="gold-calc__field">
          <span>درصد بازیابی (٪)</span>
          <input type="text" inputMode="decimal" autoComplete="off" value={recovery} onChange={(e) => setRecovery(e.target.value)} />
        </label>

        <label className="gold-calc__field gold-calc__field--wide">
          <span>
            قیمت هر گرم طلای ۲۴ عیار (تومان)
            {usingLive && <em className="gold-calc__live">قیمت زنده</em>}
          </span>
          <input
            type="text"
            inputMode="numeric"
            autoComplete="off"
            value={price}
            onChange={(e) => {
              priceTouched.current = true
              setPrice(e.target.value)
            }}
          />
          {pricePerGram > 0 && !usingLive && (
            <button
              type="button"
              className="gold-calc__reset"
              onClick={() => {
                priceTouched.current = false
                setPrice(String(Math.round(pricePerGram)))
              }}
            >
              برگرداندن به قیمت زنده ({fmt(pricePerGram)} تومان)
            </button>
          )}
        </label>
      </div>

      {warnHigh && (
        <p className="gold-calc__warn">عیار وارد شده بسیار بالاست. مطمئن شوید عیار را به «گرم در تن» وارد کرده‌اید.</p>
      )}

      {r.ok ? (
        <div className="gold-calc__result" aria-live="polite">
          <div className="gold-calc__main">
            <small>ارزش تقریبی خاک (قبل از بازیابی)</small>
            <strong>{toWords(r.total)}</strong>
            <span>{fmt(r.total)} تومان برای {fmt(r.t, 2)} تن</span>
          </div>

          <dl className="gold-calc__rows">
            <div>
              <dt>ارزش هر تن خاک</dt>
              <dd>{toWords(r.perTon)}</dd>
            </div>
            <div>
              <dt>مقدار طلای موجود در خاک</dt>
              <dd>
                {fmt(r.goldGrams, 2)} گرم
                {r.goldGrams >= 1000 ? ` (${fmt(r.goldGrams / 1000, 2)} کیلوگرم)` : ''}
              </dd>
            </div>
            {r.recovered != null && (
              <div className="gold-calc__rec">
                <dt>با بازیابی {fmt(r.rec, 1)}٪ حدوداً</dt>
                <dd>{toWords(r.recovered)}</dd>
              </div>
            )}
          </dl>

          <Link to="/submit-ad" className="btn btn-primary gold-calc__cta">
            ثبت رایگان آگهی فروش خاک
          </Link>
        </div>
      ) : (
        <p className="gold-calc__hint">عیار خاک را وارد کنید تا نتیجه نمایش داده شود.</p>
      )}

      <p className="gold-calc__note">
        فرمول: عیار (گرم در تن) × مقدار (تن) × قیمت هر گرم طلای ۲۴ عیار. این عدد فقط یک تخمین است؛ ارزش واقعی خاک به
        بازیابی، هزینه فرآوری، ناخالصی و توافق خریدار بستگی دارد.
        {updatedAt ? ` قیمت طلا: ${new Date(updatedAt).toLocaleDateString('fa-IR')} ساعت ${new Date(updatedAt).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })}.` : ''}
      </p>
    </section>
  )
}
