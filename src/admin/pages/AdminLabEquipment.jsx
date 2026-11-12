import { useEffect, useState } from 'react'
import {
  getAdminLab,
  updateHolding,
  createCompany,
  updateCompany,
  deleteCompany,
  createEquipment,
  updateEquipment,
  deleteEquipment,
} from '../../services/labEquipmentService'
import { uploadLabFile } from '../../services/storageService'
import { AdminPageHead, AdminCard, Toast } from '../components/AdminUI'
import { LoadingBlock } from '../../components/StatusBlocks'
import './AdminSettings.css'

const lines = (s) => s.split('\n').map((x) => x.trim()).filter(Boolean)

function Field({ label, children }) {
  return (
    <label className="admin-field">
      <span>{label}</span>
      {children}
    </label>
  )
}

const EMPTY_DEVICE = { title_fa: '', title_en: '', brand: '', description: '', images: [], catalog_url: '', is_active: true }

export default function AdminLabEquipment() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState(null)
  const [busy, setBusy] = useState(false)

  const [form, setForm] = useState(null) // فرم هلدینگ
  const [device, setDevice] = useState(null) // دستگاه در حال ویرایش/افزودن
  const [company, setCompany] = useState(null)
  const [docTitle, setDocTitle] = useState('')

  async function load() {
    setLoading(true)
    try {
      const d = await getAdminLab()
      setData(d)
      if (d) {
        const h = d.holding
        setForm({
          name_fa: h.name_fa || '',
          name_en: h.name_en || '',
          slogan: h.slogan || '',
          description: h.description || '',
          partnership_text: h.partnership_text || '',
          phones: (h.phones || []).join('\n'),
          website: h.website || '',
          email: h.email || '',
          activities: (h.activities || []).join('\n'),
          after_sales: (h.after_sales || []).join('\n'),
          documents: h.documents || [],
          brands: (h.brands || []).join('\n'),
          addresses: (h.addresses || []).map((a) => `${a.title}: ${a.text}`).join('\n'),
          logo_url: h.logo_url || '',
          brochure_images: h.brochure_images || [],
          is_active: h.is_active,
        })
      }
    } catch {
      setToast({ type: 'error', message: 'بارگذاری اطلاعات با خطا مواجه شد.' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const ok = (message) => setToast({ type: 'success', message })
  const fail = (message) => setToast({ type: 'error', message })

  async function upload(file) {
    const { url } = await uploadLabFile(file)
    return url
  }

  // ---------- هلدینگ ----------
  async function saveHolding(e) {
    e.preventDefault()
    setBusy(true)
    try {
      const addresses = lines(form.addresses).map((l) => {
        const i = l.indexOf(':')
        return i > 0 ? { title: l.slice(0, i).trim(), text: l.slice(i + 1).trim() } : { title: 'آدرس', text: l }
      })
      const updated = await updateHolding(data.holding.id, {
        name_fa: form.name_fa,
        name_en: form.name_en || null,
        slogan: form.slogan || null,
        description: form.description || null,
        partnership_text: form.partnership_text || null,
        phones: lines(form.phones),
        website: form.website || null,
        email: form.email || null,
        activities: lines(form.activities),
        after_sales: lines(form.after_sales),
        documents: form.documents,
        brands: lines(form.brands),
        addresses,
        logo_url: form.logo_url || null,
        brochure_images: form.brochure_images,
        is_active: form.is_active,
      })
      setData((d) => ({ ...d, holding: updated }))
      ok('اطلاعات هلدینگ ذخیره شد.')
    } catch {
      fail('ذخیره اطلاعات هلدینگ با خطا مواجه شد.')
    } finally {
      setBusy(false)
    }
  }

  async function onLogo(e) {
    const f = e.target.files?.[0]
    if (!f) return
    setBusy(true)
    try {
      setForm((s) => ({ ...s }))
      const url = await upload(f)
      setForm((s) => ({ ...s, logo_url: url }))
    } catch {
      fail('آپلود لوگو با خطا مواجه شد.')
    } finally {
      setBusy(false)
      e.target.value = ''
    }
  }

  async function onBrochures(e) {
    const files = Array.from(e.target.files || [])
    if (!files.length) return
    setBusy(true)
    try {
      const urls = await Promise.all(files.map(upload))
      setForm((s) => ({ ...s, brochure_images: [...s.brochure_images, ...urls] }))
    } catch {
      fail('آپلود بروشور با خطا مواجه شد.')
    } finally {
      setBusy(false)
      e.target.value = ''
    }
  }

  async function onDocument(e) {
    const f = e.target.files?.[0]
    if (!f) return
    setBusy(true)
    try {
      const url = await upload(f)
      const title = docTitle.trim() || f.name.replace(/\.[^.]+$/, '')
      setForm((s) => ({ ...s, documents: [...s.documents, { title, url }] }))
      setDocTitle('')
    } catch {
      fail('آپلود فایل با خطا مواجه شد.')
    } finally {
      setBusy(false)
      e.target.value = ''
    }
  }

  // ---------- دستگاه ----------
  async function onDeviceImages(e) {
    const files = Array.from(e.target.files || [])
    if (!files.length) return
    setBusy(true)
    try {
      const urls = await Promise.all(files.map(upload))
      setDevice((d) => ({ ...d, images: [...d.images, ...urls] }))
    } catch {
      fail('آپلود تصویر با خطا مواجه شد.')
    } finally {
      setBusy(false)
      e.target.value = ''
    }
  }

  async function onDeviceCatalog(e) {
    const f = e.target.files?.[0]
    if (!f) return
    setBusy(true)
    try {
      const url = await upload(f)
      setDevice((d) => ({ ...d, catalog_url: url }))
    } catch {
      fail('آپلود کاتالوگ با خطا مواجه شد.')
    } finally {
      setBusy(false)
      e.target.value = ''
    }
  }

  async function saveDevice(e) {
    e.preventDefault()
    if (!device.title_fa.trim()) return fail('نام دستگاه را وارد کنید.')
    setBusy(true)
    try {
      const payload = {
        title_fa: device.title_fa.trim(),
        title_en: device.title_en || null,
        brand: device.brand || null,
        description: device.description || null,
        images: device.images,
        catalog_url: device.catalog_url || null,
        is_active: device.is_active,
      }
      if (device.id) {
        const u = await updateEquipment(device.id, payload)
        setData((d) => ({ ...d, equipment: d.equipment.map((x) => (x.id === u.id ? u : x)) }))
      } else {
        const nextOrder = data.equipment.length ? Math.max(...data.equipment.map((x) => x.sort_order)) + 1 : 1
        const c = await createEquipment({ ...payload, holding_id: data.holding.id, sort_order: nextOrder })
        setData((d) => ({ ...d, equipment: [...d.equipment, c] }))
      }
      setDevice(null)
      ok('دستگاه ذخیره شد.')
    } catch {
      fail('ذخیره دستگاه با خطا مواجه شد.')
    } finally {
      setBusy(false)
    }
  }

  async function removeDevice(item) {
    if (!window.confirm('این دستگاه حذف شود؟')) return
    try {
      await deleteEquipment(item.id)
      setData((d) => ({ ...d, equipment: d.equipment.filter((x) => x.id !== item.id) }))
      ok('دستگاه حذف شد.')
    } catch {
      fail('حذف دستگاه با خطا مواجه شد.')
    }
  }

  async function toggleDevice(item) {
    try {
      const u = await updateEquipment(item.id, { is_active: !item.is_active })
      setData((d) => ({ ...d, equipment: d.equipment.map((x) => (x.id === u.id ? u : x)) }))
    } catch {
      fail('به‌روزرسانی وضعیت با خطا مواجه شد.')
    }
  }

  async function moveDevice(item, dir) {
    const sorted = [...data.equipment].sort((a, b) => a.sort_order - b.sort_order)
    const i = sorted.findIndex((x) => x.id === item.id)
    const other = sorted[dir === 'up' ? i - 1 : i + 1]
    if (!other) return
    try {
      const [a, b] = await Promise.all([
        updateEquipment(item.id, { sort_order: other.sort_order }),
        updateEquipment(other.id, { sort_order: item.sort_order }),
      ])
      setData((d) => ({ ...d, equipment: d.equipment.map((x) => (x.id === a.id ? a : x.id === b.id ? b : x)) }))
    } catch {
      fail('تغییر ترتیب با خطا مواجه شد.')
    }
  }

  // ---------- شرکت‌های زیرمجموعه ----------
  async function saveCompany(e) {
    e.preventDefault()
    if (!company.name_fa.trim()) return fail('نام شرکت را وارد کنید.')
    setBusy(true)
    try {
      const payload = { name_fa: company.name_fa.trim(), description: company.description || null, is_active: company.is_active }
      if (company.id) {
        const u = await updateCompany(company.id, payload)
        setData((d) => ({ ...d, companies: d.companies.map((x) => (x.id === u.id ? u : x)) }))
      } else {
        const nextOrder = data.companies.length ? Math.max(...data.companies.map((x) => x.sort_order)) + 1 : 1
        const c = await createCompany({ ...payload, holding_id: data.holding.id, sort_order: nextOrder })
        setData((d) => ({ ...d, companies: [...d.companies, c] }))
      }
      setCompany(null)
      ok('شرکت ذخیره شد.')
    } catch {
      fail('ذخیره شرکت با خطا مواجه شد.')
    } finally {
      setBusy(false)
    }
  }

  async function removeCompany(item) {
    if (!window.confirm('این شرکت حذف شود؟')) return
    try {
      await deleteCompany(item.id)
      setData((d) => ({ ...d, companies: d.companies.filter((x) => x.id !== item.id) }))
      ok('شرکت حذف شد.')
    } catch {
      fail('حذف شرکت با خطا مواجه شد.')
    }
  }

  if (loading) return <LoadingBlock label="در حال بارگذاری..." />
  if (!data) return <p>هلدینگی ثبت نشده است. ابتدا مایگریشن دیتابیس را اجرا کنید.</p>

  const equipment = [...data.equipment].sort((a, b) => a.sort_order - b.sort_order)
  const set = (k) => (e) => setForm((s) => ({ ...s, [k]: e.target.value }))
  const setD = (k) => (e) => setDevice((s) => ({ ...s, [k]: e.target.value }))

  return (
    <div>
      <AdminPageHead
        title="تجهیزات آزمایشگاهی"
        description="معرفی هلدینگ، شماره تماس، شرکت‌های زیرمجموعه و دستگاه‌ها (همراه با عکس و کاتالوگ) از اینجا مدیریت می‌شود."
        action={
          <a href="/lab-equipment" target="_blank" rel="noreferrer" className="btn btn-outline btn-sm">
            مشاهده صفحه
          </a>
        }
      />

      {/* ---- هلدینگ ---- */}
      <AdminCard>
        <h2 className="admin-section-title">معرفی هلدینگ</h2>
        <form onSubmit={saveHolding} className="admin-settings__form">
          <Field label="نام فارسی"><input value={form.name_fa} onChange={set('name_fa')} required /></Field>
          <Field label="نام انگلیسی"><input value={form.name_en} onChange={set('name_en')} dir="ltr" /></Field>
          <Field label="شعار"><input value={form.slogan} onChange={set('slogan')} /></Field>
          <Field label="متن معرفی"><textarea rows={4} value={form.description} onChange={set('description')} /></Field>
          <Field label="متن همکاری با دیجی‌معدن"><textarea rows={3} value={form.partnership_text} onChange={set('partnership_text')} /></Field>
          <Field label="شماره‌های تماس (هر شماره در یک خط)"><textarea rows={3} value={form.phones} onChange={set('phones')} dir="ltr" /></Field>
          <Field label="وب‌سایت"><input value={form.website} onChange={set('website')} dir="ltr" placeholder="https://" /></Field>
          <Field label="ایمیل"><input value={form.email} onChange={set('email')} dir="ltr" /></Field>
          <Field label="آدرس‌ها (هر خط: عنوان: آدرس)"><textarea rows={3} value={form.addresses} onChange={set('addresses')} /></Field>
          <Field label="حوزه‌های فعالیت (هر مورد در یک خط)"><textarea rows={5} value={form.activities} onChange={set('activities')} /></Field>
          <Field label="خدمات پس از فروش و گارانتی (هر مورد در یک خط)"><textarea rows={5} value={form.after_sales} onChange={set('after_sales')} /></Field>
          <Field label="برندها (هر مورد در یک خط)"><textarea rows={4} value={form.brands} onChange={set('brands')} dir="ltr" /></Field>

          <Field label="کاتالوگ‌ها و فایل‌های قابل دانلود (PDF یا تصویر)">
            {form.documents.map((d, i) => (
              <div key={d.url} style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                <a href={d.url} target="_blank" rel="noreferrer" style={{ flex: 1, minWidth: 160 }}>{d.title}</a>
                <button type="button" className="btn btn-danger btn-sm" onClick={() => setForm((s) => ({ ...s, documents: s.documents.filter((_, j) => j !== i) }))}>حذف</button>
              </div>
            ))}
            <input value={docTitle} onChange={(e) => setDocTitle(e.target.value)} placeholder="عنوان فایل جدید (اختیاری)" />
            <input type="file" accept="application/pdf,image/*" onChange={onDocument} disabled={busy} />
          </Field>

          <Field label="لوگوی هلدینگ">
            {form.logo_url && <img src={form.logo_url} alt="لوگو" style={{ height: 70, objectFit: 'contain', alignSelf: 'flex-start' }} />}
            <input type="file" accept="image/*" onChange={onLogo} disabled={busy} />
          </Field>

          <Field label="تصاویر بروشور هلدینگ">
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {form.brochure_images.map((src, i) => (
                <div key={src} style={{ position: 'relative' }}>
                  <img src={src} alt="" style={{ height: 90, borderRadius: 6 }} />
                  <button
                    type="button"
                    className="btn btn-danger btn-sm"
                    style={{ position: 'absolute', top: 2, insetInlineEnd: 2, padding: '0 8px' }}
                    onClick={() => setForm((s) => ({ ...s, brochure_images: s.brochure_images.filter((_, j) => j !== i) }))}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
            <input type="file" accept="image/*" multiple onChange={onBrochures} disabled={busy} />
          </Field>

          <label className="admin-settings__toggle">
            <input type="checkbox" checked={form.is_active} onChange={(e) => setForm((s) => ({ ...s, is_active: e.target.checked }))} />
            <span>صفحه برای بازدیدکنندگان نمایش داده شود</span>
          </label>
          <button type="submit" className="btn btn-primary" disabled={busy}>ذخیره اطلاعات هلدینگ</button>
        </form>
      </AdminCard>

      <div style={{ height: 20 }} />

      {/* ---- دستگاه‌ها ---- */}
      <AdminCard>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h2 className="admin-section-title" style={{ margin: 0 }}>دستگاه‌ها و تجهیزات</h2>
          {!device && (
            <button className="btn btn-primary btn-sm" onClick={() => setDevice({ ...EMPTY_DEVICE })}>+ افزودن دستگاه</button>
          )}
        </div>

        {device && (
          <form onSubmit={saveDevice} className="admin-settings__form" style={{ marginBottom: 18, paddingBottom: 18, borderBottom: '1px solid var(--color-border)' }}>
            <Field label="نام فارسی دستگاه"><input value={device.title_fa} onChange={setD('title_fa')} required /></Field>
            <Field label="نام انگلیسی / مدل"><input value={device.title_en} onChange={setD('title_en')} dir="ltr" /></Field>
            <Field label="برند"><input value={device.brand} onChange={setD('brand')} dir="ltr" /></Field>
            <Field label="توضیحات"><textarea rows={4} value={device.description} onChange={setD('description')} /></Field>
            <Field label="عکس‌های دستگاه">
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                {device.images.map((src, i) => (
                  <div key={src} style={{ position: 'relative' }}>
                    <img src={src} alt="" style={{ height: 80, borderRadius: 6 }} />
                    <button
                      type="button"
                      className="btn btn-danger btn-sm"
                      style={{ position: 'absolute', top: 2, insetInlineEnd: 2, padding: '0 8px' }}
                      onClick={() => setDevice((d) => ({ ...d, images: d.images.filter((_, j) => j !== i) }))}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
              <input type="file" accept="image/*" multiple onChange={onDeviceImages} disabled={busy} />
            </Field>
            <Field label="فایل کاتالوگ (PDF یا تصویر)">
              {device.catalog_url && (
                <div style={{ fontSize: '0.85rem' }}>
                  <a href={device.catalog_url} target="_blank" rel="noreferrer">کاتالوگ فعلی</a>{' '}
                  <button type="button" className="btn btn-outline btn-sm" onClick={() => setDevice((d) => ({ ...d, catalog_url: '' }))}>حذف</button>
                </div>
              )}
              <input type="file" accept="application/pdf,image/*" onChange={onDeviceCatalog} disabled={busy} />
            </Field>
            <label className="admin-settings__toggle">
              <input type="checkbox" checked={device.is_active} onChange={(e) => setDevice((d) => ({ ...d, is_active: e.target.checked }))} />
              <span>نمایش داده شود</span>
            </label>
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="submit" className="btn btn-primary" disabled={busy}>ذخیره دستگاه</button>
              <button type="button" className="btn btn-outline" onClick={() => setDevice(null)}>انصراف</button>
            </div>
          </form>
        )}

        {equipment.length === 0 && !device && <p style={{ color: 'var(--color-ink-soft)' }}>هنوز دستگاهی ثبت نشده است.</p>}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {equipment.map((item, i) => (
            <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              {item.images?.[0] ? (
                <img src={item.images[0]} alt="" style={{ width: 80, height: 60, objectFit: 'cover', borderRadius: 6 }} />
              ) : (
                <div style={{ width: 80, height: 60, background: 'var(--color-bg-alt)', borderRadius: 6 }} />
              )}
              <div style={{ flex: 1, minWidth: 160 }}>
                <strong>{item.title_fa}</strong>
                <div style={{ fontSize: '0.8rem', color: 'var(--color-ink-soft)' }}>
                  {item.is_active ? 'فعال' : 'غیرفعال'} · {item.images?.length || 0} عکس · {item.catalog_url ? 'دارای کاتالوگ' : 'بدون کاتالوگ'}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                <button className="btn btn-outline btn-sm" disabled={i === 0} onClick={() => moveDevice(item, 'up')}>↑</button>
                <button className="btn btn-outline btn-sm" disabled={i === equipment.length - 1} onClick={() => moveDevice(item, 'down')}>↓</button>
                <button className="btn btn-outline btn-sm" onClick={() => setDevice({ ...EMPTY_DEVICE, ...item, title_en: item.title_en || '', brand: item.brand || '', description: item.description || '', catalog_url: item.catalog_url || '', images: item.images || [] })}>ویرایش</button>
                <button className="btn btn-outline btn-sm" onClick={() => toggleDevice(item)}>{item.is_active ? 'غیرفعال' : 'فعال'}</button>
                <button className="btn btn-danger btn-sm" onClick={() => removeDevice(item)}>حذف</button>
              </div>
            </div>
          ))}
        </div>
      </AdminCard>

      <div style={{ height: 20 }} />

      {/* ---- شرکت‌های زیرمجموعه ---- */}
      <AdminCard>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h2 className="admin-section-title" style={{ margin: 0 }}>شرکت‌های زیرمجموعه</h2>
          {!company && (
            <button className="btn btn-primary btn-sm" onClick={() => setCompany({ name_fa: '', description: '', is_active: true })}>+ افزودن شرکت</button>
          )}
        </div>
        {company && (
          <form onSubmit={saveCompany} className="admin-settings__form" style={{ marginBottom: 18, paddingBottom: 18, borderBottom: '1px solid var(--color-border)' }}>
            <Field label="نام شرکت"><input value={company.name_fa} onChange={(e) => setCompany((c) => ({ ...c, name_fa: e.target.value }))} required /></Field>
            <Field label="توضیحات"><textarea rows={3} value={company.description || ''} onChange={(e) => setCompany((c) => ({ ...c, description: e.target.value }))} /></Field>
            <label className="admin-settings__toggle">
              <input type="checkbox" checked={company.is_active} onChange={(e) => setCompany((c) => ({ ...c, is_active: e.target.checked }))} />
              <span>نمایش داده شود</span>
            </label>
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="submit" className="btn btn-primary" disabled={busy}>ذخیره</button>
              <button type="button" className="btn btn-outline" onClick={() => setCompany(null)}>انصراف</button>
            </div>
          </form>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {data.companies.map((c) => (
            <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: 160 }}>
                <strong>{c.name_fa}</strong>
                {!c.is_active && <span style={{ color: 'var(--color-ink-soft)', fontSize: '0.8rem' }}> (غیرفعال)</span>}
              </div>
              <button className="btn btn-outline btn-sm" onClick={() => setCompany({ ...c })}>ویرایش</button>
              <button className="btn btn-danger btn-sm" onClick={() => removeCompany(c)}>حذف</button>
            </div>
          ))}
        </div>
      </AdminCard>

      <Toast message={toast?.message} type={toast?.type} onClose={() => setToast(null)} />
    </div>
  )
}
