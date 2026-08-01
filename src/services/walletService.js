import { supabase } from '../lib/supabaseClient'
import { WALLET_POINTS } from '../lib/constants'

// کیف‌پول کاربر را برمی‌گرداند؛ اگر هنوز ساخته نشده، یکی با موجودی صفر می‌سازد
export async function getOrCreateWallet(authUserId) {
  const { data: existing, error: selectError } = await supabase
    .from('wallet_accounts')
    .select('*')
    .eq('auth_user_id', authUserId)
    .maybeSingle()
  if (selectError) throw selectError
  if (existing) return existing

  const { data: created, error: insertError } = await supabase
    .from('wallet_accounts')
    .insert([{ auth_user_id: authUserId, points_balance: 0 }])
    .select()
    .single()
  if (insertError) throw insertError
  return created
}

export async function getWalletTransactions(authUserId) {
  const { data, error } = await supabase
    .from('wallet_transactions')
    .select('*')
    .eq('auth_user_id', authUserId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

// واریز امتیاز + به‌روزرسانی موجودی (در یک تابع، برای جلوگیری از ناهماهنگی)
export async function awardPoints(authUserId, reason, relatedAdId = null) {
  const pointsMap = {
    ad_registration: WALLET_POINTS.AD_REGISTRATION,
    successful_transaction: WALLET_POINTS.SUCCESSFUL_TRANSACTION,
    identity_verification: WALLET_POINTS.IDENTITY_VERIFICATION,
    referral: WALLET_POINTS.REFERRAL,
  }
  const amount = pointsMap[reason]
  if (!amount) throw new Error('دلیل واریز امتیاز نامعتبر است.')

  const wallet = await getOrCreateWallet(authUserId)

  const { error: txError } = await supabase
    .from('wallet_transactions')
    .insert([{ auth_user_id: authUserId, amount, reason, related_ad_id: relatedAdId }])
  if (txError) throw txError

  const { data: updated, error: updateError } = await supabase
    .from('wallet_accounts')
    .update({ points_balance: wallet.points_balance + amount, updated_at: new Date().toISOString() })
    .eq('auth_user_id', authUserId)
    .select()
    .single()
  if (updateError) throw updateError
  return updated
}
