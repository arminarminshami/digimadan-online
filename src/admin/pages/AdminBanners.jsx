import { useEffect, useState } from 'react'
import { getAllBanners, createBanner, updateBanner, deleteBanner } from '../../services/bannerService'
import { uploadBannerImage } from '../../services/storageService'
import { AdminPageHead, AdminCard, Toast } from '../components/AdminUI'
import ImageUploader from '../components/ImageUploader'
import { LoadingBlock, EmptyBlock } from '../../components/StatusBlocks'

export default function AdminBanners() {
  const [banners, setBanners] = useState([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [toast, setToast] = useState(null)

  async function load() {
    setLoading(true)
    try {
      setBanners(await getAllBanners())
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  async function handleUpload(fileList) {
    setUploading(true)
    try {
      const file = fileList[0]
      const { url } = await uploadBannerImage(file)
      const nextOrder = banners.length > 0 ? Math.max(...banners.map((b) => b.sort_order)) + 1 : 0
      const created = await createBanner({ image_url: url, sort_order: nextOrder, is_active: true })
      setBanners((prev) => [...prev, created])
      setToast({ type: 'success', message: 'بنر اضافه شد.' })
    } catch (err) {
      setToast({ type: 'error', message: 'آپلود بنر با خطا مواجه شد.' })
    } finally {
      setUploading(false)
    }
  }

  async function handleToggleActive(banner) {
    try {
      const updated = await updateBanner(banner.id, { is_active: !banner.is_active })
      setBanners((prev) => prev.map((b) => (b.id === banner.id ? updated : b)))
    } catch {
      setToast({ type: 'error', message: 'به‌روزرسانی وضعیت بنر با خطا مواجه شد.' })
    }
  }

  async function handleMove(banner, direction) {
    const sorted = [...banners].sort((a, b) => a.sort_order - b.sort_order)
    const index = sorted.findIndex((b) => b.id === banner.id)
    const swapIndex = direction === 'up' ? index - 1 : index + 1
    if (swapIndex < 0 || swapIndex >= sorted.length) return
    const other = sorted[swapIndex]

    try {
      const [updatedA, updatedB] = await Promise.all([
        updateBanner(banner.id, { sort_order: other.sort_order }),
        updateBanner(other.id, { sort_order: banner.sort_order }),
      ])
      setBanners((prev) =>
        prev.map((b) => {
          if (b.id === updatedA.id) return updatedA
          if (b.id === updatedB.id) return updatedB
          return b
        })
      )
    } catch {
      setToast({ type: 'error', message: 'تغییر ترتیب با خطا مواجه شد.' })
    }
  }

  async function handleDelete(banner) {
    if (!window.confirm('این بنر حذف شود؟')) return
    try {
      await deleteBanner(banner.id)
      setBanners((prev) => prev.filter((b) => b.id !== banner.id))
      setToast({ type: 'success', message: 'بنر حذف شد.' })
    } catch {
      setToast({ type: 'error', message: 'حذف بنر با خطا مواجه شد.' })
    }
  }

  const sorted = [...banners].sort((a, b) => a.sort_order - b.sort_order)

  return (
    <div>
      <AdminPageHead
        title="مدیریت بنرهای صفحه اصلی"
        description="می‌توانید چند بنر اضافه کنید؛ در صفحه‌ی اصلی به‌صورت خودکار و چرخشی نمایش داده می‌شوند. اگر هیچ بنر فعالی نباشد، تصویر پیش‌فرض نمایش داده می‌شود."
      />

      <AdminCard>
        <p style={{ fontSize: '0.85rem', color: 'var(--color-ink-soft)', marginBottom: 12 }}>
          افزودن بنر جدید (پیشنهاد می‌شود تصویر افقی و حداقل ۱۶۰۰ پیکسل عرض باشد):
        </p>
        <ImageUploader images={[]} onUpload={handleUpload} onRemove={() => {}} uploading={uploading} multiple={false} />
      </AdminCard>

      <div style={{ height: 20 }} />

      {loading && <LoadingBlock label="در حال بارگذاری بنرها..." />}

      {!loading && sorted.length === 0 && (
        <EmptyBlock title="هنوز بنری اضافه نکرده‌اید" hint="از باکس بالا یک عکس آپلود کنید." />
      )}

      {!loading && sorted.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {sorted.map((banner, i) => (
            <AdminCard key={banner.id}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <img
                  src={banner.image_url}
                  alt="بنر"
                  style={{ width: 140, height: 60, objectFit: 'cover', borderRadius: 8, flexShrink: 0 }}
                />
                <div style={{ flex: 1, fontSize: '0.85rem', color: 'var(--color-ink-soft)' }}>
                  ترتیب نمایش: {i + 1} از {sorted.length}
                  <br />
                  وضعیت: {banner.is_active ? 'فعال (نمایش داده می‌شود)' : 'غیرفعال'}
                </div>
                <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                  <button className="btn btn-outline btn-sm" disabled={i === 0} onClick={() => handleMove(banner, 'up')}>
                    ↑
                  </button>
                  <button
                    className="btn btn-outline btn-sm"
                    disabled={i === sorted.length - 1}
                    onClick={() => handleMove(banner, 'down')}
                  >
                    ↓
                  </button>
                  <button className="btn btn-outline btn-sm" onClick={() => handleToggleActive(banner)}>
                    {banner.is_active ? 'غیرفعال کردن' : 'فعال کردن'}
                  </button>
                  <button className="btn btn-danger btn-sm" onClick={() => handleDelete(banner)}>
                    حذف
                  </button>
                </div>
              </div>
            </AdminCard>
          ))}
        </div>
      )}

      <Toast message={toast?.message} type={toast?.type} onClose={() => setToast(null)} />
    </div>
  )
}
