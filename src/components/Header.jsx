import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../admin/AuthContext'
import { logout } from '../services/authService'
import { getMyProfile } from '../services/profileService'
import PriceTicker from './PriceTicker'
import './Header.css'

// ------------------------------------------------------------
// ساختار منوی سایت
// - «آگهی‌ها» و «بیشتر» منوی شیشه‌ای کشویی دارند (دسکتاپ: با نگه‌داشتن موس)
// - در موبایل همه‌ی این‌ها داخل منوی همبرگری و به‌صورت آکاردئونی باز می‌شوند
// ------------------------------------------------------------
const ADS_MENU = [
  { to: '/ads', label: 'همه آگهی‌ها', hint: 'تازه‌ترین آگهی‌های خرید و فروش', icon: 'grid' },
  { to: '/ads?category=mineral_materials', label: 'آگهی مواد معدنی', hint: 'سنگ، کنسانتره و فلزات', icon: 'gem' },
  { to: '/ads?category=mines', label: 'آگهی معادن', hint: 'خرید و فروش معدن', icon: 'mountain' },
  { to: '/ads?category=exploration_extraction', label: 'آگهی اکتشاف و استخراج', hint: 'عملیات اکتشاف و استخراج', icon: 'search' },
  { to: '/ads?category=partnership_investment', label: 'آگهی مشارکت و سرمایه‌گذاری', hint: 'شریک و سرمایه‌گذار پیدا کنید', icon: 'handshake' },
  { to: '/ads?category=mining_machinery', label: 'آگهی ماشین‌آلات معدنی', hint: 'ماشین‌آلات نو و دست‌دوم', icon: 'wrench' },
]

const MORE_MENU = [
  { to: '/prices', label: 'قیمت‌های بازار', hint: 'قیمت لحظه‌ای فلزات و ارز', icon: 'chart' },
  { to: '/news', label: 'اخبار', hint: 'تازه‌ترین اخبار معدن و فلزات', icon: 'news' },
  { to: '/articles', label: 'مقالات', hint: 'مقالات تخصصی صنعت معدن', icon: 'article' },
  { to: '/about', label: 'درباره ما', hint: 'با دیجی‌معدن آشنا شوید', icon: 'info' },
  { to: '/contact', label: 'تماس با ما', hint: 'ارتباط با پشتیبانی', icon: 'phone' },
]

const MORE_PATHS = MORE_MENU.map((m) => m.to)

function Icon({ name }) {
  const common = {
    width: 18,
    height: 18,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    'aria-hidden': true,
  }
  switch (name) {
    case 'grid':
      return (
        <svg {...common}>
          <rect x="3" y="3" width="7" height="7" rx="1.5" />
          <rect x="14" y="3" width="7" height="7" rx="1.5" />
          <rect x="3" y="14" width="7" height="7" rx="1.5" />
          <rect x="14" y="14" width="7" height="7" rx="1.5" />
        </svg>
      )
    case 'gem':
      return (
        <svg {...common}>
          <path d="M6 3h12l3 6-9 12L3 9l3-6Z" />
          <path d="M3 9h18M9 3l3 6 3-6M12 9v12" />
        </svg>
      )
    case 'mountain':
      return (
        <svg {...common}>
          <path d="M3 20L9 8l4 7 3-6 5 11H3Z" />
        </svg>
      )
    case 'search':
      return (
        <svg {...common}>
          <circle cx="11" cy="11" r="7" />
          <path d="M21 21l-4.3-4.3" />
        </svg>
      )
    case 'handshake':
      return (
        <svg {...common}>
          <circle cx="8" cy="9" r="3" />
          <circle cx="17" cy="9" r="3" />
          <path d="M2 20c0-3 2.7-5 6-5s6 2 6 5M11 20c0-2.4 2-4.4 4.5-4.4S20 17.6 20 20" />
        </svg>
      )
    case 'wrench':
      return (
        <svg {...common}>
          <path d="M14.7 6.3a4 4 0 0 1-5.4 5.4L4 17l3 3 5.3-5.3a4 4 0 0 1 5.4-5.4L21 6l-3-3-3.3 3.3Z" />
        </svg>
      )
    case 'chart':
      return (
        <svg {...common}>
          <path d="M3 3v18h18" />
          <path d="M7 15l4-4 3 3 5-6" />
        </svg>
      )
    case 'news':
      return (
        <svg {...common}>
          <rect x="3" y="4" width="18" height="16" rx="2" />
          <path d="M7 8h10M7 12h10M7 16h6" />
        </svg>
      )
    case 'article':
      return (
        <svg {...common}>
          <path d="M6 3h9l4 4v14H6z" />
          <path d="M14 3v5h5M9 13h7M9 17h7" />
        </svg>
      )
    case 'info':
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 11v6M12 7.5v.5" />
        </svg>
      )
    case 'phone':
      return (
        <svg {...common}>
          <path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2Z" />
        </svg>
      )
    default:
      return null
  }
}

function Chevron() {
  return (
    <svg className="nav-dd__chev" width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M2.5 4.5 6 8l3.5-3.5" />
    </svg>
  )
}

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [openKey, setOpenKey] = useState(null) // منوی کشویی باز در دسکتاپ
  const [accordion, setAccordion] = useState(null) // گروه باز در منوی موبایل
  const { isAuthenticated, user } = useAuth()
  const [displayName, setDisplayName] = useState(null)
  const navigate = useNavigate()
  const location = useLocation()
  const headerRef = useRef(null)
  const closeTimer = useRef(null)

  useEffect(() => {
    if (!isAuthenticated || !user) {
      setDisplayName(null)
      return
    }
    let mounted = true
    getMyProfile(user.id)
      .then((profile) => {
        if (!mounted || !profile) return
        const name = profile.full_name || [profile.first_name, profile.last_name].filter(Boolean).join(' ')
        setDisplayName(name || null)
      })
      .catch(() => {})
    return () => {
      mounted = false
    }
  }, [isAuthenticated, user])

  // با هر تغییر صفحه، همه‌ی منوها بسته شوند
  useEffect(() => {
    setOpenKey(null)
    setMenuOpen(false)
  }, [location.pathname, location.search])

  // کلیک بیرون از هدر یا کلید Esc منوی کشویی را می‌بندد (برای تبلت و لمسی هم لازم است)
  useEffect(() => {
    if (!openKey) return undefined
    function onPointerDown(e) {
      if (headerRef.current && !headerRef.current.contains(e.target)) setOpenKey(null)
    }
    function onKey(e) {
      if (e.key === 'Escape') setOpenKey(null)
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [openKey])

  async function handleLogout() {
    await logout()
    navigate('/')
  }

  const here = location.pathname + location.search
  const adsActive = location.pathname === '/ads'
  const moreActive = MORE_PATHS.some((p) => location.pathname === p || location.pathname.startsWith(p + '/'))

  function enter(key) {
    clearTimeout(closeTimer.current)
    setOpenKey(key)
  }
  function leave(key) {
    clearTimeout(closeTimer.current)
    closeTimer.current = setTimeout(() => setOpenKey((k) => (k === key ? null : k)), 160)
  }

  function renderDropdown({ key, label, to, items, active }) {
    const open = openKey === key
    const TriggerTag = to ? Link : 'button'
    const triggerProps = to ? { to } : { type: 'button' }
    return (
      <div
        className={'nav-dd' + (open ? ' nav-dd--open' : '')}
        onMouseEnter={() => enter(key)}
        onMouseLeave={() => leave(key)}
        onFocus={() => enter(key)}
        onBlur={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget)) leave(key)
        }}
      >
        <TriggerTag
          {...triggerProps}
          className={'site-header__link nav-dd__trigger' + (active ? ' site-header__link--active' : '')}
          aria-haspopup="true"
          aria-expanded={open}
          onClick={(e) => {
            // در دستگاه‌های لمسی (بدون hover) اولین لمس فقط منو را باز می‌کند
            if (window.matchMedia && window.matchMedia('(hover: none)').matches && !open) {
              e.preventDefault()
              setOpenKey(key)
            } else if (!to) {
              setOpenKey(key)
            }
          }}
        >
          {label}
          <Chevron />
        </TriggerTag>

        <div className="nav-dd__panel-wrap">
          <div className="nav-dd__panel" role="menu">
            {items.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                role="menuitem"
                className={'nav-dd__item' + (here === item.to ? ' nav-dd__item--active' : '')}
                onClick={() => setOpenKey(null)}
              >
                <span className="nav-dd__icon">
                  <Icon name={item.icon} />
                </span>
                <span className="nav-dd__text">
                  <span className="nav-dd__label">{item.label}</span>
                  <span className="nav-dd__hint">{item.hint}</span>
                </span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    )
  }

  function closeMobile() {
    setMenuOpen(false)
  }

  function renderAccordion(key, label, items) {
    const open = accordion === key
    return (
      <div className={'mnav-group' + (open ? ' mnav-group--open' : '')}>
        <button
          type="button"
          className="site-header__link mnav-group__head"
          aria-expanded={open}
          onClick={() => setAccordion(open ? null : key)}
        >
          {label}
          <Chevron />
        </button>
        {open && (
          <div className="mnav-group__body">
            {items.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                onClick={closeMobile}
                className={'mnav-group__item' + (here === item.to ? ' mnav-group__item--active' : '')}
              >
                <span className="nav-dd__icon nav-dd__icon--sm">
                  <Icon name={item.icon} />
                </span>
                {item.label}
              </Link>
            ))}
          </div>
        )}
      </div>
    )
  }

  const linkClass = ({ isActive }) => 'site-header__link' + (isActive ? ' site-header__link--active' : '')

  return (
    <header className="site-header" ref={headerRef}>
      <PriceTicker />
      <div className="container site-header__bar">
        {/* لوگو + دکمه‌ی ثبت آگهی + (موبایل) ورود/پنل کاربری */}
        <div className="site-header__brand-group">
          <Link to="/" className="site-header__brand">
            <img src="/logo.png" alt="دیجی‌معدن" className="site-header__brand-mark" />
            <span className="site-header__brand-text">دیجی‌معدن</span>
          </Link>
          <Link to="/submit-ad" className="btn btn-primary btn-sm site-header__cta">
            ثبت رایگان آگهی
          </Link>
          {/* فقط در موبایل نمایش داده می‌شود؛ نسخه‌ی دسکتاپ در site-header__actions است */}
          <div className="site-header__mobile-auth">
            {isAuthenticated ? (
              <>
                <Link to="/dashboard" className="btn btn-primary btn-sm site-header__mobile-account">
                  {displayName || 'پنل کاربری'}
                </Link>
                <button className="btn btn-outline btn-sm site-header__mobile-logout" onClick={handleLogout}>
                  خروج
                </button>
              </>
            ) : (
              <Link to="/login" className="btn btn-primary btn-sm site-header__mobile-login">
                ورود
              </Link>
            )}
          </div>
        </div>

        {/* منوی اصلی در دسکتاپ و تبلت */}
        <nav className="site-header__nav site-header__nav--desktop" aria-label="منوی اصلی">
          <NavLink to="/" end className={linkClass}>
            خانه
          </NavLink>
          {renderDropdown({ key: 'ads', label: 'آگهی‌ها', to: '/ads', items: ADS_MENU, active: adsActive })}
          <NavLink to="/auctions" className={linkClass}>
            مزایده‌ها
          </NavLink>
          <NavLink to="/minerals" className={linkClass}>
            مواد معدنی
          </NavLink>
          <NavLink to="/lab-equipment" className={({ isActive }) => linkClass({ isActive }) + ' site-header__link--two-line'}>
            تجهیزات
            <br />
            آزمایشگاهی
          </NavLink>
          {renderDropdown({ key: 'more', label: 'بیشتر', items: MORE_MENU, active: moreActive })}
        </nav>

        {/* ورود / پنل کاربری */}
        <div className="site-header__actions">
          {isAuthenticated ? (
            <>
              <Link to="/dashboard" className="site-header__link site-header__account">
                {displayName || 'پنل کاربری'}
              </Link>
              <button className="btn btn-outline btn-sm" onClick={handleLogout}>خروج</button>
            </>
          ) : (
            <Link to="/login" className="btn btn-primary btn-sm site-header__login-btn">
              ثبت نام / ورود
            </Link>
          )}
        </div>

        {/* همبرگر فقط در موبایل */}
        <button
          className="site-header__burger"
          aria-label="باز کردن منو"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((v) => !v)}
        >
          <span />
          <span />
          <span />
        </button>
      </div>

      {menuOpen && (
        <nav className="site-header__nav site-header__nav--mobile" aria-label="منوی موبایل">
          <NavLink to="/" end onClick={closeMobile} className={linkClass}>
            خانه
          </NavLink>
          {renderAccordion('ads', 'آگهی‌ها', ADS_MENU)}
          <NavLink to="/auctions" onClick={closeMobile} className={linkClass}>
            مزایده‌ها
          </NavLink>
          <NavLink to="/minerals" onClick={closeMobile} className={linkClass}>
            مواد معدنی
          </NavLink>
          <NavLink to="/lab-equipment" onClick={closeMobile} className={linkClass}>
            تجهیزات آزمایشگاهی
          </NavLink>
          {renderAccordion('more', 'بیشتر', MORE_MENU)}
          <NavLink to="/submit-ad" onClick={closeMobile} className="site-header__link">
            ثبت رایگان آگهی
          </NavLink>
          {isAuthenticated ? (
            <>
              <NavLink to="/dashboard" onClick={closeMobile} className="site-header__link">
                پنل کاربری
              </NavLink>
              <button
                className="site-header__link"
                style={{ textAlign: 'start', background: 'none', border: 'none' }}
                onClick={() => {
                  closeMobile()
                  handleLogout()
                }}
              >
                خروج از حساب
              </button>
            </>
          ) : (
            <NavLink to="/login" onClick={closeMobile} className="site-header__link">
              ثبت نام / ورود
            </NavLink>
          )}
        </nav>
      )}

      <div className="strata-line strata-line--thin" />
    </header>
  )
}
