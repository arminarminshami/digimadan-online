import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { AdminPageHead, AdminCard, Toast } from '../components/AdminUI'
import { LoadingBlock, ErrorBlock } from '../../components/StatusBlocks'

export default function AdminSmsPatterns() {
  const [patterns, setPatterns] = useState([])
  const [config, setConfig] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [toast, setToast] = useState(null)

  async function load() {
    setLoading(true)
    try {
      const [{ data: pats }, { data: cfg }] = await Promise.all([
        supabase.from('sms_patterns').select('*').order('event_type'),
        supabase.from('sms_config').select('panel_username, panel_password').limit(1).maybeSingle(),
      ])
      setPatterns(pats || [])
      setConfig(cfg || {})
    } catch {
      setError('بارگذاری الگوها با خطا مواجه شد.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  function updateRow(eventType, field, value) {
    setPatterns((prev) => prev.map((p) => (p.event_type === eventType ? { ...p, [field]: value } : p)))
  }

  async function handleSave() {
    setSaving(true)
    try {
      for (const p of patterns) {
        await supabase
          .from('sms_patterns')
          .update({
            body_id: p.body_id?.trim() || null,
            is_active: p.is_active,
            updated_at: new Date().toISOString(),
          })
          .eq('event_type', p.event_type)
      }
      setToast({ type: 'success', message: 'الگوها ذخیره شد.' })
    } catch {
      setToast({ type: 'error', message: 'ذخیره‌سازی با خطا مواجه شد.' })
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <LoadingBlock label="در حال بارگذاری..." />

  const credsReady = Boolean(config?.panel_username && config?.panel_password)

  return (
    <div>
      <AdminPageHead
        title="الگوهای خط خدماتی"
        description="پیامک‌های سیستمی را از خط خدماتی بفرستید تا محدودیت ساعت و لیست سیاه تبلیغاتی نداشته باشند."
        action={
          <button className="btn btn-primary btn-sm" disabled={saving} onClick={handleSave}>
            {saving ? 'در حال ذخیره...' : 'ذخیره‌ی الگوها'}
          </button>
        }
      />

      {error && <ErrorBlock message={error} />}

      {!credsReady && (
        <AdminCard className="admin-settings__section" style={{ marginBottom: 18 }}>
          <p style={{ margin: 0, color: 'var(--color-danger)', fontWeight: 700 }}>
            ابتدا «نام کاربری» و «رمز پنل ملی‌پیامک» را در صفحه‌ی تنظیمات سرویس‌ها وارد کنید،
            وگرنه ارسال با الگو فعال نمی‌شود.
          </p>
        </AdminCard>
      )}

      <AdminCard className="admin-settings__section">
        <h2 className="admin-section-title">شناسه‌ی الگو (bodyId) هر پیام</h2>
        <p className="bulk-sms__meta" style={{ marginBottom: 14 }}>
          هر الگو را در پنل ملی‌پیامک (بخش وب‌سرویس خدماتی) بسازید، منتظر تایید بمانید،
          سپس شناسه‌ی آن را اینجا وارد کنید. هر ردیفی که شناسه نداشته باشد، خودکار از خط
          عادی ارسال می‌شود.
        </p>

        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr><th>رویداد</th><th>متغیرها (به ترتیب)</th><th>شناسه الگو</th><th>فعال</th></tr>
            </thead>
            <tbody>
              {patterns.map((p) => (
                <tr key={p.event_type}>
                  <td className="admin-table__title" data-label="رویداد">{p.label_fa}</td>
                  <td data-label="متغیرها">
                    <span className="bulk-sms__meta">{p.variables_hint}</span>
                  </td>
                  <td data-label="شناسه الگو">
                    <input
                      className="admin-inline-form"
                      value={p.body_id || ''}
                      onChange={(e) => updateRow(p.event_type, 'body_id', e.target.value)}
                      placeholder="مثلا 12345"
                    />
                  </td>
                  <td data-label="فعال">
                    <input
                      type="checkbox"
                      checked={p.is_active}
                      onChange={(e) => updateRow(p.event_type, 'is_active', e.target.checked)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </AdminCard>

      <Toast message={toast?.message} type={toast?.type} onClose={() => setToast(null)} />
    </div>
  )
}
