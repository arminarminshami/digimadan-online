import { supabase } from '../lib/supabaseClient'

const TABLE = 'pages'

export async function getPageBySlug(slug) {
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .eq('slug', slug)
    .maybeSingle()
  if (error) throw error
  return data
}

export async function getAllPages() {
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .order('updated_at', { ascending: false })
  if (error) throw error
  return data
}

export async function createPage(page) {
  const { data, error } = await supabase.from(TABLE).insert([page]).select().single()
  if (error) throw error
  return data
}

export async function updatePage(id, updates) {
  const { data, error } = await supabase
    .from(TABLE)
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deletePage(id) {
  const { error } = await supabase.from(TABLE).delete().eq('id', id)
  if (error) throw error
  return true
}
