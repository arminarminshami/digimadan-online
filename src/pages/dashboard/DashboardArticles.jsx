import { useEffect, useState } from 'react'
import {
  getMyArticles,
  submitArticle,
  updateMyArticle,
  deleteMyArticle,
} from '../../services/articlesService'
import { uploadAdImage } from '../../services/storageService'
import { getMyProfile } from '../../services/profileService'
import { LoadingBlock, EmptyBlock, ErrorBlock } from '../../components/StatusBlocks'
import '../Articles.css'

const ARTICLE_STATUS_LABELS = {
  draft: 'پیش‌نویس',
  pending: 'در انتظار تایید ادمین',
  published: 'منتشر شده',
  rejected: 'رد شده',
}

const EMPTY_FORM = { title: '', content: '', coverImageUrl: '' }

export default function DashboardArticles({ user }) {
  const [articles, setArticles] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [notice, setNotice] = useState(null)

  async function load() {
    setLoading(true)
    try {
      const data = await getMyArticles(user.id)
      setArticles(data)
    } catch {
      setError('بارگذاری مقالات شما با خطا مواجه شد.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user.id])

  function updateField(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function startNew() {
    setForm(EMPTY_FORM)
    setEditingId(null)
    setShowForm(true)
    setNotice(null)
  }

  function startEdit(article) {
    setForm({
      title: article.title,
      content: article.content,
      coverImageUrl: article.cover_image_url || '',
    })
    setEditingId(article.id)
    setShowForm(true)
    setNotice(null)
  }

  function cancelForm() {
    setShowForm(false)
    setEditingId(null)
    setForm(EMPTY_FORM)
  }

  async function handleCoverUpload(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const uploaded = await uploadAdImage(file)
      updateField('coverImageUrl', uploaded.url)
    } catch {
      setError('آپلود تصویر با خطا مواجه شد.')
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.title.trim() || !form.content.trim()) {
      setError('عنوان و متن مقاله را کامل وارد کنید.')
      return
    }
    setSaving(true)
    setError(null)
    try {
      if (editingId) {
        await updateMyArticle(editingId, {
          title: form.title.trim(),
          content: form.content.trim(),
          coverImageUrl: form.coverImageUrl || null,
        })
      } else {
        // نام نویسنده از پروفایل خوانده و همراه مقاله ذخیره می‌شود تا زیر
        // مقاله برای همه‌ی بازدیدکنندگان (حتی مهمان) قابل نمایش باشد
        const profile = await getMyProfile(user.id).catch(() => null)
        const authorName =
          profile?.full_name ||
          [profile?.first_name, profile?.last_name].filter(Boolean).join(' ') ||
          null

        await submitArticle({
          title: form.title.trim(),
          content: form.content.trim(),
          coverImageUrl: form.coverImageUrl || null,
          authorUserId: user.id,
          authorName,
        })
      }
      setNotice('مقاله شما ثبت شد و پس از تایید ادمین منتشر خواهد شد.')
      cancelForm()
      load()
    } catch (err) {
      setError('ثبت مقاله با خطا مواجه شد. لطفاً دوباره تلاش کنید.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(article) {
    if (!window.confirm(`مقاله «${article.title}» حذف شود؟`)) return
    try {
      await deleteMyArticle(article.id)
      setArticles((prev) => prev.filter((a) => a.id !== article.id))
    } catch {
      setError('حذف مقاله با خطا مواجه شد.')
    }
  }

  if (loading) return <LoadingBlock label="در حال بارگذاری مقالات شما..." />

  return (
    <div>
      <div className="section-head">
        <div>
          <h2 className="section-title">مقالات من</h2>
          <p className="submit-ad__subtitle">
            مقاله بنویسید؛ پس از تایید ادمین با نام شما در سایت منتشر می‌شود.
          </p>
        </div>
        {!showForm && (
          <button className="btn btn-primary btn-sm" onClick={startNew}>
            + نوشتن مقاله جدید
          </button>
        )}
      </div>

      {error && <ErrorBlock message={error} />}
      {notice && <p className="submit-ad__subtitle">{notice}</p>}

      {showForm && (
        <form className="article-form" onSubmit={handleSubmit}>
          <label className="admin-field">
            <span>عنوان مقاله</span>
            <input
              required
              value={form.title}
              onChange={(e) => updateField('title', e.target.value)}
              placeholder="مثال: روش‌های نوین فرآوری سنگ آهن"
            />
          </label>

          <label className="admin-field">
            <span>متن مقاله</span>
            <textarea
              required
              rows={10}
              value={form.content}
              onChange={(e) => updateField('content', e.target.value)}
              placeholder="متن کامل مقاله را اینجا بنویسید..."
            />
          </label>

          <div className="admin-field">
            <span>تصویر شاخص (اختیاری)</span>
            <div className="analysis-uploader">
              <input
                type="file"
                accept="image/*"
                id="article-cover-input"
                onChange={handleCoverUpload}
                disabled={uploading}
              />
              <label htmlFor="article-cover-input" className="btn btn-outline btn-sm">
                {uploading ? 'در حال آپلود...' : form.coverImageUrl ? 'تغییر تصویر' : 'انتخاب تصویر'}
              </label>
              {form.coverImageUrl && (
                <span className="analysis-uploader__file">
                  تصویر انتخاب شد
                  <button type="button" onClick={() => updateField('coverImageUrl', '')} aria-label="حذف تصویر">
                    ×
                  </button>
                </span>
              )}
            </div>
          </div>

          <div className="ad-step-actions ad-step-actions--split">
            <button type="button" className="btn btn-outline" onClick={cancelForm}>
              انصراف
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'در حال ارسال...' : editingId ? 'ذخیره و ارسال مجدد' : 'ارسال برای بررسی'}
            </button>
          </div>
        </form>
      )}

      {articles.length === 0 && !showForm ? (
        <EmptyBlock title="هنوز مقاله‌ای ننوشته‌اید" hint="با دکمه‌ی بالا اولین مقاله‌تان را بنویسید." />
      ) : (
        <div className="my-articles__list">
          {articles.map((a) => (
            <div key={a.id} className="my-articles__item">
              <div className="my-articles__info">
                <span className="my-articles__title">{a.title}</span>
                <span className="my-articles__meta">
                  {ARTICLE_STATUS_LABELS[a.status] || a.status} ·{' '}
                  {new Date(a.created_at).toLocaleDateString('fa-IR')}
                </span>
                {a.status === 'rejected' && a.rejection_reason && (
                  <span className="my-articles__reject-reason">دلیل رد: {a.rejection_reason}</span>
                )}
              </div>
              <div className="my-articles__actions">
                {a.status === 'published' ? (
                  <a href={`/articles/${a.slug}`} className="btn btn-outline btn-sm">
                    مشاهده
                  </a>
                ) : (
                  <>
                    <button className="btn btn-outline btn-sm" onClick={() => startEdit(a)}>
                      ویرایش
                    </button>
                    <button className="btn btn-danger btn-sm" onClick={() => handleDelete(a)}>
                      حذف
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
