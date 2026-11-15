import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../AuthContext'
import AppIcon from '../../app/AppIcons'
import NotifyPrompt from '../../app/NotifyPrompt'
import { GuideProvider, useGuide, useFirstRunWelcome } from '../../app/GuideContext'
import { guideKeyForPath } from '../../app/guides'
import { installGlobalHaptics } from '../../app/haptics'
import { syncPush } from '../../app/push'
import { ADMIN_ROOTS, adminTitleFor } from './adminSections'
import '../../app/AppLayout.css'
import './AdminAppLayout.css'

const AdminAppCtx = createContext({ pending: 0, refresh: () => {} })
export function useAdminApp() {
  return useContext(AdminAppCtx)
}

const TABS = [
  { id: 'home', to: '/admin', label: 'خانه', icon: 'home' },
  { id: 'ads', to: '/admin/ads', label: 'آگهی‌ها', icon: 'list', badge: true },
  { id: 'new', to: '/admin/ads/new', label: 'آگهی جدید', icon: 'plus', fab: true },
  { id: 'auctions', to: '/admin/auctions', label: 'مزایده‌ها', icon: 'gavel' },
  { id: 'users', to: '/admin/users', label: 'کاربران', icon: 'users' },
]

function activeTab(pathname) {
  if (pathname === '/admin') return 'home'
  if (pathname === '/admin/ads/new') return 'new'
  if (pathname.startsWith('/admin/ads')) return 'ads'
  if (pathname.startsWith('/admin/auctions')) return 'auctions'
  if (pathname.startsWith('/admin/users')) return 'users'
  return null
}

function Shell({ children }) {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const { openGuide, autoGuide } = useGuide()
  const { isAuthenticated } = useAuth()
  const [pending, setPending] = useState(0)
  const isHome = pathname === '/admin'
  const guideKey = guideKeyForPath(pathname, '')
  const active = activeTab(pathname)

  useFirstRunWelcome(true, 'adminWelcome')
  useEffect(() => installGlobalHaptics(), [])
  useEffect(() => {
    syncPush()
  }, [isAuthenticated])
  useEffect(() => {
    if (guideKey && guideKey !== 'adminHome') autoGuide(guideKey)
  }, [guideKey, autoGuide])

  // تعداد آگهی‌های در انتظار تأیید (نشان قرمز روی «آگهی‌ها»)
  const refresh = useCallback(async () => {
    const { count, error } = await supabase.from('ads').select('id', { count: 'exact', head: true }).eq('status', 'pending')
    if (!error) setPending(count || 0)
  }, [])
  useEffect(() => {
    refresh()
    const timer = setInterval(refresh, 60000)
    const onVis = () => document.visibilityState === 'visible' && refresh()
    document.addEventListener('visibilitychange', onVis)
    return () => {
      clearInterval(timer)
      document.removeEventListener('visibilitychange', onVis)
    }
  }, [refresh, pathname])

  const ctx = useMemo(() => ({ pending, refresh }), [pending, refresh])

  function goBack() {
    const idx = window.history.state && window.history.state.idx
    if (typeof idx === 'number' && idx > 0) navigate(-1)
    else navigate('/admin')
  }

  const showBack = !ADMIN_ROOTS.includes(pathname)

  return (
    <AdminAppCtx.Provider value={ctx}>
      <div className="app-frame admin-app">
        {!isHome && (
          <header className="app-bar">
            <div className="app-bar__side">
              {showBack && (
                <button type="button" className="app-bar__btn" onClick={goBack} aria-label="بازگشت">
                  <AppIcon name="back" size={22} />
                </button>
              )}
            </div>
            <h1 className="app-bar__title">{adminTitleFor(pathname)}</h1>
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

        <main key={pathname} className={'app-page' + (isHome ? '' : ' admin-main admin-app-main')}>
          {children}
        </main>

        <nav className="app-tabbar" aria-label="منوی مدیریت">
          {TABS.map((t) => (
            <Link
              key={t.id}
              to={t.to}
              className={'app-tab' + (t.fab ? ' app-tab--fab' : '') + (active === t.id ? ' is-active' : '')}
              aria-current={active === t.id ? 'page' : undefined}
            >
              <span className="app-tab__icon">
                <AppIcon name={t.icon} size={t.fab ? 28 : 23} stroke={t.fab ? 2.2 : 1.8} />
                {t.badge && pending > 0 && (
                  <span className="admin-tab-badge">{pending > 99 ? '۹۹+' : pending.toLocaleString('fa-IR')}</span>
                )}
              </span>
              <span className="app-tab__label">{t.label}</span>
            </Link>
          ))}
        </nav>

        <NotifyPrompt variant="admin" />
      </div>
    </AdminAppCtx.Provider>
  )
}

export default function AdminAppLayout({ children }) {
  return (
    <GuideProvider>
      <Shell>{children}</Shell>
    </GuideProvider>
  )
}
