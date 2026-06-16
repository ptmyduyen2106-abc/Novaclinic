'use client'
// components/PharmacyQueue.tsx — Hàng chờ nhà thuốc

import { useState, useRef, useEffect } from 'react'
import { QueueCard }  from './QueueCard'
import { useQueue }   from '@/hooks/useQueue'

export function PharmacyQueue() {
  const { queue, loading, error, completeRecord, refresh } = useQueue()
  const [newIds,  setNewIds]  = useState<Set<string>>(new Set())
  const prevCountRef = useRef(0)

  useEffect(() => {
    if (queue.length > prevCountRef.current) {
      const newOnes = queue.slice(0, queue.length - prevCountRef.current)
      setNewIds((prev) => {
        const updated = new Set(prev)
        newOnes.forEach((r) => updated.add(r.id))
        return updated
      })
      setTimeout(() => {
        setNewIds((prev) => {
          const updated = new Set(prev)
          newOnes.forEach((r) => updated.delete(r.id))
          return updated
        })
      }, 10000)
    }
    prevCountRef.current = queue.length
  }, [queue])

  if (loading) return (
    <div className="space-y-3">
      {[1,2,3].map((i) => <div key={i} className="h-24 bg-slate-100 rounded-2xl animate-pulse" style={{ animationDelay: `${i*0.1}s` }} />)}
    </div>
  )

  if (error) return (
    <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
      <p className="text-red-600 text-sm">{error}</p>
      <button onClick={refresh} className="mt-2 text-xs text-red-600 underline hover:no-underline">Thử lại</button>
    </div>
  )

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${queue.length > 0 ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />
          <span className="text-sm font-medium text-slate-600">
            {queue.length === 0 ? 'Không có bệnh nhân chờ' : `${queue.length} bệnh nhân đang chờ`}
          </span>
        </div>
        <button onClick={refresh} className="text-xs text-slate-400 hover:text-blue-600 transition flex items-center gap-1">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Làm mới
        </button>
      </div>

      {queue.length === 0 && (
        <div className="text-center py-16 text-slate-400">
          <svg className="w-12 h-12 mx-auto mb-3 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-sm">Hàng chờ trống</p>
          <p className="text-xs mt-1">Đơn thuốc mới sẽ xuất hiện tức thì khi bác sĩ gửi</p>
        </div>
      )}

      {queue.map((record) => (
        <QueueCard key={record.id} record={record} onComplete={completeRecord} isNew={newIds.has(record.id)} />
      ))}
    </div>
  )
}
