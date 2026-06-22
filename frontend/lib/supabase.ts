// ─────────────────────────────────────────────
// lib/supabase.ts — Supabase client + DB helpers
// ─────────────────────────────────────────────
import { createBrowserClient } from '@supabase/ssr'
import type { PatientRecord, Expense, InventoryItem, User } from '@/types'

const supabaseUrl     = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey, {
  realtime: { params: { eventsPerSecond: 10 } },
})

// ─────────────────────────────────────────────
// Row mapper: snake_case → camelCase
// ─────────────────────────────────────────────
function mapRowToRecord(row: Record<string, unknown>): PatientRecord {
  return {
    id:           row.id as string,
    patientName:  row.patient_name as string,
    yearOfBirth:  row.year_of_birth as number,
    weight:       row.weight as number | undefined,
    phone:        row.phone as string | undefined,
    diagnosis:    row.diagnosis as string,
    prescription: (row.prescription as PatientRecord['prescription']) ?? [],
    services:     (row.services as PatientRecord['services']) ?? [],
    serviceNote:  row.service_note as string | undefined,
    totalPrice:   row.total_price as number,
    advice:       row.advice as string | undefined,
    pharmacyNote: row.pharmacy_note as string | undefined,
    status:       row.status as PatientRecord['status'],
    doctorId:     row.doctor_id as string,
    doctorName:   (row.users as { name: string } | null)?.name,
    createdAt:    row.created_at as string,
    completedAt:  row.completed_at as string | undefined,
  }
}

// ─────────────────────────────────────────────
// PatientRecord helpers (Supabase trực tiếp)
// ─────────────────────────────────────────────

export async function fetchPendingQueue(): Promise<PatientRecord[]> {
  const { data, error } = await supabase
    .from('patient_records')
    .select('*, users(name)')
    .eq('status', 'pending')
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []).map(mapRowToRecord)
}

export async function fetchAllRecords(limit = 50): Promise<PatientRecord[]> {
  const { data, error } = await supabase
    .from('patient_records')
    .select('*, users(name)')
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) throw error
  return (data ?? []).map(mapRowToRecord)
}

export async function fetchRecordsByPatientPhone(phone: string): Promise<PatientRecord[]> {
  const { data, error } = await supabase
    .from('patient_records')
    .select('*, users(name)')
    .eq('phone', phone)
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []).map(mapRowToRecord)
}

export async function insertPatientRecord(
  record: Omit<PatientRecord, 'id' | 'createdAt' | 'completedAt'>
): Promise<PatientRecord> {
  const row = {
    patient_name:  record.patientName,
    year_of_birth: record.yearOfBirth,
    weight:        record.weight,
    phone:         record.phone,
    diagnosis:     record.diagnosis,
    prescription:  record.prescription,
    services:      record.services,
    service_note:  record.serviceNote,
    total_price:   record.totalPrice,
    advice:        record.advice,
    status:        record.status,
    doctor_id:     record.doctorId,
    created_at:    new Date().toISOString(),
  }
  const { data, error } = await supabase
    .from('patient_records')
    .insert([row])
    .select()
    .single()
  if (error) throw error
  return mapRowToRecord(data)
}

export async function updatePatientRecord(
  id: string,
  updates: Partial<PatientRecord>
): Promise<PatientRecord> {
  const { data, error } = await supabase
    .from('patient_records')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return mapRowToRecord(data)
}

export async function completePatientRecord(
  id: string,
  pharmacyNote?: string
): Promise<void> {
  const { error } = await supabase
    .from('patient_records')
    .update({
      status:        'done',
      pharmacy_note: pharmacyNote,
      completed_at:  new Date().toISOString(),
    })
    .eq('id', id)
  if (error) throw error
}

// ─────────────────────────────────────────────
// Finance helpers (Supabase trực tiếp)
// ─────────────────────────────────────────────

export async function fetchExpenses(month?: string): Promise<Expense[]> {
  let query = supabase.from('expenses').select('*').order('date', { ascending: false })
  if (month) {
    query = query.gte('date', `${month}-01`).lte('date', `${month}-31`)
  }
  const { data, error } = await query
  if (error) throw error
  return (data ?? []).map((row) => ({
    id:        row.id,
    date:      row.date,
    amount:    row.amount,
    detail:    row.detail,
    createdBy: row.created_by,
    createdAt: row.created_at,
  }))
}

export async function insertExpense(
  expense: Omit<Expense, 'id' | 'createdAt'>
): Promise<Expense> {
  const { data, error } = await supabase
    .from('expenses')
    .insert([{
      date:       expense.date,
      amount:     expense.amount,
      detail:     expense.detail,
      created_by: expense.createdBy,
      created_at: new Date().toISOString(),
    }])
    .select()
    .single()
  if (error) throw error
  return {
    id:        data.id,
    date:      data.date,
    amount:    data.amount,
    detail:    data.detail,
    createdBy: data.created_by,
    createdAt: data.created_at,
  }
}

export async function fetchInventory(month?: string): Promise<InventoryItem[]> {
  let query = supabase.from('inventory').select('*').order('date', { ascending: false })
  if (month) {
    query = query.gte('date', `${month}-01`).lte('date', `${month}-31`)
  }
  const { data, error } = await query
  if (error) throw error
  return (data ?? []).map((row) => ({
    id:            row.id,
    date:          row.date,
    invoiceNumber: row.invoice_number,
    itemType:      row.item_type,
    amount:        row.amount,
    paymentMethod: row.payment_method,
    note:          row.note,
    createdAt:     row.created_at,
  }))
}

export async function insertInventoryItem(
  item: Omit<InventoryItem, 'id' | 'createdAt'>
): Promise<InventoryItem> {
  const { data, error } = await supabase
    .from('inventory')
    .insert([{
      date:           item.date,
      invoice_number: item.invoiceNumber,
      item_type:      item.itemType,
      amount:         item.amount,
      payment_method: item.paymentMethod,
      note:           item.note,
      created_at:     new Date().toISOString(),
    }])
    .select()
    .single()
  if (error) throw error
  return {
    id:            data.id,
    date:          data.date,
    invoiceNumber: data.invoice_number,
    itemType:      data.item_type,
    amount:        data.amount,
    paymentMethod: data.payment_method,
    note:          data.note,
    createdAt:     data.created_at,
  }
}

// ─────────────────────────────────────────────
// Auth helpers
// ─────────────────────────────────────────────

export async function getCurrentUser(): Promise<User | null> {
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return null
  const { data, error } = await supabase
    .from('users').select('*').eq('id', user.id).single()
  if (error || !data) return null
  return data as User
}

export async function signInWithEmail(email: string, password: string): Promise<void> {
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error
}

export async function signOut(): Promise<void> {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

// ─────────────────────────────────────────────
// Backend API client (C++ server)
// ─────────────────────────────────────────────

const API_URL = process.env.NEXT_PUBLIC_API_URL!

export async function apiFetch<T = unknown>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const { data: { session } } = await supabase.auth.getSession()
  const token = session?.access_token

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  })

  const text = await res.text()

  if (!text || text.trim() === '') {
    if (res.ok) return undefined as T
    throw new Error(`HTTP ${res.status}: empty response`)
  }

  let json: { success?: boolean; data?: T; error?: string; message?: string }
  try {
    json = JSON.parse(text)
  } catch {
    throw new Error(`Invalid JSON from server (${res.status}): ${text.slice(0, 120)}`)
  }

  if (!res.ok || json.success === false) {
    throw new Error(json.error ?? json.message ?? `HTTP ${res.status}`)
  }

  return (json.data ?? json) as T
}

// ── Patient records (qua backend) ─────────────
export async function apiFetchPendingQueue(): Promise<PatientRecord[]> {
  return apiFetch<PatientRecord[]>('/api/records/queue')
}

export async function apiFetchAllRecords(limit = 50): Promise<PatientRecord[]> {
  return apiFetch<PatientRecord[]>(`/api/records?limit=${limit}`)
}

export async function apiFetchRecordById(id: string): Promise<PatientRecord> {
  return apiFetch<PatientRecord>(`/api/records/${id}`)
}

export async function apiSearchRecords(params: { name?: string; phone?: string }): Promise<PatientRecord[]> {
  const qs = new URLSearchParams(params as Record<string, string>).toString()
  return apiFetch<PatientRecord[]>(`/api/records/search?${qs}`)
}

export async function apiCreateRecord(
  record: Omit<PatientRecord, 'id' | 'createdAt' | 'completedAt' | 'doctorId' | 'totalPrice'>
): Promise<PatientRecord> {
  return apiFetch<PatientRecord>('/api/records', {
    method: 'POST',
    body: JSON.stringify(record),
  })
}

export async function apiCompleteRecord(id: string, pharmacyNote?: string): Promise<void> {
  await apiFetch(`/api/records/${id}/complete`, {
    method: 'PATCH',
    body: JSON.stringify({ pharmacyNote }),
  })
}

export async function apiCancelRecord(id: string): Promise<void> {
  await apiFetch(`/api/records/${id}/cancel`, { method: 'PATCH' })
}

// ── Users (qua backend) ────────────────────────
export async function apiFetchUsers(role?: string): Promise<User[]> {
  const qs = role ? `?role=${role}` : ''
  return apiFetch<User[]>(`/api/users${qs}`)
}

export async function apiFetchUserById(id: string): Promise<User> {
  return apiFetch<User>(`/api/users/${id}`)
}

export async function apiCreateUser(user: { id: string; name: string; role: string }): Promise<User> {
  return apiFetch<User>('/api/users', {
    method: 'POST',
    body: JSON.stringify(user),
  })
}

export async function apiGetMe(): Promise<User> {
  return apiFetch<User>('/api/auth/me')
}

// ── Finance (qua backend) ──────────────────────
export async function apiFetchExpenses(month?: string): Promise<Expense[]> {
  const qs = month ? `?month=${month}` : ''
  return apiFetch<Expense[]>(`/api/finance/expenses${qs}`)
}

// ✅ FIX: Nhận đủ createdBy, map sang created_by trước khi gửi backend
export async function apiCreateExpense(
  expense: Omit<Expense, 'id' | 'createdAt'>
): Promise<Expense> {
  return apiFetch<Expense>('/api/finance/expenses', {
    method: 'POST',
    body: JSON.stringify({
      date:       expense.date,
      amount:     expense.amount,
      detail:     expense.detail,
      created_by: expense.createdBy,  // camelCase → snake_case
    }),
  })
}

export async function apiFetchInventory(month?: string): Promise<InventoryItem[]> {
  const qs = month ? `?month=${month}` : ''
  return apiFetch<InventoryItem[]>(`/api/finance/inventory${qs}`)
}

export async function apiCreateInventoryItem(
  item: Omit<InventoryItem, 'id' | 'createdAt'>
): Promise<InventoryItem> {
  return apiFetch<InventoryItem>('/api/finance/inventory', {
    method: 'POST',
    body: JSON.stringify(item),
  })
}

export async function apiFetchFinanceSummary(month?: string): Promise<{
  month: string
  totalRevenue: number
  totalExpenses: number
  totalInventory: number
  netProfit: number
  patientCount: number
}> {
  const qs = month ? `?month=${month}` : ''
  return apiFetch(`/api/finance/summary${qs}`)
}