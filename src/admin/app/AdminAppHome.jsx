import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabaseClient'
import { logout } from '../../services/authService'
import { useAuth } from '../AuthContext'
import AppIcon from '../../app/AppIcons'
import AppTile from '../../app/AppTile'
import { useGuide } from '../../app/GuideContext'
import { ADMIN_GROUPS } from './adminSections'
import { useAdminApp } from './AdminAppLayout'
import '../../app/AppHome.css'
import '../../app/AppServices.css'
import '../../app/AppAccount.css'
import './AdminAppHome.css'

const fa = (n) => Number(n || 0).toLocaleString('fa-IR')

async function countAds(status) {
  const { count } = await supabase.from('ads').select('id', { count: 'exact', head: true }).eq('status', status)
  return count || 0
}

export default function AdminAppHome() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { openGuide } = useGuide()
  const { pending } = useAdminApp()
  const [published, setPublished] = useState(null)
  const [users, setUsers] = useState(null)
  const [confirm, setConfirm] = useState(false)

  useEffect(() => {
    let alive = true
    countAds('published').then((n) => alive && setPublished(n))
    supabase.rpc('get_total_user_count').then(({ data }) => alive && setUsers(typeof data === 'number' ? data : null))
    return () => {
      alive = false
    }
  }, [])

  async function doLogout() {
    await logout()
    navigate('/admin/login', { replace: true })
  }

  return (
    <div className="aah">
      <header className="app-home__top aah__top">
        <div className="app-home__bar">
          <div className="app-home__brand">
            <img src="/logo.png" alt="" className="app-home__logo" />
            <div className="app-home__brand-text">
              <b>پنل مدیریت</b>
              <small dir="ltr">{user?.email || 'دیجی‌معدن'}</small>
            </div>
          </div>
          <div className="app-home__actions">
            <a href="/" target="_blank" rel="noreferrer" className="app-home__round" aria-label="مشاهده سایت">
              <AppIcon name="external" size={19} />
            </a>
            <button type="button" className="app-home__round" onClick={() => openGuide('adminWelcome')} aria-label="راهنما">
              <AppIcon name="help" size={20} />
            </button>
          </div>
        </div>

        <div className="aah__stats">
          <Link to="/admin/ads" className={'aah__stat aah__stat--hot' + (pending > 0 ? ' is-active' : '')}>
            <b>{fa(pending)}</b>
            <span>در انتظار تأیید</span>
          </Link>
          <div className="aah__stat">
            <b>{published == null ? '…' : fa(published)}</b>
            <span>آگهی منتشرشده</span>
          </div>
          <div className="aah__stat">
            <b>{users == null ? '…' : fa(users)}</b>
            <span>کاربران</span>
          </div>
        </div>
      </header>

      <div className="aah__groups">
        {ADMIN_GROUPS.map((g) => (
          <section key={g.title} className="app-services__section">
            <h2 className="app-services__title">{g.title}</h2>
            <div className="app-services__grid">
              {g.items.map((it) => (
                <AppTile key={it.to} to={it.to} label={it.label} icon={it.icon} color={it.color} badge={it.badgeKey === 'pending' ? pending : 0} />
              ))}
            </div>
          </section>
        ))}

        <button type="button" className="aah__logout" onClick={() => setConfirm(true)}>
          <AppIcon name="logout" size={20} />
          خروج از حساب مدیریت
        </button>
      </div>

      {confirm && (
        <div className="guide-overlay" onClick={() => setConfirm(false)}>
          <div className="acct-sheet" role="dialog" aria-modal="true" aria-label="خروج" onClick={(e) => e.stopPropagation()}>
            <span className="acct-sheet__handle" />
            <h2 className="acct-sheet__title">خروج از حساب</h2>
            <p className="acct-sheet__muted acct-sheet__muted--center">می‌خواهید از پنل مدیریت خارج شوید؟</p>
            <button type="button" className="guide-btn acct-btn-danger" onClick={doLogout}>بله، خروج</button>
            <button type="button" className="guide-btn guide-btn--ghost" onClick={() => setConfirm(false)}>انصراف</button>
          </div>
        </div>
      )}
    </div>
  )
}
