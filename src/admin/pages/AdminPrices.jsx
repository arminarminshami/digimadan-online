import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { AdminPageHead, AdminCard, Toast } from '../components/AdminUI'
import { LoadingBlock, EmptyBlock, ErrorBlock } from '../../components/StatusBlocks'

const CATEGORY_LABELS = {
  iranian: 'بازار ایران (تومانی)',
  global: 'بازار جهانی (دلاری)',
}

export default function AdminPrices() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [toast, setToast] = useState(null)
  const [busyKey, setBusyKey] = useState(null)
  const [refreshing, setRefreshing] = useState(false)
  const [search, setSearch] = useState('')

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const { data, error: err } = await supabase
        .from('price_items')
        .select('*, price_values(current_value, change_percent, updated_at)')
        .order('category')
        .order('label_fa')
      if (err) throw err
      setItems(data || [])
    } catch {
      setError('بارگذاری قیمت‌ها با خطا مواجه شد.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  async function handleToggleActive(item) {
    setBusyKey(item.key)
    try {
      const { error: err } = await supabase
        .from('price_items')
        .update({ is_active: !item.is_active })
        .eq('id', item.id)
      if (err) throw err
      setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, is_active: !i.is_active } : i)))
      setToast({
        type: 'success',
        message: item.is_active ? 'این قیمت از سایت پنهان شد.' : 'این قیمت در سایت نمایش داده می‌شود.',
      })
    } catch {
      setToast({ type: 'error', message: 'تغییر وضعیت با خطا مواجه شد.' })
    } finally {
      setBusyKey(null)
    }
  }

  // فراخوانی دستی تابع به‌روزرسانی قیمت‌ها (معمولا خودکار هر ۵ دقیقه اجرا می‌شود)
  async function handleRefreshPrices() {
    setRefreshing(true)
    try {
      const { data, error: err } = await supabase.functions.invoke('price-ticker', { body: {} })
      if (err) throw err
      if (data?.error) throw new Error(data.error)
      setToast({ type: 'success', message: `قیمت‌ها به‌روزرسانی شد (${data?.updated_count ?? 0} مورد).` })
      load()
    } catch (err) {
      setToast({ type: 'error', message: 'به‌روزرسانی قیمت‌ها با خطا مواجه شد.' })
    } finally {
      setRefreshing(false)
    }
  }

  const filtered = search.trim()
    ? items.filter(
        (i) =>
          i.label_fa?.includes(search.trim()) || i.key?.toLowerCase().includes(search.trim().toLowerCase())
      )
    : items

  const activeCount = items.filter((i) => i.is_active).length

  return (
    <div>
      <AdminPageHead
        title="مدیریت قیمت‌ها"
        description="قیمت‌ها هر ۵ دقیقه به‌صورت خودکار از BrsApi به‌روز می‌شوند."
        action={
          <button className="btn btn-primary btn-sm" disabled={refreshing} onClick={handleRefreshPrices}>
            {refreshing ? 'در حال به‌روزرسانی...' : 'به‌روزرسانی دستی'}
          </button>
        }
      />

      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-card__value">{items.length.toLocaleString('fa-IR')}</div>
          <div className="stat-card__label">کل اقلام قیمتی</div>
        </div>
        <div className="stat-card">
          <div className="stat-card__value">{activeCount.toLocaleString('fa-IR')}</div>
          <div className="stat-card__label">فعال (قابل نمایش در سایت)</div>
        </div>
      </div>

      <AdminCard className="admin-settings__section" style={{ marginTop: 20 }}>
        <div className="admin-search-row">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="جست‌وجو در نام قیمت..."
          />
        </div>

        {loading && <LoadingBlock label="در حال بارگذاری قیمت‌ها..." />}
        {error && <ErrorBlock message={error} />}
        {!loading && !error && filtered.length === 0 && <EmptyBlock title="قیمتی یافت نشد" />}

        {!loading && !error && filtered.length > 0 && (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>عنوان</th>
                  <th>بازار</th>
                  <th>مقدار فعلی</th>
                  <th>تغییر</th>
                  <th>وضعیت</th>
                  <th>عملیات</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((item) => {
                  const value = item.price_values?.[0]
                  return (
                    <tr key={item.id}>
                      <td className="admin-table__title" data-label="عنوان">{item.label_fa}</td>
                      <td data-label="بازار">{CATEGORY_LABELS[item.category] || item.category}</td>
                      <td data-label="مقدار فعلی">
                        {value?.current_value != null
                          ? `${Number(value.current_value).toLocaleString('fa-IR')} ${item.unit || ''}`
                          : '—'}
                      </td>
                      <td data-label="تغییر">
                        {value?.change_percent != null ? (
                          <span
                            style={{
                              color:
                                value.change_percent >= 0 ? 'var(--color-sage)' : 'var(--color-danger)',
                              fontWeight: 700,
                            }}
                          >
                            {value.change_percent >= 0 ? '+' : ''}
                            {value.change_percent}٪
                          </span>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td data-label="وضعیت">
                        <span
                          className={
                            'status-pill ' + (item.is_active ? 'status-pill--on' : 'status-pill--off')
                          }
                        >
                          {item.is_active ? 'فعال' : 'پنهان'}
                        </span>
                      </td>
                      <td data-label="عملیات">
                        <div className="admin-row-actions">
                          <button
                            className="btn btn-outline btn-sm"
                            disabled={busyKey === item.key}
                            onClick={() => handleToggleActive(item)}
                          >
                            {item.is_active ? 'پنهان کن' : 'نمایش بده'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </AdminCard>

      <Toast message={toast?.message} type={toast?.type} onClose={() => setToast(null)} />
    </div>
  )
}
