import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../admin/AuthContext'
import { createAd, getAdById, updateAd } from '../services/adsService'
import { uploadMultipleAdImages, deleteAdImage, uploadAdAnalysisFile } from '../services/storageService'
import { awardPoints } from '../services/walletService'
import ImageUploader from '../admin/components/ImageUploader'
import SearchableSelect from '../components/SearchableSelect'
import {
  AD_CATEGORIES,
  PROVINCES,
  MINERAL_FORMS,
  MINERAL_GROUPS_SORTED,
  SIMPLE_AD_CATEGORIES,
  MINE_LICENSE_STATUS,
  MACHINE_GROUPS_SORTED,
  MACHINE_CONDITIONS,
} from '../lib/constants'
import { getMyProfile, isIdentityComplete } from '../services/profileService'
import { LoadingBlock } from '../components/StatusBlocks'
import ErrorModal from '../components/ErrorModal'
import './SubmitAd.css'

const EMPTY_FORM = {
  ad_type: 'sell',
  title: '',
  category: '',
  province: PROVINCES[0],
  description: '',
  contact_name: '',
  phone: '',
  secondary_phone: '',
  // دسته‌ی «مواد معدنی»
  mineral_type: '',
  mineral_form: '',
  purity_percent: '',
  ore_grade: '',
  humidity_percent: '',
  granularity: '',
  tonnage: '',
  // دسته‌ی «معادن»
  mine_name: '',
  mine_license_number: '',
  mine_license_status: '',
  mine_area_hectares: '',
  mine_reserve_tons: '',
  // دسته‌ی «ماشین‌آلات معدنی»
  machine_type: '',
  machine_brand: '',
  machine_model: '',
  machine_year: '',
  machine_condition: '',
  machine_working_hours: '',
  // مرحله‌ی قیمت (برای دسته‌های ساده اعمال نمی‌شود)
  base_price: '',
  auction_duration_days: '',
  delivery_terms: '',
}

// دسته‌های «ساده» (اکتشاف و استخراج / مشارکت و سرمایه‌گذاری) فقط عنوان،
// توضیحات و عکس می‌خواهند -- بدون فیلدهای اختصاصی و بدون مرحله‌ی قیمت.
function getStepSequence(category) {
  return SIMPLE_AD_CATEGORIES.includes(category) ? [1, 3] : [1, 2, 3]
}

function getStepLabel(category, stepNumber) {
  if (stepNumber === 1) return 'اطلاعات آگهی'
  if (stepNumber === 3) return 'تایید انتشار'
  return 'قیمت و مدت انتشار'
}

export default function SubmitAd() {
  const { user, isAuthenticated, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const editId = searchParams.get('edit')

  const [step, setStep] = useState(1)
  const [form, setForm] = useState(EMPTY_FORM)
  const [images, setImages] = useState([])
  const [uploading, setUploading] = useState(false)
  const [mineDocuments, setMineDocuments] = useState([])
  const [uploadingDocs, setUploadingDocs] = useState(false)
  const [analysisFile, setAnalysisFile] = useState(null) // { url, path, name }
  const [uploadingAnalysis, setUploadingAnalysis] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [stepError, setStepError] = useState(null)
  const [submitted, setSubmitted] = useState(false)
  const [loadingAd, setLoadingAd] = useState(!!editId)
  const [checkingIdentity, setCheckingIdentity] = useState(true)
  const [rejectionReason, setRejectionReason] = useState(null)

  const isMineral = form.category === 'mineral_materials'
  const isMine = form.category === 'mines'
  const isMachinery = form.category === 'mining_machinery'
  const isSimple = SIMPLE_AD_CATEGORIES.includes(form.category)

  // پیش از اجازه‌ی ثبت آگهی: کاربر باید لاگین باشد و اطلاعات هویتی‌اش کامل باشد
  useEffect(() => {
    if (authLoading) return
    if (!isAuthenticated) {
      navigate('/login', { state: { redirectTo: '/submit-ad' } })
      return
    }
    let mounted = true
    getMyProfile(user.id)
      .then((profile) => {
        if (!mounted) return
        if (!isIdentityComplete(profile)) {
          navigate('/dashboard?tab=profile&needsIdentity=1', { replace: true })
          return
        }
        setCheckingIdentity(false)
      })
      .catch(() => mounted && setCheckingIdentity(false))
    return () => {
      mounted = false
    }
  }, [authLoading, isAuthenticated, user, navigate])

  // شماره تماس اول همیشه همان شماره‌ی حساب کاربری است (فقط برای آگهی جدید،
  // نه در حالت ویرایش که شماره از خودِ آگهی خوانده می‌شود)
  useEffect(() => {
    if (!editId && user?.phone) {
      setForm((prev) => ({ ...prev, phone: user.phone }))
    }
  }, [editId, user])

  useEffect(() => {
    if (!editId || !user) return
    let mounted = true
    getAdById(editId)
      .then((ad) => {
        if (!mounted) return
        if (ad.owner_user_id !== user.id) {
          setError('شما اجازه‌ی ویرایش این آگهی را ندارید.')
          return
        }
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
        })
        setImages((ad.images || []).map((url) => ({ url })))
        setMineDocuments((ad.mine_documents || []).map((url) => ({ url })))
        if (ad.analysis_file_url) {
          setAnalysisFile({ url: ad.analysis_file_url, name: 'فایل آنالیز ثبت‌شده' })
        }
        if (ad.status === 'rejected' && ad.rejection_reason) {
          setRejectionReason(ad.rejection_reason)
        }
      })
      .catch(() => mounted && setError('آگهی مورد نظر پیدا نشد.'))
      .finally(() => mounted && setLoadingAd(false))
    return () => {
      mounted = false
    }
  }, [editId, user])

  function updateField(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function handleUpload(fileList) {
    setUploading(true)
    try {
      const uploaded = await uploadMultipleAdImages(fileList)
      setImages((prev) => [...prev, ...uploaded].slice(0, 5))
    } catch {
      setError('آپلود تصویر با خطا مواجه شد.')
    } finally {
      setUploading(false)
    }
  }

  async function handleRemoveImage(index) {
    const img = images[index]
    setImages((prev) => prev.filter((_, i) => i !== index))
    if (img.path) deleteAdImage(img.path).catch(() => {})
  }

  async function handleUploadDocs(fileList) {
    setUploadingDocs(true)
    try {
      const uploaded = await uploadMultipleAdImages(fileList)
      setMineDocuments((prev) => [...prev, ...uploaded].slice(0, 5))
    } catch {
      setError('آپلود عکس مدارک با خطا مواجه شد.')
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
    setError(null)
    try {
      const uploaded = await uploadAdAnalysisFile(file)
      setAnalysisFile({ ...uploaded, name: file.name })
    } catch {
      setError('آپلود فایل آنالیز با خطا مواجه شد.')
    } finally {
      setUploadingAnalysis(false)
      e.target.value = ''
    }
  }

  function handleRemoveAnalysisFile() {
    setAnalysisFile(null)
  }

  function goToStep(targetStep) {
    setStepError(null)
    setStep(targetStep)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function goNext() {
    const seq = getStepSequence(form.category)
    const idx = seq.indexOf(step)
    if (idx < seq.length - 1) goToStep(seq[idx + 1])
  }

  function goBack() {
    const seq = getStepSequence(form.category)
    const idx = seq.indexOf(step)
    if (idx > 0) goToStep(seq[idx - 1])
  }

  function handleNextFromStep1() {
    if (!form.category) {
      setStepError('لطفاً ابتدا دسته‌بندی آگهی را انتخاب کنید.')
      return
    }
    if (!form.title.trim() || !form.phone.trim() || !form.description.trim()) {
      setStepError('لطفاً عنوان آگهی، شماره تماس و توضیحات کامل را وارد کنید.')
      return
    }
    if (isMine && (!form.mine_name.trim() || !form.mine_license_status)) {
      setStepError('لطفاً نام معدن و وضعیت پروانه را مشخص کنید.')
      return
    }
    if (isMachinery && !form.machine_type) {
      setStepError('لطفاً نوع ماشین‌آلات را انتخاب کنید.')
      return
    }
    goNext()
  }

  function handleNextFromStep2() {
    if (!form.base_price || !form.auction_duration_days) {
      setStepError('لطفاً قیمت و مدت انتشار آگهی را مشخص کنید.')
      return
    }
    goNext()
  }

  async function handleFinalSubmit() {
    setError(null)
    setSaving(true)
    try {
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
        images: images.map((img) => img.url),
        mine_documents: mineDocuments.map((img) => img.url),
        analysis_file_url: analysisFile?.url || null,
      }

      if (editId) {
        // ویرایش آگهی موجود؛ بعد از تغییر دوباره برای بررسی ادمین ارسال می‌شود
        await updateAd(editId, { ...payload, status: 'pending', rejection_reason: null })
      } else {
        await createAd({
          ...payload,
          status: 'pending',
          owner_user_id: user.id,
        })
        await awardPoints(user.id, 'ad_registration').catch(() => {})
      }
      setSubmitted(true)
    } catch (err) {
      setError('ثبت آگهی با خطا مواجه شد. لطفاً دوباره تلاش کنید.')
    } finally {
      setSaving(false)
    }
  }

  if (authLoading || loadingAd || checkingIdentity) return <LoadingBlock label="در حال بارگذاری..." />

  if (submitted) {
    return (
      <div className="container submit-ad-page">
        <div className="submit-ad__gate">
          <h1>{editId ? 'آگهی شما به‌روزرسانی شد ✓' : 'آگهی شما ثبت شد ✓'}</h1>
          <p>
            آگهی شما برای بررسی نزد تیم دیجی‌معدن ارسال شد. پس از تایید ادمین، به‌صورت
            خودکار روی سایت منتشر می‌شود و در صفحه‌ی آگهی‌ها نمایش داده خواهد شد.
          </p>
          <button className="btn btn-primary" onClick={() => navigate('/dashboard/ads')}>
            بازگشت به آگهی‌های من
          </button>
        </div>
      </div>
    )
  }

  const stepSequence = getStepSequence(form.category)

  return (
    <div className="container submit-ad-page">
      <h1 className="section-title">{editId ? 'ویرایش آگهی' : 'ثبت آگهی جدید'}</h1>
      <p className="submit-ad__subtitle">
        پس از تایید ادمین، آگهی شما روی سایت منتشر می‌شود.
      </p>

      <ol className="ad-stepper">
        {stepSequence.map((s, i) => (
          <li
            key={s}
            className={
              'ad-stepper__step' +
              (step === s ? ' ad-stepper__step--active' : '') +
              (stepSequence.indexOf(step) > i ? ' ad-stepper__step--done' : '')
            }
          >
            <span className="ad-stepper__circle">{stepSequence.indexOf(step) > i ? '✓' : i + 1}</span>
            <span className="ad-stepper__label">{getStepLabel(form.category, s)}</span>
          </li>
        ))}
      </ol>

      {/* خطاها به‌صورت پنجره‌ی وسط صفحه نمایش داده می‌شوند */}
      <ErrorModal message={error} onClose={() => setError(null)} />
      <ErrorModal message={stepError} onClose={() => setStepError(null)} />

      {/* ---------------- مرحله ۱: اطلاعات آگهی ---------------- */}
      {step === 1 && (
        <div className="submit-ad-form">
          {/*
            گام اول: انتخاب دسته‌بندی. تا وقتی کاربر دسته‌بندی را انتخاب
            نکند بقیه‌ی فرم نمایش داده نمی‌شود، چون فیلدهای هر دسته کاملا
            با هم فرق دارند و نشان‌دادن همه‌شان با هم گیج‌کننده است.
          */}
          <label className="admin-field category-picker">
            <span>دسته‌بندی آگهی را انتخاب کنید</span>
            <select value={form.category} onChange={(e) => updateField('category', e.target.value)}>
              <option value="">— انتخاب کنید —</option>
              {AD_CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </label>

          {!form.category && (
            <p className="submit-ad__subtitle category-picker__hint">
              پس از انتخاب دسته‌بندی، فیلدهای مربوط به همان دسته نمایش داده می‌شود.
            </p>
          )}

          {form.category && (
          <>
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

          <div className="submit-ad-form__grid">
            <label className="admin-field">
              <span>عنوان آگهی</span>
              <input
                required
                value={form.title}
                onChange={(e) => updateField('title', e.target.value)}
                placeholder="مثال: فروش خاک معدنی طلا در خراسان"
              />
            </label>

            <label className="admin-field">
              <span>استان</span>
              <select value={form.province} onChange={(e) => updateField('province', e.target.value)}>
                {PROVINCES.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </label>

            {/* ---- فیلدهای اختصاصی «مواد معدنی» ---- */}
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
                  <span>{form.ad_type === 'buy' ? 'تناژ مورد نیاز' : 'تناژ بار موجود (دپو)'}</span>
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

            {/* ---- فیلدهای اختصاصی «معادن» ---- */}
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
                    required
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

            {/* ---- فیلدهای اختصاصی «ماشین‌آلات معدنی» ---- */}
            {isMachinery && (
              <>
                <label className="admin-field">
                  <span>نوع ماشین‌آلات</span>
                  <select
                    required
                    value={form.machine_type}
                    onChange={(e) => updateField('machine_type', e.target.value)}
                  >
                    <option value="">انتخاب کنید</option>
                    {MACHINE_GROUPS_SORTED.map((g) => (
                      <optgroup key={g.group} label={g.label}>
                        {g.items.map((mt) => (
                          <option key={mt} value={mt}>{mt}</option>
                        ))}
                      </optgroup>
                    ))}
                    <option value="سایر">سایر</option>
                  </select>
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
                  <input
                    value={form.machine_model}
                    onChange={(e) => updateField('machine_model', e.target.value)}
                  />
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
              <span>نام شما</span>
              <input
                value={form.contact_name}
                onChange={(e) => updateField('contact_name', e.target.value)}
                placeholder="مثال: آقای محمدی"
              />
            </label>

            <label className="admin-field">
              <span>شماره تماس (شماره حساب کاربری شما)</span>
              <input value={form.phone} readOnly disabled />
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
              placeholder="توضیح کامل، شرایط، متراژ، مجوزها و..."
            />
          </label>

          <div className="admin-field">
            <span>{isMine ? 'عکس‌های معدن (حداکثر ۵ عکس)' : 'تصاویر (حداکثر ۵ عکس)'}</span>
            <ImageUploader images={images} onUpload={handleUpload} onRemove={handleRemoveImage} uploading={uploading} />
          </div>

          {isMine && (
            <div className="admin-field">
              <span>عکس مدارک معدن (پروانه، سند و... — حداکثر ۵ عکس)</span>
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
                  id="analysis-file-input"
                  onChange={handleAnalysisUpload}
                  disabled={uploadingAnalysis}
                />
                <label htmlFor="analysis-file-input" className="btn btn-outline btn-sm">
                  {uploadingAnalysis ? 'در حال آپلود...' : analysisFile ? 'جایگزینی فایل آنالیز' : 'انتخاب فایل آنالیز'}
                </label>
                {analysisFile && (
                  <span className="analysis-uploader__file">
                    📎 {analysisFile.name}
                    <button type="button" onClick={handleRemoveAnalysisFile} aria-label="حذف فایل آنالیز">×</button>
                  </span>
                )}
              </div>
            </div>
          )}

          </>
          )}

          <div className="ad-step-actions">
            <button type="button" className="btn btn-primary" onClick={handleNextFromStep1}>
              مرحله بعد ←
            </button>
          </div>
        </div>
      )}

      {/* ---------------- مرحله ۲: قیمت و مدت انتشار (فقط دسته‌های غیر ساده) ---------------- */}
      {step === 2 && !isSimple && (
        <div className="submit-ad-form">
          <div className="submit-ad-form__grid">
            <label className="admin-field">
              <span>
                {isMine
                  ? 'قیمت پیشنهادی معدن (تومان)'
                  : isMachinery
                  ? 'قیمت دستگاه (تومان)'
                  : form.ad_type === 'buy'
                  ? 'قیمت پیشنهادی خرید به ازای هر تن (تومان)'
                  : 'قیمت محصول به ازای هر تن (تومان)'}
              </span>
              <input
                required
                type="number"
                value={form.base_price}
                onChange={(e) => updateField('base_price', e.target.value)}
                placeholder="مثال: 15000000"
              />
            </label>

            <label className="admin-field">
              <span>مدت زمان انتشار آگهی</span>
              <select
                required
                value={form.auction_duration_days}
                onChange={(e) => updateField('auction_duration_days', e.target.value)}
              >
                <option value="">انتخاب کنید</option>
                <option value="15">۱۵ روزه</option>
                <option value="30">۳۰ روزه</option>
              </select>
            </label>
          </div>

          {isMineral && (
            <label className="admin-field">
              <span>{form.ad_type === 'buy' ? 'شرایط دریافت بار' : 'شرایط تحویل بار'}</span>
              <input
                value={form.delivery_terms}
                onChange={(e) => updateField('delivery_terms', e.target.value)}
                placeholder={form.ad_type === 'buy' ? 'مثال: دریافت 100 تن ماهیانه' : 'مثال: تحویل 100 تن ماهیانه'}
              />
            </label>
          )}

          {(isMine || isMachinery) && (
            <label className="admin-field">
              <span>توضیحات شرایط معامله (اختیاری)</span>
              <input
                value={form.delivery_terms}
                onChange={(e) => updateField('delivery_terms', e.target.value)}
                placeholder="مثال: امکان بازدید حضوری، شرایط پرداخت و..."
              />
            </label>
          )}

          <div className="ad-step-actions ad-step-actions--split">
            <button type="button" className="btn btn-outline" onClick={goBack}>
              → بازگشت
            </button>
            <button type="button" className="btn btn-primary" onClick={handleNextFromStep2}>
              مرحله بعد ←
            </button>
          </div>
        </div>
      )}

      {/* ---------------- مرحله‌ی آخر: تایید جهت انتشار آگهی ---------------- */}
      {step === 3 && (
        <div className="submit-ad-form">
          {rejectionReason && (
            <div className="rejection-banner">
              <strong>این آگهی قبلاً توسط ادمین رد شده بود.</strong>
              <p>دلیل رد آگهی: {rejectionReason}</p>
              <span>پس از ارسال دوباره، آگهی از نو برای بررسی ادمین ارسال می‌شود.</span>
            </div>
          )}

          <div className="review-summary">
            <h3>خلاصه‌ی آگهی</h3>
            <dl>
              <div><dt>نوع آگهی</dt><dd>{form.ad_type === 'buy' ? 'آگهی خرید' : 'آگهی فروش'}</dd></div>
              <div><dt>دسته‌بندی</dt><dd>{AD_CATEGORIES.find((c) => c.value === form.category)?.label || '—'}</dd></div>
              <div><dt>عنوان</dt><dd>{form.title || '—'}</dd></div>
              <div><dt>استان</dt><dd>{form.province || '—'}</dd></div>

              {isMineral && (
                <>
                  <div><dt>نوع ماده معدنی</dt><dd>{form.mineral_type || '—'}</dd></div>
                  <div><dt>{form.ad_type === 'buy' ? 'تناژ مورد نیاز' : 'تناژ بار موجود'}</dt><dd>{form.tonnage ? `${form.tonnage} تن` : '—'}</dd></div>
                </>
              )}

              {isMine && (
                <>
                  <div><dt>نام معدن</dt><dd>{form.mine_name || '—'}</dd></div>
                  <div><dt>وضعیت پروانه</dt><dd>{MINE_LICENSE_STATUS.find((s) => s.value === form.mine_license_status)?.label || '—'}</dd></div>
                  <div><dt>ماده معدنی اصلی</dt><dd>{form.mineral_type || '—'}</dd></div>
                </>
              )}

              {isMachinery && (
                <>
                  <div><dt>نوع ماشین‌آلات</dt><dd>{form.machine_type || '—'}</dd></div>
                  <div><dt>وضعیت</dt><dd>{MACHINE_CONDITIONS.find((c) => c.value === form.machine_condition)?.label || '—'}</dd></div>
                </>
              )}

              {!isSimple && (
                <div><dt>قیمت</dt><dd>{form.base_price ? `${Number(form.base_price).toLocaleString('fa-IR')} تومان` : '—'}</dd></div>
              )}
              {!isSimple && (
                <div><dt>مدت انتشار آگهی</dt><dd>{form.auction_duration_days ? `${form.auction_duration_days} روزه` : '—'}</dd></div>
              )}

              <div><dt>شماره تماس</dt><dd>{form.phone || '—'}</dd></div>
              <div><dt>شماره تماس دوم</dt><dd>{form.secondary_phone || '—'}</dd></div>
              {isMine && <div><dt>عکس مدارک معدن</dt><dd>{mineDocuments.length} عکس پیوست شده</dd></div>}
            </dl>
          </div>

          <p className="submit-ad__subtitle">
            با تایید و ارسال، آگهی شما برای بررسی نزد تیم دیجی‌معدن ارسال می‌شود.
          </p>

          <div className="ad-step-actions ad-step-actions--split">
            <button type="button" className="btn btn-outline" onClick={goBack}>
              → بازگشت
            </button>
            <button type="button" className="btn btn-primary" disabled={saving} onClick={handleFinalSubmit}>
              {saving ? 'در حال ارسال...' : editId ? 'ذخیره و ارسال مجدد' : 'تایید و ارسال آگهی برای بررسی'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
