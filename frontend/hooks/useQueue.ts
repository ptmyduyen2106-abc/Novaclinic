// hooks/useQueue.ts — Real-time pharmacy queue
import { useState, useEffect, useCallback } from 'react'
import { apiFetchPendingQueue, apiCompleteRecord } from '@/lib/supabase'
import { subscribeToNewPatients, subscribeToPatientUpdates } from '@/lib/realtime'
import type { PatientRecord } from '@/types'

interface UseQueueReturn {
  queue:          PatientRecord[]
  loading:        boolean
  error:          string | null
  completeRecord: (id: string, pharmacyNote?: string) => Promise<void>
  refresh:        () => Promise<void>
}

export function useQueue(): UseQueueReturn {
  const [queue,   setQueue]   = useState<PatientRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState<string | null>(null)

  const loadQueue = useCallback(async () => {
    try {
      setLoading(true); setError(null)
      setQueue(await apiFetchPendingQueue())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lỗi tải hàng chờ')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadQueue()

    const unsubInsert = subscribeToNewPatients((newRecord) => {
      setQueue((prev) => prev.some((r) => r.id === newRecord.id)
        ? prev : [newRecord, ...prev])
    })

    const unsubUpdate = subscribeToPatientUpdates((updated) => {
      setQueue((prev) => {
        if (updated.status === 'done' || updated.status === 'cancelled')
          return prev.filter((r) => r.id !== updated.id)
        return prev.map((r) => r.id === updated.id ? { ...r, ...updated } : r)
      })
    })

    return () => { unsubInsert(); unsubUpdate() }
  }, [loadQueue])

  const completeRecord = useCallback(async (id: string, pharmacyNote?: string) => {
    try {
      await apiCompleteRecord(id, pharmacyNote)
      setQueue((prev) => prev.filter((r) => r.id !== id))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lỗi hoàn tất')
      throw err
    }
  }, [])

  return { queue, loading, error, completeRecord, refresh: loadQueue }
}