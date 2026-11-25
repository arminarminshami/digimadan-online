import { useEffect, useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { getAllPrices, getPriceHistory } from '../services/priceService'
import { useSeo } from '../lib/useSeo'
import GoldOreCalculator from '../components/GoldOreCalculator'
import { LoadingBlock } from '../components/StatusBlocks'
import './Prices.css'

const GOLD_KEY = 'ir_gold_24k'

const fmt = (n, d = 0) => Number(n).toLocaleString('fa-IR', { maximumFractionDigits: d })

export default function Prices() {
  const location = useLocation()
  const [gold, setGold] = useState(null)
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)

  useSeo({
    title: 'قیمت طلا و ماشین‌حساب ارزش خاک طلا',
    description:
      'قیمت زنده هر گرم طلای ۲۴ عیار و ماشین‌حساب ارزش تقریبی خاک طلا بر اساس عیار (گرم در تن) در دیجی‌معدن.',
    path: '/prices',
  })

  useEffect(() => {
    let alive = true
    getAllPrices()
      .then((items) => {
        if (!alive) return
        const g = items.find((i) => i.key === GOLD_KEY) || null
        setGold(g)
        if (g) {
          getPriceHistory(g.id, { days: 30 })
            .then((rows) => {
              if (!alive) return
              // یک نقطه در هر روز (آخرین مقدار همان روز)
              const byDay = new Map()
              rows.forEach((h) => {
                if (Number(h.value) > 0) byDay.set(new Date(h.recorded_at).toLocaleDateString('fa-IR'), Number(h.value))
              })
              setHistory([...byDay].map(([date, value]) => ({ date, value })))
            })
            .catch(() => {})
        }
      })
      .catch(() => {})
      .finally(() => alive && setLoading(false))
    return () => {
      alive = false
    }
  }, [])

  // لینک مستقیم به ماشین‌حساب: /prices#calculator
  useEffect(() => {
    if (loading || location.hash !== '#calculator') return
    document.getElementById('calculator')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [loading, location.hash])

  const v = gold?.price_values?.[0] || gold?.price_values || null
  const price = Number(v?.current_value) || 0
  const change = v?.change_percent != null ? Number(v.change_percent) : null
  const updated = v?.updated_at || null
  const ageHours = updated ? (Date.now() - new Date(updated).getTime()) / 3600e3 : null
  const stale = ageHours != null && ageHours > 6

  const trend = useMemo(() => (change == null ? 'flat' : change > 0 ? 'up' : change < 0 ? 'down' : 'flat'), [change])

  if (loading) return <LoadingBlock label="در حال بارگذاری قیمت طلا..." />

  return (
    <div className="container prices-page">
      <h1 className="section-title">قیمت طلا و ماشین‌حساب خاک طلا</h1>
      <p className="prices-page__subtitle">قیمت زنده‌ی هر گرم طلای ۲۴ عیار و تخمین ارزش خاک طلا از روی عیار</p>

      <section className="gold-price" aria-label="قیمت طلای ۲۴ عیار">
        <span className="gold-price__label">قیمت هر گرم طلای ۲۴ عیار</span>
        {price > 0 ? (
          <>
            <strong className="gold-price__value">
              {fmt(price)} <small>تومان</small>
            </strong>
            {change != null && (
              <span className={`gold-price__change gold-price__change--${trend}`}>
                {trend === 'up' ? '▲' : trend === 'down' ? '▼' : '■'} {fmt(Math.abs(change), 2)}٪ نسبت به آخرین روز کاری
              </span>
            )}
            <div className="gold-price__meta">
              {Number(v?.day_low) > 0 && Number(v?.day_high) > 0 && (
                <span>
                  امروز: {fmt(v.day_low)} تا {fmt(v.day_high)}
                </span>
              )}
              {updated && (
                <span>
                  آخرین به‌روزرسانی: {new Date(updated).toLocaleDateString('fa-IR')} ساعت{' '}
                  {new Date(updated).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })}
                </span>
              )}
            </div>
            {stale && <p className="gold-price__warn">قیمت چند ساعت است به‌روز نشده؛ ممکن است با بازار تفاوت داشته باشد.</p>}
          </>
        ) : (
          <p className="gold-price__warn">قیمت طلا فعلاً در دسترس نیست. می‌توانید قیمت را در ماشین‌حساب خودتان وارد کنید.</p>
        )}
      </section>

      <GoldOreCalculator pricePerGram={price} updatedAt={updated} />

      {history.length > 1 && (
        <section className="gold-chart" aria-label="نمودار قیمت طلا">
          <h2>روند قیمت طلای ۲۴ عیار (۳۰ روز اخیر)</h2>
          <div dir="ltr">
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={history}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2DCCB" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis
                tick={{ fontSize: 11 }}
                domain={['auto', 'auto']}
                width={56}
                tickFormatter={(x) => fmt(x / 1e6, 1) + 'م'}
              />
              <Tooltip formatter={(x) => [fmt(x) + ' تومان', 'قیمت']} />
              <Line type="monotone" dataKey="value" stroke="#C2703D" strokeWidth={2.4} dot={false} isAnimationActive={false} />
            </LineChart>
          </ResponsiveContainer>
          </div>
        </section>
      )}

      <p className="gold-source">منبع قیمت: بازار آزاد طلا (به‌روزرسانی خودکار هر چند دقیقه). قیمت‌ها تقریبی و راهنما هستند.</p>
    </div>
  )
}
