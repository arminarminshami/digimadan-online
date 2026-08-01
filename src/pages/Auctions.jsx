import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../admin/AuthContext'
import { getPublicAuctions } from '../services/auctionService'
import { getMyProfile } from '../services/profileService'
import { LoadingBlock, EmptyBlock, ErrorBlock } from '../components/StatusBlocks'
import { formatJalaliDateTime } from '../components/JalaliDateSelect'
import { AD_CATEGORY_MAP } from '../lib/constants'
import { useSeo } from '../lib/useSeo'
import './Auctions.css'

// فیلدهای اجباری برای ورود به بخش مزایده
export function isAuctionProfileComplete(p) {
  if (!p) return false
  return Boolean(
    p.first_name?.trim() &&
      p.last_name?.trim() &&
      p.birth_date &&
      p.province?.trim() &&
      p.city?.trim() &&
      p.address?.trim() &&
      p.postal_code?.trim()
  )
}

function statusOf(a) {
  const now = new Date()
  if (a.status === 'closed') return { key: 'closed', label: 'پایان‌یافته' }
  if (a.participate_opens_at && now < new Date(a.participate_opens_at))
    return { key: 'upcoming', label: 'در پیش رو' }
  return { key: 'live', label: 'در حال برگزاری' }
}

export default function Auctions() {
  const { user, isAuthenticated, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const [auctions, setAuctions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [gate, setGate] = useState(null) // 'login' | 'profile' | null

  useSeo({
    title: 'مزایده‌های معدنی',
    description: 'مزایده‌های رسمی خرید و فروش مواد معدنی، معادن و ماشین‌آلات معدنی در دیجی‌معدن.',
    path: '/auctions',
  })

  useEffect(() => {
    if (authLoading) return
    if (!isAuthenticated) {
      setGate('login')
      setLoading(false)
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
        setGate(null)
        setAuctions(await getPublicAuctions())
      } catch {
        if (mounted) setError('دریافت مزایده‌ها با خطا مواجه شد.')
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => {
      mounted = false
    }
  }, [authLoading, isAuthenticated, user])

  if (authLoading || loading) return <LoadingBlock label="در حال بارگذاری..." />

  if (gate === 'login') {
    return (
      <div className="auc-page">
        <div className="auc-hero">
          <div className="container">
            <span className="auc-eyebrow">بخش مزایده</span>
            <h1 className="auc-title">مزایده‌های رسمی دیجی‌معدن</h1>
          </div>
        </div>
        <div className="container auc-gate">
          <h2>برای مشاهده‌ی مزایده‌ها وارد حساب کاربری شوید</h2>
          <p>دسترسی به مزایده‌ها و مدارک آن‌ها تنها برای کاربران احراز هویت‌شده امکان‌پذیر است.</p>
          <button className="btn btn-auc" onClick={() => navigate('/login', { state: { redirectTo: '/auctions' } })}>
            ورود / ثبت‌نام
          </button>
        </div>
      </div>
    )
  }

  if (gate === 'profile') {
    return (
      <div className="auc-page">
        <div className="auc-hero">
          <div className="container">
            <span className="auc-eyebrow">بخش مزایده</span>
            <h1 className="auc-title">تکمیل اطلاعات الزامی است</h1>
          </div>
        </div>
        <div className="container auc-gate">
          <h2>برای ورود به بخش مزایده، پروفایل شما باید کامل باشد</h2>
          <p>
            موارد لازم: نام، نام خانوادگی، تاریخ تولد، استان، شهر، آدرس و کد پستی.
            این اطلاعات برای اعتبارسنجی شرکت‌کنندگان مزایده ضروری است.
          </p>
          <button className="btn btn-auc" onClick={() => navigate('/dashboard?tab=profile')}>
            تکمیل اطلاعات پروفایل
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="auc-page">
      <div className="auc-hero">
        <div className="container">
          <span className="auc-eyebrow">بخش مزایده</span>
          <h1 className="auc-title">مزایده‌های رسمی دیجی‌معدن</h1>
          <p className="auc-subtitle">
            فهرست مزایده‌های در حال برگزاری و پیش رو. برای دریافت مدارک و شرکت، وارد هر مزایده شوید.
          </p>
        </div>
      </div>

      <div className="container auc-body">
        {error && <ErrorBlock message={error} />}
        {!error && auctions.length === 0 && (
          <EmptyBlock title="در حال حاضر مزایده‌ای برگزار نمی‌شود" hint="به‌زودی مزایده‌های جدید اعلام می‌شود." />
        )}

        <div className="auc-grid">
          {auctions.map((a) => {
            const st = statusOf(a)
            const cover = a.images?.[0]
            return (
              <Link key={a.id} to={`/auctions/${a.id}`} className="auc-card">
                <div className="auc-card__media">
                  {cover ? <img src={cover} alt={a.title} loading="lazy" /> : <div className="auc-card__ph" />}
                  <span className={`auc-badge auc-badge--${st.key}`}>{st.label}</span>
                </div>
                <div className="auc-card__body">
                  <span className="auc-card__cat">{AD_CATEGORY_MAP[a.category] || a.category}</span>
                  <h2 className="auc-card__title">{a.title}</h2>
                  {a.description && <p className="auc-card__desc">{a.description.slice(0, 110)}…</p>}
                  <dl className="auc-card__meta">
                    {a.held_at_text && (
                      <div>
                        <dt>زمان برگزاری</dt>
                        <dd>{a.held_at_text}</dd>
                      </div>
                    )}
                    {a.participate_opens_at && (
                      <div>
                        <dt>شروع شرکت</dt>
                        <dd>{formatJalaliDateTime(a.participate_opens_at)}</dd>
                      </div>
                    )}
                  </dl>
                  <span className="auc-card__cta">مشاهده جزئیات و مدارک ←</span>
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}
