/**
 * همه‌ی آدرس‌های /admin و /admin/... (مثل /admin/login و /admin/ads) همان صفحه‌ی
 * ورودی «اپلیکیشن مدیریت» را برمی‌گردانند؛ یعنی مانیفست، آیکون و نام مدیریت.
 * بدون این، فقط خود /admin/ مانیفست مدیریت داشت و بقیه‌ی آدرس‌ها مانیفست اپ عمومی را.
 * (مرورگر هنگام «نصب» یا «افزودن به صفحه اصلی» مانیفست همان صفحه‌ای را می‌خواند که باز است.)
 */
export async function onRequest(context) {
  const { request, env } = context
  if (request.method !== 'GET' && request.method !== 'HEAD') return context.next()

  const url = new URL(request.url)
  let res = await env.ASSETS.fetch(new URL('/admin/', url))
  // اگر دارایی‌ها ریدایرکت دادند، یک‌بار دنبالش برو
  if (res.status >= 300 && res.status < 400 && res.headers.get('location')) {
    res = await env.ASSETS.fetch(new URL(res.headers.get('location'), url))
  }

  const headers = new Headers(res.headers)
  headers.set('Cache-Control', 'no-cache')
  headers.set('Content-Type', 'text/html; charset=utf-8')
  return new Response(request.method === 'HEAD' ? null : res.body, { status: res.status, headers })
}
