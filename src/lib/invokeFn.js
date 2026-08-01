import { supabase } from './supabaseClient'

/**
 * فراخوانی امن Edge Function با نمایش پیام واقعی خطا
 * ---------------------------------------------------------------
 * supabase-js برای هر پاسخ غیر ۲xx فقط یک خطای کلی می‌دهد و متن پیام
 * سرور را داخل error.context (یک Response) نگه می‌دارد. بدون خواندن آن،
 * همه‌ی خطاها به‌صورت «ارتباط برقرار نشد» دیده می‌شوند و عیب‌یابی
 * غیرممکن می‌شود.
 */
export async function invokeFn(name, payload, fallbackMessage = 'ارتباط با سرور برقرار نشد.') {
  const { data, error } = await supabase.functions.invoke(name, { body: payload })

  if (error) {
    // تلاش برای خواندن پیام واقعی از بدنه‌ی پاسخ
    let serverMessage = null
    try {
      const res = error.context
      if (res && typeof res.json === 'function') {
        const body = await res.clone().json()
        serverMessage = body?.error || body?.message || null
      }
    } catch {
      /* اگر بدنه JSON نبود، پیام عمومی نمایش داده می‌شود */
    }

    if (serverMessage) throw new Error(serverMessage)

    // تشخیص حالت‌های رایج تا کاربر بداند دقیقا چه کند
    const status = error.context?.status
    if (status === 401) throw new Error('نشست شما منقضی شده است. لطفاً دوباره وارد شوید.')
    if (status === 403) throw new Error('دسترسی غیرمجاز. این عملیات فقط برای ادمین‌ها مجاز است.')
    throw new Error(error.message ? `${fallbackMessage} (${error.message})` : fallbackMessage)
  }

  if (data?.error) throw new Error(data.error)
  return data
}
