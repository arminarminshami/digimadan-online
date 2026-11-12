import { useEffect, useState } from 'react'
import { getAllPrices } from '../services/priceService'
import { HOME_MAIN_PRICE_KEYS, HOME_METAL_PRICE_KEYS } from '../lib/constants'
import './PriceTicker.css'

const TICKER_KEYS = [...HOME_MAIN_PRICE_KEYS, ...HOME_METAL_PRICE_KEYS]

function pickOrderedPrices(prices, keys) {
  const byKey = Object.fromEntries(prices.map((p) => [p.key, p]))
  return keys.map((k) => byKey[k]).filter(Boolean)
}

function formatValue(item) {
  const value = item.price_values?.[0]?.current_value ?? item.price_values?.current_value
  if (value == null) return '—'
  return Number(value).toLocaleString('fa-IR') + (item.unit ? ` ${item.unit}` : '')
}

function changeDirection(item) {
  const v = item.price_values?.[0] || item.price_values
  if (!v || v.change_percent == null) return 'flat'
  return Number(v.change_percent) > 0 ? 'up' : Number(v.change_percent) < 0 ? 'down' : 'flat'
}

export default function PriceTicker() {
  const [items, setItems] = useState([])

  useEffect(() => {
    let mounted = true
    getAllPrices()
      .then((data) => mounted && setItems(pickOrderedPrices(data, TICKER_KEYS)))
      .catch(() => {})
    return () => {
      mounted = false
    }
  }, [])

  if (items.length === 0) return null

  // برای حرکت بی‌وقفه‌ی نوار، لیست را دو بار پشت‌هم تکرار می‌کنیم
  const loopItems = [...items, ...items]

  return (
    <div className="price-ticker">
      <div className="price-ticker__track">
        {loopItems.map((item, i) => (
          <span key={`${item.id}-${i}`} className="price-ticker__item">
            <span className="price-ticker__label">{item.label_fa}</span>
            <span className={`price-ticker__value price-ticker__value--${changeDirection(item)}`}>
              {formatValue(item)}
            </span>
          </span>
        ))}
      </div>
    </div>
  )
}
