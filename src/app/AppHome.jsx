import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../admin/AuthContext'
import { getMyProfile } from '../services/profileService'
import AppIcon from './AppIcons'
import AppTile from './AppTile'
import { useGuide } from './GuideContext'
import './AppHome.css'

// نه کاشی صفحه اول (۳×۳): دسته‌بندی‌های آگهی + بخش‌های پربازدید
export const HOME_TILES = [
  { to: '/ads?category=mineral_materials', label: 'مواد معدنی', icon: 'gem', color: '#C2703D' },
  { to: '/ads?category=mines', label: 'معادن', icon: 'mountain', color: '#7A6A58' },
  { to: '/ads?category=exploration_extraction', label: 'اکتشاف و استخراج', icon: 'search', color: '#3E7CB1' },
  { to: '/ads?category=partnership_investment', label: 'مشارکت و سرمایه‌گذاری', icon: 'handshake', color: '#5C7A52' },
  { to: '/ads?category=mining_machinery', label: 'ماشین‌آلات معدنی', icon: 'wrench', color: '#D9822B' },
  { to: '/lab-equipment', label: 'تجهیزات آزمایشگاهی', icon: 'flask', color: '#8E5BB5' },
  { to: '/auctions', label: 'مزایده‌ها', icon: 'gavel', color: '#B5483A' },
  { to: '/prices', label: 'قیمت طلا و ماشین‌حساب', icon: 'calc', color: '#2E8B7A' },
  { to: '/news', label: 'اخبار', icon: 'news', color: '#3A6EA5' },
]

export default function AppHome() {
  const { isAuthenticated, user } = useAuth()
  const navigate = useNavigate()
  const { openGuide } = useGuide()
  const [name, setName] = useState(null)
  const [q, setQ] = useState('')

  useEffect(() => {
    if (!isAuthenticated || !user) {
      setName(null)
      return undefined
    }
    let alive = true
    getMyProfile(user.id)
      .then((p) => {
        if (!alive || !p) return
        setName(p.full_name || [p.first_name, p.last_name].filter(Boolean).join(' ') || null)
      })
      .catch(() => {})
    return () => {
      alive = false
    }
  }, [isAuthenticated, user])

  function onSearch(e) {
    e.preventDefault()
    const text = q.trim()
    if (text) navigate('/search?q=' + encodeURIComponent(text))
  }

  return (
    <div className="app-home">
      <header className="app-home__top">
        <div className="app-home__bar">
          <div className="app-home__brand">
            <img src="/logo.png" alt="" className="app-home__logo" />
            <div className="app-home__brand-text">
              <b>دیجی‌معدن</b>
              <small>{name ? `سلام ${name}` : 'بازار آنلاین معدن ایران'}</small>
            </div>
          </div>
          <div className="app-home__actions">
            <Link to="/contact" className="app-home__round" aria-label="پشتیبانی">
              <AppIcon name="headset" size={20} />
            </Link>
            <button type="button" className="app-home__round" onClick={() => openGuide('welcome')} aria-label="راهنما">
              <AppIcon name="help" size={20} />
            </button>
          </div>
        </div>

        <form className="app-home__search" onSubmit={onSearch} role="search">
          <AppIcon name="search" size={19} />
          <input
            type="search"
            inputMode="search"
            enterKeyHint="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="جستجوی آگهی، ماده معدنی، مزایده..."
            aria-label="جستجو"
          />
        </form>

        {/* کارت اصلی: ثبت رایگان آگهی */}
        <Link to="/app/post-ad" className="app-home__cta">
          <span className="app-home__cta-icon">
            <AppIcon name="plus" size={26} stroke={2.2} />
          </span>
          <span className="app-home__cta-text">
            <b>ثبت رایگان آگهی</b>
            <small>خرید و فروش مواد معدنی، معدن و ماشین‌آلات</small>
          </span>
          <AppIcon name="chevL" size={22} className="app-home__cta-arrow" />
        </Link>
      </header>

      <section className="app-home__grid" aria-label="بخش‌های دیجی‌معدن">
        {HOME_TILES.map((t) => (
          <AppTile key={t.to} {...t} />
        ))}
      </section>
    </div>
  )
}
