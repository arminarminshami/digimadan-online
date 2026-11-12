import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getAllAuctions, deleteAuction, updateAuction } from '../../services/auctionService'
import { AdminPageHead, Toast } from '../components/AdminUI'
import { LoadingBlock, EmptyBlock, ErrorBlock } from '../../components/StatusBlocks'
import { formatJalaliDateTime } from '../../components/JalaliDateSelect'
import { AD_CATEGORY_MAP } from '../../lib/constants'

const STATUS_LABELS = {
  draft: 'پیش‌نویس',
  published: 'منتشر شده',
  closed: 'پایان‌یافته',
}

export default function AdminAuctionsList() {
  const [auctions, setAuctions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [toast, setToast] = useState(null)
  const [busy, setBusy] = useState(null)

  async function load() {
    setLoading(true)
    try {
      setAuctions(await getAllAuctions())
    } catch {
      setError('بارگذاری مزایده‌ها با خطا مواجه شد.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  async function changeStatus(a, status) {
    setBusy(a.id)
    try {
      await updateAuction(a.id, { status })
      setAuctions((p) => p.map((x) => (x.id === a.id ? { ...x, status } : x)))
      setToast({ type: 'success', message: 'وضعیت مزایده تغییر کرد.' })
    } catch {
      setToast({ type: 'error', message: 'تغییر وضعیت با خطا مواجه شد.' })
    } finally {
      setBusy(null)
    }
  }

  async function handleDelete(a) {
    if (!window.confirm(`مزایده «${a.title}» حذف شود؟ تمام درخواست‌های شرکت در آن هم حذف می‌شود.`)) return
    setBusy(a.id)
    try {
      await deleteAuction(a.id)
      setAuctions((p) => p.filter((x) => x.id !== a.id))
      setToast({ type: 'success', message: 'مزایده حذف شد.' })
    } catch {
      setToast({ type: 'error', message: 'حذف مزایده با خطا مواجه شد.' })
    } finally {
      setBusy(null)
    }
  }

  return (
    <div>
      <AdminPageHead
        title="مدیریت مزایده‌ها"
        description="ایجاد و مدیریت مزایده‌های سایت"
        action={
          <Link to="/admin/auctions/new" className="btn btn-primary btn-sm">
            + ایجاد مزایده
          </Link>
        }
      />

      {loading && <LoadingBlock label="در حال بارگذاری..." />}
      {error && <ErrorBlock message={error} />}
      {!loading && !error && auctions.length === 0 && (
        <EmptyBlock title="هنوز مزایده‌ای ساخته نشده" hint="با دکمه‌ی بالا اولین مزایده را ایجاد کنید." />
      )}

      {!loading && auctions.length > 0 && (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>عنوان</th>
                <th>دسته‌بندی</th>
                <th>زمان برگزاری</th>
                <th>وضعیت</th>
                <th>عملیات</th>
              </tr>
            </thead>
            <tbody>
              {auctions.map((a) => (
                <tr key={a.id}>
                  <td className="admin-table__title" data-label="عنوان">{a.title}</td>
                  <td data-label="دسته‌بندی">{AD_CATEGORY_MAP[a.category] || a.category}</td>
                  <td data-label="زمان برگزاری">{a.held_at_text || formatJalaliDateTime(a.participate_opens_at)}</td>
                  <td data-label="وضعیت">
                    <span className={'status-pill ' + (a.status === 'published' ? 'status-pill--on' : a.status === 'closed' ? 'status-pill--off' : 'status-pill--warn')}>
                      {STATUS_LABELS[a.status] || a.status}
                    </span>
                  </td>
                  <td data-label="عملیات">
                    <div className="admin-row-actions">
                      <Link to={`/admin/auctions/${a.id}/participants`} className="btn btn-outline btn-sm">
                        درخواست‌ها
                      </Link>
                      <Link to={`/admin/auctions/${a.id}/edit`} className="btn btn-outline btn-sm">
                        ویرایش
                      </Link>
                      {a.status !== 'published' && (
                        <button className="btn btn-primary btn-sm" disabled={busy === a.id} onClick={() => changeStatus(a, 'published')}>
                          انتشار
                        </button>
                      )}
                      {a.status === 'published' && (
                        <button className="btn btn-outline btn-sm" disabled={busy === a.id} onClick={() => changeStatus(a, 'closed')}>
                          پایان مزایده
                        </button>
                      )}
                      <button className="btn btn-danger btn-sm" disabled={busy === a.id} onClick={() => handleDelete(a)}>
                        حذف
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Toast message={toast?.message} type={toast?.type} onClose={() => setToast(null)} />
    </div>
  )
}
