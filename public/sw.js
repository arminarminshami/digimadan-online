/* سرویس‌ورکر دیجی‌معدن
 * - فقط برای نصب‌پذیری و صفحه‌ی «آفلاین» است؛ داده‌های آگهی/قیمت هرگز کش نمی‌شوند
 *   (درخواست‌های Supabase و هر دامنه‌ی دیگر دست‌نخورده می‌روند).
 * - صفحه‌ها همیشه اول از شبکه گرفته می‌شوند تا بعد از هر انتشار، کاربر نسخه‌ی تازه را ببیند.
 * - فقط فایل‌های هش‌دار /assets/ (که هیچ‌وقت تغییر نمی‌کنند) کش می‌شوند.
 * - اعلان‌ها (Web Push): نمایش اعلان و باز کردن صفحه‌ی مربوط با لمس آن.
 */
// __BUILD_ID__ هنگام ساخت با شناسه‌ی انتشار جایگزین می‌شود (هر انتشار = یک سرویس‌ورکر تازه)
const VERSION = 'dm-__BUILD_ID__'
const STATIC_CACHE = `${VERSION}-static`
const SHELL = ['/offline.html', '/icon-192.png', '/icon-512.png']

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(STATIC_CACHE).then((c) => c.addAll(SHELL)))
})

// نسخه‌ی تازه منتظر می‌ماند تا کاربر در پنجره‌ی «به‌روزرسانی» تأیید کند
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => !k.startsWith(VERSION)).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', (event) => {
  const req = event.request
  if (req.method !== 'GET') return
  const url = new URL(req.url)
  if (url.origin !== self.location.origin) return

  // ناوبری بین صفحه‌ها: شبکه‌اول، در صورت قطعی اینترنت صفحه‌ی آفلاین
  if (req.mode === 'navigate') {
    event.respondWith(fetch(req).catch(() => caches.match('/offline.html')))
    return
  }

  // فایل‌های هش‌دار ساخت: کش‌اول
  if (url.pathname.startsWith('/assets/')) {
    event.respondWith(
      caches.match(req).then(
        (hit) =>
          hit ||
          fetch(req).then((res) => {
            if (res.ok) {
              const copy = res.clone()
              caches.open(STATIC_CACHE).then((c) => c.put(req, copy))
            }
            return res
          })
      )
    )
  }
})

// ---------- اعلان‌ها ----------
self.addEventListener('push', (event) => {
  let data = {}
  try {
    data = event.data ? event.data.json() : {}
  } catch {
    data = { body: event.data ? event.data.text() : '' }
  }
  const title = data.title || 'دیجی‌معدن'
  event.waitUntil(
    self.registration.showNotification(title, {
      body: data.body || '',
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      tag: data.tag || undefined,
      dir: 'rtl',
      lang: 'fa',
      data: { url: data.url || '/' },
    })
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const target = new URL((event.notification.data && event.notification.data.url) || '/', self.location.origin).href
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      for (const client of list) {
        if (client.url.startsWith(self.location.origin) && 'focus' in client) {
          return client.focus().then((c) => (c && 'navigate' in c ? c.navigate(target) : c)).catch(() => self.clients.openWindow(target))
        }
      }
      return self.clients.openWindow(target)
    })
  )
})
