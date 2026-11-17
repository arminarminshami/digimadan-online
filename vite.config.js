import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'node:fs'
import path from 'node:path'

// شناسه‌ی هر انتشار: در Cloudflare/GitHub همان کامیت است، در ساخت محلی زمان ساخت
const BUILD_ID = (
  process.env.CF_PAGES_COMMIT_SHA ||
  process.env.VERCEL_GIT_COMMIT_SHA ||
  process.env.GITHUB_SHA ||
  Date.now().toString(36)
).slice(0, 12)

// بعد از هر ساخت: فایل version.json (برای تشخیص نسخه‌ی جدید) می‌سازد و
// شناسه را داخل سرویس‌ورکر می‌گذارد تا با هر انتشار سرویس‌ورکر هم تغییر کند
function appVersionPlugin() {
  return {
    name: 'dm-app-version',
    apply: 'build',
    closeBundle() {
      const out = path.resolve(process.cwd(), 'dist')
      if (!fs.existsSync(out)) return
      fs.writeFileSync(path.join(out, 'version.json'), JSON.stringify({ version: BUILD_ID, builtAt: new Date().toISOString() }))
      const sw = path.join(out, 'sw.js')
      if (fs.existsSync(sw)) fs.writeFileSync(sw, fs.readFileSync(sw, 'utf8').replace(/__BUILD_ID__/g, BUILD_ID))
    },
  }
}

export default defineConfig({
  plugins: [react(), appVersionPlugin()],
  build: {
    rollupOptions: {
      input: {
        main: path.resolve(process.cwd(), 'index.html'),
        admin: path.resolve(process.cwd(), 'admin/index.html'),
      },
    },
  },
  define: {
    __APP_VERSION__: JSON.stringify(BUILD_ID),
  },
  server: {
    port: 5173,
  },
})
