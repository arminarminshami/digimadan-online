import { supabase } from '../lib/supabaseClient'

// بخش «تجهیزات آزمایشگاهی»: معرفی هلدینگ، شرکت‌های زیرمجموعه و دستگاه‌ها.
// خواندن برای همه آزاد است؛ نوشتن فقط برای ادمین (RLS با is_admin()).

async function loadLab({ onlyActive }) {
  let holdingQ = supabase.from('lab_holdings').select('*').order('sort_order', { ascending: true }).limit(1)
  if (onlyActive) holdingQ = holdingQ.eq('is_active', true)
  const { data: holdings, error } = await holdingQ
  if (error) throw error
  const holding = holdings?.[0]
  if (!holding) return null

  let companiesQ = supabase
    .from('lab_holding_companies')
    .select('*')
    .eq('holding_id', holding.id)
    .order('sort_order', { ascending: true })
  let equipmentQ = supabase
    .from('lab_equipment')
    .select('*')
    .eq('holding_id', holding.id)
    .order('sort_order', { ascending: true })
  if (onlyActive) {
    companiesQ = companiesQ.eq('is_active', true)
    equipmentQ = equipmentQ.eq('is_active', true)
  }
  const [{ data: companies, error: e1 }, { data: equipment, error: e2 }] = await Promise.all([companiesQ, equipmentQ])
  if (e1) throw e1
  if (e2) throw e2
  return { holding, companies: companies || [], equipment: equipment || [] }
}

export const getPublicLab = () => loadLab({ onlyActive: true })
export const getAdminLab = () => loadLab({ onlyActive: false })

export async function updateHolding(id, fields) {
  const { data, error } = await supabase
    .from('lab_holdings')
    .update({ ...fields, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function createCompany(fields) {
  const { data, error } = await supabase.from('lab_holding_companies').insert([fields]).select().single()
  if (error) throw error
  return data
}

export async function updateCompany(id, fields) {
  const { data, error } = await supabase.from('lab_holding_companies').update(fields).eq('id', id).select().single()
  if (error) throw error
  return data
}

export async function deleteCompany(id) {
  const { error } = await supabase.from('lab_holding_companies').delete().eq('id', id)
  if (error) throw error
}

export async function createEquipment(fields) {
  const { data, error } = await supabase.from('lab_equipment').insert([fields]).select().single()
  if (error) throw error
  return data
}

export async function updateEquipment(id, fields) {
  const { data, error } = await supabase
    .from('lab_equipment')
    .update({ ...fields, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteEquipment(id) {
  const { error } = await supabase.from('lab_equipment').delete().eq('id', id)
  if (error) throw error
}
