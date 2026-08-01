import { supabase } from '../lib/supabaseClient'

// ============================================================
// معماری دستیار هوش مصنوعی
// طبق توافق پروژه: ساختار کامل (مکالمه، پیام، حافظه) از الان ساخته می‌شود.
// خود تماس با مدل هوش مصنوعی واقعی، بعدا که کلید API را در پنل ادمین
// وارد کردید، در تابع callAiModel() پایین همین فایل وصل می‌شود.
// ============================================================

export async function getAiConfig() {
  const { data, error } = await supabase.from('ai_config').select('*').limit(1).single()
  if (error) throw error
  return data
}

export async function updateAiConfig(updates) {
  const config = await getAiConfig()
  const { data, error } = await supabase
    .from('ai_config')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', config.id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function createConversation(authUserId, title = 'گفتگوی جدید') {
  const { data, error } = await supabase
    .from('ai_conversations')
    .insert([{ auth_user_id: authUserId, title }])
    .select()
    .single()
  if (error) throw error
  return data
}

export async function getConversations(authUserId) {
  const { data, error } = await supabase
    .from('ai_conversations')
    .select('*')
    .eq('auth_user_id', authUserId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function getMessages(conversationId) {
  const { data, error } = await supabase
    .from('ai_messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })
  if (error) throw error
  return data
}

async function saveMessage(conversationId, role, content) {
  const { data, error } = await supabase
    .from('ai_messages')
    .insert([{ conversation_id: conversationId, role, content }])
    .select()
    .single()
  if (error) throw error
  return data
}

// نقطه‌ی اتصال آینده به مدل هوش مصنوعی واقعی.
// در حال حاضر کلید API وارد نشده، پس فقط یک پاسخ روشن و صادقانه برمی‌گرداند
// (به‌جای داده‌ی ساختگی که جای پاسخ واقعی هوش مصنوعی را بگیرد).
async function callAiModel({ config, conversationHistory, userMessage }) {
  if (!config.is_enabled || !config.api_key) {
    return 'دستیار هوش مصنوعی هنوز به یک سرویس واقعی وصل نشده است. این پیام شما ذخیره شد و به‌محض اتصال کلید API در پنل ادمین، پاسخ‌دهی فعال خواهد شد.'
  }

  // -----------------------------------------------------------------
  // TODO (بعد از دریافت کلید API واقعی): اینجا تماس واقعی با مدل زبانی
  // (مثلا Anthropic/Claude API) با conversationHistory و userMessage
  // پیاده‌سازی می‌شود. ساختار داده (ai_conversations/ai_messages) از
  // همین الان آماده‌ی این اتصال است.
  // -----------------------------------------------------------------
  throw new Error('اتصال واقعی به مدل هوش مصنوعی هنوز پیاده‌سازی نشده است.')
}

export async function sendUserMessage(conversationId, userMessage) {
  await saveMessage(conversationId, 'user', userMessage)

  const config = await getAiConfig()
  const history = await getMessages(conversationId)

  let assistantReply
  try {
    assistantReply = await callAiModel({ config, conversationHistory: history, userMessage })
  } catch {
    assistantReply = 'دستیار هوش مصنوعی هنوز به یک سرویس واقعی وصل نشده است. این پیام شما ذخیره شد و به‌محض اتصال کلید API در پنل ادمین، پاسخ‌دهی فعال خواهد شد.'
  }

  return saveMessage(conversationId, 'assistant', assistantReply)
}
