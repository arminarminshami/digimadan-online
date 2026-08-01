import { useEffect, useState } from 'react'
import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import { logout } from '../services/authService'
import BackButton from '../components/BackButton'
import { useAuth } from './AuthContext'
import './AdminLayout.css'

const NAV_ITEMS = [
  { to: '/admin', label: 'داشبورد', end: true, icon: 'grid' },
  { to: '/admin/ads', label: 'مدیریت آگهی‌ها', icon: 'list' },
  { to: '/admin/auctions', label: 'مدیریت مزایده‌ها', icon: 'gavel' },
  { to: '/admin/users', label: 'مدیریت کاربران', icon: 'users' },
  { to: '/admin/content', label: 'مقالات و اخبار', icon: 'doc' },
  { to: '/admin/banners', label: 'مدیریت بنرها', icon: 'image' },
  { to: '/admin/pages', label: 'مدیریت صفحات', icon: 'page' },
  { to: '/admin/prices', label: 'مدیریت قیمت‌ها', icon: 'chart' },
  { to: '/admin/send-sms', label: 'ارسال پیام به کاربران', icon: 'send' },
  { to: '/admin/sms-patterns', label: 'الگوهای خط خدماتی', icon: 'doc' },
  { to: '/admin/sms', label: 'گزارش پیامک‌ها', icon: 'sms' },
  { to: '/admin/settings', label: 'تنظیمات سرویس‌ها', icon: 'gear' },
]

const ICONS = {
  grid: <path d="M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z" />,
  list: <path d="M4 6h16M4 12h16M4 18h10" />,
  doc: <path d="M6 3h9l3 3v15H6zM15 3v3h3" />,
  page: <path d="M5 3h14v18H5zM8 8h8M8 12h8M8 16h5" />,
  image: <path d="M4 5h16v14H4zM4 16l5-5 4 4 3-3 4 4" />,
  chart: <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />,
  send: <path d="M22 2 11 13M22 2l-7 20-4-9-9-4 20-7z" />,
  sms: <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />,
  gavel: <path d="M14 4l6 6M3 21l7-7M9 10l5 5M5 14l6-6 4 4-6 6z" />,
  users: <path d="M8 11a3 3 0 100-6 3 3 0 000 6zM3 20c0-3 2.5-5.5 5.5-5.5S14 17 14 20M16 11a2.7 2.7 0 100-5.4M18.5 20c0-2.6-1.7-4.7-4-5.3" />,
  gear: <path d="M12 9a3 3 0 100 6 3 3 0 000-6zM4.2 12a7.8 7.8 0 01.1-1.2l-1.8-1.4 1.4-2.4 2.1.6a7.7 7.7 0 011.6-1l.3-2.2h2.8l.3 2.2a7.7 7.7 0 011.6 1l2.1-.6 1.4 2.4-1.8 1.4c.07.4.1.8.1 1.2s-.03.8-.1 1.2l1.8 1.4-1.4 2.4-2.1-.6a7.7 7.7 0 01-1.6 1l-.3 2.2h-2.8l-.3-2.2a7.7 7.7 0 01-1.6-1l-2.1.6-1.4-2.4 1.8-1.4c-.07-.4-.1-.8-.1-1.2z" />,
}

export default function AdminLayout({ children }) {
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()
  const [drawerOpen, setDrawerOpen] = useState(false)

  // با تغییر صفحه، منوی موبایل خودکار بسته می‌شود
  useEffect(() => {
    setDrawerOpen(false)
  }, [location.pathname])

  // وقتی منوی موبایل باز است، اسکرول پس‌زمینه قفل می‌شود
  useEffect(() => {
    document.body.style.overflow = drawerOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [drawerOpen])

  async function handleLogout() {
    await logout()
    navigate('/admin/login', { replace: true })
  }

  const currentLabel =
    NAV_ITEMS.find((i) => (i.end ? location.pathname === i.to : location.pathname.startsWith(i.to)))?.label ||
    'پنل مدیریت'

  return (
    <div className="admin-layout">
      {/* نوار بالای صفحه -- فقط در موبایل نمایش داده می‌شود */}
      <header className="admin-topbar">
        <button
          className="admin-topbar__burger"
          onClick={() => setDrawerOpen(true)}
          aria-label="باز کردن منو"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <span className="admin-topbar__title">{currentLabel}</span>
        <a href="/" target="_blank" rel="noreferrer" className="admin-topbar__site" aria-label="مشاهده سایت">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
            <path d="M15 3h6v6M10 14L21 3" />
          </svg>
        </a>
      </header>

      {drawerOpen && <div className="admin-drawer-backdrop" onClick={() => setDrawerOpen(false)} />}

      <aside className={'admin-sidebar' + (drawerOpen ? ' admin-sidebar--open' : '')}>
        <div className="admin-sidebar__brand">
          <img src="/logo.png" alt="دیجی‌معدن" className="admin-sidebar__brand-mark" />
          <span>دیجی‌معدن</span>
          <button
            className="admin-sidebar__close"
            onClick={() => setDrawerOpen(false)}
            aria-label="بستن منو"
          >
            ×
          </button>
        </div>

        <nav className="admin-sidebar__nav">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                'admin-sidebar__link' + (isActive ? ' admin-sidebar__link--active' : '')
              }
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                {ICONS[item.icon]}
              </svg>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="admin-sidebar__footer">
          <a href="/" target="_blank" rel="noreferrer" className="admin-sidebar__view-site">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
              <path d="M15 3h6v6M10 14L21 3" />
            </svg>
            مشاهده سایت
          </a>
          <div className="admin-sidebar__user">{user?.email}</div>
          <button className="btn btn-outline btn-sm btn-block" onClick={handleLogout}>
            خروج از حساب
          </button>
        </div>
      </aside>

      <main className="admin-main">
        <BackButton />
        {children}
      </main>
    </div>
  )
}
