import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { createAuction, updateAuction, getAuctionById } from '../../services/auctionService'
import {
  uploadAuctionImage,
  uploadAuctionDocument,
  deleteAdImage,
} from '../../services/storageService'
import { AdminPageHead, AdminCard, Toast } from '../components/AdminUI'
import { LoadingBlock, ErrorBlock } from '../../components/StatusBlocks'
import { JalaliDateTimeSelect } from '../../components/JalaliDateSelect'
import PriceInput from '../../components/PriceInput'
import { AD_CATEGORIES } from '../../lib/constants'
import './AdminAuctionForm.css'

const EMPTY = {
  title: '',
  category: '',
  description: '',
  terms: '',
  docs_open_at: '',
  docs_close_at: '',
  participate_opens_at: '',
  held_at_text: '',
  result_text: '',
  entry_fee: '',
  status: 'draft',
}

export default function AdminAuctionForm() {
  const { id } = useParams()
  const isEdit = Boolean(id)
  const navigate = useNavigate()

  const [form, setForm] = useState(EMPTY)
  const [images, setImages] = useState([]) // [{url, path}]
  const [documents, setDocuments] = useState([]) // [{name, url, path}]
  const [loading, setLoading] = useState(isEdit)
  const [saving, setSaving] = useState(false)
  const [uploadingImg, setUploadingImg] = useState(false)
  const [uploadingDoc, setUploadingDoc] = useState(false)
  const [error, setError] = useState(null)
  const [toast, setToast] = useState(null)

  useEffect(() => {
    if (!isEdit) return
    getAuctionById(id)
      .then((a) => {
        setForm({
          title: a.title || '',
          category: a.category || '',
          description: a.description || '',
          terms: a.terms || '',
          docs_open_at: a.docs_open_at || '',
          docs_close_at: a.docs_close_at || '',
          participate_opens_at: a.participate_opens_at || '',
          held_at_text: a.held_at_text || '',
          result_text: a.result_text || '',
          entry_fee: a.entry_fee ?? '',
          status: a.status || 'draft',
        })
        setImages((a.images || []).map((url) => ({ url, path: null })))
        setDocuments(Array.isArray(a.documents) ? a.documents : [])
      })
      .catch(() => setError('دریافت اطلاعات مزایده با خطا مواجه شد.'))
      .finally(() => setLoading(false))
  }, [id, isEdit])

  function update(k, v) {
    setForm((p) => ({ ...p, [k]: v }))
  }

  async function handleImages(e) {
    const files = Array.from(e.target.files || [])
    if (!files.length) return
    setUploadingImg(true)
    try {
      const up = []
      for (const f of files) up.push(await uploadAuctionImage(f))
      setImages((prev) => [...prev, ...up].slice(0, 5))
    } catch (err) {
      setError(err?.message ? `آپلود عکس انجام نشد: ${err.message}` : 'آپلود عکس با خطا مواجه شد.')
    } finally {
      setUploadingImg(false)
      e.target.value = ''
    }
  }

  async function handleDocs(e) {
    const files = Array.from(e.target.files || [])
    if (!files.length) return
    setUploadingDoc(true)
    try {
      const up = []
      for (const f of files) up.push(await uploadAuctionDocument(f))
      setDocuments((prev) => [...prev, ...up])
    } catch (err) {
      setError(err?.message ? `آپلود فایل انجام نشد: ${err.message}` : 'آپلود فایل با خطا مواجه شد.')
    } finally {
      setUploadingDoc(false)
      e.target.value = ''
    }
  }

  function removeImage(i) {
    const img = images[i]
    setImages((prev) => prev.filter((_, x) => x !== i))
    if (img?.path) deleteAdImage(img.path).catch(() => {})
  }

  function removeDoc(i) {
    setDocuments((prev) => prev.filter((_, x) => x !== i))
  }

  async function handleSubmit(e, publishNow) {
    e.preventDefault()
    if (!form.category) {
      setError('ابتدا دسته‌بندی مزایده را انتخاب کنید.')
      return
    }
    if (!form.title.trim()) {
      setError('عنوان مزایده را وارد کنید.')
      return
    }
    setSaving(true)
    setError(null)

    const payload = {
      ...form,
      entry_fee: form.entry_fee ? Number(form.entry_fee) : null,
      docs_open_at: form.docs_open_at || null,
      docs_close_at: form.docs_close_at || null,
      participate_opens_at: form.participate_opens_at || null,
      images: images.map((i) => i.url),
      documents,
      status: publishNow ? 'published' : form.status,
    }

    try {
      if (isEdit) await updateAuction(id, payload)
      else await createAuction(payload)
      navigate('/admin/auctions')
    } catch (err) {
      // پیام دقیق سرور نمایش داده می‌شود تا علت واقعی مشخص باشد
      setError(err?.message ? `ذخیره‌ی مزایده انجام نشد: ${err.message}` : 'ذخیره‌ی مزایده با خطا مواجه شد.')
      setSaving(false)
    }
  }

  if (loading) return <LoadingBlock label="در حال بارگذاری مزایده..." />

  return (
    <div>
      <AdminPageHead
        title={isEdit ? 'ویرایش مزایده' : 'ایجاد مزایده جدید'}
        description="ابتدا دسته‌بندی را انتخاب کنید، سپس اطلاعات مزایده را کامل کنید."
        action={
          <Link to="/admin/auctions" className="btn btn-outline btn-sm">
            ← بازگشت به فهرست
          </Link>
        }
      />

      {error && <ErrorBlock message={error} />}

      <form className="auction-form" onSubmit={(e) => handleSubmit(e, false)}>
        {/* گام اول: دسته‌بندی */}
        <AdminCard className="admin-settings__section">
          <h2 className="admin-section-title">۱. دسته‌بندی مزایده</h2>
          <label className="admin-field" style={{ maxWidth: 420 }}>
            <select value={form.category} onChange={(e) => update('category', e.target.value)}>
              <option value="">— انتخاب کنید —</option>
              {AD_CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </label>
        </AdminCard>

        {form.category && (
          <>
            <AdminCard className="admin-settings__section">
              <h2 className="admin-section-title">۲. اطلاعات مزایده</h2>

              <label className="admin-field">
                <span>عنوان و نام مزایده</span>
                <input
                  required
                  value={form.title}
                  onChange={(e) => update('title', e.target.value)}
                  placeholder="مثال: مزایده فروش ۵۰۰۰ تن سنگ آهن معدن چادرملو"
                />
              </label>

              <label className="admin-field">
                <span>توضیحات مزایده</span>
                <textarea
                  rows={6}
                  value={form.description}
                  onChange={(e) => update('description', e.target.value)}
                  placeholder="شرح کامل موضوع مزایده..."
                />
              </label>

              <label className="admin-field">
                <span>شرایط شرکت در مزایده</span>
                <textarea
                  rows={6}
                  value={form.terms}
                  onChange={(e) => update('terms', e.target.value)}
                  placeholder="شرایطی که شرکت‌کنندگان باید بدانند و رعایت کنند..."
                />
              </label>
            </AdminCard>

            <AdminCard className="admin-settings__section">
              <h2 className="admin-section-title">۳. عکس‌ها و مدارک</h2>

              <div className="admin-field">
                <span>عکس‌های مزایده (حداکثر ۵ عکس)</span>
                <div className="auction-upload">
                  <input type="file" accept="image/*" multiple id="auc-img" onChange={handleImages} disabled={uploadingImg || images.length >= 5} />
                  <label htmlFor="auc-img" className="btn btn-outline btn-sm">
                    {uploadingImg ? 'در حال آپلود...' : `انتخاب عکس (${images.length}/۵)`}
                  </label>
                </div>
                {images.length > 0 && (
                  <div className="auction-thumbs">
                    {images.map((img, i) => (
                      <div key={img.url} className="auction-thumb">
                        <img src={img.url} alt="" />
                        <button type="button" onClick={() => removeImage(i)}>×</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="admin-field">
                <span>مدارک مزایده (PDF — بدون محدودیت تعداد)</span>
                <div className="auction-upload">
                  <input type="file" accept="application/pdf" multiple id="auc-doc" onChange={handleDocs} disabled={uploadingDoc} />
                  <label htmlFor="auc-doc" className="btn btn-outline btn-sm">
                    {uploadingDoc ? 'در حال آپلود...' : 'افزودن فایل PDF'}
                  </label>
                </div>
                {documents.length > 0 && (
                  <ul className="auction-docs">
                    {documents.map((d, i) => (
                      <li key={d.url}>
                        <span>📄 {d.name}</span>
                        <button type="button" onClick={() => removeDoc(i)}>حذف</button>
                      </li>
                    ))}
                  </ul>
                )}
                <p className="auction-hint">
                  این فایل‌ها در فضای خصوصی ذخیره می‌شوند و فقط در بازه‌ی زمانی تعیین‌شده‌ی
                  زیر برای کاربران قابل دانلود خواهند بود.
                </p>
              </div>
            </AdminCard>

            <AdminCard className="admin-settings__section">
              <h2 className="admin-section-title">۴. زمان‌بندی</h2>

              <div className="admin-field">
                <span>شروع دسترسی به مدارک</span>
                <JalaliDateTimeSelect value={form.docs_open_at} onChange={(v) => update('docs_open_at', v)} />
              </div>

              <div className="admin-field">
                <span>پایان دسترسی به مدارک (بعد از این زمان دانلود بسته می‌شود)</span>
                <JalaliDateTimeSelect value={form.docs_close_at} onChange={(v) => update('docs_close_at', v)} />
              </div>

              <div className="admin-field">
                <span>زمان فعال شدن دکمه‌ی «شرکت در مزایده»</span>
                <JalaliDateTimeSelect value={form.participate_opens_at} onChange={(v) => update('participate_opens_at', v)} />
              </div>

              <label className="admin-field">
                <span>زمان برگزاری مزایده</span>
                <input
                  value={form.held_at_text}
                  onChange={(e) => update('held_at_text', e.target.value)}
                  placeholder="مثال: یکشنبه ۱۵ مهر ۱۴۰۴ ساعت ۱۰ صبح، دفتر مرکزی"
                />
              </label>
            </AdminCard>

            <AdminCard className="admin-settings__section">
              <h2 className="admin-section-title">۵. مبلغ و نتیجه</h2>

              <div className="admin-field">
                <span>قیمت پایه مزایده</span>
                <PriceInput
                  value={form.entry_fee}
                  onChange={(v) => update('entry_fee', v)}
                  placeholder="مثال: 5,000,000"
                />
              </div>

              <label className="admin-field">
                <span>اعلام نتیجه مزایده (بعد از برگزاری تکمیل شود)</span>
                <textarea
                  rows={4}
                  value={form.result_text}
                  onChange={(e) => update('result_text', e.target.value)}
                  placeholder="نتیجه‌ی نهایی مزایده که برای همه نمایش داده می‌شود..."
                />
              </label>
            </AdminCard>

            <div className="ad-form__actions">
              <button type="submit" className="btn btn-outline" disabled={saving}>
                {saving ? 'در حال ذخیره...' : 'ذخیره به‌صورت پیش‌نویس'}
              </button>
              <button type="button" className="btn btn-primary" disabled={saving} onClick={(e) => handleSubmit(e, true)}>
                {saving ? 'در حال انتشار...' : 'ذخیره و انتشار مزایده'}
              </button>
            </div>
          </>
        )}
      </form>

      <Toast message={toast?.message} type={toast?.type} onClose={() => setToast(null)} />
    </div>
  )
}
