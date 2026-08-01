# راهنمای دیپلوی روی Cloudflare Pages

## چرا دیپلوی شکست می‌خورد؟

دو دلیل اصلی داشت:

### ۱) نبودِ فایل package-lock.json  ← دلیل اصلی
Cloudflare Pages به‌صورت پیش‌فرض دستور `npm ci` را اجرا می‌کند.
این دستور **بدون فایل package-lock.json اصلاً کار نمی‌کند** و با این خطا
بلافاصله متوقف می‌شود:

    npm ERR! The `npm ci` command can only install with an existing package-lock.json

این فایل در پروژه وجود نداشت، پس بیلد همان ابتدا شکست می‌خورد.

### ۲) مشخص‌نبودن نسخه‌ی Node
Vite 5 به Node 18 یا بالاتر نیاز دارد، اما Cloudflare برای پروژه‌هایی که
نسخه را مشخص نکرده‌اند ممکن است نسخه‌ی خیلی قدیمی (۱۲) را انتخاب کند و
بیلد با خطای نامفهوم بشکند.

---

## راه‌حل — یکی از این دو را انجام دهید

### راه اول (توصیه‌شده): ساخت lockfile
روی کامپیوتر خودتان در پوشه‌ی پروژه اجرا کنید:

    npm install

سپس فایل ساخته‌شده‌ی `package-lock.json` را حتماً در گیت‌هاب commit کنید.
از این به بعد بیلد Cloudflare بدون مشکل انجام می‌شود.

### راه دوم: تغییر دستور بیلد در Cloudflare
اگر نمی‌خواهید lockfile بسازید، در پنل Cloudflare:

    Workers & Pages > پروژه > Settings > Builds & deployments

مقدار **Build command** را به این تغییر دهید:

    npm install && npm run build

(به‌جای `npm ci` از `npm install` استفاده می‌شود که به lockfile نیاز ندارد.)

---

## تنظیمات درست پروژه در Cloudflare Pages

| تنظیم | مقدار |
|---|---|
| Framework preset | Vite |
| Build command | `npm run build` |
| Build output directory | `dist` |
| Root directory | (خالی بگذارید) |

## متغیرهای محیطی (الزامی)

در `Settings > Environment variables` این‌ها را اضافه کنید و حتماً برای
هر دو محیط Production و Preview تنظیم کنید:

    VITE_SUPABASE_URL        = https://gdafmztscwtqtjzgnhvp.supabase.co
    VITE_SUPABASE_ANON_KEY   = (کلید anon از پنل Supabase)
    VITE_SITE_URL            = https://digimadan.com

نکته: بدون دو متغیر اول، سایت بیلد می‌شود ولی هیچ داده‌ای نمایش نمی‌دهد.

---

## فایل‌هایی که اضافه/اصلاح شدند

- `.node-version` و `.nvmrc` — نسخه‌ی Node را روی 20.18.0 قفل می‌کند
- `package.json` — فیلد `engines` اضافه شد
- `public/_redirects` — مسیریابی SPA در Cloudflare (از قبل درست بود)
- `functions/_middleware.js` — نقشه‌ی سایت + پیش‌رندر برای خزنده‌ها
  (این جایگزین `vercel.json` است، چون Cloudflare آن را نادیده می‌گیرد)

## درباره‌ی فایل‌های Vercel

`vercel.json` و `api/prerender.js` برای Cloudflare بی‌اثرند و نادیده گرفته
می‌شوند. اگر دیگر روی Vercel دیپلوی نمی‌کنید می‌توانید حذفشان کنید؛
نگه‌داشتنشان هیچ ضرری برای Cloudflare ندارد.
