import { Navigate, useSearchParams } from 'react-router-dom'
import { APP_MODE } from './appMode'
import Home from '../pages/Home'
import Dashboard from '../pages/Dashboard'
import AppHome from './AppHome'
import AppAccount from './AppAccount'
import AppServices from './AppServices'
import AppPostAd from './AppPostAd'

// در حالت اپلیکیشن: صفحه‌ی خانه‌ی آیکونی؛ در سایت معمولی: همان صفحه‌ی قبلی
export function HomeEntry() {
  return APP_MODE ? <AppHome /> : <Home />
}

// در حالت اپلیکیشن، /dashboard بدون tab صفحه‌ی «حساب من» است؛ با tab همان پنل قبلی باز می‌شود
export function DashboardEntry() {
  const [sp] = useSearchParams()
  if (APP_MODE && !sp.get('tab')) return <AppAccount />
  return <Dashboard />
}

export function ServicesEntry() {
  return APP_MODE ? <AppServices /> : <Navigate to="/" replace />
}

export function PostAdEntry() {
  return APP_MODE ? <AppPostAd /> : <Navigate to="/submit-ad" replace />
}
