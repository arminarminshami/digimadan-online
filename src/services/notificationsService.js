import { supabase } from '../lib/supabaseClient'

export async function getNotifications(authUserId, { onlyUnread } = {}) {
  let query = supabase
    .from('notifications')
    .select('*')
    .eq('auth_user_id', authUserId)
    .order('created_at', { ascending: false })
  if (onlyUnread) query = query.is('read_at', null)
  const { data, error } = await query
  if (error) throw error
  return data
}

export async function getUnreadCount(authUserId) {
  const { count, error } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('auth_user_id', authUserId)
    .is('read_at', null)
  if (error) throw error
  return count ?? 0
}

export async function markAsRead(notificationId) {
  const { error } = await supabase
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('id', notificationId)
  if (error) throw error
}

export async function markAllAsRead(authUserId) {
  const { error } = await supabase
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('auth_user_id', authUserId)
    .is('read_at', null)
  if (error) throw error
}

// ادمین یا سرویس‌های دیگر از این برای ساختن اعلان جدید استفاده می‌کنند
export async function createNotification({ authUserId, type, title, body, linkUrl }) {
  const { data, error } = await supabase
    .from('notifications')
    .insert([{ auth_user_id: authUserId, type, title, body, link_url: linkUrl }])
    .select()
    .single()
  if (error) throw error
  return data
}

// گوش‌دادن به اعلان‌های جدید برای یک کاربر، به‌صورت بلادرنگ
export function subscribeToNotifications(authUserId, onNewNotification) {
  const channel = supabase
    .channel(`notifications:${authUserId}`)
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'notifications', filter: `auth_user_id=eq.${authUserId}` },
      (payload) => onNewNotification(payload.new)
    )
    .subscribe()

  return () => supabase.removeChannel(channel)
}
