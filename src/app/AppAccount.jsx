import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../admin/AuthContext'
import { logout } from '../services/authService'
import { getMyProfile } from '../services/profileService'
import { getOrCreateWallet, getWalletTransactions } from '../services/walletService'
import { CONTACT_INFO, WALLET_POINTS, WALLET_REASON_LABELS, buildWhatsAppLink } from '../lib/constants'
import AppIcon from './AppIcons'
import { useGuide } from './GuideContext'
import { disablePush, enablePush, isPushEnabled, pushPermission, pushSupported } from './push'
import './AppAccount.css'

const fa = (n) => Number(n || 0).toLocaleString('fa-IR')
const faDigits = (s) => String(s).replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[d])

function Row({ icon, color, label, hint, to, href, onClick, danger }) {
  const body = (
    <>
      <span className="acct-row__icon" style={{ '--c': color }}>
        <AppIcon name={icon} size={21} />
      </span>
      <span className="acct-row__text">
        <b>{label}</b>
        {hint && <small>{hint}</small>}
      </span>
      <AppIcon name="chevL" size={18} className="acct-row__arrow" />
    </>
  )
  const cls = 'acct-row' + (danger ? ' acct-row--danger' : '')
  if (to) return <Link to={to} className={cls}>{body}</Link>
  if (href) return <a href={href} className={cls} target="_blank" rel="noopener noreferrer">{body}</a>
  return <button type="button" className={cls} onClick={onClick}>{body}</button>
}

// پنجره‌ی پایین صفحه (برای امتیازها و تأیید خروج)
function Sheet({ title, onClose, children }) {
  return (
    <div className="guide-overlay" onClick={onClose}>
      <div className="acct-sheet" role="dialog" aria-modal="true" aria-label={title} onClick={(e) => e.stopPropagation()}>
        <span className="acct-sheet__handle" />
        <h2 className="acct-sheet__title">{title}</h2>
        <div className="acct-sheet__body">{children}</div>
      </div>
    </div>
  )
}

export default function AppAccount() {
  const { isAuthenticated, user, loading } = useAuth()
  const navigate = useNavigate()
  const { openGuide } = useGuide()
  const [name, setName] = useState(null)
  const [points, setPoints] = useState(null)
  const [sheet, setSheet] = useState(null) // 'points' | 'logout'
  const [txs, setTxs] = useState(null)
  const [txError, setTxError] = useState(false)
  const [pushOn, setPushOn] = useState(false)
  const [pushBusy, setPushBusy] = useState(false)

  useEffect(() => {
    isPushEnabled().then(setPushOn)
  }, [])

  async function togglePush() {
    if (pushBusy) return
    if (pushPermission() === 'denied') {
      setSheet('notify-denied')
      return
    }
    setPushBusy(true)
    try {
      if (pushOn) {
        await disablePush()
        setPushOn(false)
      } else {
        const r = await enablePush()
        setPushOn(Boolean(r.ok))
        if (!r.ok && r.reason === 'denied') setSheet('notify-denied')
      }
    } catch {
      /* ignore */
    }
    setPushBusy(false)
  }

  useEffect(() => {
    if (!isAuthenticated || !user) return undefined
    let alive = true
    getMyProfile(user.id)
      .then((p) => {
        if (!alive || !p) return
        setName(p.full_name || [p.first_name, p.last_name].filter(Boolean).join(' ') || null)
      })
      .catch(() => {})
    getOrCreateWallet(user.id)
      .then((w) => alive && setPoints(w.points_balance))
      .catch(() => {})
    return () => {
      alive = false
    }
  }, [isAuthenticated, user])

  function openPoints() {
    setSheet('points')
    if (txs || !user) return
    getWalletTransactions(user.id)
      .then(setTxs)
      .catch(() => setTxError(true))
  }

  async function doLogout() {
    await logout()
    setSheet(null)
    navigate('/')
  }

  const wa = buildWhatsAppLink(CONTACT_INFO.whatsappPhone, 'سلام، نیاز به راهنمایی دارم.')
  const contactLine = user?.phone ? faDigits(user.phone) : user?.email || ''
  const initial = (name || contactLine || 'د').trim().charAt(0)

  if (loading) {
    return <div className="acct acct--center"><span className="acct-spinner" /></div>
  }

  return (
    <div className="acct">
      {isAuthenticated ? (
        <>
          <section className="acct-hero">
            <span className="acct-hero__avatar">{initial}</span>
            <div className="acct-hero__text">
              <b>{name || 'کاربر دیجی‌معدن'}</b>
              {contactLine && <small dir="ltr">{contactLine}</small>}
            </div>
          </section>

          <button type="button" className="acct-points" onClick={openPoints}>
            <span className="acct-points__icon"><AppIcon name="star" size={24} /></span>
            <span className="acct-points__text">
              <small>امتیاز شما</small>
              <b>{points == null ? '…' : fa(points)}</b>
            </span>
            <span className="acct-points__more">مشاهده جزئیات</span>
          </button>

          <h2 className="acct-title">فعالیت‌های من</h2>
          <div className="acct-list">
            <Row icon="file" color="#C2703D" label="آگهی‌های من" hint="مشاهده و ویرایش آگهی‌ها" to="/dashboard?tab=ads" />
            <Row icon="gavel" color="#B5483A" label="مزایده‌های من" to="/dashboard?tab=auctions" />
            <Row icon="article" color="#7A6A58" label="مقالات من" to="/dashboard?tab=articles" />
            <Row icon="message" color="#3E7CB1" label="پیام‌ها و گفتگوها" to="/dashboard?tab=messages" />
            <Row icon="user" color="#8E5BB5" label="اطلاعات پروفایل" to="/dashboard?tab=profile" />
            <Row icon="wallet" color="#2E8B7A" label="امتیاز و کیف‌پول" hint="جزئیات امتیازها" onClick={openPoints} />
          </div>
        </>
      ) : (
        <section className="acct-guest">
          <img src="/logo.png" alt="" className="acct-guest__logo" />
          <h2>به حساب خود وارد شوید</h2>
          <p>برای ثبت آگهی، دیدن آگهی‌ها و مزایده‌های خودتان، پیام‌ها و امتیازها وارد شوید یا ثبت‌نام کنید.</p>
          <Link to="/login" state={{ redirectTo: '/dashboard' }} className="acct-guest__btn">
            ورود / ثبت‌نام
          </Link>
        </section>
      )}

      <h2 className="acct-title">پشتیبانی و راهنما</h2>
      <div className="acct-list">
        <Row icon="whatsapp" color="#25A55F" label="پشتیبانی در واتساپ" hint="پاسخ سریع به سؤال‌های شما" href={wa} />
        <Row icon="phone" color="#3E7CB1" label="تماس تلفنی" hint={faDigits(CONTACT_INFO.phones[0])} href={`tel:${CONTACT_INFO.phones[0]}`} />
        {pushSupported() && (
          <Row
            icon="bell"
            color="#D9A21B"
            label="اعلان‌ها"
            hint={
              pushPermission() === 'denied'
                ? 'در تنظیمات گوشی مسدود است'
                : pushOn
                  ? 'فعال است؛ برای خاموش کردن بزنید'
                  : 'آگهی تازه، تأیید آگهی و پیام‌ها'
            }
            onClick={togglePush}
          />
        )}
        <Row icon="help" color="#8E5BB5" label="راهنمای اپلیکیشن" hint="آموزش کار با بخش‌ها" onClick={() => openGuide('welcome')} />
        <Row icon="info" color="#5C7A52" label="درباره دیجی‌معدن" to="/about" />
        {isAuthenticated && (
          <Row icon="logout" color="#B5483A" label="خروج از حساب" onClick={() => setSheet('logout')} danger />
        )}
      </div>

      {sheet === 'points' && (
        <Sheet title="امتیازهای من" onClose={() => setSheet(null)}>
          <div className="acct-sheet__score">
            <AppIcon name="star" size={26} />
            <b>{points == null ? '…' : fa(points)}</b>
            <span>امتیاز</span>
          </div>

          <h3 className="acct-sheet__sub">چطور امتیاز بگیرم؟</h3>
          <ul className="acct-sheet__rules">
            <li><span>ثبت آگهی</span><b>+{fa(WALLET_POINTS.AD_REGISTRATION)}</b></li>
            <li><span>تکمیل معامله</span><b>+{fa(WALLET_POINTS.SUCCESSFUL_TRANSACTION)}</b></li>
            <li><span>تأیید هویت</span><b>+{fa(WALLET_POINTS.IDENTITY_VERIFICATION)}</b></li>
            <li><span>معرفی کاربر جدید</span><b>+{fa(WALLET_POINTS.REFERRAL)}</b></li>
          </ul>

          <h3 className="acct-sheet__sub">سابقه‌ی امتیازها</h3>
          {!txs && !txError && <p className="acct-sheet__muted">در حال بارگذاری...</p>}
          {txError && <p className="acct-sheet__muted">دریافت سابقه با خطا مواجه شد.</p>}
          {txs && txs.length === 0 && <p className="acct-sheet__muted">هنوز امتیازی ثبت نشده است.</p>}
          {txs && txs.length > 0 && (
            <ul className="acct-sheet__tx">
              {txs.slice(0, 20).map((t) => (
                <li key={t.id}>
                  <span>
                    {WALLET_REASON_LABELS[t.reason] || t.reason}
                    <small>{new Date(t.created_at).toLocaleDateString('fa-IR')}</small>
                  </span>
                  <b className={t.amount < 0 ? 'is-neg' : ''}>{t.amount > 0 ? '+' : ''}{fa(t.amount)}</b>
                </li>
              ))}
            </ul>
          )}
          <button type="button" className="guide-btn guide-btn--primary" onClick={() => setSheet(null)}>
            بستن
          </button>
        </Sheet>
      )}

      {sheet === 'notify-denied' && (
        <Sheet title="اعلان‌ها مسدود است" onClose={() => setSheet(null)}>
          <p className="acct-sheet__muted acct-sheet__muted--center">
            برای فعال‌سازی، از تنظیمات گوشی وارد بخش اعلان‌های «دیجی‌معدن» شوید و اجازه‌ی اعلان را بدهید. بعد دوباره همین‌جا را بزنید.
          </p>
          <button type="button" className="guide-btn guide-btn--primary" onClick={() => setSheet(null)}>
            متوجه شدم
          </button>
        </Sheet>
      )}

      {sheet === 'logout' && (
        <Sheet title="خروج از حساب" onClose={() => setSheet(null)}>
          <p className="acct-sheet__muted acct-sheet__muted--center">آیا می‌خواهید از حساب کاربری خود خارج شوید؟</p>
          <button type="button" className="guide-btn acct-btn-danger" onClick={doLogout}>
            بله، خروج
          </button>
          <button type="button" className="guide-btn guide-btn--ghost" onClick={() => setSheet(null)}>
            انصراف
          </button>
        </Sheet>
      )}
    </div>
  )
}
