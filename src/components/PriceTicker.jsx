import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getAllPrices } from '../services/priceService'
import './PriceTicker.css'

const GOLD_KEY = 'ir_gold_24k'

// نوار قیمت بالای سایت: فقط قیمت زنده‌ی طلای ۲۴ عیار
export default function PriceTicker() {
  const [gold, setGold] = useState(null)

  useEffect(() => {
    let alive = true
    const load = () =>
      getAllPrices()
        .then((items) => alive && setGold(items.find((i) => i.key === GOLD_KEY) || null))
        .catch(() => {})
    load()
    const t = setInterval(load, 5 * 60e3)
    return () => {
      alive = false
      clearInterval(t)
    }
  }, [])

  const v = gold?.price_values?.[0] || gold?.price_values || null
  const price = Number(v?.current_value) || 0
  if (!gold || price <= 0) return null
  const change = v?.change_percent != null ? Number(v.change_percent) : null

  return (
    <Link to="/prices#calculator" className="price-ticker price-ticker--gold" aria-label="قیمت طلا و ماشین‌حساب خاک طلا">
      <span className="price-ticker__label">طلای ۲۴ عیار (هر گرم)</span>
      <span className="price-ticker__value">{price.toLocaleString('fa-IR')} تومان</span>
      {change != null && (
        <span className={'price-ticker__change ' + (change >= 0 ? 'price-ticker__change--up' : 'price-ticker__change--down')}>
          {change >= 0 ? '▲' : '▼'} {Math.abs(change).toLocaleString('fa-IR', { maximumFractionDigits: 2 })}٪
        </span>
      )}
      <span className="price-ticker__cta">ماشین‌حساب خاک طلا ←</span>
    </Link>
  )
}
