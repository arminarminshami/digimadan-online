import { useEffect, useState } from 'react'
import { getSmsConfig, updateSmsConfig, getSmsLog, getSmsReport } from '../../services/smsService'
import { getPriceProviderConfig, updatePriceProviderConfig, getAllPrices, manuallyUpdatePrice } from '../../services/priceService'
import { getAiConfig, updateAiConfig } from '../../services/aiService'
import { AdminPageHead, AdminCard, Toast } from '../components/AdminUI'
import { LoadingBlock } from '../../components/StatusBlocks'
import './AdminSettings.css'

function ConfigSection({ title, description, children }) {
  return (
    <AdminCard className="admin-settings__section">
      <h2 className="admin-section-title">{title}</h2>
      {description && <p className="admin-settings__desc">{description}</p>}
      {children}
    </AdminCard>
  )
}

export default function AdminSettings() {
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState(null)
  const [saving, setSaving] = useState(false)

  const [sms, setSms] = useState(null)
  const [smsLog, setSmsLog] = useState([])
  const [smsReports, setSmsReports] = useState({}) // { credit: {...}, messages: {...}, 'inbox-count': {...}, status: {...} }
  const [checkingReport, setCheckingReport] = useState(null)
  const [messagesQuery, setMessagesQuery] = useState({ type: 'out', number: '', count: 20 })
  const [statusRecIds, setStatusRecIds] = useState('')
  const [priceConfig, setPriceConfig] = useState(null)
  const [prices, setPrices] = useState([])
  const [aiConfig, setAiConfig] = useState(null)
  const [iranianEdits, setIranianEdits] = useState({})

  async function loadAll() {
    setLoading(true)
    try {
      const [smsData, logData, priceConfigData, pricesData, aiData] = await Promise.all([
        getSmsConfig(),
        getSmsLog({ limit: 10 }),
        getPriceProviderConfig(),
        getAllPrices(),
        getAiConfig(),
      ])
      setSms(smsData)
      setSmsLog(logData)
      setPriceConfig(priceConfigData)
      setPrices(pricesData)
      setAiConfig(aiData)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAll()
  }, [])

  async function handleSaveSms(e) {
    e.preventDefault()
    setSaving(true)
    try {
      const updated = await updateSmsConfig({
        provider_name: sms.provider_name,
        api_key: sms.api_key,
        sender_number: sms.sender_number,
        admin_notify_phone: sms.admin_notify_phone,
        panel_username: sms.panel_username,
        panel_password: sms.panel_password,
        is_enabled: sms.is_enabled,
      })
      setSms(updated)
      setToast({ type: 'success', message: 'تنظیمات پیامک ذخیره شد.' })
    } catch {
      setToast({ type: 'error', message: 'ذخیره با خطا مواجه شد.' })
    } finally {
      setSaving(false)
    }
  }

  const SMS_REPORT_TABS = [
    { key: 'credit', label: 'میزان اعتبار' },
    { key: 'inbox-count', label: 'تعداد پیامک‌های دریافتی' },
  ]

  async function handleFetchReport(action, body) {
    setCheckingReport(action)
    try {
      const result = await getSmsReport(action, body)
      setSmsReports((prev) => ({ ...prev, [action]: result }))
    } catch (err) {
      setToast({ type: 'error', message: err.message })
    } finally {
      setCheckingReport(null)
    }
  }

  function handleFetchMessages() {
    handleFetchReport('messages', {
      type: messagesQuery.type,
      number: messagesQuery.number,
      index: 0,
      count: Number(messagesQuery.count) || 20,
    })
  }

  function handleFetchStatus() {
    const recIds = statusRecIds
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
      .map(Number)
    if (recIds.length === 0) {
      setToast({ type: 'error', message: 'حداقل یک شناسه‌ی پیامک (recId) وارد کنید.' })
      return
    }
    handleFetchReport('status', { recIds })
  }

  async function handleSavePriceConfig(e) {
    e.preventDefault()
    setSaving(true)
    try {
      const updated = await updatePriceProviderConfig({
        provider_name: priceConfig.provider_name,
        api_key: priceConfig.api_key,
        refresh_interval_minutes: Number(priceConfig.refresh_interval_minutes) || 5,
        is_enabled: priceConfig.is_enabled,
      })
      setPriceConfig(updated)
      setToast({ type: 'success', message: 'تنظیمات قیمت ذخیره شد.' })
    } catch {
      setToast({ type: 'error', message: 'ذخیره با خطا مواجه شد.' })
    } finally {
      setSaving(false)
    }
  }

  async function handleSaveAi(e) {
    e.preventDefault()
    setSaving(true)
    try {
      const updated = await updateAiConfig({
        provider_name: aiConfig.provider_name,
        api_key: aiConfig.api_key,
        model_name: aiConfig.model_name,
        is_enabled: aiConfig.is_enabled,
      })
      setAiConfig(updated)
      setToast({ type: 'success', message: 'تنظیمات هوش‌مصنوعی ذخیره شد.' })
    } catch {
      setToast({ type: 'error', message: 'ذخیره با خطا مواجه شد.' })
    } finally {
      setSaving(false)
    }
  }

  async function handleManualPriceUpdate(item) {
    const newValue = iranianEdits[item.id]
    if (!newValue) return
    try {
      await manuallyUpdatePrice(item.id, { currentValue: Number(newValue) })
      setToast({ type: 'success', message: `قیمت «${item.label_fa}» بروزرسانی شد.` })
      loadAll()
    } catch {
      setToast({ type: 'error', message: 'بروزرسانی قیمت با خطا مواجه شد.' })
    }
  }

  if (loading) return <LoadingBlock label="در حال بارگذاری تنظیمات..." />

  const iranianPrices = prices.filter((p) => p.category === 'iranian')

  return (
    <div>
      <AdminPageHead title="تنظیمات سرویس‌ها" description="پیامک، قیمت و هوش‌مصنوعی — همه از همینجا قابل تنظیم است" />

      <div className="admin-settings__grid">
        <ConfigSection
          title="پنل پیامک (OTP و اعلان‌ها)"
          description="نام سرویس‌دهنده، کلید API و شماره فرستنده‌ی پنل پیامک واقعی خود را وارد کنید."
        >
          <form onSubmit={handleSaveSms} className="admin-settings__form">
            <label className="admin-field">
              <span>نام سرویس‌دهنده</span>
              <input
                value={sms.provider_name || ''}
                onChange={(e) => setSms({ ...sms, provider_name: e.target.value })}
                placeholder="kavenegar یا melipayamak"
              />
            </label>
            <label className="admin-field">
              <span>کلید API</span>
              <input
                value={sms.api_key || ''}
                onChange={(e) => setSms({ ...sms, api_key: e.target.value })}
                placeholder="کلید واقعی پنل پیامک"
              />
            </label>
            <label className="admin-field">
              <span>شماره فرستنده</span>
              <input
                value={sms.sender_number || ''}
                onChange={(e) => setSms({ ...sms, sender_number: e.target.value })}
                placeholder="مثلا 3000xxxxxx"
              />
            </label>
            <label className="admin-field">
              <span>نام کاربری پنل ملی‌پیامک (برای استعلام تحویل — اختیاری)</span>
              <input
                value={sms.panel_username || ''}
                onChange={(e) => setSms({ ...sms, panel_username: e.target.value })}
              />
            </label>
            <label className="admin-field">
              <span>رمز پنل ملی‌پیامک (برای استعلام تحویل — اختیاری)</span>
              <input
                type="password"
                value={sms.panel_password || ''}
                onChange={(e) => setSms({ ...sms, panel_password: e.target.value })}
              />
            </label>
            <label className="admin-field">
              <span>شماره موبایل ادمین (برای اطلاع از آگهی‌های در انتظار بررسی)</span>
              <input
                value={sms.admin_notify_phone || ''}
                onChange={(e) => setSms({ ...sms, admin_notify_phone: e.target.value })}
                placeholder="0912xxxxxxx"
              />
            </label>
            <label className="admin-settings__toggle">
              <input
                type="checkbox"
                checked={sms.is_enabled}
                onChange={(e) => setSms({ ...sms, is_enabled: e.target.checked })}
              />
              <span>ارسال واقعی پیامک فعال باشد</span>
            </label>
            <button type="submit" className="btn btn-primary" disabled={saving}>ذخیره تنظیمات پیامک</button>
          </form>

          <div className="admin-settings__log">
            <h3>گزارش‌های پنل پیامک (ملی‌پیامک)</h3>

            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
              {SMS_REPORT_TABS.map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={() => handleFetchReport(tab.key)}
                  disabled={checkingReport === tab.key}
                >
                  {checkingReport === tab.key ? 'در حال دریافت...' : tab.label}
                </button>
              ))}
            </div>

            {/* لیست پیامک‌ها */}
            <div style={{ marginBottom: 14, paddingBottom: 14, borderBottom: '1px solid var(--color-border)' }}>
              <strong style={{ fontSize: '0.82rem' }}>لیست پیامک‌ها</strong>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
                <select
                  value={messagesQuery.type}
                  onChange={(e) => setMessagesQuery((q) => ({ ...q, type: e.target.value }))}
                  style={{ padding: '6px 8px', borderRadius: 6, border: '1.5px solid var(--color-border)' }}
                >
                  <option value="out">ارسالی</option>
                  <option value="in">دریافتی</option>
                </select>
                <input
                  placeholder="شماره خط (مثلا 5000xxx)"
                  value={messagesQuery.number}
                  onChange={(e) => setMessagesQuery((q) => ({ ...q, number: e.target.value }))}
                  style={{ padding: '6px 8px', borderRadius: 6, border: '1.5px solid var(--color-border)', flex: 1, minWidth: 140 }}
                />
                <input
                  type="number"
                  placeholder="تعداد"
                  value={messagesQuery.count}
                  onChange={(e) => setMessagesQuery((q) => ({ ...q, count: e.target.value }))}
                  style={{ width: 80, padding: '6px 8px', borderRadius: 6, border: '1.5px solid var(--color-border)' }}
                />
                <button type="button" className="btn btn-outline btn-sm" onClick={handleFetchMessages} disabled={checkingReport === 'messages'}>
                  {checkingReport === 'messages' ? 'در حال دریافت...' : 'دریافت لیست'}
                </button>
              </div>
              <p style={{ fontSize: '0.75rem', color: 'var(--color-ink-soft)', marginTop: 4 }}>
                شماره‌ی خط را از پنل ملی‌پیامک خودتان کپی کنید؛ اگر خالی بگذارید ممکن است پیش‌فرض پنل استفاده شود.
              </p>
            </div>

            {/* وضعیت ارسال */}
            <div style={{ marginBottom: 14, paddingBottom: 14, borderBottom: '1px solid var(--color-border)' }}>
              <strong style={{ fontSize: '0.82rem' }}>وضعیت ارسال (بر اساس شناسه‌ی پیامک)</strong>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
                <input
                  placeholder="شناسه‌ها را با کاما جدا کنید، مثلا: 3741437414, 3741537415"
                  value={statusRecIds}
                  onChange={(e) => setStatusRecIds(e.target.value)}
                  style={{ padding: '6px 8px', borderRadius: 6, border: '1.5px solid var(--color-border)', flex: 1, minWidth: 220 }}
                />
                <button type="button" className="btn btn-outline btn-sm" onClick={handleFetchStatus} disabled={checkingReport === 'status'}>
                  {checkingReport === 'status' ? 'در حال دریافت...' : 'بررسی وضعیت'}
                </button>
              </div>
              <p style={{ fontSize: '0.75rem', color: 'var(--color-ink-soft)', marginTop: 4 }}>
                شناسه‌ها (recId) را از خروجی «لیست پیامک‌ها» بردارید و اینجا وارد کنید.
              </p>
            </div>

            {Object.entries(smsReports).map(([key, value]) => (
              <div key={key} style={{ marginBottom: 10 }}>
                <strong style={{ fontSize: '0.8rem' }}>نتیجه‌ی «{key}»:</strong>
                <pre
                  style={{
                    marginTop: 4,
                    fontSize: '0.78rem',
                    background: 'var(--color-bg-alt)',
                    padding: 10,
                    borderRadius: 8,
                    whiteSpace: 'pre-wrap',
                    maxHeight: 260,
                    overflow: 'auto',
                  }}
                >
                  {typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}
                </pre>
              </div>
            ))}
          </div>

          {smsLog.length > 0 && (
            <div className="admin-settings__log">
              <h3>آخرین کدهای تایید (برای تست بدون پیامک واقعی)</h3>
              <ul>
                {smsLog.map((log) => (
                  <li key={log.id}>
                    <span>{log.phone}</span>
                    <span className="admin-settings__log-status">{log.status}</span>
                    <span className="admin-settings__log-response">{log.provider_response}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </ConfigSection>

        <ConfigSection
          title="سرویس قیمت جهانی"
          description="کلید API سرویس‌هایی مثل metals-api.com یا metals.dev را اینجا وارد کنید."
        >
          <form onSubmit={handleSavePriceConfig} className="admin-settings__form">
            <label className="admin-field">
              <span>نام سرویس‌دهنده</span>
              <input
                value={priceConfig.provider_name || ''}
                onChange={(e) => setPriceConfig({ ...priceConfig, provider_name: e.target.value })}
                placeholder="metals-api یا metals.dev"
              />
            </label>
            <label className="admin-field">
              <span>کلید API</span>
              <input
                value={priceConfig.api_key || ''}
                onChange={(e) => setPriceConfig({ ...priceConfig, api_key: e.target.value })}
                placeholder="کلید واقعی سرویس قیمت"
              />
            </label>
            <label className="admin-field">
              <span>فاصله‌ی بروزرسانی (دقیقه)</span>
              <input
                type="number"
                value={priceConfig.refresh_interval_minutes}
                onChange={(e) => setPriceConfig({ ...priceConfig, refresh_interval_minutes: e.target.value })}
              />
            </label>
            <label className="admin-settings__toggle">
              <input
                type="checkbox"
                checked={priceConfig.is_enabled}
                onChange={(e) => setPriceConfig({ ...priceConfig, is_enabled: e.target.checked })}
              />
              <span>دریافت خودکار قیمت جهانی فعال باشد</span>
            </label>
            <button type="submit" className="btn btn-primary" disabled={saving}>ذخیره تنظیمات قیمت</button>
          </form>

          <div className="admin-settings__log">
            <h3>قیمت‌های ایرانی (فعلاً دستی — بدون API عمومی)</h3>
            <ul className="admin-settings__manual-prices">
              {iranianPrices.map((item) => (
                <li key={item.id}>
                  <span>{item.label_fa}</span>
                  <input
                    type="number"
                    placeholder={item.price_values?.[0]?.current_value ?? 'مقدار جدید'}
                    value={iranianEdits[item.id] || ''}
                    onChange={(e) => setIranianEdits((prev) => ({ ...prev, [item.id]: e.target.value }))}
                  />
                  <button type="button" className="btn btn-outline btn-sm" onClick={() => handleManualPriceUpdate(item)}>
                    بروزرسانی
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </ConfigSection>

        <ConfigSection
          title="دستیار هوش مصنوعی"
          description="بعد از تهیه‌ی کلید API یک مدل زبانی، آن را اینجا وارد کنید تا دستیار فعال شود."
        >
          <form onSubmit={handleSaveAi} className="admin-settings__form">
            <label className="admin-field">
              <span>نام سرویس‌دهنده</span>
              <input
                value={aiConfig.provider_name || ''}
                onChange={(e) => setAiConfig({ ...aiConfig, provider_name: e.target.value })}
                placeholder="anthropic"
              />
            </label>
            <label className="admin-field">
              <span>کلید API</span>
              <input
                value={aiConfig.api_key || ''}
                onChange={(e) => setAiConfig({ ...aiConfig, api_key: e.target.value })}
                placeholder="کلید واقعی API"
              />
            </label>
            <label className="admin-field">
              <span>نام مدل</span>
              <input
                value={aiConfig.model_name || ''}
                onChange={(e) => setAiConfig({ ...aiConfig, model_name: e.target.value })}
                placeholder="مثلا claude-sonnet-4-6"
              />
            </label>
            <label className="admin-settings__toggle">
              <input
                type="checkbox"
                checked={aiConfig.is_enabled}
                onChange={(e) => setAiConfig({ ...aiConfig, is_enabled: e.target.checked })}
              />
              <span>دستیار هوش مصنوعی فعال باشد</span>
            </label>
            <button type="submit" className="btn btn-primary" disabled={saving}>ذخیره تنظیمات هوش‌مصنوعی</button>
          </form>
        </ConfigSection>
      </div>

      <Toast message={toast?.message} type={toast?.type} onClose={() => setToast(null)} />
    </div>
  )
}
