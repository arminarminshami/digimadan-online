import { useEffect, useState } from 'react'
import {
  getAllArticles,
  setArticleStatus,
  createArticleAsAdmin,
  updateArticleAsAdmin,
  deleteArticle,
  getNewsItems,
  createNewsItem,
} from '../../services/articlesService'
import { uploadAdImage } from '../../services/storageService'
import { AdminPageHead, AdminCard, StatusPill, Toast } from '../components/AdminUI'
import { LoadingBlock, EmptyBlock } from '../../components/StatusBlocks'

const EMPTY_NEWS_FORM = { title: '', source: '', sourceUrl: '', summary: '' }
const EMPTY_ARTICLE_FORM = { title: '', content: '', coverImageUrl: '', authorName: '' }

const ARTICLE_STATUS_LABELS = {
  draft: 'پیش‌نویس',
  pending: 'در انتظار تایید',
  published: 'منتشر شده',
  rejected: 'رد شده',
}

export default function AdminContent() {
  const [articles, setArticles] = useState([])
  const [news, setNews] = useState([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState(null)
  const [newsForm, setNewsForm] = useState(EMPTY_NEWS_FORM)
  const [saving, setSaving] = useState(false)

  const [articleForm, setArticleForm] = useState(EMPTY_ARTICLE_FORM)
  const [showArticleForm, setShowArticleForm] = useState(false)
  const [editingArticleId, setEditingArticleId] = useState(null)
  const [savingArticle, setSavingArticle] = useState(false)
  const [uploadingCover, setUploadingCover] = useState(false)

  async function load() {
    setLoading(true)
    const [articlesData, newsData] = await Promise.all([getAllArticles(), getNewsItems()])
    setArticles(articlesData)
    setNews(newsData)
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  async function handleApprove(article) {
    try {
      await setArticleStatus(article.id, 'published')
      setArticles((prev) => prev.map((a) => (a.id === article.id ? { ...a, status: 'published' } : a)))
      setToast({ type: 'success', message: 'مقاله منتشر شد.' })
    } catch {
      setToast({ type: 'error', message: 'انتشار مقاله با خطا مواجه شد.' })
    }
  }

  async function handleReject(article) {
    const reason = window.prompt('دلیل رد این مقاله را بنویسید (برای نویسنده نمایش داده می‌شود):')
    if (reason === null) return
    if (!reason.trim()) {
      setToast({ type: 'error', message: 'برای رد مقاله باید دلیل را بنویسید.' })
      return
    }
    try {
      await setArticleStatus(article.id, 'rejected', reason.trim())
      setArticles((prev) =>
        prev.map((a) => (a.id === article.id ? { ...a, status: 'rejected', rejection_reason: reason.trim() } : a))
      )
      setToast({ type: 'success', message: 'مقاله رد شد و دلیل آن به نویسنده نمایش داده می‌شود.' })
    } catch {
      setToast({ type: 'error', message: 'رد مقاله با خطا مواجه شد.' })
    }
  }

  async function handleDeleteArticle(article) {
    if (!window.confirm(`مقاله «${article.title}» حذف شود؟ این عمل قابل بازگشت نیست.`)) return
    try {
      await deleteArticle(article.id)
      setArticles((prev) => prev.filter((a) => a.id !== article.id))
      setToast({ type: 'success', message: 'مقاله حذف شد.' })
    } catch {
      setToast({ type: 'error', message: 'حذف مقاله با خطا مواجه شد.' })
    }
  }

  function startNewArticle() {
    setArticleForm(EMPTY_ARTICLE_FORM)
    setEditingArticleId(null)
    setShowArticleForm(true)
  }

  function startEditArticle(article) {
    setArticleForm({
      title: article.title,
      content: article.content,
      coverImageUrl: article.cover_image_url || '',
      authorName: article.author_name || '',
    })
    setEditingArticleId(article.id)
    setShowArticleForm(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function cancelArticleForm() {
    setShowArticleForm(false)
    setEditingArticleId(null)
    setArticleForm(EMPTY_ARTICLE_FORM)
  }

  async function handleCoverUpload(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingCover(true)
    try {
      const uploaded = await uploadAdImage(file)
      setArticleForm((prev) => ({ ...prev, coverImageUrl: uploaded.url }))
    } catch {
      setToast({ type: 'error', message: 'آپلود تصویر با خطا مواجه شد.' })
    } finally {
      setUploadingCover(false)
      e.target.value = ''
    }
  }

  async function handleSaveArticle(e) {
    e.preventDefault()
    setSavingArticle(true)
    try {
      if (editingArticleId) {
        await updateArticleAsAdmin(editingArticleId, {
          title: articleForm.title.trim(),
          content: articleForm.content.trim(),
          cover_image_url: articleForm.coverImageUrl || null,
          author_name: articleForm.authorName.trim() || null,
        })
        setToast({ type: 'success', message: 'مقاله به‌روزرسانی شد.' })
      } else {
        await createArticleAsAdmin({
          title: articleForm.title.trim(),
          content: articleForm.content.trim(),
          coverImageUrl: articleForm.coverImageUrl || null,
          authorName: articleForm.authorName.trim() || 'تیم دیجی‌معدن',
          status: 'published',
        })
        setToast({ type: 'success', message: 'مقاله ثبت و منتشر شد.' })
      }
      cancelArticleForm()
      load()
    } catch {
      setToast({ type: 'error', message: 'ذخیره مقاله با خطا مواجه شد.' })
    } finally {
      setSavingArticle(false)
    }
  }

  async function handleCreateNews(e) {
    e.preventDefault()
    setSaving(true)
    try {
      await createNewsItem(newsForm)
      setNewsForm(EMPTY_NEWS_FORM)
      setToast({ type: 'success', message: 'خبر منتشر شد.' })
      load()
    } catch {
      setToast({ type: 'error', message: 'ثبت خبر با خطا مواجه شد.' })
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <LoadingBlock label="در حال بارگذاری..." />

  const pendingArticles = articles.filter((a) => a.status === 'pending')

  return (
    <div>
      <AdminPageHead
        title="مدیریت محتوا"
        description="ثبت مقاله، تایید مقالات کاربران و ثبت اخبار"
        action={
          !showArticleForm && (
            <button className="btn btn-primary btn-sm" onClick={startNewArticle}>
              + مقاله جدید
            </button>
          )
        }
      />

      {showArticleForm && (
        <AdminCard className="admin-settings__section" style={{ marginBottom: 20 }}>
          <h2 className="admin-section-title">
            {editingArticleId ? 'ویرایش مقاله' : 'ثبت مقاله جدید (بلافاصله منتشر می‌شود)'}
          </h2>
          <form onSubmit={handleSaveArticle} className="admin-settings__form" style={{ maxWidth: 640 }}>
            <label className="admin-field">
              <span>عنوان مقاله</span>
              <input
                required
                value={articleForm.title}
                onChange={(e) => setArticleForm({ ...articleForm, title: e.target.value })}
              />
            </label>

            <label className="admin-field">
              <span>نام نویسنده (زیر مقاله نمایش داده می‌شود)</span>
              <input
                value={articleForm.authorName}
                onChange={(e) => setArticleForm({ ...articleForm, authorName: e.target.value })}
                placeholder="مثال: تیم دیجی‌معدن"
              />
            </label>

            <label className="admin-field">
              <span>متن مقاله</span>
              <textarea
                required
                rows={10}
                value={articleForm.content}
                onChange={(e) => setArticleForm({ ...articleForm, content: e.target.value })}
              />
            </label>

            <div className="admin-field">
              <span>تصویر شاخص (اختیاری)</span>
              <div className="analysis-uploader">
                <input
                  type="file"
                  accept="image/*"
                  id="admin-article-cover"
                  onChange={handleCoverUpload}
                  disabled={uploadingCover}
                />
                <label htmlFor="admin-article-cover" className="btn btn-outline btn-sm">
                  {uploadingCover ? 'در حال آپلود...' : articleForm.coverImageUrl ? 'تغییر تصویر' : 'انتخاب تصویر'}
                </label>
                {articleForm.coverImageUrl && (
                  <span className="analysis-uploader__file">
                    تصویر انتخاب شد
                    <button
                      type="button"
                      onClick={() => setArticleForm({ ...articleForm, coverImageUrl: '' })}
                      aria-label="حذف تصویر"
                    >
                      ×
                    </button>
                  </span>
                )}
              </div>
            </div>

            <div className="admin-row-actions">
              <button type="button" className="btn btn-outline" onClick={cancelArticleForm}>
                انصراف
              </button>
              <button type="submit" className="btn btn-primary" disabled={savingArticle}>
                {savingArticle ? 'در حال ذخیره...' : editingArticleId ? 'ذخیره تغییرات' : 'ثبت و انتشار مقاله'}
              </button>
            </div>
          </form>
        </AdminCard>
      )}

      <AdminCard className="admin-settings__section" style={{ marginBottom: 20 }}>
        <h2 className="admin-section-title">مقالات در انتظار تایید ({pendingArticles.length})</h2>
        {pendingArticles.length === 0 ? (
          <EmptyBlock title="مقاله‌ای در انتظار تایید نیست" />
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr><th>عنوان</th><th>نویسنده</th><th>وضعیت</th><th>عملیات</th></tr>
              </thead>
              <tbody>
                {pendingArticles.map((a) => (
                  <tr key={a.id}>
                    <td className="admin-table__title" data-label="عنوان">{a.title}</td>
                    <td data-label="نویسنده">{a.author_name || '—'}</td>
                    <td data-label="وضعیت"><StatusPill status={a.status} /></td>
                    <td data-label="عملیات">
                      <div className="admin-row-actions">
                        <button className="btn btn-outline btn-sm" onClick={() => startEditArticle(a)}>
                          مشاهده / ویرایش
                        </button>
                        <button className="btn btn-primary btn-sm" onClick={() => handleApprove(a)}>
                          تایید و انتشار
                        </button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleReject(a)}>
                          رد
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </AdminCard>

      <AdminCard className="admin-settings__section" style={{ marginBottom: 20 }}>
        <h2 className="admin-section-title">همه‌ی مقالات ({articles.length})</h2>
        {articles.length === 0 ? (
          <EmptyBlock title="هنوز مقاله‌ای ثبت نشده" />
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr><th>عنوان</th><th>نویسنده</th><th>وضعیت</th><th>تاریخ</th><th>عملیات</th></tr>
              </thead>
              <tbody>
                {articles.map((a) => (
                  <tr key={a.id}>
                    <td className="admin-table__title" data-label="عنوان">{a.title}</td>
                    <td data-label="نویسنده">{a.author_name || '—'}</td>
                    <td data-label="وضعیت">
                      <StatusPill status={a.status} />
                      {a.status === 'rejected' && a.rejection_reason && (
                        <div className="admin-table__reject-reason" title={a.rejection_reason}>
                          {a.rejection_reason}
                        </div>
                      )}
                    </td>
                    <td data-label="تاریخ">{new Date(a.created_at).toLocaleDateString('fa-IR')}</td>
                    <td data-label="عملیات">
                      <div className="admin-row-actions">
                        <button className="btn btn-outline btn-sm" onClick={() => startEditArticle(a)}>
                          ویرایش
                        </button>
                        {a.status !== 'published' && (
                          <button className="btn btn-primary btn-sm" onClick={() => handleApprove(a)}>
                            انتشار
                          </button>
                        )}
                        <button className="btn btn-danger btn-sm" onClick={() => handleDeleteArticle(a)}>
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
      </AdminCard>

      <AdminCard className="admin-settings__section">
        <h2 className="admin-section-title">ثبت خبر جدید</h2>
        <form onSubmit={handleCreateNews} className="admin-settings__form" style={{ maxWidth: 520 }}>
          <label className="admin-field">
            <span>عنوان خبر</span>
            <input required value={newsForm.title} onChange={(e) => setNewsForm({ ...newsForm, title: e.target.value })} />
          </label>
          <label className="admin-field">
            <span>خلاصه</span>
            <textarea rows={3} value={newsForm.summary} onChange={(e) => setNewsForm({ ...newsForm, summary: e.target.value })} />
          </label>
          <label className="admin-field">
            <span>منبع (اختیاری)</span>
            <input value={newsForm.source} onChange={(e) => setNewsForm({ ...newsForm, source: e.target.value })} />
          </label>
          <label className="admin-field">
            <span>لینک منبع (اختیاری)</span>
            <input value={newsForm.sourceUrl} onChange={(e) => setNewsForm({ ...newsForm, sourceUrl: e.target.value })} />
          </label>
          <button type="submit" className="btn btn-primary" disabled={saving}>ثبت خبر</button>
        </form>

        {news.length > 0 && (
          <div className="admin-settings__log">
            <h3>آخرین اخبار ثبت‌شده</h3>
            <ul>
              {news.slice(0, 5).map((n) => (
                <li key={n.id}>{n.title}</li>
              ))}
            </ul>
          </div>
        )}
      </AdminCard>

      <Toast message={toast?.message} type={toast?.type} onClose={() => setToast(null)} />
    </div>
  )
}
