import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { AdminPageHead, AdminCard, Toast } from '../components/AdminUI'
import { LoadingBlock, EmptyBlock, ErrorBlock } from '../../components/StatusBlocks'

const TYPE_LABELS = {
  otp: 'کد ورود',
  approval: 'تایید / اطلاع‌رسانی',
  rejection: 'رد شدن',
  auction_reminder: 'یادآوری',
  custom: 'سایر',
}

const FILTERS = [
  { value: '', label: 'همه' },
  { value: 'sent', label: 'ارسال‌شده' },
  { value: 'failed', label: 'ناموفق' },
]

export default function AdminSmsLog() {
  const [logs, setLogs] = useState([])
  const [stats, setStats] = useState({ total: 0, sent: 0, failed: 0 })
  const [statusFilter, setStatusFilter] = useState('')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [toast, setToast] = useState(null)

  async function load() {
    setLoading(true)
    setError(null)
    try {
      let query = supabase
        .from('sms_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200)

      if (statusFilter) query = query.eq('status', statusFilter)
      if (search.trim()) query = query.ilike('phone', `%${search.trim()}%`)

      const { data, error: err } = await query
      if (err) throw err
      setLogs(data || [])

      // آمار کلی (مستقل از فیلتر) برای دید سریع وضعیت سرویس پیامک
      const [{ count: total }, { count: sent }, { count: failed }] = await Promise.all([
        supabase.from('sms_log').select('*', { count: 'exact', head: true }),
        supabase.from('sms_log').select('*', { count: 'exact', head: true }).eq('status', 'sent'),
        supabase.from('sms_log').select('*', { count: 'exact', head: true }).eq('status', 'failed'),
      ])
      setStats({ total: total || 0, sent: sent || 0, failed: failed || 0 })
    } catch (err) {
      setError('بارگذاری گزارش پیامک‌ها با خطا مواجه شد.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter])

  function handleSearch(e) {
    e.preventDefault()
    load()
  }

  const successRate = stats.total > 0 ? Math.round((stats.sent / stats.total) * 100) : 0

  return (
    <div>
      <AdminPageHead
        title="گزارش پیامک‌ها"
        description="وضعیت ارسال پیامک‌های سایت (کد ورود، اطلاع‌رسانی‌ها و...)"
        action={
          <button className="btn btn-outline btn-sm" onClick={load}>
            به‌روزرسانی
          </button>
        }
      />

      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-card__value">{stats.total.toLocaleString('fa-IR')}</div>
          <div className="stat-card__label">کل پیامک‌ها</div>
        </div>
        <div className="stat-card">
          <div className="stat-card__value">{stats.sent.toLocaleString('fa-IR')}</div>
          <div className="stat-card__label">ارسال موفق</div>
        </div>
        <div className="stat-card">
          <div className="stat-card__value">{stats.failed.toLocaleString('fa-IR')}</div>
          <div className="stat-card__label">ارسال ناموفق</div>
        </div>
        <div className="stat-card">
          <div className="stat-card__value">٪{successRate.toLocaleString('fa-IR')}</div>
          <div className="stat-card__label">نرخ موفقیت</div>
        </div>
      </div>

      <AdminCard className="admin-settings__section" style={{ marginTop: 20 }}>
        <div className="admin-filter-row">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              className={'btn btn-sm ' + (statusFilter === f.value ? 'btn-primary' : 'btn-outline')}
              onClick={() => setStatusFilter(f.value)}
            >
              {f.label}
            </button>
          ))}
        </div>

        <form className="admin-search-row" onSubmit={handleSearch}>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="جست‌وجو بر اساس شماره موبایل..."
          />
          <button type="submit" className="btn btn-outline btn-sm">
            جست‌وجو
          </button>
        </form>

        {loading && <LoadingBlock label="در حال بارگذاری..." />}
        {error && <ErrorBlock message={error} />}
        {!loading && !error && logs.length === 0 && <EmptyBlock title="پیامکی یافت نشد" />}

        {!loading && !error && logs.length > 0 && (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>شماره</th>
                  <th>نوع</th>
                  <th>وضعیت</th>
                  <th>تاریخ</th>
                  <th>پاسخ سرویس</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id}>
                    <td className="admin-table__title" data-label="شماره">{log.phone}</td>
                    <td data-label="نوع">{TYPE_LABELS[log.message_type] || log.message_type}</td>
                    <td data-label="وضعیت">
                      <span
                        className={'status-pill ' + (log.status === 'sent' ? 'status-pill--on' : 'status-pill--danger')}
                      >
                        {log.status === 'sent' ? 'ارسال شد' : 'ناموفق'}
                      </span>
                    </td>
                    <td data-label="تاریخ">
                      {new Date(log.created_at).toLocaleString('fa-IR', {
                        dateStyle: 'short',
                        timeStyle: 'short',
                      })}
                    </td>
                    <td data-label="پاسخ سرویس">
                      <span className="admin-sms-log__response" title={log.provider_response}>
                        {log.provider_response || '—'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </AdminCard>

      <Toast message={toast?.message} type={toast?.type} onClose={() => setToast(null)} />
    </div>
  )
}
