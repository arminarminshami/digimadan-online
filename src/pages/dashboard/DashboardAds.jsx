import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getMyAds, boostAd } from '../../services/auctionsService'
import { deleteAd } from '../../services/adsService'
import { AD_CATEGORY_MAP, AD_STATUS_LABELS } from '../../lib/constants'
import { LoadingBlock, EmptyBlock } from '../../components/StatusBlocks'
import './DashboardAds.css'

export default function DashboardAds({ user }) {
  const [ads, setAds] = useState([])
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState(null)
  const [error, setError] = useState(null)

  function load() {
    setLoading(true)
    getMyAds(user.id)
      .then(setAds)
      .catch((err) => setError('بارگذاری آگهی‌های شما با خطا مواجه شد.'))
      .finally(() => setLoading(false))
  }

  useEffect(load, [user])

  async function handleDelete(ad) {
    if (!window.confirm(`آگهی «${ad.title}» حذف شود؟ این عمل قابل بازگشت نیست.`)) return
    setBusyId(ad.id)
    try {
      await deleteAd(ad.id)
      setAds((prev) => prev.filter((a) => a.id !== ad.id))
    } catch {
      setError('حذف آگهی با خطا مواجه شد.')
    } finally {
      setBusyId(null)
    }
  }

  async function handleBoost(ad) {
    setBusyId(ad.id)
    try {
      const updated = await boostAd(ad.id)
      setAds((prev) =>
        [...prev.filter((a) => a.id !== ad.id), updated].sort(
          (a, b) => new Date(b.boosted_at || b.created_at) - new Date(a.boosted_at || a.created_at)
        )
      )
    } catch {
      setError('نردبان کردن آگهی با خطا مواجه شد.')
    } finally {
      setBusyId(null)
    }
  }

  if (loading) return <LoadingBlock label="در حال بارگذاری آگهی‌های شما..." />

  return (
    <div className="my-ads">
      <div className="my-ads__head">
        <h2>آگهی‌های من ({ads.length})</h2>
        <Link to="/submit-ad" className="btn btn-primary btn-sm">+ آگهی جدید</Link>
      </div>

      {error && <p className="profile-form__error">{error}</p>}

      {ads.length === 0 ? (
        <EmptyBlock title="هنوز آگهی‌ای ثبت نکرده‌اید" hint="از دکمه‌ی بالا اولین آگهی خود را ثبت کنید." />
      ) : (
        <div className="my-ads__list">
          {ads.map((ad) => {
            const isBusy = busyId === ad.id
            const isBoosted =
              ad.boosted_at && Date.now() - new Date(ad.boosted_at).getTime() < 7 * 24 * 60 * 60 * 1000
            return (
              <div key={ad.id} className="my-ads__item">
                <img
                  className="my-ads__thumb"
                  src={ad.images?.[0] || '/logo.png'}
                  alt={ad.title}
                />
                <div className="my-ads__info">
                  <Link to={`/ads/${ad.id}`} className="my-ads__title">
                    {ad.title}
                    {isBoosted && <span className="my-ads__boost-badge">نردبان‌شده</span>}
                  </Link>
                  <span className="my-ads__meta">
                    {AD_CATEGORY_MAP[ad.category] || ad.category} · {AD_STATUS_LABELS[ad.status] || ad.status}
                  </span>
                  {ad.status === 'rejected' && ad.rejection_reason && (
                    <span className="my-ads__reject-reason">دلیل رد: {ad.rejection_reason}</span>
                  )}
                </div>
                <div className="my-ads__actions">
                  <Link to={`/submit-ad?edit=${ad.id}`} className="btn btn-outline btn-sm">ویرایش</Link>
                  <button
                    className="btn btn-outline btn-sm"
                    disabled={isBusy}
                    onClick={() => handleBoost(ad)}
                  >
                    {isBusy ? '...' : 'نردبان کردن'}
                  </button>
                  <button
                    className="btn btn-danger btn-sm"
                    disabled={isBusy}
                    onClick={() => handleDelete(ad)}
                  >
                    حذف
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
