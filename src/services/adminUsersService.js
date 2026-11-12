import { supabase } from '../lib/supabaseClient'
import { invokeFn } from '../lib/invokeFn'

async function callAdminUsers(payload) {
  return invokeFn('admin-users', payload, 'ارتباط با سرویس مدیریت کاربران برقرار نشد.')
}

export async function listUsers({ page = 1, perPage = 20, search = '' } = {}) {
  return callAdminUsers({ action: 'list', page, perPage, search })
}

export async function getUser(authUserId) {
  return callAdminUsers({ action: 'get', authUserId })
}

export async function createUser(fields) {
  return callAdminUsers({ action: 'create', ...fields })
}

export async function updateUserProfile(authUserId, profile, phone) {
  return callAdminUsers({ action: 'update', authUserId, profile, phone })
}

export async function blockUser(authUserId) {
  return callAdminUsers({ action: 'block', authUserId })
}

export async function unblockUser(authUserId) {
  return callAdminUsers({ action: 'unblock', authUserId })
}
