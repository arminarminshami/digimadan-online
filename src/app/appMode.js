// حالت «اپلیکیشن»: وقتی سایت از روی صفحه‌ی اصلی گوشی (وب‌اپ نصب‌شده) باز می‌شود
// ظاهر اپلیکیشن (نوار پایین، صفحه‌ی خانه‌ی آیکونی و ...) نشان داده می‌شود؛
// در مرورگر معمولی همان سایت قبلی دیده می‌شود.
// برای تست در مرورگر: آدرس سایت را با  ?app=1  باز کنید (و برای خاموش کردن ?app=0).
const PREVIEW_KEY = 'dm_app_preview'

function compute() {
  if (typeof window === 'undefined') return false
  try {
    const q = new URLSearchParams(window.location.search).get('app')
    if (q === '1') localStorage.setItem(PREVIEW_KEY, '1')
    if (q === '0') localStorage.removeItem(PREVIEW_KEY)
  } catch {
    /* بدون localStorage هم کار می‌کند */
  }
  const standalone =
    (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) ||
    window.navigator.standalone === true
  // برنامه‌ی نصب‌شده روی دسکتاپ همان سایت کامل را نشان می‌دهد؛ ظاهر اپلیکیشن فقط برای گوشی و تبلت است
  const small = window.matchMedia ? window.matchMedia('(max-width: 900px)').matches : true
  let preview = false
  try {
    preview = localStorage.getItem(PREVIEW_KEY) === '1'
  } catch {
    /* ignore */
  }
  return (standalone && small) || preview
}

export const APP_MODE = compute()

if (APP_MODE && typeof document !== 'undefined') {
  document.documentElement.classList.add('app-mode')
}
