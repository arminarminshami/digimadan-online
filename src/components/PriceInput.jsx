import './PriceInput.css'

// فقط ارقام را نگه می‌دارد (ارقام فارسی/عربی هم به انگلیسی تبدیل می‌شوند)
function toDigits(str) {
  return String(str ?? '')
    .replace(/[\u06f0-\u06f9]/g, (d) => String(d.charCodeAt(0) - 0x06f0))
    .replace(/[\u0660-\u0669]/g, (d) => String(d.charCodeAt(0) - 0x0660))
    .replace(/\D/g, '')
}

// هر سه رقم یک جداکننده می‌گذارد: 15000000 -> 15,000,000
function withSeparators(digits) {
  if (!digits) return ''
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

/**
 * ورودی قیمت با جداکننده‌ی سه‌رقمی
 * ---------------------------------------------------------------
 * مقدار ذخیره‌شده همیشه عدد خام است (بدون کاما)؛ جداکننده فقط برای
 * خوانایی در لحظه‌ی تایپ نمایش داده می‌شود.
 */
export default function PriceInput({ value, onChange, placeholder, id, required }) {
  const digits = toDigits(value)

  return (
    <div className="price-input">
      <input
        id={id}
        required={required}
        inputMode="numeric"
        value={withSeparators(digits)}
        onChange={(e) => onChange(toDigits(e.target.value))}
        placeholder={placeholder}
      />
      <span className="price-input__unit">تومان</span>
      {digits && <span className="price-input__words">{toPersianWords(digits)}</span>}
    </div>
  )
}

// خواندن مبلغ به حروف (میلیون/میلیارد) تا ادمین اشتباه صفر وارد نکند
function toPersianWords(digits) {
  const n = Number(digits)
  if (!n) return ''
  if (n >= 1_000_000_000_000) return `${(n / 1_000_000_000_000).toLocaleString('fa-IR', { maximumFractionDigits: 2 })} هزار میلیارد تومان`
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toLocaleString('fa-IR', { maximumFractionDigits: 2 })} میلیارد تومان`
  if (n >= 1_000_000) return `${(n / 1_000_000).toLocaleString('fa-IR', { maximumFractionDigits: 2 })} میلیون تومان`
  if (n >= 1_000) return `${(n / 1_000).toLocaleString('fa-IR', { maximumFractionDigits: 2 })} هزار تومان`
  return `${n.toLocaleString('fa-IR')} تومان`
}
