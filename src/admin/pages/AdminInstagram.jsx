import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { invokeFn } from '../../lib/invokeFn'
import { AdminPageHead, AdminCard, Toast } from '../components/AdminUI'
import { LoadingBlock, EmptyBlock, ErrorBlock } from '../../components/StatusBlocks'
import './AdminInstagram.css'

// کپی متن؛ اگر مرورگر clipboard API را نداد از روش قدیمی استفاده می‌شود
async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    const ta = document.createElement('textarea')
    ta.value = text
    ta.style.position = 'fixed'
    ta.style.opacity = '0'
    document.body.appendChild(ta)
    ta.select()
    let ok = false
    try { ok = document.execCommand('copy') } catch { ok = false }
    ta.remove()
    return ok
  }
}

export default function AdminInstagram() {
  const [ads, setAds] = useState([])
  const [posted, setPosted] = useState(new Set())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [toast, setToast] = useState(null)
  const [onlyPending, setOnlyPending] = useState(true)
  const [made, setMade] = useState({}) // { [adId]: { url, caption } }
  const [busy, setBusy] = useState({}) // { [adId]: 'make' | 'mark' }

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const [adsRes, postsRes] = await Promise.all([
        supabase
          .from('ads')
          .select('id,title,images,status,ad_type,created_at')
          .in('status', ['published', 'live'])
          .order('created_at', { ascending: false })
          .limit(60),
        supabase.from('instagram_posts').select('ref_id').eq('kind', 'ad').eq('status', 'sent'),
      ])
      if (adsRes.error) throw adsRes.error
      if (postsRes.error) throw postsRes.error
      setAds(adsRes.data || [])
      setPosted(new Set((postsRes.data || []).map((p) => p.ref_id)))
    } catch {
      setError('بارگذاری آگهی‌ها با خطا مواجه شد.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const setBusyFor = (id, v) => setBusy((b) => ({ ...b, [id]: v }))

  async function makeCard(ad) {
    setBusyFor(ad.id, 'make')
    try {
      const res = await invokeFn('instagram-publish', { kind: 'preview', refId: ad.id }, 'ساخت کارت با خطا مواجه شد.')
      if (!res?.url) throw new Error('ساخت کارت ناموفق بود.')
      setMade((m) => ({ ...m, [ad.id]: { url: res.url, caption: res.caption || '' } }))
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'ساخت کارت با خطا مواجه شد.' })
    } finally {
      setBusyFor(ad.id, null)
    }
  }

  async function copyCaption(ad) {
    const ok = await copyText(made[ad.id]?.caption || '')
    setToast(ok
      ? { type: 'success', message: 'کپشن کپی شد. در اینستاگرام جای‌گذاری کنید.' }
      : { type: 'error', message: 'کپی انجام نشد. کپشن را دستی انتخاب و کپی کنید.' })
  }

  // روی گوشی منوی اشتراک‌گذاری باز می‌شود (ذخیره در گالری یا ارسال مستقیم به اینستاگرام)
  async function saveImage(ad) {
    const url = made[ad.id]?.url
    if (!url) return
    try {
      const blob = await (await fetch(url)).blob()
      const file = new File([blob], `digimadan-${ad.id.slice(0, 8)}.jpg`, { type: 'image/jpeg' })
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file] })
        return
      }
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      a.download = file.name
      document.body.appendChild(a)
      a.click()
      a.remove()
      setTimeout(() => URL.revokeObjectURL(a.href), 4000)
    } catch (err) {
      if (err?.name === 'AbortError') return // کاربر منوی اشتراک را بست
      window.open(url, '_blank', 'noopener') // آخرین راه: باز کردن تصویر و نگه‌داشتن انگشت برای ذخیره
    }
  }

  async function toggleMarked(ad) {
    setBusyFor(ad.id, 'mark')
    try {
      if (posted.has(ad.id)) {
        const { error: err } = await supabase
          .from('instagram_posts').delete().eq('kind', 'ad').eq('ref_id', ad.id).eq('status', 'sent')
        if (err) throw err
        setPosted((s) => { const n = new Set(s); n.delete(ad.id); return n })
      } else {
        const { error: err } = await supabase
          .from('instagram_posts').insert([{ kind: 'ad', ref_id: ad.id, status: 'sent' }])
        if (err && err.code !== '23505') throw err
        setPosted((s) => new Set(s).add(ad.id))
      }
    } catch {
      setToast({ type: 'error', message: 'ثبت وضعیت با خطا مواجه شد.' })
    } finally {
      setBusyFor(ad.id, null)
    }
  }

  const list = onlyPending ? ads.filter((a) => !posted.has(a.id)) : ads
  const pendingCount = ads.filter((a) => !posted.has(a.id)).length

  return (
    <div>
      <AdminPageHead
        title="انتشار در اینستاگرام"
        description="روش نیمه‌خودکار: کارت و کپشن آماده می‌شود، شما در اینستاگرام پست می‌کنید."
      />

      <AdminCard>
        <ol className="ig-steps">
          <li>برای آگهی مورد نظر «ساخت کارت و کپشن» را بزنید.</li>
          <li>«ذخیره تصویر» را بزنید و تصویر را در گالری ذخیره کنید یا مستقیم به اینستاگرام بفرستید.</li>
          <li>«کپی کپشن» را بزنید و در اینستاگرام هنگام ساخت پست جای‌گذاری کنید.</li>
          <li>بعد از انتشار، «پست شد» را بزنید تا آگهی از فهرست پست‌نشده‌ها خارج شود.</li>
        </ol>
        <label className="ig-filter">
          <input type="checkbox" checked={onlyPending} onChange={(e) => setOnlyPending(e.target.checked)} />
          فقط آگهی‌های پست‌نشده ({pendingCount.toLocaleString('fa-IR')})
        </label>
      </AdminCard>

      {loading && <LoadingBlock label="در حال بارگذاری آگهی‌ها..." />}
      {error && <ErrorBlock message={error} />}
      {!loading && !error && list.length === 0 && (
        <EmptyBlock title={onlyPending ? 'همه آگهی‌ها پست شده‌اند' : 'آگهی منتشرشده‌ای یافت نشد'} />
      )}

      {!loading && !error && list.map((ad) => {
        const m = made[ad.id]
        const isPosted = posted.has(ad.id)
        return (
          <AdminCard key={ad.id} className="ig-item">
            <div className="ig-item__head">
              {ad.images?.[0] && <img className="ig-item__thumb" src={ad.images[0]} alt="" loading="lazy" />}
              <div className="ig-item__info">
                <div className="ig-item__title">{ad.title}</div>
                <div className="ig-item__meta">
                  {new Date(ad.created_at).toLocaleDateString('fa-IR-u-ca-persian')}
                  {' · '}
                  <span className={'status-pill ' + (isPosted ? 'status-pill--on' : 'status-pill--warn')}>
                    {isPosted ? 'پست شده' : 'پست نشده'}
                  </span>
                </div>
              </div>
            </div>

            {m && (
              <div className="ig-item__preview">
                <img src={m.url} alt="کارت اینستاگرام" />
              </div>
            )}

            <div className="ig-item__actions">
              <button className="btn btn-primary btn-sm" disabled={busy[ad.id] === 'make'} onClick={() => makeCard(ad)}>
                {busy[ad.id] === 'make' ? 'در حال ساخت...' : m ? 'ساخت دوباره' : 'ساخت کارت و کپشن'}
              </button>
              {m && (
                <>
                  <button className="btn btn-outline btn-sm" onClick={() => saveImage(ad)}>ذخیره تصویر</button>
                  <button className="btn btn-outline btn-sm" onClick={() => copyCaption(ad)}>کپی کپشن</button>
                </>
              )}
              <button className="btn btn-outline btn-sm" disabled={busy[ad.id] === 'mark'} onClick={() => toggleMarked(ad)}>
                {isPosted ? 'برگردان به پست‌نشده' : 'پست شد ✓'}
              </button>
            </div>
          </AdminCard>
        )
      })}

      <Toast message={toast?.message} type={toast?.type} onClose={() => setToast(null)} />
    </div>
  )
}
