import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getAllAds, deleteAd, toggleAdStatus, updateAd } from '../../services/adsService'
import { AdminPageHead, StatusPill, Toast } from '../components/AdminUI'
import { LoadingBlock, EmptyBlock, ErrorBlock } from '../../components/StatusBlocks'
import { AD_CATEGORY_MAP } from '../../lib/constants'

export default function AdminAdsList() {
  const [ads, setAds] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [toast, setToast] = useState(null)
  const [busyId, setBusyId] = useState(null)

  async function load() {
    setLoading(true)
    try {
      const data = await getAllAds()
      setAds(data)
    } catch (err) {
      setError('بارگذاری آگهی‌ها با خطا مواجه شد.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  async function handleToggle(ad) {
    setBusyId(ad.id)
    try {
      const updated = await toggleAdStatus(ad.id, ad.status)
      setAds((prev) => prev.map((a) => (a.id === ad.id ? updated : a)))
      setToast({
        type: 'success',
        message: updated.status === 'published' ? 'آگهی منتشر شد.' : 'آگهی به پیش‌نویس تغییر کرد.',
      })
    } catch (err) {
      setToast({ type: 'error', message: 'تغییر وضعیت با خطا مواجه شد.' })
    } finally {
      setBusyId(null)
    }
  }

  async function handleDelete(ad) {
    if (!window.confirm(`آگهی «${ad.title}» حذف شود؟ این عمل قابل بازگشت نیست.`)) return
    setBusyId(ad.id)
    try {
      await deleteAd(ad.id)
      setAds((prev) => prev.filter((a) => a.id !== ad.id))
      setToast({ type: 'success', message: 'آگهی حذف شد.' })
    } catch (err) {
      setToast({ type: 'error', message: 'حذف آگهی با خطا مواجه شد.' })
    } finally {
      setBusyId(null)
    }
  }

  async function handleReject(ad) {
    const reason = window.prompt('دلیل رد این آگهی را بنویسید (برای کاربر نمایش داده می‌شود):')
    if (reason === null) return // انصراف
    if (!reason.trim()) {
      setToast({ type: 'error', message: 'برای رد آگهی باید دلیل را بنویسید.' })
      return
    }
    setBusyId(ad.id)
    try {
      const updated = await updateAd(ad.id, { status: 'rejected', rejection_reason: reason.trim() })
      setAds((prev) => prev.map((a) => (a.id === ad.id ? updated : a)))
      setToast({ type: 'success', message: 'آگهی رد شد و دلیل آن برای کاربر نمایش داده می‌شود.' })
    } catch (err) {
      setToast({ type: 'error', message: 'رد کردن آگهی با خطا مواجه شد.' })
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div>
      <AdminPageHead
        title="مدیریت آگهی‌ها"
        description="افزودن، ویرایش، انتشار یا حذف آگهی‌ها"
        action={
          <Link to="/admin/ads/new" className="btn btn-primary">
            + آگهی جدید
          </Link>
        }
      />

      {loading && <LoadingBlock label="در حال بارگذاری آگهی‌ها..." />}
      {error && <ErrorBlock message="دریافت آگهی‌ها با خطا مواجه شد." />}
      {!loading && !error && ads.length === 0 && (
        <EmptyBlock title="هنوز آگهی‌ای ثبت نکرده‌اید" hint="با دکمه «آگهی جدید» اولین آگهی را اضافه کنید." />
      )}

      {!loading && !error && ads.length > 0 && (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th></th>
                <th>عنوان</th>
                <th>دسته‌بندی</th>
                <th>استان</th>
                <th>ثبت‌کننده</th>
                <th>وضعیت</th>
                <th>عملیات</th>
              </tr>
            </thead>
            <tbody>
              {ads.map((ad) => (
                <tr key={ad.id}>
                  <td>
                    <img
                      className="admin-table__thumb"
                      src={ad.images?.[0] || ''}
                      alt=""
                      onError={(e) => (e.target.style.visibility = 'hidden')}
                    />
                  </td>
                  <td className="admin-table__title" data-label="عنوان">{ad.title}</td>
                  <td data-label="دسته‌بندی">{AD_CATEGORY_MAP[ad.category] || ad.category}</td>
                  <td data-label="استان">{ad.province}</td>
                  <td data-label="ثبت‌کننده">
                    {ad.owner_name || ad.owner_phone ? (
                      <div className="admin-owner-cell">
                        <span className="admin-owner-cell__name">{ad.owner_name || 'بدون نام'}</span>
                        {(ad.owner_phone || ad.phone) && (
                          <a href={`tel:${ad.owner_phone || ad.phone}`} className="admin-owner-cell__phone">
                            {ad.owner_phone || ad.phone}
                          </a>
                        )}
                      </div>
                    ) : (
                      <span className="admin-owner-cell__admin">ثبت توسط ادمین</span>
                    )}
                  </td>
                  <td data-label="وضعیت">
                    <StatusPill status={ad.status} />
                    {ad.status === 'rejected' && ad.rejection_reason && (
                      <div className="admin-table__reject-reason" title={ad.rejection_reason}>
                        {ad.rejection_reason}
                      </div>
                    )}
                  </td>
                  <td data-label="عملیات">
                    <div className="admin-row-actions">
                      <Link to={`/admin/ads/${ad.id}/edit`} className="btn btn-outline btn-sm">
                        ویرایش
                      </Link>
                      <button
                        className="btn btn-outline btn-sm"
                        disabled={busyId === ad.id}
                        onClick={() => handleToggle(ad)}
                      >
                        {ad.status === 'published' ? 'عدم انتشار' : 'انتشار'}
                      </button>
                      {ad.status !== 'rejected' && (
                        <button
                          className="btn btn-outline btn-sm"
                          disabled={busyId === ad.id}
                          onClick={() => handleReject(ad)}
                        >
                          رد کردن
                        </button>
                      )}
                      <button
                        className="btn btn-danger btn-sm"
                        disabled={busyId === ad.id}
                        onClick={() => handleDelete(ad)}
                      >
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
