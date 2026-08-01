import { supabase } from '../lib/supabaseClient'

function slugify(title) {
  return title
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\u0600-\u06FFa-zA-Z0-9-]/g, '')
    .slice(0, 80)
}

export async function getPublishedArticles({ limit } = {}) {
  let query = supabase
    .from('articles')
    .select('*')
    .eq('status', 'published')
    .order('created_at', { ascending: false })
  if (limit) query = query.limit(limit)
  const { data, error } = await query
  if (error) throw error
  return data
}

export async function getArticleBySlug(slug) {
  const { data, error } = await supabase
    .from('articles')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'published')
    .single()
  if (error) throw error
  return data
}

// ادمین: همه‌ی مقالات صرف‌نظر از وضعیت
export async function getAllArticles() {
  const { data, error } = await supabase
    .from('articles')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

// مقالات خودِ کاربر (در هر وضعیتی) برای پنل کاربری
export async function getMyArticles(authUserId) {
  const { data, error } = await supabase
    .from('articles')
    .select('*')
    .eq('author_user_id', authUserId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function submitArticle({ title, content, coverImageUrl, authorUserId, authorName }) {
  const slug = `${slugify(title)}-${Date.now().toString(36)}`
  const { data, error } = await supabase
    .from('articles')
    .insert([
      {
        title,
        slug,
        content,
        cover_image_url: coverImageUrl,
        author_user_id: authorUserId,
        // نام نویسنده همینجا ذخیره می‌شود چون جدول پروفایل برای بازدیدکننده‌ی
        // مهمان قابل خواندن نیست و بدون این، نام زیر مقاله نمایش داده نمی‌شد.
        author_name: authorName || null,
        status: 'pending',
      },
    ])
    .select()
    .single()
  if (error) throw error
  return data
}

// ویرایش مقاله‌ی خود کاربر (فقط تا وقتی منتشر نشده)؛ دوباره به صف بررسی می‌رود
export async function updateMyArticle(articleId, { title, content, coverImageUrl }) {
  const { data, error } = await supabase
    .from('articles')
    .update({
      title,
      content,
      cover_image_url: coverImageUrl,
      status: 'pending',
      rejection_reason: null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', articleId)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteMyArticle(articleId) {
  const { error } = await supabase.from('articles').delete().eq('id', articleId)
  if (error) throw error
  return true
}

// ادمین: ساخت مستقیم مقاله (بلافاصله منتشر می‌شود)
export async function createArticleAsAdmin({ title, content, coverImageUrl, authorUserId, authorName, status = 'published' }) {
  const slug = `${slugify(title)}-${Date.now().toString(36)}`
  const { data, error } = await supabase
    .from('articles')
    .insert([
      {
        title,
        slug,
        content,
        cover_image_url: coverImageUrl,
        author_user_id: authorUserId,
        author_name: authorName || null,
        status,
      },
    ])
    .select()
    .single()
  if (error) throw error
  return data
}

// ادمین: ویرایش کامل هر مقاله
export async function updateArticleAsAdmin(articleId, fields) {
  const { data, error } = await supabase
    .from('articles')
    .update({ ...fields, updated_at: new Date().toISOString() })
    .eq('id', articleId)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteArticle(articleId) {
  const { error } = await supabase.from('articles').delete().eq('id', articleId)
  if (error) throw error
  return true
}

export async function setArticleStatus(articleId, status, rejectionReason = null) {
  const { data, error } = await supabase
    .from('articles')
    .update({
      status,
      rejection_reason: status === 'rejected' ? rejectionReason : null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', articleId)
    .select()
    .single()
  if (error) throw error
  return data
}

// ------------------------------------------------------------
// اخبار معدنی (ورود دستی توسط ادمین، یا بعدا اتصال RSS)
// ------------------------------------------------------------
export async function getNewsItems({ limit } = {}) {
  let query = supabase.from('news_items').select('*').order('published_at', { ascending: false })
  if (limit) query = query.limit(limit)
  const { data, error } = await query
  if (error) throw error
  return data
}

export async function createNewsItem({ title, source, sourceUrl, summary }) {
  const { data, error } = await supabase
    .from('news_items')
    .insert([{ title, source, source_url: sourceUrl, summary }])
    .select()
    .single()
  if (error) throw error
  return data
}
