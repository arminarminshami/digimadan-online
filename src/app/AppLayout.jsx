import { useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../admin/AuthContext'
import AppIcon from './AppIcons'
import NotifyPrompt from './NotifyPrompt'
import { installGlobalHaptics } from './haptics'
import { syncPush } from './push'
import { GuideProvider, useGuide, useFirstRunWelcome } from './GuideContext'
import { guideKeyForPath } from './guides'
import { AD_CATEGORIES } from '../lib/constants'
import './AppLayout.css'

const TITLES = {
  '/ads': 'آگهی‌ها',
  '/auctions': 'مزایده‌ها',
  '/prices': 'قیمت‌های بازار',
  '/news': 'اخبار',
  '/articles': 'مقالات',
  '/lab-equipment': 'تجهیزات آزمایشگاهی',
  '/minerals': 'مواد معدنی',
  '/contact': 'تماس با ما',
  '/about': 'درباره ما',
  '/login': 'ورود به حساب',
  '/register': 'ثبت‌نام',
  '/submit-ad': 'ثبت آگهی',
  '/dashboard': 'حساب کاربری',
  '/search': 'جستجو',
  '/app/services': 'خدمات',
  '/app/post-ad': 'ثبت رایگان آگهی',
}

function titleFor(pathname, search) {
  if (pathname === '/ads') {
    const cat = new URLSearchParams(search).get('category')
    const found = AD_CATEGORIES.find((c) => c.value === cat)
    return found ? found.label : 'آگهی‌ها'
  }
  if (TITLES[pathname]) return TITLES[pathname]
  if (pathname.startsWith('/ads/')) return 'جزئیات آگهی'
  if (pathname.startsWith('/auctions/')) return 'جزئیات مزایده'
  if (pathname.startsWith('/articles/')) return 'مطالعه'
  if (pathname.startsWith('/news')) return 'اخبار'
  if (pathname.startsWith('/dashboard')) return 'حساب کاربری'
  return 'دیجی‌معدن'
}

// صفحه‌های اصلی نوار پایین دکمه‌ی «بازگشت» ندارند
function isRootScreen(pathname, search) {
  const p = new URLSearchParams(search)
  if (pathname === '/app/services') return true
  if (pathname === '/dashboard' && !p.get('tab')) return true
  if (pathname === '/ads' && !p.get('category')) return true
  return false
}

function activeTab(pathname) {
  if (pathname === '/') return 'home'
  if (pathname.startsWith('/ads')) return 'ads'
  if (pathname === '/app/post-ad' || pathname === '/submit-ad') return 'post'
  if (pathname.startsWith('/dashboard') || ['/login', '/register', '/forgot-password', '/reset-password'].includes(pathname)) {
    return 'account'
  }
  return 'services'
}

const TABS = [
  { id: 'home', to: '/', label: 'خانه', icon: 'home' },
  { id: 'ads', to: '/ads', label: 'آگهی‌ها', icon: 'list' },
  { id: 'post', to: '/app/post-ad', label: 'ثبت آگهی', icon: 'plus', fab: true },
  { id: 'services', to: '/app/services', label: 'خدمات', icon: 'apps' },
  { id: 'account', to: '/dashboard', label: 'حساب من', icon: 'user' },
]

function Shell({ children }) {
  const { pathname, search } = useLocation()
  const navigate = useNavigate()
  const { openGuide, autoGuide } = useGuide()
  const { isAuthenticated } = useAuth()
  const isHome = pathname === '/'
  const guideKey = guideKeyForPath(pathname, search)
  const active = activeTab(pathname)

  useFirstRunWelcome(true)

  // لرزش خفیف برای هر آیکون و دکمه‌ی قابل لمس
  useEffect(() => installGlobalHaptics(), [])

  // اشتراک اعلان این گوشی به کاربر فعلی وصل می‌ماند (با ورود و خروج به‌روز می‌شود)
  useEffect(() => {
    syncPush()
  }, [isAuthenticated])

  // راهنمای هر بخش بار اول خودکار باز می‌شود (راهنمای خانه در راهنمای خوش‌آمدگویی است)
  useEffect(() => {
    if (guideKey && guideKey !== 'home') autoGuide(guideKey)
  }, [guideKey, autoGuide])

  function goBack() {
    const idx = window.history.state && window.history.state.idx
    if (typeof idx === 'number' && idx > 0) navigate(-1)
    else navigate('/')
  }

  const showBack = !isRootScreen(pathname, search)

  return (
    <div className="app-frame">
      {!isHome && (
        <header className="app-bar">
          <div className="app-bar__side">
            {showBack && (
              <button type="button" className="app-bar__btn" onClick={goBack} aria-label="بازگشت">
                <AppIcon name="back" size={22} />
              </button>
            )}
          </div>
          <h1 className="app-bar__title">{titleFor(pathname, search)}</h1>
          <div className="app-bar__side app-bar__side--end">
            {guideKey && (
              <button type="button" className="app-bar__btn" onClick={() => openGuide(guideKey)} aria-label="راهنما">
                <AppIcon name="help" size={21} />
              </button>
            )}
          </div>
          <span className="app-bar__strata" aria-hidden="true" />
        </header>
      )}

      <main key={pathname} className="app-page">
        {children}
      </main>

      <nav className="app-tabbar" aria-label="منوی اپلیکیشن">
        {TABS.map((t) => (
          <Link
            key={t.id}
            to={t.to}
            className={'app-tab' + (t.fab ? ' app-tab--fab' : '') + (active === t.id ? ' is-active' : '')}
            aria-current={active === t.id ? 'page' : undefined}
          >
            <span className="app-tab__icon">
              <AppIcon name={t.icon} size={t.fab ? 28 : 23} stroke={t.fab ? 2.2 : 1.8} />
            </span>
            <span className="app-tab__label">{t.label}</span>
          </Link>
        ))}
      </nav>

      <NotifyPrompt />
    </div>
  )
}

export default function AppLayout({ children }) {
  return (
    <GuideProvider>
      <Shell>{children}</Shell>
    </GuideProvider>
  )
}
