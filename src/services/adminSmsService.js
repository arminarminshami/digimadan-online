import { supabase } from '../lib/supabaseClient'
import { invokeFn } from '../lib/invokeFn'

async function callBulkSms(payload) {
  return invokeFn('admin-bulk-sms', payload, 'ارتباط با سرویس پیامک برقرار نشد.')
}

// ارسال پیام دلخواه به فهرستی از شماره‌ها
export async function sendBulkSms({ text, phones }) {
  return callBulkSms({ action: 'send', text, phones })
}

// استعلام وضعیت تحویل واقعی پیام‌های یک کمپین
export async function checkCampaignDelivery(campaignId) {
  return callBulkSms({ action: 'check_delivery', campaignId })
}

// فهرست کمپین‌های ارسال‌شده
export async function getCampaigns() {
  const { data, error } = await supabase
    .from('sms_campaigns')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50)
  if (error) throw error
  return data
}

// جزئیات گیرندگان یک کمپین (وضعیت ارسال و تحویل هر شماره)
export async function getCampaignRecipients(campaignId) {
  const { data, error } = await supabase
    .from('sms_log')
    .select('id, phone, status, delivery_status, delivery_checked_at, provider_response')
    .eq('campaign_id', campaignId)
    .order('created_at', { ascending: true })
  if (error) throw error
  return data
}
