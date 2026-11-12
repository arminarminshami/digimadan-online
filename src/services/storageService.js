import { supabase } from '../lib/supabaseClient'

const ADS_BUCKET = 'ad-images'
const PROFILE_BUCKET = 'profile-images'
const BANNERS_BUCKET = 'banners'
const AD_ANALYSIS_BUCKET = 'ad-analysis-files'
const AUCTION_IMAGES_BUCKET = 'auction-images'
const AUCTION_DOCS_BUCKET = 'auction-documents'
const PARTICIPATION_DOCS_BUCKET = 'participation-documents'
const LAB_EQUIPMENT_BUCKET = 'lab-equipment'

function randomFileName(file) {
  const rawExt = (file.name.split('.').pop() || '').toLowerCase()
  // اگر فایل پسوند معتبر نداشت (مثلاً image بدون پسوند در بعضی گوشی‌ها) از روی نوع فایل حدس می‌زنیم
  const fromType = (file.type || '').split('/')[1]
  const ext = /^[a-z0-9]{2,5}$/.test(rawExt) ? rawExt : (fromType || 'jpg').replace('jpeg', 'jpg')
  const rand = Math.random().toString(36).slice(2, 10)
  return `${Date.now()}-${rand}.${ext}`
}

/**
 * عکس‌های بزرگ گوشی (معمولاً ۴ تا ۱۲ مگابایت) قبل از آپلود کوچک می‌شوند:
 * آپلود سریع‌تر و کم‌خطاتر روی اینترنت موبایل، و سایت هم سبک‌تر لود می‌شود.
 * اگر هر مشکلی پیش بیاید، همان فایل اصلی آپلود می‌شود.
 */
async function shrinkImage(file, maxSide = 2200, quality = 0.86) {
  try {
    if (!file.type || !/^image\/(jpeg|png|webp)$/.test(file.type)) return file
    if (file.size < 1.2 * 1024 * 1024) return file
    const bitmap = await createImageBitmap(file)
    const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height))
    const w = Math.round(bitmap.width * scale)
    const h = Math.round(bitmap.height * scale)
    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d')
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, w, h)
    ctx.drawImage(bitmap, 0, 0, w, h)
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', quality))
    if (!blob || blob.size >= file.size) return file
    const name = file.name.replace(/\.[^.]+$/, '') + '.jpg'
    return new File([blob], name, { type: 'image/jpeg' })
  } catch {
    return file
  }
}

async function uploadToBucket(bucket, originalFile) {
  const file = await shrinkImage(originalFile)
  const fileName = randomFileName(file)
  const { error } = await supabase.storage.from(bucket).upload(fileName, file, {
    cacheControl: '3600',
    upsert: false,
    contentType: file.type || undefined,
  })
  if (error) throw error

  const { data: publicUrlData } = supabase.storage.from(bucket).getPublicUrl(fileName)
  return { path: fileName, url: publicUrlData.publicUrl }
}

export async function uploadAdImage(file) {
  return uploadToBucket(ADS_BUCKET, file)
}

export async function uploadMultipleAdImages(files) {
  const uploads = await Promise.all(Array.from(files).map((f) => uploadAdImage(f)))
  return uploads
}

// آپلود عکس پروفایل کاربر — نیازمند باکت storage به نام profile-images
// (در Supabase Dashboard > Storage بسازید، دقیقا مثل ad-images)
export async function uploadProfileImage(file) {
  return uploadToBucket(PROFILE_BUCKET, file)
}

// آپلود عکس بنر هومپیج — فقط ادمین (طبق RLS باکت banners)
export async function uploadBannerImage(file) {
  return uploadToBucket(BANNERS_BUCKET, file)
}

export async function deleteAdImage(path) {
  const { error } = await supabase.storage.from(ADS_BUCKET).remove([path])
  if (error) throw error
  return true
}

// آپلود فایل آنالیز (PDF یا عکس) در مرحله‌ی اول فرم ثبت آگهی
export async function uploadAdAnalysisFile(file) {
  return uploadToBucket(AD_ANALYSIS_BUCKET, file)
}


// تجهیزات آزمایشگاهی: عکس دستگاه، لوگو، بروشور و کاتالوگ (باکت عمومی؛ نوشتن فقط ادمین)
export async function uploadLabFile(file) {
  return uploadToBucket(LAB_EQUIPMENT_BUCKET, file)
}


// ---------------- مزایده ----------------

// عکس پیش‌نمایش مزایده (عمومی)
export async function uploadAuctionImage(file) {
  return uploadToBucket(AUCTION_IMAGES_BUCKET, file)
}

/**
 * مدارک PDF مزایده -- در باکت خصوصی ذخیره می‌شوند.
 * چون باکت خصوصی است، getPublicUrl لینک قابل استفاده نمی‌دهد؛ اینجا فقط
 * مسیر فایل را برمی‌گردانیم و دانلود بعدا از طریق Edge Function با بررسی
 * بازه‌ی زمانی انجام می‌شود.
 */
export async function uploadAuctionDocument(file) {
  // از همان randomFileName بقیه‌ی سایت استفاده می‌شود.
  // crypto.randomUUID فقط در بافت امن (HTTPS) و مرورگرهای جدید موجود است
  // و در غیر این صورت خطا می‌دهد و آپلود بی‌صدا شکست می‌خورد.
  const path = randomFileName(file)
  const { error } = await supabase.storage.from(AUCTION_DOCS_BUCKET).upload(path, file)
  if (error) throw error
  return { path, url: path, name: file.name }
}

// مدارک هویتی کاربر برای شرکت در مزایده (باکت خصوصی)
export async function uploadParticipationDocument(file) {
  const path = randomFileName(file)
  const { error } = await supabase.storage.from(PARTICIPATION_DOCS_BUCKET).upload(path, file)
  if (error) throw error
  return { path, url: path, name: file.name }
}
