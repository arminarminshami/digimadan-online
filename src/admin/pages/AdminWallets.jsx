import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { AdminPageHead, AdminCard, Toast } from '../components/AdminUI'
import { LoadingBlock, EmptyBlock, ErrorBlock } from '../../components/StatusBlocks'
import { formatJalaliDateTime } from '../../components/JalaliDateSelect'
import { WALLET_REASON_LABELS } from '../../lib/constants'

export default function AdminWallets() {
  const [rows, setRows] = useState([])
  const [tx, setTx] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [toast, setToast] = useState(null)
  const [open, setOpen] = useState(null)
  const [amount, setAmount] = useState('')
  const [saving, setSaving] = useState(false)

  async function load() {
    setLoading(true)
    try {
      const [{ data: accounts, error: e1 }, { data: txs }] = await Promise.all([
        supabase.from('wallet_accounts').select('*').order('points_balance', { ascending: false }),
        supabase.from('wallet_transactions').select('*').order('created_at', { ascending: false }).limit(100),
      ])
      if (e1) throw e1

      // نام کاربران جداگانه خوانده می‌شود (کلید خارجی به user_profiles تعریف نشده)
      const ids = [...new Set((accounts || []).map((a) => a.auth_user_id).filter(Boolean))]
      let byId = {}
      if (ids.length) {
        const { data: profiles } = await supabase
          .from('user_profiles')
          .select('auth_user_id, first_name, last_name, full_name, phone')
          .in('auth_user_id', ids)
        byId = Object.fromEntries((profiles || []).map((p) => [p.auth_user_id, p]))
      }

      setRows(
        (accounts || []).map((a) => {
          const p = byId[a.auth_user_id]
          return {
            ...a,
            user_name: p?.full_name || [p?.first_name, p?.last_name].filter(Boolean).join(' ') || null,
            user_phone: p?.phone || null,
          }
        })
      )
      setTx(txs || [])
    } catch (err) {
      setError(err?.message || 'بارگذاری کیف‌پول‌ها با خطا مواجه شد.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  // تنظیم دستی امتیاز توسط ادمین (مثبت یا منفی)
  async function handleAdjust() {
    const n = Number(amount)
    if (!n) {
      setToast({ type: 'error', message: 'مقدار امتیاز را وارد کنید.' })
      return
    }
    setSaving(true)
    try {
      const newBalance = Number(open.points_balance || 0) + n
      const { error: e1 } = await supabase
        .from('wallet_accounts')
        .update({ points_balance: newBalance })
        .eq('id', open.id)
      if (e1) throw e1

      const { error: e2 } = await supabase.from('wallet_transactions').insert([
        {
          auth_user_id: open.auth_user_id,
          amount: n,
          reason: 'manual_adjustment',
        },
      ])
      if (e2) throw e2

      setToast({ type: 'success', message: 'امتیاز به‌روزرسانی شد.' })
      setOpen(null)
      setAmount('')
      load()
    } catch (err) {
      setToast({ type: 'error', message: err?.message || 'ثبت تغییر با خطا مواجه شد.' })
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <LoadingBlock label="در حال بارگذاری کیف‌پول‌ها..." />

  const totalPoints = rows.reduce((s, r) => s + Number(r.points_balance || 0), 0)

  return (
    <div>
      <AdminPageHead
        title="کیف‌پول کاربران"
        description="مشاهده‌ی امتیاز کاربران و تنظیم دستی آن"
        action={<button className="btn btn-outline btn-sm" onClick={load}>به‌روزرسانی</button>}
      />

      {error && <ErrorBlock message={error} />}

      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-card__value">{rows.length.toLocaleString('fa-IR')}</div>
          <div className="stat-card__label">کیف‌پول فعال</div>
        </div>
        <div className="stat-card">
          <div className="stat-card__value">{totalPoints.toLocaleString('fa-IR')}</div>
          <div className="stat-card__label">مجموع امتیاز کاربران</div>
        </div>
        <div className="stat-card">
          <div className="stat-card__value">{tx.length.toLocaleString('fa-IR')}</div>
          <div className="stat-card__label">تراکنش اخیر</div>
        </div>
      </div>

      <AdminCard className="admin-settings__section" style={{ marginTop: 20 }}>
        <h2 className="admin-section-title">کیف‌پول‌ها</h2>
        {rows.length === 0 ? (
          <EmptyBlock title="کیف‌پولی وجود ندارد" />
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr><th>کاربر</th><th>امتیاز</th><th>عملیات</th></tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id}>
                    <td className="admin-table__title" data-label="کاربر">
                      <div className="admin-owner-cell">
                        <span className="admin-owner-cell__name">{r.user_name || 'بدون نام'}</span>
                        {r.user_phone && (
                          <a href={`tel:${r.user_phone}`} className="admin-owner-cell__phone">{r.user_phone}</a>
                        )}
                      </div>
                    </td>
                    <td data-label="امتیاز">
                      <strong>{Number(r.points_balance || 0).toLocaleString('fa-IR')}</strong>
                    </td>
                    <td data-label="عملیات">
                      <button
                        className="btn btn-outline btn-sm"
                        onClick={() => { setOpen(r); setAmount('') }}
                      >
                        تنظیم امتیاز
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </AdminCard>

      <AdminCard className="admin-settings__section" style={{ marginTop: 20 }}>
        <h2 className="admin-section-title">تراکنش‌های اخیر</h2>
        {tx.length === 0 ? (
          <EmptyBlock title="تراکنشی ثبت نشده" />
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr><th>مقدار</th><th>دلیل</th><th>تاریخ</th></tr>
              </thead>
              <tbody>
                {tx.map((t) => (
                  <tr key={t.id}>
                    <td data-label="مقدار">
                      <span style={{ color: Number(t.amount) >= 0 ? 'var(--color-sage)' : 'var(--color-danger)', fontWeight: 800 }}>
                        {Number(t.amount) >= 0 ? '+' : ''}{Number(t.amount).toLocaleString('fa-IR')}
                      </span>
                    </td>
                    <td data-label="دلیل">{WALLET_REASON_LABELS[t.reason] || t.reason}</td>
                    <td data-label="تاریخ">{formatJalaliDateTime(t.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </AdminCard>

      {open && (
        <div className="bulk-sms__modal-backdrop" onClick={() => setOpen(null)}>
          <div className="bulk-sms__modal" onClick={(e) => e.stopPropagation()}>
            <h3>تنظیم امتیاز — {open.user_name || 'کاربر'}</h3>
            <p className="bulk-sms__meta">
              امتیاز فعلی: <strong>{Number(open.points_balance || 0).toLocaleString('fa-IR')}</strong>
            </p>
            <label className="admin-field">
              <span>مقدار تغییر (برای کسر، عدد منفی وارد کنید)</span>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="مثال: 50 یا 50-"
              />
            </label>
            <div className="bulk-sms__modal-actions">
              <button className="btn btn-primary btn-sm" disabled={saving} onClick={handleAdjust}>
                {saving ? 'در حال ثبت...' : 'ثبت تغییر'}
              </button>
              <button className="btn btn-outline btn-sm" onClick={() => setOpen(null)}>انصراف</button>
            </div>
          </div>
        </div>
      )}

      <Toast message={toast?.message} type={toast?.type} onClose={() => setToast(null)} />
    </div>
  )
}
