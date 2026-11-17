import { useEffect, useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from './AuthContext'
import { LoadingBlock } from '../components/StatusBlocks'

// فقط کاربرانی که در جدول admin_users هستند وارد پنل مدیریت می‌شوند.
// کاربر عادی (یا بدون ورود) به صفحه‌ی «ورود مدیر» فرستاده می‌شود.
export default function ProtectedRoute({ children }) {
  const { isAuthenticated, user, loading } = useAuth()
  const location = useLocation()
  const [status, setStatus] = useState('checking') // checking | admin | denied

  useEffect(() => {
    if (!isAuthenticated || !user) return undefined
    let alive = true
    const cacheKey = 'dm_admin_ok_' + user.id
    setStatus('checking')
    supabase
      .from('admin_users')
      .select('auth_user_id')
      .eq('auth_user_id', user.id)
      .maybeSingle()
      .then(({ data, error }) => {
        if (!alive) return
        if (error) {
          // خطای شبکه: اگر همین نشست قبلاً تأیید شده بود، اجازه بده
          let ok = false
          try {
            ok = sessionStorage.getItem(cacheKey) === '1'
          } catch {
            /* ignore */
          }
          setStatus(ok ? 'admin' : 'denied')
          return
        }
        if (data) {
          try {
            sessionStorage.setItem(cacheKey, '1')
          } catch {
            /* ignore */
          }
        }
        setStatus(data ? 'admin' : 'denied')
      })
    return () => {
      alive = false
    }
  }, [isAuthenticated, user])

  if (loading || (isAuthenticated && status === 'checking')) {
    return <LoadingBlock label="در حال بررسی ورود..." />
  }

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" state={{ from: location.pathname }} replace />
  }

  if (status === 'denied') {
    return <Navigate to="/admin/login" state={{ from: location.pathname, notAdmin: true }} replace />
  }

  return children
}
