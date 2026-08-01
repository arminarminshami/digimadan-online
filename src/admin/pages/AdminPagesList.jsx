import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getAllPages, deletePage } from '../../services/pagesService'
import { AdminPageHead, Toast } from '../components/AdminUI'
import { LoadingBlock, EmptyBlock, ErrorBlock } from '../../components/StatusBlocks'

const SUGGESTED_SLUGS = [
  { slug: 'about', label: 'درباره ما' },
  { slug: 'contact', label: 'تماس با ما' },
  { slug: 'news', label: 'اخبار' },
]

export default function AdminPagesList() {
  const [pages, setPages] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [toast, setToast] = useState(null)

  async function load() {
    setLoading(true)
    try {
      setPages(await getAllPages())
    } catch (err) {
      setError('بارگذاری صفحات با خطا مواجه شد.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  async function handleDelete(page) {
    if (!window.confirm(`صفحه «${page.title}» حذف شود؟`)) return
    try {
      await deletePage(page.id)
      setPages((prev) => prev.filter((p) => p.id !== page.id))
      setToast({ type: 'success', message: 'صفحه حذف شد.' })
    } catch (err) {
      setToast({ type: 'error', message: 'حذف صفحه با خطا مواجه شد.' })
    }
  }

  const existingSlugs = new Set(pages.map((p) => p.slug))
  const missingSuggestions = SUGGESTED_SLUGS.filter((s) => !existingSlugs.has(s.slug))

  return (
    <div>
      <AdminPageHead
        title="مدیریت صفحات"
        description="صفحات ثابت سایت مانند درباره ما، تماس و اخبار را ویرایش کنید."
        action={
          <Link to="/admin/pages/new" className="btn btn-primary">
            + صفحه جدید
          </Link>
        }
      />

      {loading && <LoadingBlock label="در حال بارگذاری صفحات..." />}
      {error && <ErrorBlock message="دریافت صفحات با خطا مواجه شد." />}

      {!loading && !error && missingSuggestions.length > 0 && (
        <div className="admin-card" style={{ marginBottom: 20 }}>
          <p style={{ fontSize: '0.88rem', color: 'var(--color-ink-soft)', marginBottom: 10 }}>
            این صفحات هنوز ساخته نشده‌اند:
          </p>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {missingSuggestions.map((s) => (
              <Link
                key={s.slug}
                to={`/admin/pages/new?slug=${s.slug}&title=${encodeURIComponent(s.label)}`}
                className="btn btn-outline btn-sm"
              >
                + {s.label}
              </Link>
            ))}
          </div>
        </div>
      )}

      {!loading && !error && pages.length === 0 && (
        <EmptyBlock title="هنوز صفحه‌ای نساخته‌اید" hint="با دکمه «صفحه جدید» شروع کنید." />
      )}

      {!loading && !error && pages.length > 0 && (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>عنوان</th>
                <th>آدرس (slug)</th>
                <th>عملیات</th>
              </tr>
            </thead>
            <tbody>
              {pages.map((page) => (
                <tr key={page.id}>
                  <td className="admin-table__title">{page.title}</td>
                  <td>
                    <a
                      href={page.slug === 'about' ? '/about' : page.slug === 'contact' ? '/contact' : `/page/${page.slug}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      /{page.slug === 'about' || page.slug === 'contact' ? page.slug : `page/${page.slug}`}
                    </a>
                  </td>
                  <td>
                    <div className="admin-row-actions">
                      <Link to={`/admin/pages/${page.id}/edit`} className="btn btn-outline btn-sm">
                        ویرایش
                      </Link>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDelete(page)}>
                        حذف
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Toast message={toast?.message} type={toast?.type} onClose={() => setToast(null)} />
    </div>
  )
}
