import { supabase } from '../lib/supabaseClient'

// اعلان‌های واقعی (Web Push): آگهی تازه، تأیید آگهی توسط ادمین، پیام جدید
export function pushSupported() {
  return (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  )
}

// 'default' | 'granted' | 'denied' | 'unsupported'
export function pushPermission() {
  return pushSupported() ? Notification.permission : 'unsupported'
}

function urlBase64ToUint8Array(base64) {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4)
  const raw = atob((base64 + padding).replace(/-/g, '+').replace(/_/g, '/'))
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)))
}

async function getRegistration() {
  const existing = await navigator.serviceWorker.getRegistration()
  if (existing) return existing
  return Promise.race([
    navigator.serviceWorker.ready,
    new Promise((_, rej) => setTimeout(() => rej(new Error('sw_not_ready')), 5000)),
  ])
}

async function saveSubscription(sub) {
  const j = sub.toJSON()
  const { error } = await supabase.rpc('save_push_subscription', {
    p_endpoint: j.endpoint,
    p_p256dh: j.keys.p256dh,
    p_auth: j.keys.auth,
    p_user_agent: navigator.userAgent,
  })
  if (error) throw error
  return j.endpoint
}

async function subscribe(reg) {
  const { data: key, error } = await supabase.rpc('get_push_public_key')
  if (error || !key) throw new Error('no_key')
  return reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(key) })
}

// درخواست اجازه + ثبت اشتراک. باید از داخل لمس کاربر (کلیک دکمه) صدا زده شود.
export async function enablePush() {
  if (!pushSupported()) return { ok: false, reason: 'unsupported' }
  const perm = await Notification.requestPermission()
  if (perm !== 'granted') return { ok: false, reason: perm }
  const reg = await getRegistration()
  const sub = (await reg.pushManager.getSubscription()) || (await subscribe(reg))
  const endpoint = await saveSubscription(sub)
  // پیام خوش‌آمد: تأیید می‌کند اعلان‌ها واقعاً به همین گوشی می‌رسند
  fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/push-send`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ kind: 'welcome', endpoint }),
  }).catch(() => {})
  return { ok: true }
}

// با هر بار اجرای اپ و ورود/خروج کاربر: اشتراک به کاربر فعلی وصل می‌شود (و در صورت پاک‌شدن، دوباره ساخته می‌شود)
export async function syncPush() {
  if (!pushSupported() || Notification.permission !== 'granted') return
  try {
    const reg = await getRegistration()
    const sub = (await reg.pushManager.getSubscription()) || (await subscribe(reg))
    await saveSubscription(sub)
  } catch {
    /* بی‌صدا؛ دفعه‌ی بعد دوباره تلاش می‌شود */
  }
}

export async function isPushEnabled() {
  if (!pushSupported() || Notification.permission !== 'granted') return false
  try {
    const reg = await navigator.serviceWorker.getRegistration()
    return Boolean(reg && (await reg.pushManager.getSubscription()))
  } catch {
    return false
  }
}

export async function disablePush() {
  try {
    const reg = await navigator.serviceWorker.getRegistration()
    const sub = reg && (await reg.pushManager.getSubscription())
    if (sub) {
      await supabase.rpc('remove_push_subscription', { p_endpoint: sub.endpoint })
      await sub.unsubscribe()
    }
  } catch {
    /* ignore */
  }
}
