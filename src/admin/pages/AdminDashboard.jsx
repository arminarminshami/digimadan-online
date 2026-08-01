import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabaseClient'
import { AdminPageHead, AdminCard } from '../components/AdminUI'
import { LoadingBlock, ErrorBlock } from '../../components/StatusBlocks'

async function countRows(table, filters = []) {
  let query = supabase.from(table).select('*', { count: 'exact', head: true })
  for (const [col, val] of filters) query = query.eq(col, val)
  const { count, error } = await query
  if (error) return 0
  return count || 0
}

export default function AdminDashboard() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function load() {
      try {
        const [
          adsTotal,
          adsPublished,
          adsPending,
          adsRejected,
          articlesTotal,
          articlesPending,
          newsTotal,
          bannersTotal,
          pagesTotal,
          smsFailed,
        ] = await Promise.all([
          countRows('ads'),
          countRows('ads', [['status', 'published']]),
          countRows('ads', [['status', 'pending']]),
          countRows('ads', [['status', 'rejected']]),
          countRows('articles'),
          countRows('articles', [['status', 'pending']]),
          countRows('news_items'),
          countRows('banners'),
          countRows('pages'),
          countRows('sms_log', [['status', 'failed']]),
        ])

        // تعداد کل کاربران از یک تابع امن سمت دیتابیس خوانده می‌شود،
        // چون جدول auth.users مستقیم از سمت کلاینت قابل شمارش نیست.
        const { data: userCount } = await supabase.rpc('get_total_user_count')

        setStats({
          adsTotal,
          adsPublished,
          adsPending,
          adsRejected,
          articlesTotal,
          articlesPending,
          newsTotal,
          bannersTotal,
          pagesTotal,
          smsFailed,
          users: userCount || 0,
        })
      } catch (err) {
        setError('بارگذاری داشبورد با خطا مواجه شد.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  return (
    <div>
      <AdminPageHead title="داشبورد" description="نگاهی کلی به وضعیت سایت دیجی‌معدن" />

      {loading && <LoadingBlock label="در حال بارگذاری آمار..." />}
      {error && <ErrorBlock message={error} />}

      {!loading && !error && stats && (
        <>
          {/* کارهایی که همین حالا نیاز به رسیدگی دارند */}
          {(stats.adsPending > 0 || stats.articlesPending > 0) && (
            <AdminCard className="admin-settings__section" style={{ marginBottom: 20 }}>
              <h2 className="admin-section-title">در انتظار بررسی شما</h2>
              <div className="admin-todo-row">
                {stats.adsPending > 0 && (
                  <Link to="/admin/ads" className="admin-todo-card">
                    <span className="admin-todo-card__value">{stats.adsPending.toLocaleString('fa-IR')}</span>
                    <span className="admin-todo-card__label">آگهی در انتظار تایید</span>
                  </Link>
                )}
                {stats.articlesPending > 0 && (
                  <Link to="/admin/content" className="admin-todo-card">
                    <span className="admin-todo-card__value">{stats.articlesPending.toLocaleString('fa-IR')}</span>
                    <span className="admin-todo-card__label">مقاله در انتظار تایید</span>
                  </Link>
                )}
              </div>
            </AdminCard>
          )}

          <h2 className="admin-section-title">آگهی‌ها</h2>
          <div className="stat-grid">
            <div className="stat-card">
              <div className="stat-card__value">{stats.adsTotal.toLocaleString('fa-IR')}</div>
              <div className="stat-card__label">کل آگهی‌ها</div>
            </div>
            <div className="stat-card">
              <div className="stat-card__value">{stats.adsPublished.toLocaleString('fa-IR')}</div>
              <div className="stat-card__label">منتشرشده (فعال)</div>
            </div>
            <div className="stat-card">
              <div className="stat-card__value">{stats.adsPending.toLocaleString('fa-IR')}</div>
              <div className="stat-card__label">در انتظار تایید</div>
            </div>
            <div className="stat-card">
              <div className="stat-card__value">{stats.adsRejected.toLocaleString('fa-IR')}</div>
              <div className="stat-card__label">رد شده</div>
            </div>
          </div>

          <h2 className="admin-section-title" style={{ marginTop: 24 }}>
            کاربران و محتوا
          </h2>
          <div className="stat-grid">
            <div className="stat-card">
              <div className="stat-card__value">{stats.users.toLocaleString('fa-IR')}</div>
              <div className="stat-card__label">کاربران ثبت‌نام‌شده</div>
            </div>
            <div className="stat-card">
              <div className="stat-card__value">{stats.articlesTotal.toLocaleString('fa-IR')}</div>
              <div className="stat-card__label">مقالات</div>
            </div>
            <div className="stat-card">
              <div className="stat-card__value">{stats.newsTotal.toLocaleString('fa-IR')}</div>
              <div className="stat-card__label">اخبار</div>
            </div>
            <div className="stat-card">
              <div className="stat-card__value">{stats.pagesTotal.toLocaleString('fa-IR')}</div>
              <div className="stat-card__label">صفحات سایت</div>
            </div>
            <div className="stat-card">
              <div className="stat-card__value">{stats.bannersTotal.toLocaleString('fa-IR')}</div>
              <div className="stat-card__label">بنرها</div>
            </div>
            <div className="stat-card">
              <div className="stat-card__value">{stats.smsFailed.toLocaleString('fa-IR')}</div>
              <div className="stat-card__label">پیامک‌های ناموفق</div>
            </div>
          </div>

          <h2 className="admin-section-title" style={{ marginTop: 24 }}>
            دسترسی سریع
          </h2>
          <div className="admin-quick-actions">
            <Link to="/admin/ads/new" className="btn btn-primary">
              + ثبت آگهی جدید
            </Link>
            <Link to="/admin/users/new" className="btn btn-outline">
              + افزودن کاربر
            </Link>
            <Link to="/admin/content" className="btn btn-outline">
              + نوشتن مقاله
            </Link>
            <Link to="/admin/prices" className="btn btn-outline">
              مدیریت قیمت‌ها
            </Link>
            <Link to="/admin/sms" className="btn btn-outline">
              گزارش پیامک‌ها
            </Link>
          </div>
        </>
      )}
    </div>
  )
}
