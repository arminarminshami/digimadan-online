import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { listUsers, blockUser, unblockUser } from '../../services/adminUsersService'
import { AdminPageHead, Toast } from '../components/AdminUI'
import { LoadingBlock, EmptyBlock, ErrorBlock } from '../../components/StatusBlocks'

const PER_PAGE = 20

export default function AdminUsersList() {
  const [users, setUsers] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [toast, setToast] = useState(null)
  const [busyId, setBusyId] = useState(null)

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const result = await listUsers({ page, perPage: PER_PAGE, search })
      setUsers(result.users)
      setTotal(result.total)
    } catch (err) {
      setError(err.message || 'بارگذاری کاربران با خطا مواجه شد.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page])

  function handleSearchSubmit(e) {
    e.preventDefault()
    setPage(1)
    load()
  }

  async function handleToggleBlock(u) {
    setBusyId(u.id)
    try {
      if (u.is_blocked) {
        await unblockUser(u.id)
        setToast({ type: 'success', message: 'کاربر آنبلاک شد.' })
      } else {
        await blockUser(u.id)
        setToast({ type: 'success', message: 'کاربر مسدود شد.' })
      }
      setUsers((prev) => prev.map((x) => (x.id === u.id ? { ...x, is_blocked: !x.is_blocked } : x)))
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'عملیات با خطا مواجه شد.' })
    } finally {
      setBusyId(null)
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE))

  return (
    <div>
      <AdminPageHead
        title="مدیریت کاربران"
        description={`تعداد کل کاربران سایت: ${total.toLocaleString('fa-IR')} نفر`}
        action={
          <Link to="/admin/users/new" className="btn btn-primary btn-sm">
            + افزودن کاربر
          </Link>
        }
      />

      <form className="admin-search-row" onSubmit={handleSearchSubmit}>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="جست‌وجو بر اساس نام، نام خانوادگی، شماره موبایل، ایمیل یا کد ملی..."
        />
        <button type="submit" className="btn btn-outline btn-sm">
          جست‌وجو
        </button>
      </form>

      {loading && <LoadingBlock label="در حال بارگذاری کاربران..." />}
      {error && <ErrorBlock message={error} />}
      {!loading && !error && users.length === 0 && (
        <EmptyBlock title="کاربری یافت نشد" hint="عبارت جست‌وجو را تغییر دهید یا یک کاربر جدید اضافه کنید." />
      )}

      {!loading && !error && users.length > 0 && (
        <>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>نام</th>
                  <th>شماره موبایل</th>
                  <th>ایمیل</th>
                  <th>تاریخ ثبت‌نام</th>
                  <th>وضعیت</th>
                  <th>عملیات</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td className="admin-table__title" data-label="نام">
                      {u.profile?.full_name || [u.profile?.first_name, u.profile?.last_name].filter(Boolean).join(' ') || '—'}
                    </td>
                    <td data-label="شماره موبایل">{u.phone || '—'}</td>
                    <td data-label="ایمیل">{u.email || '—'}</td>
                    <td data-label="تاریخ ثبت‌نام">{new Date(u.created_at).toLocaleDateString('fa-IR')}</td>
                    <td data-label="وضعیت">
                      <span className={'status-pill ' + (u.is_blocked ? 'status-pill--danger' : 'status-pill--on')}>
                        {u.is_blocked ? 'مسدود' : 'فعال'}
                      </span>
                    </td>
                    <td data-label="عملیات">
                      <div className="admin-row-actions">
                        <Link to={`/admin/users/${u.id}/edit`} state={{ user: u }} className="btn btn-outline btn-sm">
                          ویرایش
                        </Link>
                        <button
                          className={'btn btn-sm ' + (u.is_blocked ? 'btn-outline' : 'btn-danger')}
                          disabled={busyId === u.id}
                          onClick={() => handleToggleBlock(u)}
                        >
                          {u.is_blocked ? 'آنبلاک' : 'بلاک'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="admin-pagination">
              <button
                className="btn btn-outline btn-sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                قبلی
              </button>
              <span>
                صفحه {page.toLocaleString('fa-IR')} از {totalPages.toLocaleString('fa-IR')}
              </span>
              <button
                className="btn btn-outline btn-sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                بعدی
              </button>
            </div>
          )}
        </>
      )}

      <Toast message={toast?.message} type={toast?.type} onClose={() => setToast(null)} />
    </div>
  )
}
