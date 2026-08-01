import { useEffect, useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../admin/AuthContext'
import { logout } from '../services/authService'
import { getMyProfile } from '../services/profileService'
import PriceTicker from './PriceTicker'
import './Header.css'

const NAV_LINKS = [
  { to: '/', label: 'خانه' },
  { to: '/ads', label: 'آگهی‌ها' },
  { to: '/auctions', label: 'مزایده' },
  { to: '/minerals', label: 'مواد معدنی' },
  { to: '/prices', label: 'قیمت‌ها' },
  { to: '/news', label: 'اخبار' },
  { to: '/articles', label: 'مقالات' },
  { to: '/about', label: 'درباره ما' },
  { to: '/contact', label: 'تماس با ما' },
]

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false)
  const { isAuthenticated, user } = useAuth()
  const [displayName, setDisplayName] = useState(null)
  const navigate = useNavigate()

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

  async function handleLogout() {
    await logout()
    navigate('/')
  }

  return (
    <header className="site-header">
      <PriceTicker />
      <div className="container site-header__bar">
        {/* لوگو + دکمه‌های موبایل (ورود/ثبت‌نام و ثبت آگهی) */}
        <div className="site-header__brand-group">
          <Link to="/" className="site-header__brand">
            <img src="/logo.png" alt="دیجی‌معدن" className="site-header__brand-mark" />
            <span className="site-header__brand-text">دیجی‌معدن</span>
          </Link>
          <Link to="/submit-ad" className="btn btn-primary btn-sm site-header__cta">
            ثبت آگهی
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
                ورود / ثبت‌نام
              </Link>
            )}
          </div>
        </div>

        {/* منو، وسط هدر */}
        <nav className="site-header__nav site-header__nav--desktop">
          {NAV_LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === '/'}
              className={({ isActive }) =>
                'site-header__link' + (isActive ? ' site-header__link--active' : '')
              }
            >
              {link.label}
            </NavLink>
          ))}
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
        <nav className="site-header__nav site-header__nav--mobile">
          {NAV_LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === '/'}
              onClick={() => setMenuOpen(false)}
              className={({ isActive }) =>
                'site-header__link' + (isActive ? ' site-header__link--active' : '')
              }
            >
              {link.label}
            </NavLink>
          ))}
          <NavLink to="/submit-ad" onClick={() => setMenuOpen(false)} className="site-header__link">
            ثبت آگهی
          </NavLink>
          {isAuthenticated ? (
            <>
              <NavLink to="/dashboard" onClick={() => setMenuOpen(false)} className="site-header__link">
                پنل کاربری
              </NavLink>
              <button
                className="site-header__link"
                style={{ textAlign: 'start', background: 'none', border: 'none' }}
                onClick={() => {
                  setMenuOpen(false)
                  handleLogout()
                }}
              >
                خروج از حساب
              </button>
            </>
          ) : (
            <NavLink to="/login" onClick={() => setMenuOpen(false)} className="site-header__link">
              ثبت نام / ورود
            </NavLink>
          )}
        </nav>
      )}

      <div className="strata-line strata-line--thin" />
    </header>
  )
}
