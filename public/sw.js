/* سرویس‌ورکر دیجی‌معدن
 * - فقط برای نصب‌پذیری و صفحه‌ی «آفلاین» است؛ داده‌های آگهی/قیمت هرگز کش نمی‌شوند
 *   (درخواست‌های Supabase و هر دامنه‌ی دیگر دست‌نخورده می‌روند).
 * - صفحه‌ها همیشه اول از شبکه گرفته می‌شوند تا بعد از هر انتشار، کاربر نسخه‌ی تازه را ببیند.
 * - فقط فایل‌های هش‌دار /assets/ (که هیچ‌وقت تغییر نمی‌کنند) کش می‌شوند.
 */
const VERSION = 'dm-v1'
const STATIC_CACHE = `${VERSION}-static`
const SHELL = ['/offline.html', '/icon-192.png', '/icon-512.png']

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(STATIC_CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()))
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
