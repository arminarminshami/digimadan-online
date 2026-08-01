import { supabase } from '../lib/supabaseClient'

const ADS_BUCKET = 'ad-images'
const PROFILE_BUCKET = 'profile-images'
const BANNERS_BUCKET = 'banners'
const AD_ANALYSIS_BUCKET = 'ad-analysis-files'
const AUCTION_IMAGES_BUCKET = 'auction-images'
const AUCTION_DOCS_BUCKET = 'auction-documents'
const PARTICIPATION_DOCS_BUCKET = 'participation-documents'

function randomFileName(file) {
  const ext = file.name.split('.').pop()
  const rand = Math.random().toString(36).slice(2, 10)
  return `${Date.now()}-${rand}.${ext}`
}

async function uploadToBucket(bucket, file) {
  const fileName = randomFileName(file)
  const { error } = await supabase.storage.from(bucket).upload(fileName, file, {
    cacheControl: '3600',
    upsert: false,
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
