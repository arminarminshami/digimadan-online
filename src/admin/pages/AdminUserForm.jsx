import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { getUser, createUser, updateUserProfile } from '../../services/adminUsersService'
import { AdminPageHead, Toast } from '../components/AdminUI'
import { LoadingBlock, ErrorBlock } from '../../components/StatusBlocks'
import { PROVINCES, CITIES_BY_PROVINCE, USER_SPECIALTIES, COMPANY_ACTIVITY_TYPES } from '../../lib/constants'
import JalaliDateSelect from '../../components/JalaliDateSelect'
import './AdminAdForm.css'

const EMPTY_FORM = {
  phone: '',
  first_name: '',
  last_name: '',
  national_id: '',
  email: '',
  birth_date: '',
  province: '',
  city: '',
  address: '',
  postal_code: '',
  specialty: '',
  job_title: '',
  company_name: '',
  company_national_id: '',
  company_activity_type: '',
  company_province: '',
  company_city: '',
  company_address: '',
  description: '',
}

export default function AdminUserForm() {
  const { id } = useParams()
  const isEdit = Boolean(id)
  const navigate = useNavigate()

  const [form, setForm] = useState(EMPTY_FORM)
  const [loading, setLoading] = useState(isEdit)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [toast, setToast] = useState(null)

  useEffect(() => {
    if (!isEdit) return
    getUser(id)
      .then(({ user }) => {
        const p = user.profile || {}
        setForm({
          phone: user.phone ? user.phone.replace(/^\+?98/, '0') : '',
          first_name: p.first_name || '',
          last_name: p.last_name || '',
          national_id: p.national_id || '',
          email: p.email || user.email || '',
          birth_date: p.birth_date || '',
          province: p.province || '',
          city: p.city || '',
          address: p.address || '',
          postal_code: p.postal_code || '',
          specialty: p.specialty || '',
          job_title: p.job_title || '',
          company_name: p.company_name || '',
          company_national_id: p.company_national_id || '',
          company_activity_type: p.company_activity_type || '',
          company_province: p.company_province || '',
          company_city: p.company_city || '',
          company_address: p.company_address || '',
          description: p.description || '',
        })
      })
      .catch((err) => setError(err.message || 'دریافت اطلاعات کاربر با خطا مواجه شد.'))
      .finally(() => setLoading(false))
  }, [id, isEdit])

  function updateField(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setError(null)

    const profile = {
      first_name: form.first_name || null,
      last_name: form.last_name || null,
      full_name: [form.first_name, form.last_name].filter(Boolean).join(' ') || null,
      national_id: form.national_id || null,
      email: form.email || null,
      birth_date: form.birth_date || null,
      province: form.province || null,
      city: form.city || null,
      address: form.address || null,
      postal_code: form.postal_code || null,
      specialty: form.specialty || null,
      job_title: form.job_title || null,
      company_name: form.company_name || null,
      company_national_id: form.company_national_id || null,
      company_activity_type: form.company_activity_type || null,
      company_province: form.company_province || null,
      company_city: form.company_city || null,
      company_address: form.company_address || null,
      description: form.description || null,
    }

    try {
      if (isEdit) {
        await updateUserProfile(id, profile, form.phone)
      } else {
        await createUser({ phone: form.phone, ...profile })
      }
      navigate('/admin/users')
    } catch (err) {
      setError(err.message || 'ذخیره‌سازی با خطا مواجه شد.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <LoadingBlock label="در حال بارگذاری اطلاعات کاربر..." />

  return (
    <div>
      <AdminPageHead
        title={isEdit ? 'ویرایش کاربر' : 'افزودن کاربر جدید'}
        description="فیلدهای زیر را تکمیل کنید و سپس ذخیره کنید."
        action={
          <Link to="/admin/users" className="btn btn-outline btn-sm">
            ← بازگشت به فهرست
          </Link>
        }
      />

      {error && <ErrorBlock message={error} />}

      <form className="ad-form" onSubmit={handleSubmit}>
        <div className="ad-form__grid">
          <label className="admin-field">
            <span>شماره موبایل</span>
            <input
              required
              value={form.phone}
              onChange={(e) => updateField('phone', e.target.value)}
              placeholder="0912xxxxxxx"
            />
          </label>

          <label className="admin-field">
            <span>نام</span>
            <input value={form.first_name} onChange={(e) => updateField('first_name', e.target.value)} />
          </label>

          <label className="admin-field">
            <span>نام خانوادگی</span>
            <input value={form.last_name} onChange={(e) => updateField('last_name', e.target.value)} />
          </label>

          <label className="admin-field">
            <span>کد ملی</span>
            <input value={form.national_id} onChange={(e) => updateField('national_id', e.target.value)} />
          </label>

          <label className="admin-field">
            <span>ایمیل</span>
            <input type="email" value={form.email} onChange={(e) => updateField('email', e.target.value)} />
          </label>

          <label className="admin-field">
            <span>تاریخ تولد</span>
            <JalaliDateSelect value={form.birth_date} onChange={(v) => updateField('birth_date', v)} />
          </label>

          <label className="admin-field">
            <span>استان</span>
            <select
              value={form.province}
              onChange={(e) => setForm((prev) => ({ ...prev, province: e.target.value, city: '' }))}
            >
              <option value="">انتخاب کنید</option>
              {PROVINCES.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </label>

          <label className="admin-field">
            <span>شهر</span>
            <select value={form.city} onChange={(e) => updateField('city', e.target.value)} disabled={!form.province}>
              <option value="">{form.province ? 'انتخاب کنید' : 'ابتدا استان را انتخاب کنید'}</option>
              {(CITIES_BY_PROVINCE[form.province] || []).map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </label>

          <label className="admin-field">
            <span>کد پستی</span>
            <input value={form.postal_code} onChange={(e) => updateField('postal_code', e.target.value)} />
          </label>

          <label className="admin-field">
            <span>تخصص</span>
            <select value={form.specialty} onChange={(e) => updateField('specialty', e.target.value)}>
              <option value="">انتخاب نکنید</option>
              {USER_SPECIALTIES.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </label>

          <label className="admin-field">
            <span>سمت شغلی</span>
            <input value={form.job_title} onChange={(e) => updateField('job_title', e.target.value)} />
          </label>
        </div>

        <label className="admin-field">
          <span>آدرس</span>
          <input value={form.address} onChange={(e) => updateField('address', e.target.value)} />
        </label>

        <h3 className="admin-section-title">اطلاعات شرکت (اختیاری)</h3>
        <div className="ad-form__grid">
          <label className="admin-field">
            <span>نام شرکت</span>
            <input value={form.company_name} onChange={(e) => updateField('company_name', e.target.value)} />
          </label>

          <label className="admin-field">
            <span>شناسه ملی شرکت</span>
            <input
              value={form.company_national_id}
              onChange={(e) => updateField('company_national_id', e.target.value)}
            />
          </label>

          <label className="admin-field">
            <span>نوع فعالیت</span>
            <select
              value={form.company_activity_type}
              onChange={(e) => updateField('company_activity_type', e.target.value)}
            >
              <option value="">انتخاب نکنید</option>
              {COMPANY_ACTIVITY_TYPES.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </label>

          <label className="admin-field">
            <span>استان شرکت</span>
            <select
              value={form.company_province}
              onChange={(e) => setForm((prev) => ({ ...prev, company_province: e.target.value, company_city: '' }))}
            >
              <option value="">انتخاب کنید</option>
              {PROVINCES.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </label>

          <label className="admin-field">
            <span>شهر شرکت</span>
            <select
              value={form.company_city}
              onChange={(e) => updateField('company_city', e.target.value)}
              disabled={!form.company_province}
            >
              <option value="">{form.company_province ? 'انتخاب کنید' : 'ابتدا استان را انتخاب کنید'}</option>
              {(CITIES_BY_PROVINCE[form.company_province] || []).map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </label>
        </div>

        <label className="admin-field">
          <span>آدرس شرکت</span>
          <input value={form.company_address} onChange={(e) => updateField('company_address', e.target.value)} />
        </label>

        <label className="admin-field">
          <span>توضیحات (اختیاری)</span>
          <textarea
            rows={4}
            value={form.description}
            onChange={(e) => updateField('description', e.target.value)}
          />
        </label>

        <div className="ad-form__actions">
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'در حال ذخیره...' : isEdit ? 'ذخیره تغییرات' : 'افزودن کاربر'}
          </button>
        </div>
      </form>

      <Toast message={toast?.message} type={toast?.type} onClose={() => setToast(null)} />
    </div>
  )
}
