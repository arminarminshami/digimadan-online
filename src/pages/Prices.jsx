import { useEffect, useState } from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { useAuth } from '../admin/AuthContext'
import {
  getAllPrices,
  getPriceHistory,
  getUserPriceFavorites,
  togglePriceFavorite,
  createPriceAlert,
} from '../services/priceService'
import { LoadingBlock, EmptyBlock } from '../components/StatusBlocks'
import './Prices.css'

function formatValue(item) {
  const v = item.price_values?.[0] || item.price_values
  if (!v || v.current_value == null) return '—'
  return Number(v.current_value).toLocaleString('fa-IR') + (item.unit ? ` ${item.unit}` : '')
}

function changePercent(item) {
  const v = item.price_values?.[0] || item.price_values
  return v?.change_percent ?? null
}

export default function Prices() {
  const { user, isAuthenticated } = useAuth()
  const [items, setItems] = useState([])
  const [favorites, setFavorites] = useState([])
  const [selected, setSelected] = useState(null)
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [alertValue, setAlertValue] = useState('')
  const [alertDirection, setAlertDirection] = useState('above')
  const [alertMessage, setAlertMessage] = useState(null)

  useEffect(() => {
    getAllPrices()
      .then((data) => {
        setItems(data)
        if (data.length > 0) setSelected(data[0])
      })
      .finally(() => setLoading(false))

    if (isAuthenticated) {
      getUserPriceFavorites(user.id).then(setFavorites)
    }
  }, [isAuthenticated, user])

  useEffect(() => {
    if (!selected) return
    getPriceHistory(selected.id, { days: 30 }).then((data) =>
      setHistory(data.map((h) => ({ date: new Date(h.recorded_at).toLocaleDateString('fa-IR'), value: Number(h.value) })))
    )
  }, [selected])

  async function handleToggleFavorite(item) {
    if (!isAuthenticated) return
    const isFav = favorites.includes(item.id)
    await togglePriceFavorite(user.id, item.id, isFav)
    setFavorites((prev) => (isFav ? prev.filter((id) => id !== item.id) : [...prev, item.id]))
  }

  async function handleCreateAlert(e) {
    e.preventDefault()
    if (!isAuthenticated || !selected) return
    await createPriceAlert({
      authUserId: user.id,
      priceItemId: selected.id,
      targetValue: Number(alertValue),
      direction: alertDirection,
    })
    setAlertMessage('هشدار قیمت ثبت شد.')
    setAlertValue('')
  }

  if (loading) return <LoadingBlock label="در حال بارگذاری قیمت‌ها..." />

  const globalItems = items.filter((i) => i.category === 'global')
  const iranianItems = items.filter((i) => i.category === 'iranian')

  return (
    <div className="container prices-page">
      <h1 className="section-title">قیمت‌های لحظه‌ای</h1>
      <p className="prices-page__subtitle">قیمت جهانی فلزات و انرژی، و قیمت بازار داخلی</p>

      <div className="prices-layout">
        <div className="prices-list">
          <h2 className="admin-section-title">بازار جهانی</h2>
          {globalItems.map((item) => (
            <PriceRow
              key={item.id}
              item={item}
              isSelected={selected?.id === item.id}
              isFavorite={favorites.includes(item.id)}
              onSelect={() => setSelected(item)}
              onToggleFavorite={() => handleToggleFavorite(item)}
              showFavorite={isAuthenticated}
            />
          ))}

          <h2 className="admin-section-title">بازار داخلی</h2>
          {iranianItems.map((item) => (
            <PriceRow
              key={item.id}
              item={item}
              isSelected={selected?.id === item.id}
              isFavorite={favorites.includes(item.id)}
              onSelect={() => setSelected(item)}
              onToggleFavorite={() => handleToggleFavorite(item)}
              showFavorite={isAuthenticated}
            />
          ))}
        </div>

        <div className="prices-detail">
          {selected && (
            <>
              <h2>{selected.label_fa}</h2>
              <p className="prices-detail__value">{formatValue(selected)}</p>

              {history.length > 1 ? (
                <ResponsiveContainer width="100%" height={260}>
                  <LineChart data={history}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Line type="monotone" dataKey="value" stroke="var(--color-copper)" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <EmptyBlock title="هنوز تاریخچه‌ای ثبت نشده" hint="با فعال شدن بروزرسانی خودکار قیمت، نمودار اینجا نمایش داده می‌شود." />
              )}

              {isAuthenticated && (
                <form className="prices-detail__alert-form" onSubmit={handleCreateAlert}>
                  <span>هشدار وقتی قیمت</span>
                  <select value={alertDirection} onChange={(e) => setAlertDirection(e.target.value)}>
                    <option value="above">بالاتر از</option>
                    <option value="below">پایین‌تر از</option>
                  </select>
                  <input
                    type="number"
                    placeholder="مقدار"
                    value={alertValue}
                    onChange={(e) => setAlertValue(e.target.value)}
                    required
                  />
                  <button type="submit" className="btn btn-outline btn-sm">ثبت هشدار</button>
                </form>
              )}
              {alertMessage && <p className="prices-detail__alert-success">{alertMessage}</p>}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function PriceRow({ item, isSelected, isFavorite, onSelect, onToggleFavorite, showFavorite }) {
  const change = changePercent(item)
  return (
    <button className={'price-row' + (isSelected ? ' price-row--active' : '')} onClick={onSelect}>
      <span className="price-row__label">{item.label_fa}</span>
      <span className="price-row__value">{formatValue(item)}</span>
      {change != null && (
        <span className={'price-row__change ' + (change >= 0 ? 'price-row__change--up' : 'price-row__change--down')}>
          {change >= 0 ? '+' : ''}{change}%
        </span>
      )}
      {showFavorite && (
        <span
          className={'price-row__star' + (isFavorite ? ' price-row__star--active' : '')}
          onClick={(e) => {
            e.stopPropagation()
            onToggleFavorite()
          }}
        >
          ★
        </span>
      )}
    </button>
  )
}
