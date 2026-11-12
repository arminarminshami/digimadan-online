import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  getAuctionById,
  getAuctionParticipations,
  setParticipationStatus,
  getParticipationDocUrl,
} from '../../services/auctionService'
import { AdminPageHead, AdminCard, Toast } from '../components/AdminUI'
import { LoadingBlock, EmptyBlock, ErrorBlock } from '../../components/StatusBlocks'
import { formatJalaliDateTime } from '../../components/JalaliDateSelect'

const STATUS = {
  pending: { label: 'در انتظار تایید', cls: 'status-pill--warn' },
  approved: { label: 'تایید شده', cls: 'status-pill--on' },
  rejected: { label: 'رد شده', cls: 'status-pill--danger' },
}

export default function AdminAuctionParticipants() {
  const { id } = useParams()
  const [auction, setAuction] = useState(null)
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [toast, setToast] = useState(null)
  const [busy, setBusy] = useState(null)
  const [open, setOpen] = useState(null)
  const [note, setNote] = useState('')
  const [result, setResult] = useState('')

  async function load() {
    setLoading(true)
    try {
      const [a, p] = await Promise.all([getAuctionById(id), getAuctionParticipations(id)])
      setAuction(a)
      setRows(p)
    } catch {
      setError('بارگذاری درخواست‌ها با خطا مواجه شد.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  async function decide(row, status) {
    if (status === 'rejected' && !note.trim() && open?.id !== row.id) {
      setOpen(row)
      setNote('')
      setResult(row.result || '')
      setToast({ type: 'error', message: 'برای رد درخواست، ابتدا توضیح بنویسید.' })
      return
    }
    setBusy(row.id)
    try {
      await setParticipationStatus(row.id, status, {
        adminNote: note.trim() || row.admin_note || null,
        result: result.trim() || row.result || null,
      })
      setToast({
        type: 'success',
        message: status === 'approved' ? 'درخواست تایید شد و پیامک برای کاربر ارسال می‌شود.' : 'درخواست رد شد.',
      })
      setOpen(null)
      setNote('')
      setResult('')
      load()
    } catch {
      setToast({ type: 'error', message: 'ثبت تصمیم با خطا مواجه شد.' })
    } finally {
      setBusy(null)
    }
  }

  async function saveDetails(row) {
    setBusy(row.id)
    try {
      await setParticipationStatus(row.id, row.status, {
        adminNote: note.trim() || null,
        result: result.trim() || null,
      })
      setToast({ type: 'success', message: 'اطلاعات ذخیره شد.' })
      setOpen(null)
      load()
    } catch {
      setToast({ type: 'error', message: 'ذخیره‌سازی با خطا مواجه شد.' })
    } finally {
      setBusy(null)
    }
  }

  async function openDoc(path) {
    try {
      const url = await getParticipationDocUrl(path)
      window.open(url, '_blank', 'noopener')
    } catch {
      setToast({ type: 'error', message: 'باز کردن فایل با خطا مواجه شد.' })
    }
  }

  if (loading) return <LoadingBlock label="در حال بارگذاری..." />

  const pending = rows.filter((r) => r.status === 'pending').length

  return (
    <div>
      <AdminPageHead
        title={`درخواست‌های شرکت در مزایده`}
        description={auction ? `${auction.title} — ${pending} درخواست در انتظار بررسی` : ''}
        action={
          <Link to="/admin/auctions" className="btn btn-outline btn-sm">
            ← بازگشت به مزایده‌ها
          </Link>
        }
      />

      {error && <ErrorBlock message={error} />}
      {rows.length === 0 && <EmptyBlock title="هنوز کسی در این مزایده شرکت نکرده است" />}

      {rows.length > 0 && (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>شرکت‌کننده</th>
                <th>قیمت پیشنهادی</th>
                <th>پرداخت</th>
                <th>مدارک</th>
                <th>تاریخ</th>
                <th>وضعیت</th>
                <th>عملیات</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td className="admin-table__title" data-label="شرکت‌کننده">
                    <div className="admin-owner-cell">
                      <span className="admin-owner-cell__name">{r.user_name || 'بدون نام'}</span>
                      {r.user_phone && (
                        <a href={`tel:${r.user_phone}`} className="admin-owner-cell__phone">{r.user_phone}</a>
                      )}
                      {r.user_national_id && (
                        <span className="admin-owner-cell__admin">کد ملی: {r.user_national_id}</span>
                      )}
                    </div>
                  </td>
                  <td data-label="قیمت پیشنهادی">
                    {r.offered_price != null ? `${Number(r.offered_price).toLocaleString('fa-IR')} تومان` : '—'}
                  </td>
                  <td data-label="پرداخت">
                    <span className={'status-pill ' + (r.payment_status === 'paid' ? 'status-pill--on' : 'status-pill--off')}>
                      {r.payment_status === 'paid' ? 'پرداخت شده' : 'پرداخت نشده'}
                    </span>
                  </td>
                  <td data-label="مدارک">
                    {(r.documents || []).length === 0 ? '—' : (
                      <div className="admin-row-actions">
                        {(r.documents || []).map((d, i) => (
                          <button key={i} className="btn btn-outline btn-sm" onClick={() => openDoc(d.path || d.url)}>
                            {d.name || `فایل ${i + 1}`}
                          </button>
                        ))}
                      </div>
                    )}
                  </td>
                  <td data-label="تاریخ">{formatJalaliDateTime(r.created_at)}</td>
                  <td data-label="وضعیت">
                    <span className={'status-pill ' + (STATUS[r.status]?.cls || '')}>
                      {STATUS[r.status]?.label || r.status}
                    </span>
                    {r.result && <div className="admin-table__reject-reason" title={r.result}>{r.result}</div>}
                  </td>
                  <td data-label="عملیات">
                    <div className="admin-row-actions">
                      {r.status === 'pending' && (
                        <button className="btn btn-primary btn-sm" disabled={busy === r.id} onClick={() => decide(r, 'approved')}>
                          تایید
                        </button>
                      )}
                      <button
                        className="btn btn-outline btn-sm"
                        onClick={() => {
                          setOpen(r)
                          setNote(r.admin_note || '')
                          setResult(r.result || '')
                        }}
                      >
                        نتیجه و توضیحات
                      </button>
                      {r.status !== 'rejected' && (
                        <button className="btn btn-danger btn-sm" disabled={busy === r.id} onClick={() => decide(r, 'rejected')}>
                          رد
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {open && (
        <div className="bulk-sms__modal-backdrop" onClick={() => setOpen(null)}>
          <div className="bulk-sms__modal" onClick={(e) => e.stopPropagation()}>
            <h3>{open.user_name || 'شرکت‌کننده'}</h3>

            <label className="admin-field">
              <span>نتیجه مزایده برای این شرکت‌کننده</span>
              <input
                value={result}
                onChange={(e) => setResult(e.target.value)}
                placeholder="مثال: برنده مزایده / رتبه دوم / تایید نشده"
              />
            </label>

            <label className="admin-field">
              <span>توضیحات برای کاربر (در پنل کاربری نمایش داده می‌شود)</span>
              <textarea rows={4} value={note} onChange={(e) => setNote(e.target.value)} />
            </label>

            <div className="bulk-sms__modal-actions">
              <button className="btn btn-primary btn-sm" disabled={busy === open.id} onClick={() => saveDetails(open)}>
                ذخیره
              </button>
              <button className="btn btn-outline btn-sm" onClick={() => setOpen(null)}>بستن</button>
            </div>
          </div>
        </div>
      )}

      <Toast message={toast?.message} type={toast?.type} onClose={() => setToast(null)} />
    </div>
  )
}
