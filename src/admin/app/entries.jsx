import { APP_MODE } from '../../app/appMode'
import AdminDashboard from '../pages/AdminDashboard'
import AdminAppHome from './AdminAppHome'

// در اپلیکیشن مدیریت، صفحه‌ی /admin خانه‌ی آیکونی است؛ در سایت معمولی همان داشبورد قبلی
export function AdminHomeEntry() {
  return APP_MODE ? <AdminAppHome /> : <AdminDashboard />
}
