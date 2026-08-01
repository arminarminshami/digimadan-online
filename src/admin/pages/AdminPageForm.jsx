import { useEffect, useState } from 'react'
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom'
import { createPage, updatePage, getPageBySlug, getAllPages } from '../../services/pagesService'
import { AdminPageHead } from '../components/AdminUI'
import { LoadingBlock, ErrorBlock } from '../../components/StatusBlocks'

function slugify(text) {
  return text
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
}

export default function AdminPageForm() {
  const { id } = useParams()
  const isEdit = Boolean(id)
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const [form, setForm] = useState({
    title: searchParams.get('title') || '',
    slug: searchParams.get('slug') || '',
    content: '',
  })
  const [loading, setLoading] = useState(isEdit)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!isEdit) return
    getAllPages()
      .then((pages) => {
        const page = pages.find((p) => p.id === id)
        if (page) setForm({ title: page.title, slug: page.slug, content: page.content || '' })
      })
      .catch((err) => setError('بارگذاری صفحه با خطا مواجه شد.'))
      .finally(() => setLoading(false))
  }, [id, isEdit])

  function updateField(key, value) {
    setForm((prev) => {
      const next = { ...prev, [key]: value }
      return next
    })
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    const payload = {
      title: form.title,
      slug: form.slug || slugify(form.title),
      content: form.content,
    }
    try {
      if (isEdit) {
        await updatePage(id, payload)
      } else {
        await createPage(payload)
      }
      navigate('/admin/pages')
    } catch (err) {
      setError('ذخیره صفحه با خطا مواجه شد. ممکن است این آدرس (slug) قبلاً استفاده شده باشد.')
      setSaving(false)
    }
  }

  if (loading) return <LoadingBlock label="در حال بارگذاری صفحه..." />

  return (
    <div>
      <AdminPageHead
        title={isEdit ? 'ویرایش صفحه' : 'صفحه جدید'}
        action={
          <Link to="/admin/pages" className="btn btn-outline btn-sm">
            ← بازگشت
          </Link>
        }
      />

      {error && <ErrorBlock message={error} />}

      <form onSubmit={handleSubmit} style={{ maxWidth: 640, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <label className="admin-field">
          <span>عنوان صفحه</span>
          <input
            required
            value={form.title}
            onChange={(e) => updateField('title', e.target.value)}
            placeholder="مثال: درباره ما"
          />
        </label>

        <label className="admin-field">
          <span>آدرس صفحه (slug)</span>
          <input
            required
            value={form.slug}
            onChange={(e) => updateField('slug', slugify(e.target.value))}
            placeholder="about"
            dir="ltr"
            style={{ textAlign: 'left' }}
          />
        </label>

        <label className="admin-field">
          <span>محتوای صفحه</span>
          <textarea
            required
            rows={12}
            value={form.content}
            onChange={(e) => updateField('content', e.target.value)}
            placeholder="متن کامل این صفحه را اینجا بنویسید..."
          />
        </label>

        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? 'در حال ذخیره...' : 'ذخیره صفحه'}
        </button>
      </form>
    </div>
  )
}
