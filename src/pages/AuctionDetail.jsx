import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../admin/AuthContext'
import {
  getAuctionById,
  getAuctionDocumentUrl,
  getMyParticipation,
} from '../services/auctionService'
import { getMyProfile } from '../services/profileService'
import { isAuctionProfileComplete } from './Auctions'
import { LoadingBlock, ErrorBlock } from '../components/StatusBlocks'
import ErrorModal from '../components/ErrorModal'
import { formatJalaliDateTime } from '../components/JalaliDateSelect'
import { AD_CATEGORY_MAP } from '../lib/constants'
import { useSeo } from '../lib/useSeo'
import './Auctions.css'

export default function AuctionDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user, isAuthenticated, loading: authLoading } = useAuth()

  const [auction, setAuction] = useState(null)
  const [participation, setParticipation] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [docError, setDocError] = useState(null)
  const [busyDoc, setBusyDoc] = useState(null)
  const [gate, setGate] = useState(null)

  useSeo({
    title: auction?.title,
    description: auction ? (auction.description || '').slice(0, 150) : undefined,
    path: `/auctions/${id}`,
  })

  useEffect(() => {
    if (authLoading) return
    if (!isAuthenticated) {
      navigate('/login', { state: { redirectTo: `/auctions/${id}` } })
      return
    }
    let mounted = true
    ;(async () => {
      try {
        const profile = await getMyProfile(user.id).catch(() => null)
        if (!mounted) return
        if (!isAuctionProfileComplete(profile)) {
          setGate('profile')
          setLoading(false)
          return
        }
        const [a, p] = await Promise.all([
          getAuctionById(id),
          getMyParticipation(id, user.id).catch(() => null),
        ])
        if (!mounted) return
        setAuction(a)
        setParticipation(p)
      } catch {
        if (mounted) setError('این مزایده یافت نشد یا حذف شده است.')
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => {
      mounted = false
    }
  }, [id, authLoading, isAuthenticated, user, navigate])

  async function handleDownload(doc) {
    setBusyDoc(doc.url)
    setDocError(null)
    try {
      const url = await getAuctionDocumentUrl(id, doc.url)
      window.open(url, '_blank', 'noopener')
    } catch (err) {
      setDocError(err.message || 'دریافت فایل با خطا مواجه شد.')
    } finally {
      setBusyDoc(null)
    }
  }

  if (authLoading || loading) return <LoadingBlock label="در حال بارگذاری مزایده..." />

  if (gate === 'profile') {
    return (
      <div className="container auc-gate">
        <h2>برای مشاهده‌ی این مزایده، ابتدا پروفایل خود را کامل کنید</h2>
        <p>نام، نام خانوادگی، تاریخ تولد، استان، شهر، آدرس و کد پستی الزامی است.</p>
        <button className="btn btn-auc" onClick={() => navigate('/dashboard?tab=profile')}>
          تکمیل اطلاعات
        </button>
      </div>
    )
  }

  if (error) return <ErrorBlock message={error} />
  if (!auction) return null

  const now = new Date()
  const docsOpen =
    (!auction.docs_open_at || now >= new Date(auction.docs_open_at)) &&
    (!auction.docs_close_at || now <= new Date(auction.docs_close_at))
  const docsNotYet = auction.docs_open_at && now < new Date(auction.docs_open_at)

  const participateOpen =
    auction.status === 'published' &&
    (!auction.participate_opens_at || now >= new Date(auction.participate_opens_at))

  return (
    <div className="auc-page">
      <div className="auc-hero auc-hero--detail">
        <div className="container">
          <span className="auc-eyebrow">{AD_CATEGORY_MAP[auction.category] || auction.category}</span>
          <h1 className="auc-title">{auction.title}</h1>
          {auction.held_at_text && (
            <p className="auc-subtitle">زمان برگزاری: {auction.held_at_text}</p>
          )}
        </div>
      </div>

      <div className="container auc-body auc-detail">
        <div className="auc-detail__main">
          {auction.images?.length > 0 && (
            <div className="auc-gallery">
              {auction.images.map((src) => (
                <img key={src} src={src} alt={auction.title} loading="lazy" />
              ))}
            </div>
          )}

          {auction.description && (
            <section className="auc-section">
              <h2>توضیحات مزایده</h2>
              <p>{auction.description}</p>
            </section>
          )}

          {auction.terms && (
            <section className="auc-section auc-section--terms">
              <h2>شرایط شرکت در مزایده</h2>
              <p>{auction.terms}</p>
            </section>
          )}

          <section className="auc-section">
            <h2>مدارک مزایده</h2>

            {auction.docs_open_at && (
              <p className="auc-window">
                بازه‌ی دریافت مدارک: از {formatJalaliDateTime(auction.docs_open_at)}
                {auction.docs_close_at && <> تا {formatJalaliDateTime(auction.docs_close_at)}</>}
              </p>
            )}

            {(auction.documents || []).length === 0 && <p className="auc-muted">مدرکی بارگذاری نشده است.</p>}

            {!docsOpen && (auction.documents || []).length > 0 && (
              <p className="auc-locked">
                {docsNotYet
                  ? 'هنوز زمان دریافت مدارک فرا نرسیده است.'
                  : 'مهلت دریافت مدارک این مزایده به پایان رسیده است.'}
              </p>
            )}

            {docsOpen && (
              <ul className="auc-doclist">
                {(auction.documents || []).map((d) => (
                  <li key={d.url}>
                    <span>📄 {d.name}</span>
                    <button
                      className="btn btn-auc-outline btn-sm"
                      disabled={busyDoc === d.url}
                      onClick={() => handleDownload(d)}
                    >
                      {busyDoc === d.url ? 'در حال آماده‌سازی...' : 'دانلود'}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {auction.result_text && (
            <section className="auc-section auc-section--result">
              <h2>نتیجه مزایده</h2>
              <p>{auction.result_text}</p>
            </section>
          )}
        </div>

        <aside className="auc-detail__side">
          <div className="auc-box">
            {auction.entry_fee != null && (
              <div className="auc-box__row">
                <span>قیمت پایه مزایده</span>
                <strong>{Number(auction.entry_fee).toLocaleString('fa-IR')} تومان</strong>
              </div>
            )}
            {auction.participate_opens_at && (
              <div className="auc-box__row">
                <span>زمان شروع شرکت</span>
                <strong>{formatJalaliDateTime(auction.participate_opens_at)}</strong>
              </div>
            )}

            {participation ? (
              <div className="auc-participated">
                <strong>شما در این مزایده ثبت‌نام کرده‌اید.</strong>
                <span>
                  وضعیت:{' '}
                  {participation.status === 'approved'
                    ? 'تایید شده'
                    : participation.status === 'rejected'
                    ? 'رد شده'
                    : 'در انتظار تایید'}
                </span>
                <Link to="/dashboard?tab=auctions" className="btn btn-auc-outline btn-sm">
                  مشاهده در پنل کاربری
                </Link>
              </div>
            ) : auction.status === 'closed' ? (
              <button className="btn btn-auc" disabled>
                این مزایده پایان یافته است
              </button>
            ) : participateOpen ? (
              <button className="btn btn-auc" onClick={() => navigate(`/auctions/${id}/participate`)}>
                شرکت در مزایده
              </button>
            ) : (
              <button className="btn btn-auc btn-auc--pending" disabled>
                شرکت در مزایده
                <small>{formatJalaliDateTime(auction.participate_opens_at)}</small>
              </button>
            )}
          </div>
        </aside>
      </div>

      <ErrorModal message={docError} onClose={() => setDocError(null)} />
    </div>
  )
}
