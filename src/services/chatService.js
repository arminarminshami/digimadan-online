import { supabase } from '../lib/supabaseClient'

// گفتگوی موجود بین خریدار و فروشنده برای یک آگهی را برمی‌گرداند؛ اگر نبود می‌سازد
export async function getOrCreateThread({ adId, buyerUserId, sellerUserId }) {
  const { data: existing, error: selectError } = await supabase
    .from('chat_threads')
    .select('*')
    .eq('ad_id', adId)
    .eq('buyer_user_id', buyerUserId)
    .eq('seller_user_id', sellerUserId)
    .maybeSingle()
  if (selectError) throw selectError
  if (existing) return existing

  const { data: created, error: insertError } = await supabase
    .from('chat_threads')
    .insert([{ ad_id: adId, buyer_user_id: buyerUserId, seller_user_id: sellerUserId }])
    .select()
    .single()
  if (insertError) throw insertError
  return created
}

// همه‌ی گفتگوهای کاربر (هم به‌عنوان خریدار، هم فروشنده)
export async function getThreadsForUser(authUserId) {
  const { data, error } = await supabase
    .from('chat_threads')
    .select('*, ads(title)')
    .or(`buyer_user_id.eq.${authUserId},seller_user_id.eq.${authUserId}`)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function getMessages(threadId) {
  const { data, error } = await supabase
    .from('chat_messages')
    .select('*')
    .eq('thread_id', threadId)
    .order('created_at', { ascending: true })
  if (error) throw error
  return data
}

export async function sendMessage({ threadId, senderUserId, content, fileUrl }) {
  const { data, error } = await supabase
    .from('chat_messages')
    .insert([{ thread_id: threadId, sender_user_id: senderUserId, content, file_url: fileUrl }])
    .select()
    .single()
  if (error) throw error
  return data
}

export async function markThreadMessagesRead(threadId, readerUserId) {
  const { error } = await supabase
    .from('chat_messages')
    .update({ read_at: new Date().toISOString() })
    .eq('thread_id', threadId)
    .neq('sender_user_id', readerUserId)
    .is('read_at', null)
  if (error) throw error
}

// گوش‌دادن بلادرنگ به پیام‌های جدید یک گفتگو
export function subscribeToThreadMessages(threadId, onNewMessage) {
  const channel = supabase
    .channel(`chat_messages:${threadId}`)
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `thread_id=eq.${threadId}` },
      (payload) => onNewMessage(payload.new)
    )
    .subscribe()

  return () => supabase.removeChannel(channel)
}
