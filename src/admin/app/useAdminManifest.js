import { useEffect } from 'react'

// وقتی کاربر در بخش /admin است، سایت به‌عنوان «اپلیکیشن مدیریت» (با آیکون و نام جدا) قابل نصب می‌شود
export function useAdminManifest() {
  useEffect(() => {
    const head = document.head
    const manifest = head.querySelector('link[rel="manifest"]')
    const touch = head.querySelector('link[rel="apple-touch-icon"]')
    const theme = head.querySelector('meta[name="theme-color"]')
    const title = head.querySelector('meta[name="apple-mobile-web-app-title"]')
    const appName = head.querySelector('meta[name="application-name"]')
    const prev = {
      manifest: manifest && manifest.getAttribute('href'),
      touch: touch && touch.getAttribute('href'),
      theme: theme && theme.getAttribute('content'),
      title: title && title.getAttribute('content'),
      appName: appName && appName.getAttribute('content'),
    }

    if (manifest) manifest.setAttribute('href', '/admin-manifest.webmanifest')
    if (touch) touch.setAttribute('href', '/admin-apple-touch-icon.png')
    if (theme) theme.setAttribute('content', '#1C1B19')
    if (title) title.setAttribute('content', 'مدیریت')
    if (appName) appName.setAttribute('content', 'مدیریت دیجی‌معدن')

    return () => {
      if (manifest && prev.manifest) manifest.setAttribute('href', prev.manifest)
      if (touch && prev.touch) touch.setAttribute('href', prev.touch)
      if (theme && prev.theme) theme.setAttribute('content', prev.theme)
      if (title && prev.title) title.setAttribute('content', prev.title)
      if (appName && prev.appName) appName.setAttribute('content', prev.appName)
    }
  }, [])
}
