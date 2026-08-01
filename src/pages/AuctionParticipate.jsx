import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../admin/AuthContext'
import { getAuctionById, submitParticipation, getMyParticipation } from '../services/auctionService'
import { getMyProfile } from '../services/profileService'
import { uploadParticipationDocument } from '../services/storageService'
import { LoadingBlock, ErrorBlock } from '../components/StatusBlocks'
import ErrorModal from '../components/ErrorModal'
import { formatJalaliDate } from '../components/JalaliDateSelect'
import PriceInput from '../components/PriceInput'
import './Auctions.css'

export default function AuctionParticipate() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user, isAuthenticated, loading: authLoading } = useAuth()

  const [auction, setAuction] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [confirmed, setConfirmed] = useState(false)
  const [docs, setDocs] = useState([])
  const [uploading, setUploading] = useState(false)
  const [price, setPrice] = useState('')
  const [saving, setSaving] = useState(false)
  const [done, setDone] = useState(false)

  useEffect(() => {
    if (authLoading) return
    if (!isAuthenticated) {
      navigate('/login', { state: { redirectTo: `/auctions/${id}/participate` } })
      return
    }
    let mounted = true
    ;(async () => {
      try {
        const [a, p, existing] = await Promise.all([
          getAuctionById(id),
          getMyProfile(user.id),
          getMyParticipation(id, user.id).catch(() => null),
        ])
        if (!mounted) return
        if (existing) {
          navigate(`/auctions/${id}`, { replace: true })
          return
        }
        setAuction(a)
        setProfile(p)
      } catch {
        if (mounted) setError('بارگذاری اطلاعات با خطا مواجه شد.')
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => {
      mounted = false
    }
  }, [id, authLoading, isAuthenticated, user, navigate])

  async function handleUpload(e) {
    const files = Array.from(e.target.files || [])
    if (!files.length) return
    setUploading(true)
    try {
      const up = []
      for (const f of files) up.push(await uploadParticipationDocument(f))
      setDocs((prev) => [...prev, ...up])
    } catch {
      setError('آپلود مدارک با خطا مواجه شد.')
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  async function handleSubmit() {
    if (!confirmed) {
      setError('لطفاً ابتدا صحت اطلاعات شخصی خود را تایید کنید.')
      return
    }
    if (docs.length === 0) {
      setError('بارگذاری حداقل یک مدرک الزامی است.')
      return
    }
    setSaving(true)
    setError(null)
    try {
      await submitParticipation({
        auctionId: id,
        userId: user.id,
        offeredPrice: price,
        documents: docs,
        // پرداخت هنوز متصل نشده؛ تا اتصال درگاه، وضعیت «پرداخت‌نشده» می‌ماند
        paymentStatus: 'unpaid',
      })
      setDone(true)
    } catch (err) {
      setError('ثبت درخواست با خطا مواجه شد. لطفاً دوباره تلاش کنید.')
    } finally {
      setSaving(false)
    }
  }

  if (authLoading || loading) return <LoadingBlock label="در حال بارگذاری..." />
  if (error && !auction) return <ErrorBlock message={error} />
  if (!auction) return null

  const fullName = profile?.full_name || [profile?.first_name, profile?.last_name].filter(Boolean).join(' ')

  if (done) {
    return (
      <div className="container auc-gate auc-done">
        <div className="auc-done__icon">✓</div>
        <h2>درخواست شما ثبت شد</h2>
        <p className="auc-done__msg">
          کاربر گرامی جناب آقا/خانم <strong>{fullName}</strong>، درخواست شرکت در مزایده{' '}
          <strong>{auction.title}</strong> ثبت شد و پس از تایید توسط پلتفرم دیجی‌معدن در مزایده شرکت
          می‌نمایید. از صبر و شکیبایی شما سپاسگزاریم.
        </p>
        <button className="btn btn-auc" onClick={() => navigate('/dashboard?tab=auctions')}>
          مشاهده در پنل کاربری
        </button>
      </div>
    )
  }

  return (
    <div className="auc-page">
      <div className="auc-hero auc-hero--detail">
        <div className="container">
          <span className="auc-eyebrow">شرکت در مزایده</span>
          <h1 className="auc-title">{auction.title}</h1>
        </div>
      </div>

      <div className="container auc-body auc-participate">
        {/* ۱ — تایید اطلاعات شخصی */}
        <section className="auc-step">
          <h2>۱. تایید اطلاعات شخصی</h2>
          <dl className="auc-profile">
            <div><dt>نام و نام خانوادگی</dt><dd>{fullName || '—'}</dd></div>
            <div><dt>کد ملی</dt><dd>{profile?.national_id || '—'}</dd></div>
            <div><dt>شماره تماس</dt><dd>{profile?.phone || '—'}</dd></div>
            <div><dt>تاریخ تولد</dt><dd>{formatJalaliDate(profile?.birth_date)}</dd></div>
            <div><dt>استان / شهر</dt><dd>{[profile?.province, profile?.city].filter(Boolean).join(' / ') || '—'}</dd></div>
            <div><dt>کد پستی</dt><dd>{profile?.postal_code || '—'}</dd></div>
            <div className="auc-profile__wide"><dt>آدرس</dt><dd>{profile?.address || '—'}</dd></div>
          </dl>

          <label className="auc-confirm">
            <input type="checkbox" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} />
            اطلاعات فوق مورد تایید من است.
          </label>
          <p className="auc-muted">
            در صورت نیاز به اصلاح، از <a href="/dashboard?tab=profile">پنل کاربری</a> اطلاعات خود را
            ویرایش کنید.
          </p>
        </section>

        {/* ۲ — بارگذاری مدارک */}
        <section className="auc-step">
          <h2>۲. بارگذاری مدارک</h2>
          <p className="auc-muted">
            مدارک درخواستی را به‌صورت عکس یا PDF بارگذاری کنید. <strong>مدارک باید کاملاً واضح و
            خوانا باشند؛</strong> در غیر این صورت درخواست شما تایید نخواهد شد.
          </p>
          <div className="auction-upload">
            <input
              type="file"
              accept="image/*,application/pdf"
              multiple
              id="part-docs"
              onChange={handleUpload}
              disabled={uploading}
            />
            <label htmlFor="part-docs" className="btn btn-auc-outline btn-sm">
              {uploading ? 'در حال بارگذاری...' : 'انتخاب مدارک'}
            </label>
          </div>
          {docs.length > 0 && (
            <ul className="auc-doclist auc-doclist--compact">
              {docs.map((d, i) => (
                <li key={d.path}>
                  <span>📎 {d.name}</span>
                  <button
                    className="btn btn-auc-outline btn-sm"
                    onClick={() => setDocs((p) => p.filter((_, x) => x !== i))}
                  >
                    حذف
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* ۳ — پیشنهاد قیمت */}
        <section className="auc-step">
          <h2>۳. پیشنهاد قیمت</h2>
          <div className="admin-field">
            <span>مبلغ پیشنهادی شما</span>
            <PriceInput value={price} onChange={setPrice} placeholder="مثال: 1,500,000,000" />
          </div>
        </section>

        {/* ۴ — پرداخت */}
        <section className="auc-step">
          <h2>۴. پرداخت</h2>
          {auction.entry_fee != null && (
            <p className="auc-fee">
              قیمت پایه مزایده: <strong>{Number(auction.entry_fee).toLocaleString('fa-IR')} تومان</strong>
            </p>
          )}
          <div className="auc-payment-pending">
            درگاه پرداخت هنوز به سایت متصل نشده است. پس از اتصال درگاه، این بخش فعال می‌شود و
            پرداخت پیش از ثبت نهایی انجام خواهد شد.
          </div>
        </section>

        <div className="auc-submit-row">
          <button className="btn btn-auc" disabled={saving} onClick={handleSubmit}>
            {saving ? 'در حال ثبت...' : 'تکمیل شرکت در مزایده'}
          </button>
        </div>
      </div>

      <ErrorModal message={error} onClose={() => setError(null)} />
    </div>
  )
}
