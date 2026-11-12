import { useEffect, useState } from 'react'
import { listUsers } from '../../services/adminUsersService'
import {
  sendBulkSms,
  getCampaigns,
  getCampaignRecipients,
  checkCampaignDelivery,
} from '../../services/adminSmsService'
import { AdminPageHead, AdminCard, Toast } from '../components/AdminUI'
import { LoadingBlock, EmptyBlock, ErrorBlock } from '../../components/StatusBlocks'
import './AdminBulkSms.css'

// هر پیامک فارسی ۷۰ کاراکتر است؛ بیشتر از آن چند بخش حساب می‌شود
const SMS_PART = 70

export default function AdminBulkSms() {
  const [users, setUsers] = useState([])
  const [selected, setSelected] = useState(() => new Set())
  const [search, setSearch] = useState('')
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState(null)
  const [toast, setToast] = useState(null)

  const [campaigns, setCampaigns] = useState([])
  const [openCampaign, setOpenCampaign] = useState(null)
  const [recipients, setRecipients] = useState([])
  const [loadingRecipients, setLoadingRecipients] = useState(false)
  const [checking, setChecking] = useState(false)

  async function loadUsers() {
    setLoading(true)
    try {
      const res = await listUsers({ page: 1, perPage: 500, search })
      setUsers(res.users.filter((u) => u.phone))
    } catch (err) {
      setError(err.message || 'بارگذاری کاربران با خطا مواجه شد.')
    } finally {
      setLoading(false)
    }
  }

  async function loadCampaigns() {
    try {
      setCampaigns(await getCampaigns())
    } catch {
      /* اگر کمپینی نبود مهم نیست */
    }
  }

  useEffect(() => {
    loadUsers()
    loadCampaigns()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function toggle(id) {
    setSelected((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function toggleAll() {
    setSelected((prev) => (prev.size === users.length ? new Set() : new Set(users.map((u) => u.id))))
  }

  const selectedPhones = users.filter((u) => selected.has(u.id)).map((u) => u.phone)
  const parts = Math.max(1, Math.ceil(text.length / SMS_PART))

  async function handleSend() {
    if (!text.trim()) {
      setError('متن پیام را بنویسید.')
      return
    }
    if (!selectedPhones.length) {
      setError('حداقل یک کاربر را انتخاب کنید.')
      return
    }
    if (
      !window.confirm(
        `ارسال پیام به ${selectedPhones.length.toLocaleString('fa-IR')} نفر` +
          `${parts > 1 ? ` (هر نفر ${parts} پیامک)` : ''}؟`
      )
    )
      return

    setSending(true)
    setError(null)
    try {
      const res = await sendBulkSms({ text: text.trim(), phones: selectedPhones })
      setToast({
        type: res.failed > 0 ? 'error' : 'success',
        message: `ارسال شد: ${res.sent} موفق، ${res.failed} ناموفق.`,
      })
      setText('')
      setSelected(new Set())
      loadCampaigns()
    } catch (err) {
      setError(err.message || 'ارسال پیام با خطا مواجه شد.')
    } finally {
      setSending(false)
    }
  }

  async function openCampaignDetails(c) {
    setOpenCampaign(c)
    setLoadingRecipients(true)
    try {
      setRecipients(await getCampaignRecipients(c.id))
    } catch {
      setRecipients([])
    } finally {
      setLoadingRecipients(false)
    }
  }

  async function handleCheckDelivery() {
    if (!openCampaign) return
    setChecking(true)
    try {
      const res = await checkCampaignDelivery(openCampaign.id)
      if (res.needsCredentials) {
        setError(res.message)
      } else {
        setToast({ type: 'success', message: `وضعیت ${res.updated} پیام به‌روزرسانی شد.` })
        setRecipients(await getCampaignRecipients(openCampaign.id))
      }
    } catch (err) {
      setError(err.message || 'استعلام وضعیت با خطا مواجه شد.')
    } finally {
      setChecking(false)
    }
  }

  return (
    <div>
      <AdminPageHead
        title="ارسال پیام به کاربران"
        description="ارسال پیامک دلخواه به یک، چند یا همه‌ی کاربران سایت"
      />

      {error && <ErrorBlock message={error} />}

      <AdminCard className="admin-settings__section" style={{ marginBottom: 20 }}>
        <h2 className="admin-section-title">متن پیام</h2>
        <label className="admin-field">
          <textarea
            rows={5}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="متن پیامکی که می‌خواهید برای کاربران ارسال شود..."
          />
        </label>
        <p className="bulk-sms__meta">
          {text.length.toLocaleString('fa-IR')} کاراکتر · {parts.toLocaleString('fa-IR')} پیامک برای هر نفر
          {selectedPhones.length > 0 && (
            <>
              {' '}· مجموع تقریبی:{' '}
              <strong>{(parts * selectedPhones.length).toLocaleString('fa-IR')} پیامک</strong>
            </>
          )}
        </p>

        <div className="bulk-sms__send-row">
          <span className="bulk-sms__count">
            {selectedPhones.length.toLocaleString('fa-IR')} گیرنده انتخاب شده
          </span>
          <button className="btn btn-primary" disabled={sending} onClick={handleSend}>
            {sending ? 'در حال ارسال...' : 'ارسال پیام'}
          </button>
        </div>
      </AdminCard>

      <AdminCard className="admin-settings__section" style={{ marginBottom: 20 }}>
        <h2 className="admin-section-title">انتخاب گیرندگان</h2>

        <form
          className="admin-search-row"
          onSubmit={(e) => {
            e.preventDefault()
            loadUsers()
          }}
        >
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="جست‌وجو بر اساس شماره یا ایمیل..."
          />
          <button type="submit" className="btn btn-outline btn-sm">جست‌وجو</button>
        </form>

        {loading && <LoadingBlock label="در حال بارگذاری کاربران..." />}
        {!loading && users.length === 0 && <EmptyBlock title="کاربری با شماره موبایل یافت نشد" />}

        {!loading && users.length > 0 && (
          <>
            <label className="bulk-sms__selectall">
              <input
                type="checkbox"
                checked={selected.size === users.length && users.length > 0}
                onChange={toggleAll}
              />
              انتخاب همه ({users.length.toLocaleString('fa-IR')} کاربر)
            </label>

            <div className="bulk-sms__list">
              {users.map((u) => (
                <label key={u.id} className="bulk-sms__item">
                  <input type="checkbox" checked={selected.has(u.id)} onChange={() => toggle(u.id)} />
                  <span className="bulk-sms__item-name">
                    {u.profile?.full_name ||
                      [u.profile?.first_name, u.profile?.last_name].filter(Boolean).join(' ') ||
                      'بدون نام'}
                  </span>
                  <span className="bulk-sms__item-phone">{u.phone}</span>
                </label>
              ))}
            </div>
          </>
        )}
      </AdminCard>

      <AdminCard className="admin-settings__section">
        <h2 className="admin-section-title">تاریخچه‌ی ارسال‌ها</h2>
        {campaigns.length === 0 ? (
          <EmptyBlock title="هنوز پیامی ارسال نشده" />
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr><th>متن</th><th>گیرندگان</th><th>موفق</th><th>ناموفق</th><th>تاریخ</th><th></th></tr>
              </thead>
              <tbody>
                {campaigns.map((c) => (
                  <tr key={c.id}>
                    <td className="admin-table__title" data-label="متن">{c.body.slice(0, 40)}…</td>
                    <td data-label="گیرندگان">{c.total_recipients.toLocaleString('fa-IR')}</td>
                    <td data-label="موفق">{c.sent_count.toLocaleString('fa-IR')}</td>
                    <td data-label="ناموفق">{c.failed_count.toLocaleString('fa-IR')}</td>
                    <td data-label="تاریخ">{new Date(c.created_at).toLocaleDateString('fa-IR')}</td>
                    <td data-label="جزئیات">
                      <button className="btn btn-outline btn-sm" onClick={() => openCampaignDetails(c)}>
                        جزئیات
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </AdminCard>

      {openCampaign && (
        <div className="bulk-sms__modal-backdrop" onClick={() => setOpenCampaign(null)}>
          <div className="bulk-sms__modal" onClick={(e) => e.stopPropagation()}>
            <h3>وضعیت گیرندگان</h3>
            <p className="bulk-sms__modal-body">{openCampaign.body}</p>

            <div className="bulk-sms__modal-actions">
              <button className="btn btn-outline btn-sm" disabled={checking} onClick={handleCheckDelivery}>
                {checking ? 'در حال استعلام...' : 'استعلام وضعیت تحویل'}
              </button>
              <button className="btn btn-outline btn-sm" onClick={() => setOpenCampaign(null)}>بستن</button>
            </div>

            {loadingRecipients ? (
              <LoadingBlock label="در حال بارگذاری..." />
            ) : (
              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr><th>شماره</th><th>ارسال</th><th>تحویل</th></tr>
                  </thead>
                  <tbody>
                    {recipients.map((r) => (
                      <tr key={r.id}>
                        <td data-label="شماره">{r.phone}</td>
                        <td data-label="ارسال">
                          <span className={'status-pill ' + (r.status === 'sent' ? 'status-pill--on' : 'status-pill--danger')}>
                            {r.status === 'sent' ? 'ارسال شد' : 'ناموفق'}
                          </span>
                        </td>
                        <td data-label="تحویل">{r.delivery_status || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      <Toast message={toast?.message} type={toast?.type} onClose={() => setToast(null)} />
    </div>
  )
}
