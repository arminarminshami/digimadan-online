import { useEffect, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { getMyProfile, upsertMyProfile, isIdentityComplete } from '../../services/profileService'
import { uploadProfileImage } from '../../services/storageService'
import { PROVINCES, CITIES_BY_PROVINCE, COMPANY_ACTIVITY_TYPES } from '../../lib/constants'
import { LoadingBlock } from '../../components/StatusBlocks'
import JalaliDateSelect from '../../components/JalaliDateSelect'
import './DashboardProfile.css'


const EMPTY_FORM = {
  first_name: '',
  last_name: '',
  national_id: '',
  birth_date: '',
  avatar_url: '',
  email: '',
  landline_phone: '',
  province: '',
  city: '',
  address: '',
  postal_code: '',
  job_title: '',
  activity_field: '',
  company_name: '',
  company_activity_type: '',
  company_national_id: '',
  company_registration_id: '',
  company_province: '',
  company_city: '',
  company_address: '',
  company_website: '',
}

export default function DashboardProfile({ user }) {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const needsIdentity = searchParams.get('needsIdentity') === '1'
  const [form, setForm] = useState(EMPTY_FORM)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [error, setError] = useState(null)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    let mounted = true
    getMyProfile(user.id)
      .then((data) => {
        if (!mounted || !data) return
        setForm((prev) => ({ ...prev, ...data }))
      })
      .catch((err) => mounted && setError('بارگذاری اطلاعات پروفایل با خطا مواجه شد.'))
      .finally(() => mounted && setLoading(false))
    return () => {
      mounted = false
    }
  }, [user])

  function updateField(key, value) {
    setSaved(false)
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function handleAvatarChange(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingAvatar(true)
    setError(null)
    try {
      const { url } = await uploadProfileImage(file)
      updateField('avatar_url', url)
    } catch {
      setError('آپلود تصویر پروفایل با خطا مواجه شد.')
    } finally {
      setUploadingAvatar(false)
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    setSaved(false)
    try {
      const { id, created_at, updated_at, auth_user_id, ...fields } = form
      const payload = { ...fields, phone: user.phone || form.phone }
      // اگر با همین ذخیره اطلاعات هویتی کامل شد، سرور خودش پیامک خوش‌آمدگویی
      // می‌فرستد (از طریق تریگر روی user_profiles)؛ اینجا فقط باید مقدار
      // درست profile_completed را ذخیره کنیم.
      payload.profile_completed = isIdentityComplete(payload)
      await upsertMyProfile(user.id, payload)
      setSaved(true)
      if (needsIdentity) {
        navigate('/')
      }
    } catch (err) {
      setError('ذخیره‌ی اطلاعات با خطا مواجه شد. لطفاً دوباره تلاش کنید.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <LoadingBlock label="در حال بارگذاری پروفایل..." />

  return (
    <form className="profile-form" onSubmit={handleSubmit}>
      {needsIdentity && (
        <div className="profile-form__notice">
          برای ثبت آگهی، ابتدا باید اطلاعات هویتی خود (فیلدهای ستاره‌دار) را تکمیل کنید.
        </div>
      )}

      <div className="profile-form__avatar-row">
        <div className="profile-form__avatar">
          {form.avatar_url ? (
            <img src={form.avatar_url} alt="تصویر پروفایل" />
          ) : (
            <span>بدون عکس</span>
          )}
        </div>
        <label className="btn btn-outline btn-sm profile-form__avatar-btn">
          {uploadingAvatar ? 'در حال آپلود...' : 'تغییر عکس پروفایل'}
          <input type="file" accept="image/*" hidden onChange={handleAvatarChange} disabled={uploadingAvatar} />
        </label>
      </div>

      <fieldset className="profile-form__section">
        <legend>اطلاعات هویتی</legend>
        <div className="profile-form__grid">
          <Field label="نام" required filled={!!form.first_name}>
            <input value={form.first_name} onChange={(e) => updateField('first_name', e.target.value)} />
          </Field>
          <Field label="نام خانوادگی" required filled={!!form.last_name}>
            <input value={form.last_name} onChange={(e) => updateField('last_name', e.target.value)} />
          </Field>
          <Field label="کد ملی" required filled={!!form.national_id}>
            <input value={form.national_id} onChange={(e) => updateField('national_id', e.target.value)} />
          </Field>
          <Field label="تاریخ تولد (اختیاری)">
            <JalaliDateSelect value={form.birth_date} onChange={(iso) => updateField('birth_date', iso)} />
          </Field>
        </div>
      </fieldset>

      <fieldset className="profile-form__section">
        <legend>اطلاعات تماس</legend>
        <div className="profile-form__grid">
          <Field label="شماره موبایل">
            <input value={user.phone || ''} disabled />
          </Field>
          <Field label="ایمیل">
            <input type="email" value={form.email} onChange={(e) => updateField('email', e.target.value)} />
          </Field>
          <Field label="تلفن ثابت (اختیاری)">
            <input value={form.landline_phone} onChange={(e) => updateField('landline_phone', e.target.value)} />
          </Field>
        </div>
      </fieldset>

      <fieldset className="profile-form__section">
        <legend>آدرس</legend>
        <div className="profile-form__grid">
          <Field label="استان">
            <select
              value={form.province}
              onChange={(e) => {
                setSaved(false)
                setForm((prev) => ({ ...prev, province: e.target.value, city: '' }))
              }}
            >
              <option value="">انتخاب کنید</option>
              {PROVINCES.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </Field>
          <Field label="شهر">
            <select
              value={form.city}
              onChange={(e) => updateField('city', e.target.value)}
              disabled={!form.province}
            >
              <option value="">{form.province ? 'انتخاب کنید' : 'ابتدا استان را انتخاب کنید'}</option>
              {form.city && !(CITIES_BY_PROVINCE[form.province] || []).includes(form.city) && (
                <option value={form.city}>{form.city}</option>
              )}
              {(CITIES_BY_PROVINCE[form.province] || []).map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </Field>
          <Field label="کد پستی">
            <input value={form.postal_code} onChange={(e) => updateField('postal_code', e.target.value)} />
          </Field>
          <Field label="آدرس" wide>
            <input value={form.address} onChange={(e) => updateField('address', e.target.value)} />
          </Field>
        </div>
      </fieldset>

      <fieldset className="profile-form__section">
        <legend>اطلاعات شغلی</legend>
        <div className="profile-form__grid">
          <Field label="سمت">
            <input value={form.job_title} onChange={(e) => updateField('job_title', e.target.value)} />
          </Field>
          <Field label="حوزه فعالیت">
            <input value={form.activity_field} onChange={(e) => updateField('activity_field', e.target.value)} />
          </Field>
        </div>

        <p className="profile-form__subheading">اطلاعات شرکت</p>
        <div className="profile-form__grid">
          <Field label="نام شرکت یا مجموعه">
            <input value={form.company_name} onChange={(e) => updateField('company_name', e.target.value)} />
          </Field>
          <Field label="نوع فعالیت">
            <select
              value={form.company_activity_type}
              onChange={(e) => updateField('company_activity_type', e.target.value)}
            >
              <option value="">انتخاب کنید</option>
              {COMPANY_ACTIVITY_TYPES.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </Field>
          <Field label="شناسه ملی (اختیاری)">
            <input value={form.company_national_id} onChange={(e) => updateField('company_national_id', e.target.value)} />
          </Field>
          <Field label="شماره ثبت (اختیاری)">
            <input value={form.company_registration_id} onChange={(e) => updateField('company_registration_id', e.target.value)} />
          </Field>
          <Field label="استان">
            <select value={form.company_province} onChange={(e) => updateField('company_province', e.target.value)}>
              <option value="">انتخاب کنید</option>
              {PROVINCES.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </Field>
          <Field label="شهر">
            <input value={form.company_city} onChange={(e) => updateField('company_city', e.target.value)} />
          </Field>
          <Field label="آدرس محل فعالیت" wide>
            <input value={form.company_address} onChange={(e) => updateField('company_address', e.target.value)} />
          </Field>
          <Field label="وب‌سایت (اختیاری)">
            <input value={form.company_website} onChange={(e) => updateField('company_website', e.target.value)} />
          </Field>
        </div>
      </fieldset>

      {error && <p className="profile-form__error">{error}</p>}
      {saved && <p className="profile-form__saved">اطلاعات با موفقیت ذخیره شد.</p>}

      <button type="submit" className="btn btn-primary" disabled={saving}>
        {saving ? 'در حال ذخیره...' : 'ذخیره اطلاعات'}
      </button>
    </form>
  )
}


function Field({ label, children, wide, required, filled }) {
  return (
    <label className={'profile-form__field' + (wide ? ' profile-form__field--wide' : '')}>
      <span>
        {label}
        {required && !filled && <span className="profile-form__required-star"> *</span>}
      </span>
      {children}
    </label>
  )
}
