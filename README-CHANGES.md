# تغییرات بررسی کامل سایت دیجی‌معدن

## فایل‌های این بسته

| فایل | کار |
|---|---|
| src/admin/pages/AdminWallets.jsx | **فایل جدید** — صفحه‌ی کیف‌پول کاربران |
| src/admin/AdminLayout.jsx | جایگزین — افزودن منوی کیف‌پول |
| src/App.jsx | جایگزین — افزودن مسیر /admin/wallets |
| src/services/auctionService.js | جایگزین — نمایش پیام واقعی خطا |
| src/pages/dashboard/DashboardMessages.jsx | جایگزین — رفع گم‌شدن پیام |

## ⚠️ دو فایل که باید حذف کنید (در زیپ نیستند چون حذفی‌اند)

### src/services/priceApiService.js  ← فوری
یک توکن API شخص ثالث آشکارا در کد دارد و روی گیت‌هاب برای همه قابل
خواندن است. ماه‌هاست بلااستفاده مانده.

**حذف فایل کافی نیست** — توکن در تاریخچه‌ی گیت باقی می‌ماند.
حتماً آن را در پنل priceto.day باطل (revoke) کنید.

### src/services/notificationsService.js
بلااستفاده، هیچ صفحه‌ای از آن استفاده نمی‌کند.

## کارهای دیگر

1. ساخت lockfile (بدون آن بیلد Cloudflare شکست می‌خورد):

       npm install

   سپس package-lock.json را commit کنید.

2. اختیاری: src/components/MiningHeroScene.jsx بلااستفاده است و
   کتابخانه‌ی سنگین three (~۶۰۰KB) را وارد می‌کند.

3. همیشه قبل از push:

       npm run build

---

# تغییرات دیتابیس (قبلاً اعمال شده — کاری لازم نیست)

این‌ها مستقیم روی Supabase انجام و تست شده‌اند:

## امنیت — ۱۲ جدول
جدول‌های زیر به «هر کاربر لاگین‌شده» دسترسی کامل می‌دادند و حالا فقط
برای ادمین‌های واقعی باز هستند:

sms_config (کلید API و رمز پنل پیامک)، price_provider_config،
ai_config، wallet_accounts، wallet_transactions، banners، pages،
news_items، admin_activity_log، content_reports، price_history،
admin_users

## امنیت — فایل‌ها
هر کاربر می‌توانست فایل کاربران دیگر را حذف کند. حالا فقط صاحب فایل
یا ادمین اجازه دارد:
ad-images، ad-analysis-files، profile-images
همچنین باکت رهاشده‌ی banner-images بسته شد.

## پنل ادمین — دو باگ
- تعداد کل کاربران اشتباه خوانده می‌شد (عدد واقعی: ۱۹)
- صفحه‌ی دوم فهرست کاربران همیشه خالی بود (صفحه‌بندی دوباره اعمال می‌شد)

## تست‌های انجام‌شده
- مهمان: بنرها، آگهی‌ها، قیمت‌ها، صفحات → قابل مشاهده ✓
- کاربر عادی: پروفایل/کیف‌پول/گفتگوی خودش ✓ — کلیدهای API: صفر ✓
- ادمین: دسترسی کامل حفظ شد ✓
