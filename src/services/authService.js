import { supabase } from '../lib/supabaseClient'

// --- Current: single owner login via Supabase Auth (email + password) ---
// The admin_users table stores profile/role info linked to the Supabase Auth user.
// This keeps real credential storage inside Supabase Auth (secure, hashed)
// while admin_users lets us track roles for when more admins are added later.

export async function loginWithPassword(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error
  return data
}

export async function logout() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
  return true
}

export async function getCurrentSession() {
  const { data, error } = await supabase.auth.getSession()
  if (error) throw error
  return data.session
}

export function onAuthStateChange(callback) {
  const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
    callback(session, event)
  })
  return () => listener.subscription.unsubscribe()
}

export async function getAdminProfile(userId) {
  const { data, error } = await supabase
    .from('admin_users')
    .select('*')
    .eq('auth_user_id', userId)
    .maybeSingle()
  if (error) throw error
  return data
}

// --- Prepared for future: user self-registration ---
// Not exposed in the UI yet. Kept here so enabling it later is a UI change,
// not a re-architecture. Requires enabling email signups in Supabase Auth settings.
export async function registerWithPassword(email, password) {
  const { data, error } = await supabase.auth.signUp({ email, password })
  if (error) throw error
  return data
}

// --- Prepared for future: SMS OTP login ---
// Requires configuring an SMS provider (e.g. Kavenegar via Supabase phone auth,
// or a custom Edge Function) in the Supabase project before this will work.
export async function requestSmsOtp(phone) {
  const { data, error } = await supabase.auth.signInWithOtp({ phone })
  if (error) throw error
  return data
}

export async function verifySmsOtp(phone, token) {
  const { data, error } = await supabase.auth.verifyOtp({ phone, token, type: 'sms' })
  if (error) throw error
  return data
}
