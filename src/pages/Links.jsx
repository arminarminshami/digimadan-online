import { useEffect, useState } from 'react'
import './Links.css'

/* ===== فقط این بخش را ویرایش کنید ===== */
const LINKS = [
  { title: 'وب‌سایت دیجی‌معدن', sub: 'آگهی‌ها، مزایده‌ها و قیمت‌ها', url: 'https://digimadan.com', icon: 'globe' },
  { title: 'اینستاگرام', sub: 'digimadan.co', url: 'https://instagram.com/digimadan.co', icon: 'insta' },
  { title: 'کانال تلگرام', sub: 'آگهی‌های جدید و اخبار بازار', url: 'https://t.me/digimadan', icon: 'telegram' },
  { title: 'مدیریت مشتریان و پشتیبانی', sub: 'ارتباط مستقیم با مهندس شامی', profile: true, icon: 'support' },
  { title: 'درباره دیجی‌معدن', sub: 'با ما بیشتر آشنا شوید', url: '/about', icon: 'info', internal: true },
]

const PROFILE = {
  name: 'مهندس شامی',
  role: 'فایندر، مسئول پشتیبانی و ارتباط با مشتریان دیجی‌معدن',
  bio: "اینجانب شامی، به‌عنوان فعال حوزه معدن، استخراج و فرآوری مواد معدنی، همواره از نزدیک با چالش‌ها و نیازهای فعالان این صنعت آشنا بوده‌ام. مشکلات معدن‌داران در زمینه بازاریابی و فروش محصولات معدنی، یافتن خریداران مناسب، چالش کارخانه‌های فرآوری در تأمین مواد اولیه و همچنین نیازهای پیمانکاران فعال در حوزه‌های اکتشاف، استخراج و فرآوری و فعالان حوزه ماشین‌آلات معدنی، از جمله مسائلی است که در طول فعالیت حرفه‌ای خود با آن‌ها مواجه شده‌ام.\n\nشناخت این چالش‌ها و تجربه مستقیم فعالیت در صنعت معدن، زمینه‌ساز شکل‌گیری ایده راه‌اندازی دیجی‌معدن (DigiMadan) شد؛ بستری تخصصی با هدف تسهیل ارتباط میان معدن‌داران، تأمین‌کنندگان، خریداران، پیمانکاران و کارخانه‌های فرآوری مواد معدنی.\n\nاین مجموعه با همکاری جناب آقای دکتر جعفری و در چارچوب مجموعه شرکت هامون راه‌اندازی شد تا با بهره‌گیری از ظرفیت‌های فضای دیجیتال، زمینه توسعه ارتباطات تجاری، تسهیل فرآیند خریدوفروش و بهبود دسترسی فعالان صنعت به بازارهای هدف فراهم شود.\n\nدر حال حاضر، علاوه بر فعالیت در حوزه معدن، به‌صورت مستقیم مسئولیت پشتیبانی و ارتباط با مشتریان دیجی‌معدن را نیز بر عهده دارم. باور دارم که ارائه خدمات مؤثر و کاربردی، مستلزم شناخت دقیق نیازها، شنیدن دغدغه‌ها و آگاهی از مشکلات واقعی کاربران است. به همین دلیل، ارتباط مستقیم با مشتریان را فرصتی ارزشمند برای شناسایی چالش‌ها، بهبود خدمات و توسعه مستمر دیجی‌معدن می‌دانم.\n\nاز این رو، تمامی فعالان صنعت معدن، اعم از معدن‌داران، تأمین‌کنندگان و خریداران مواد معدنی، کارخانه‌های فرآوری، پیمانکاران و فعالان حوزه ماشین‌آلات معدنی می‌توانند برای دریافت راهنمایی، طرح پرسش‌ها، ارائه پیشنهادها، پیگیری مسائل و بررسی زمینه‌های همکاری، به‌صورت مستقیم با اینجانب در ارتباط باشند.\n\nهدف من در دیجی‌معدن، فراتر از پشتیبانی کاربران است؛ تلاش می‌کنم با تکیه بر تجربه عملی در صنعت معدن و ارتباط مستمر با فعالان این حوزه، در مسیر رفع موانع، بهبود خدمات و ایجاد ارتباطات تجاری مؤثرتر گام بردارم.\n\nدیجی‌معدن؛ بستری برای ارتباط مؤثرتر و توسعه همکاری‌های تجاری در صنعت معدن و مواد معدنی.",
  phone: '09143502304',
  photo: '/shami.jpg',
}
/* ===================================== */

function Icon({ name }) {
  const p = {
    globe: (<><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3z" /></>),
    insta: (<><rect x="3.5" y="3.5" width="17" height="17" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.2" cy="6.8" r=".6" /></>),
    telegram: (<><path d="M21 4 3 11l5.5 2L10 19l3-3.5 4.5 3.3z" /><path d="m8.5 13 8-6" /></>),
    support: (<><path d="M4 14v-2a8 8 0 0 1 16 0v2" /><rect x="3" y="14" width="4" height="6" rx="1.5" /><rect x="17" y="14" width="4" height="6" rx="1.5" /><path d="M19 20c0 1.2-1.8 2-5 2" /></>),
    info: (<><circle cx="12" cy="12" r="9" /><path d="M12 11v5.5M12 7.8v.1" /></>),
  }
  return <svg viewBox="0 0 24 24" aria-hidden="true">{p[name]}</svg>
}

export default function Links() {
  const [hash, setHash] = useState(typeof window !== 'undefined' ? window.location.hash : '')

  useEffect(() => {
    const prevTitle = document.title
    document.title = 'دیجی‌معدن | لینک‌های ما'
    const meta = document.createElement('meta')
    meta.name = 'robots'
    meta.content = 'noindex'
    document.head.appendChild(meta)
    const onHash = () => { setHash(window.location.hash); window.scrollTo(0, 0) }
    window.addEventListener('hashchange', onHash)
    return () => {
      window.removeEventListener('hashchange', onHash)
      document.title = prevTitle
      meta.remove()
    }
  }, [])

  const showProfile = hash === '#support' && PROFILE.phone

  return (
    <div className="lk-page" dir="rtl">
      <main className="lk-main">
        {showProfile ? (
          <section className="lk-profile">
            <a className="lk-back" href="#">بازگشت به لینک‌ها</a>
            <div className="lk-card">
              <div className="lk-avatar" style={PROFILE.photo ? { backgroundImage: `url("${PROFILE.photo}")` } : undefined} />
              <h2>{PROFILE.name}</h2>
              <p className="lk-role">{PROFILE.role}</p>
              {PROFILE.bio && (
                <>
                  <h3 className="lk-about-h">درباره من</h3>
                  <p className="lk-bio">{PROFILE.bio}</p>
                </>
              )}
              <a className="lk-cta" href={`tel:${PROFILE.phone.replace(/[^\d+]/g, '')}`}>
                تماس با من <bdi>{PROFILE.phone}</bdi>
              </a>
            </div>
          </section>
        ) : (
          <>
            <img className="lk-logo" src="/links-logo.png" alt="لوگوی دیجی‌معدن" width="132" height="132" />
            <h1>دیجی‌معدن</h1>
            <p className="lk-tag">بازار آنلاین معدن ایران</p>
            <ul className="lk-list">
              {LINKS.filter((l) => (l.profile ? PROFILE.phone : l.url)).map((l) => (
                <li key={l.title}>
                  <a
                    className="lk-link"
                    href={l.profile ? '#support' : l.url}
                    {...(l.profile || l.internal ? {} : { target: '_blank', rel: 'noopener noreferrer' })}
                  >
                    <span className="lk-ic"><Icon name={l.icon} /></span>
                    <span className="lk-t"><b>{l.title}</b><span>{l.sub}</span></span>
                  </a>
                </li>
              ))}
            </ul>
          </>
        )}
        <footer className="lk-foot">digimadan.com</footer>
      </main>
    </div>
  )
}
