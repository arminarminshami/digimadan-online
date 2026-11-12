import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../admin/AuthContext'
import DashboardProfile from './dashboard/DashboardProfile'
import DashboardAds from './dashboard/DashboardAds'
import DashboardArticles from './dashboard/DashboardArticles'
import DashboardAuctions from './dashboard/DashboardAuctions'
import DashboardMessages from './dashboard/DashboardMessages'
import { LoadingBlock } from '../components/StatusBlocks'
import './Dashboard.css'

const TABS = [
  { key: 'profile', label: '۱. پروفایل و مشخصات من' },
  { key: 'ads', label: '۲. آگهی‌های من' },
  { key: 'auctions', label: '۳. مزایده‌های من' },
  { key: 'articles', label: '۴. مقالات من' },
  { key: 'messages', label: '۵. گفتگوهای من' },
]

const VALID_TAB_KEYS = TABS.map((t) => t.key)

export default function Dashboard() {
  const { user, isAuthenticated, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const rawTab = searchParams.get('tab')
  const activeTab = VALID_TAB_KEYS.includes(rawTab) ? rawTab : 'profile'

  useEffect(() => {
    if (authLoading) return
    if (!isAuthenticated) {
      navigate('/login', { state: { redirectTo: '/dashboard' } })
    }
  }, [authLoading, isAuthenticated, navigate])

  function setTab(tab) {
    const next = new URLSearchParams(searchParams)
    next.set('tab', tab)
    if (tab !== 'messages') next.delete('thread')
    setSearchParams(next)
  }

  if (authLoading || !isAuthenticated) return <LoadingBlock label="در حال بارگذاری پنل کاربری..." />

  return (
    <div className="container dashboard-page">
      <div className="dashboard-page__head">
        <h1 className="section-title">پنل کاربری {user?.phone ? `— ${user.phone}` : ''}</h1>
        <p className="dashboard-page__hint">
          این پنل مخصوص شماره موبایل شماست و اطلاعات آن فقط برای شما نمایش داده می‌شود.
        </p>
      </div>

      <div className="dashboard-tabs">
        {TABS.map((t) => (
          <button
            key={t.key}
            className={'dashboard-tabs__item' + (activeTab === t.key ? ' dashboard-tabs__item--active' : '')}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="dashboard-page__body">
        {activeTab === 'profile' && <DashboardProfile user={user} />}
        {activeTab === 'ads' && <DashboardAds user={user} />}
        {activeTab === 'auctions' && <DashboardAuctions user={user} />}
        {activeTab === 'articles' && <DashboardArticles user={user} />}
        {activeTab === 'messages' && <DashboardMessages user={user} />}
      </div>
    </div>
  )
}
