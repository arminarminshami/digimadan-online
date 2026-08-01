import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { createAd, updateAd, getAdById } from '../../services/adsService'
import { uploadMultipleAdImages, deleteAdImage, uploadAdAnalysisFile } from '../../services/storageService'
import { AdminPageHead, Toast } from '../components/AdminUI'
import ImageUploader from '../components/ImageUploader'
import SearchableSelect from '../../components/SearchableSelect'
import { LoadingBlock, ErrorBlock } from '../../components/StatusBlocks'
import {
  AD_CATEGORIES,
  PROVINCES,
  MINERAL_FORMS,
  MINERAL_GROUPS_SORTED,
  SIMPLE_AD_CATEGORIES,
  MINE_LICENSE_STATUS,
  MACHINE_GROUPS_SORTED,
  MACHINE_CONDITIONS,
} from '../../lib/constants'
import './AdminAdForm.css'

const EMPTY_FORM = {
  ad_type: 'sell',
  title: '',
  category: AD_CATEGORIES[0].value,
  province: PROVINCES[0],
  description: '',
  contact_name: '',
  phone: '',
  secondary_phone: '',
  mineral_type: '',
  mineral_form: '',
  purity_percent: '',
  ore_grade: '',
  humidity_percent: '',
  granularity: '',
  tonnage: '',
  mine_name: '',
  mine_license_number: '',
  mine_license_status: '',
  mine_area_hectares: '',
  mine_reserve_tons: '',
  machine_type: '',
  machine_brand: '',
  machine_model: '',
  machine_year: '',
  machine_condition: '',
  machine_working_hours: '',
  base_price: '',
  auction_duration_days: '',
  delivery_terms: '',
  // آگهی ثبت‌شده از پنل ادمین همان لحظه منتشر می‌شود -- برخلاف فرم عمومی سایت
  // که ابتدا در وضعیت «در انتظار بررسی» قرار می‌گیرد.
  status: 'published',
}

export default function AdminAdForm() {
  const { id } = useParams()
  const isEdit = Boolean(id)
  const navigate = useNavigate()

  const [form, setForm] = useState(EMPTY_FORM)
  const [images, setImages] = useState([]) // [{ path, url }]
  const [mineDocuments, setMineDocuments] = useState([])
  const [analysisFile, setAnalysisFile] = useState(null) // { url, path, name }
  const [loading, setLoading] = useState(isEdit)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadingDocs, setUploadingDocs] = useState(false)
  const [uploadingAnalysis, setUploadingAnalysis] = useState(false)
  const [error, setError] = useState(null)
  const [toast, setToast] = useState(null)

  const isMineral = form.category === 'mineral_materials'
  const isMine = form.category === 'mines'
  const isMachinery = form.category === 'mining_machinery'
  const isSimple = SIMPLE_AD_CATEGORIES.includes(form.category)

  useEffect(() => {
    if (!isEdit) return
    getAdById(id)
      .then((ad) => {
        setForm({
          ad_type: ad.ad_type || 'sell',
          title: ad.title || '',
          category: ad.category || AD_CATEGORIES[0].value,
          province: ad.province || PROVINCES[0],
          description: ad.description || '',
          contact_name: ad.contact_name || '',
          phone: ad.phone || '',
          secondary_phone: ad.secondary_phone || '',
          mineral_type: ad.mineral_type || '',
          mineral_form: ad.mineral_form || '',
          purity_percent: ad.purity_percent ?? '',
          ore_grade: ad.ore_grade || '',
          humidity_percent: ad.humidity_percent ?? '',
          granularity: ad.granularity || '',
          tonnage: ad.tonnage ?? '',
          mine_name: ad.mine_name || '',
          mine_license_number: ad.mine_license_number || '',
          mine_license_status: ad.mine_license_status || '',
          mine_area_hectares: ad.mine_area_hectares ?? '',
          mine_reserve_tons: ad.mine_reserve_tons ?? '',
          machine_type: ad.machine_type || '',
          machine_brand: ad.machine_brand || '',
          machine_model: ad.machine_model || '',
          machine_year: ad.machine_year ?? '',
          machine_condition: ad.machine_condition || '',
          machine_working_hours: ad.machine_working_hours ?? '',
          base_price: ad.base_price ?? '',
          auction_duration_days: ad.auction_duration_days ?? '',
          delivery_terms: ad.delivery_terms || '',
          status: ad.status || 'published',
        })
        setImages((ad.images || []).map((url) => ({ url, path: null })))
        setMineDocuments((ad.mine_documents || []).map((url) => ({ url, path: null })))
        if (ad.analysis_file_url) {
          setAnalysisFile({ url: ad.analysis_file_url, name: 'فایل آنالیز ثبت‌شده' })
        }
      })
      .catch((err) => setError('دریافت اطلاعات آگهی با خطا مواجه شد.'))
      .finally(() => setLoading(false))
  }, [id, isEdit])

  function updateField(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function handleUpload(fileList) {
    setUploading(true)
    try {
      const uploaded = await uploadMultipleAdImages(fileList)
      setImages((prev) => [...prev, ...uploaded])
    } catch (err) {
      setToast({ type: 'error', message: 'آپلود تصویر با خطا مواجه شد.' })
    } finally {
      setUploading(false)
    }
  }

  async function handleRemoveImage(index) {
    const img = images[index]
    setImages((prev) => prev.filter((_, i) => i !== index))
    if (img.path) {
      deleteAdImage(img.path).catch(() => {})
    }
  }

  async function handleUploadDocs(fileList) {
    setUploadingDocs(true)
    try {
      const uploaded = await uploadMultipleAdImages(fileList)
      setMineDocuments((prev) => [...prev, ...uploaded])
    } catch {
      setToast({ type: 'error', message: 'آپلود عکس مدارک با خطا مواجه شد.' })
    } finally {
      setUploadingDocs(false)
    }
  }

  async function handleRemoveDoc(index) {
    const img = mineDocuments[index]
    setMineDocuments((prev) => prev.filter((_, i) => i !== index))
    if (img.path) deleteAdImage(img.path).catch(() => {})
  }

  async function handleAnalysisUpload(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingAnalysis(true)
    try {
      const uploaded = await uploadAdAnalysisFile(file)
      setAnalysisFile({ ...uploaded, name: file.name })
    } catch {
      setToast({ type: 'error', message: 'آپلود فایل آنالیز با خطا مواجه شد.' })
    } finally {
      setUploadingAnalysis(false)
      e.target.value = ''
    }
  }

  async function handleSubmit(e, publishNow) {
    e.preventDefault()
    setSaving(true)
    setError(null)

    const payload = {
      ...form,
      purity_percent: form.purity_percent ? Number(form.purity_percent) : null,
      humidity_percent: form.humidity_percent ? Number(form.humidity_percent) : null,
      tonnage: form.tonnage ? Number(form.tonnage) : null,
      mineral_form: form.mineral_form || null,
      mine_area_hectares: form.mine_area_hectares ? Number(form.mine_area_hectares) : null,
      mine_reserve_tons: form.mine_reserve_tons ? Number(form.mine_reserve_tons) : null,
      mine_license_status: form.mine_license_status || null,
      machine_year: form.machine_year ? Number(form.machine_year) : null,
      machine_working_hours: form.machine_working_hours ? Number(form.machine_working_hours) : null,
      machine_condition: form.machine_condition || null,
      base_price: form.base_price ? Number(form.base_price) : null,
      auction_duration_days: form.auction_duration_days ? Number(form.auction_duration_days) : null,
      delivery_terms: form.delivery_terms || null,
      secondary_phone: form.secondary_phone?.trim() || null,
      status: publishNow ? 'published' : form.status,
      images: images.map((img) => img.url),
      mine_documents: mineDocuments.map((img) => img.url),
      analysis_file_url: analysisFile?.url || null,
    }

    try {
      if (isEdit) {
        await updateAd(id, payload)
      } else {
        await createAd(payload)
      }
      navigate('/admin/ads')
    } catch (err) {
      setError('ذخیره آگهی با خطا مواجه شد. لطفاً دوباره تلاش کنید.')
      setSaving(false)
    }
  }

  if (loading) return <LoadingBlock label="در حال بارگذاری آگهی..." />

  return (
    <div>
      <AdminPageHead
        title={isEdit ? 'ویرایش آگهی' : 'ثبت آگهی جدید'}
        description="آگهی ثبت‌شده از این فرم بلافاصله روی سایت منتشر می‌شود."
        action={
          <Link to="/admin/ads" className="btn btn-outline btn-sm">
            ← بازگشت به فهرست
          </Link>
        }
      />

      {error && <ErrorBlock message={error} />}

      <form className="ad-form" onSubmit={(e) => handleSubmit(e, false)}>
        <div className="ad-type-toggle">
          <button
            type="button"
            className={'ad-type-toggle__btn' + (form.ad_type === 'sell' ? ' ad-type-toggle__btn--active' : '')}
            onClick={() => updateField('ad_type', 'sell')}
          >
            آگهی فروش
          </button>
          <button
            type="button"
            className={'ad-type-toggle__btn' + (form.ad_type === 'buy' ? ' ad-type-toggle__btn--active' : '')}
            onClick={() => updateField('ad_type', 'buy')}
          >
            آگهی خرید
          </button>
        </div>

        <div className="ad-form__grid">
          <label className="admin-field">
            <span>عنوان آگهی</span>
            <input
              required
              value={form.title}
              onChange={(e) => updateField('title', e.target.value)}
              placeholder="مثال: فروش معدن سنگ آهن در یزد"
            />
          </label>

          <label className="admin-field">
            <span>دسته‌بندی</span>
            <select value={form.category} onChange={(e) => updateField('category', e.target.value)}>
              {AD_CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </label>

          <label className="admin-field">
            <span>استان</span>
            <select value={form.province} onChange={(e) => updateField('province', e.target.value)}>
              {PROVINCES.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </label>

          {isMineral && (
            <>
              <label className="admin-field">
                <span>نوع ماده معدنی</span>
                <SearchableSelect
                  groups={MINERAL_GROUPS_SORTED}
                  value={form.mineral_type}
                  onChange={(v) => updateField('mineral_type', v)}
                  placeholder="انتخاب کنید"
                  extraOption={{ value: 'سایر', label: 'سایر' }}
                />
              </label>

              <label className="admin-field">
                <span>شکل ماده</span>
                <select value={form.mineral_form} onChange={(e) => updateField('mineral_form', e.target.value)}>
                  <option value="">انتخاب نکنید</option>
                  {MINERAL_FORMS.map((m) => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </select>
              </label>

              <label className="admin-field">
                <span>تناژ بار موجود (دپو)</span>
                <input
                  type="number"
                  step="0.01"
                  value={form.tonnage}
                  onChange={(e) => updateField('tonnage', e.target.value)}
                  placeholder="مثال: 500 تن"
                />
              </label>

              <label className="admin-field">
                <span>درصد خلوص (اختیاری)</span>
                <input
                  type="number"
                  step="0.01"
                  value={form.purity_percent}
                  onChange={(e) => updateField('purity_percent', e.target.value)}
                  placeholder="مثلا 92.5"
                />
              </label>

              <label className="admin-field">
                <span>عیار (اختیاری)</span>
                <input
                  value={form.ore_grade}
                  onChange={(e) => updateField('ore_grade', e.target.value)}
                  placeholder="مثلا 18"
                />
              </label>

              <label className="admin-field">
                <span>درصد رطوبت (اختیاری)</span>
                <input
                  type="number"
                  step="0.01"
                  value={form.humidity_percent}
                  onChange={(e) => updateField('humidity_percent', e.target.value)}
                  placeholder="مثلا 4"
                />
              </label>

              <label className="admin-field">
                <span>دانه‌بندی (اختیاری)</span>
                <input
                  value={form.granularity}
                  onChange={(e) => updateField('granularity', e.target.value)}
                  placeholder="مثلا 0 تا 5 میلی‌متر"
                />
              </label>
            </>
          )}

          {isMine && (
            <>
              <label className="admin-field">
                <span>نام معدن</span>
                <input
                  required
                  value={form.mine_name}
                  onChange={(e) => updateField('mine_name', e.target.value)}
                  placeholder="مثال: معدن سنگ آهن کوهبنان"
                />
              </label>

              <label className="admin-field">
                <span>شماره پروانه (اختیاری)</span>
                <input
                  value={form.mine_license_number}
                  onChange={(e) => updateField('mine_license_number', e.target.value)}
                  placeholder="شماره پروانه بهره‌برداری/اکتشاف"
                />
              </label>

              <label className="admin-field">
                <span>وضعیت پروانه</span>
                <select
                  value={form.mine_license_status}
                  onChange={(e) => updateField('mine_license_status', e.target.value)}
                >
                  <option value="">انتخاب کنید</option>
                  {MINE_LICENSE_STATUS.map((s) => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </label>

              <label className="admin-field">
                <span>ماده معدنی اصلی معدن</span>
                <SearchableSelect
                  groups={MINERAL_GROUPS_SORTED}
                  value={form.mineral_type}
                  onChange={(v) => updateField('mineral_type', v)}
                  placeholder="انتخاب کنید"
                  extraOption={{ value: 'سایر', label: 'سایر' }}
                />
              </label>

              <label className="admin-field">
                <span>مساحت محدوده (هکتار، اختیاری)</span>
                <input
                  type="number"
                  step="0.01"
                  value={form.mine_area_hectares}
                  onChange={(e) => updateField('mine_area_hectares', e.target.value)}
                  placeholder="مثال: 120"
                />
              </label>

              <label className="admin-field">
                <span>ذخیره تخمینی (تن، اختیاری)</span>
                <input
                  type="number"
                  step="0.01"
                  value={form.mine_reserve_tons}
                  onChange={(e) => updateField('mine_reserve_tons', e.target.value)}
                  placeholder="مثال: 500000"
                />
              </label>
            </>
          )}

          {isMachinery && (
            <>
              <label className="admin-field">
                <span>نوع ماشین‌آلات</span>
                <SearchableSelect
                  groups={MACHINE_GROUPS_SORTED}
                  value={form.machine_type}
                  onChange={(v) => updateField('machine_type', v)}
                  placeholder="انتخاب کنید"
                  extraOption={{ value: 'سایر', label: 'سایر' }}
                />
              </label>

              <label className="admin-field">
                <span>برند / سازنده (اختیاری)</span>
                <input
                  value={form.machine_brand}
                  onChange={(e) => updateField('machine_brand', e.target.value)}
                  placeholder="مثال: کاماتسو، ولوو، هپکو..."
                />
              </label>

              <label className="admin-field">
                <span>مدل (اختیاری)</span>
                <input value={form.machine_model} onChange={(e) => updateField('machine_model', e.target.value)} />
              </label>

              <label className="admin-field">
                <span>سال ساخت (اختیاری)</span>
                <input
                  type="number"
                  value={form.machine_year}
                  onChange={(e) => updateField('machine_year', e.target.value)}
                  placeholder="مثال: 1399"
                />
              </label>

              <label className="admin-field">
                <span>وضعیت دستگاه</span>
                <select
                  value={form.machine_condition}
                  onChange={(e) => updateField('machine_condition', e.target.value)}
                >
                  <option value="">انتخاب نکنید</option>
                  {MACHINE_CONDITIONS.map((c) => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </label>

              <label className="admin-field">
                <span>ساعت کارکرد (اختیاری)</span>
                <input
                  type="number"
                  value={form.machine_working_hours}
                  onChange={(e) => updateField('machine_working_hours', e.target.value)}
                  placeholder="مثال: 4500"
                />
              </label>
            </>
          )}

          <label className="admin-field">
            <span>نام مسئول تماس</span>
            <input
              value={form.contact_name}
              onChange={(e) => updateField('contact_name', e.target.value)}
              placeholder="مثال: آقای محمدی"
            />
          </label>

          <label className="admin-field">
            <span>شماره تماس</span>
            <input
              required
              value={form.phone}
              onChange={(e) => updateField('phone', e.target.value)}
              placeholder="0912xxxxxxx"
            />
          </label>

          <label className="admin-field">
            <span>شماره تماس دوم (اختیاری)</span>
            <input
              value={form.secondary_phone}
              onChange={(e) => updateField('secondary_phone', e.target.value)}
              placeholder="0912xxxxxxx"
            />
          </label>
        </div>

        <label className="admin-field">
          <span>توضیحات کامل</span>
          <textarea
            required
            rows={6}
            value={form.description}
            onChange={(e) => updateField('description', e.target.value)}
            placeholder="توضیح کامل آگهی، شرایط، متراژ، مجوزها و..."
          />
        </label>

        <div className="admin-field">
          <span>{isMine ? 'عکس‌های معدن' : 'تصاویر آگهی'}</span>
          <ImageUploader
            images={images}
            onUpload={handleUpload}
            onRemove={handleRemoveImage}
            uploading={uploading}
          />
        </div>

        {isMine && (
          <div className="admin-field">
            <span>عکس مدارک معدن (پروانه، سند و...)</span>
            <ImageUploader
              images={mineDocuments}
              onUpload={handleUploadDocs}
              onRemove={handleRemoveDoc}
              uploading={uploadingDocs}
            />
          </div>
        )}

        {!isSimple && (
          <div className="admin-field">
            <span>فایل آنالیز (PDF یا عکس - اختیاری)</span>
            <div className="analysis-uploader">
              <input
                type="file"
                accept="application/pdf,image/*"
                id="admin-analysis-file-input"
                onChange={handleAnalysisUpload}
                disabled={uploadingAnalysis}
              />
              <label htmlFor="admin-analysis-file-input" className="btn btn-outline btn-sm">
                {uploadingAnalysis ? 'در حال آپلود...' : analysisFile ? 'جایگزینی فایل آنالیز' : 'انتخاب فایل آنالیز'}
              </label>
              {analysisFile && (
                <span className="analysis-uploader__file">
                  📎 {analysisFile.name}
                  <button type="button" onClick={() => setAnalysisFile(null)} aria-label="حذف فایل آنالیز">×</button>
                </span>
              )}
            </div>
          </div>
        )}

        {!isSimple && (
          <>
            <h3 className="admin-section-title">قیمت و مدت انتشار</h3>
            <div className="ad-form__grid">
              <label className="admin-field">
                <span>
                  {isMine
                    ? 'قیمت پیشنهادی معدن (تومان)'
                    : isMachinery
                    ? 'قیمت دستگاه (تومان)'
                    : 'قیمت محصول به ازای هر تن (تومان)'}
                </span>
                <input
                  type="number"
                  value={form.base_price}
                  onChange={(e) => updateField('base_price', e.target.value)}
                  placeholder="مثال: 15000000"
                />
              </label>

              <label className="admin-field">
                <span>مدت زمان انتشار آگهی</span>
                <select
                  value={form.auction_duration_days}
                  onChange={(e) => updateField('auction_duration_days', e.target.value)}
                >
                  <option value="">انتخاب کنید</option>
                  <option value="15">۱۵ روزه</option>
                  <option value="30">۳۰ روزه</option>
                </select>
              </label>
            </div>

            <label className="admin-field">
              <span>{isMineral ? 'شرایط تحویل بار' : 'توضیحات شرایط معامله (اختیاری)'}</span>
              <input
                value={form.delivery_terms}
                onChange={(e) => updateField('delivery_terms', e.target.value)}
                placeholder={isMineral ? 'مثال: تحویل 100 تن ماهیانه' : 'مثال: امکان بازدید حضوری و...'}
              />
            </label>
          </>
        )}

        <div className="ad-form__actions">
          <button type="submit" className="btn btn-outline" disabled={saving}>
            {saving ? 'در حال ذخیره...' : 'ذخیره به‌صورت پیش‌نویس'}
          </button>
          <button
            type="button"
            className="btn btn-primary"
            disabled={saving}
            onClick={(e) => handleSubmit(e, true)}
          >
            {saving ? 'در حال انتشار...' : 'ذخیره و انتشار فوری'}
          </button>
        </div>
      </form>

      <Toast message={toast?.message} type={toast?.type} onClose={() => setToast(null)} />
    </div>
  )
}
