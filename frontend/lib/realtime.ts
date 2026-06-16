// ─────────────────────────────────────────────
// lib/realtime.ts — Supabase Realtime helpers
// ─────────────────────────────────────────────

import { supabase } from './supabase'
import type { PatientRecord } from '@/types'

type QueueCallback  = (record: PatientRecord) => void
type UpdateCallback = (record: PatientRecord) => void

export function subscribeToNewPatients(onInsert: QueueCallback) {
  const channel = supabase
    .channel('patient-inserts')
    .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'patient_records' },
        (payload) => onInsert(payload.new as PatientRecord))
    .subscribe()
  return () => supabase.removeChannel(channel)
}

export function subscribeToPatientUpdates(onUpdate: UpdateCallback) {
  const channel = supabase
    .channel('patient-updates')
    .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'patient_records' },
        (payload) => onUpdate(payload.new as PatientRecord))
    .subscribe()
  return () => supabase.removeChannel(channel)
}

export function subscribeToAllPatientChanges(
  onInsert: QueueCallback,
  onUpdate: UpdateCallback
) {
  const channel = supabase
    .channel('patient-all-changes')
    .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'patient_records' },
        (payload) => onInsert(payload.new as PatientRecord))
    .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'patient_records' },
        (payload) => onUpdate(payload.new as PatientRecord))
    .subscribe()
  return () => supabase.removeChannel(channel)
}

export function subscribeToExpenses(onInsert: (row: unknown) => void) {
  const channel = supabase
    .channel('expense-inserts')
    .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'expenses' },
        (payload) => onInsert(payload.new))
    .subscribe()
  return () => supabase.removeChannel(channel)
}

// Queue number updates (for patient-facing queue display)
export function subscribeToQueueUpdates(onUpdate: (row: unknown) => void) {
  const channel = supabase
    .channel('queue-updates')
    .on('postgres_changes',
        { event: '*', schema: 'public', table: 'queue_numbers' },
        (payload) => onUpdate(payload.new))
    .subscribe()
  return () => supabase.removeChannel(channel)
}
