'use client'
// components/QueueCard.tsx — Thẻ bệnh nhân hàng chờ

import { useState }  from 'react'
import { RxBuilder } from './RxBuilder'
import type { PatientRecord } from '@/types'

interface QueueCardProps {
  record:     PatientRecord
  onComplete: (id: string, pharmacyNote: string) => Promise<void>
  isNew?:     boolean
}

export function QueueCard({ record, onComplete, isNew = false }: QueueCardProps) {
  const [expanded,     setExpanded]     = useState(isNew)
  const [pharmacyNote, setPharmacyNote] = useState(record.pharmacyNote ?? '')
  const [completing,   setCompleting]   = useState(false)

  const age         = record.yearOfBirth ? new Date().getFullYear() - record.yearOfBirth : null
  const waitMinutes = Math.floor((Date.now() - new Date(record.createdAt).getTime()) / 60000)

  async function handleComplete() {
    setCompleting(true)
    try   { await onComplete(record.id, pharmacyNote) }
    catch { setCompleting(false) }
  }

  return (
    <div className={`bg-white rounded-2xl border shadow-sm overflow-hidden transition-all ${
      isNew ? 'border-blue-300 ring-2 ring-blue-100 animate-slideIn' : 'border-slate-200'
    }`}>
      {/* Header */}
      <div className="flex items-start gap-3 p-4 cursor-pointer hover:bg-slate-50 transition"
           onClick={() => setExpanded((v) => !v)}>
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
          {record.patientName.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold text-slate-800 text-sm">{record.patientName}</h3>
            {isNew && <span className="text-[10px] bg-blue-100 text-blue-700 font-semibold px-2 py-0.5 rounded-full animate-pulse">MỚI</span>}
          </div>
          <p className="text-xs text-slate-500 mt-0.5 truncate">
            {age ? `${age} tuổi` : ''}{record.phone ? ` · ${record.phone}` : ''}{record.weight ? ` · ${record.weight}kg` : ''}
          </p>
          <p className="text-xs text-slate-600 mt-1 font-medium truncate">{record.diagnosis}</p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-xs text-slate-400">{waitMinutes < 60 ? `${waitMinutes} phút trước` : `${Math.floor(waitMinutes/60)}h trước`}</p>
          <p className="text-xs font-semibold text-emerald-600 mt-1">{record.totalPrice.toLocaleString('vi-VN')}đ</p>
          <p className="text-xs text-slate-400 mt-1">{expanded ? '▲' : '▼'}</p>
        </div>
      </div>

      {/* Expanded */}
      {expanded && (
        <div className="border-t border-slate-100 px-4 pb-4 space-y-4">
          <div className="pt-3">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Chẩn đoán</p>
            <p className="text-sm text-slate-700">{record.diagnosis}</p>
            {record.advice && <p className="text-xs text-slate-500 mt-1 italic">Lời dặn: {record.advice}</p>}
          </div>

          {record.services?.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Dịch vụ</p>
              <div className="flex flex-wrap gap-1">
                {record.services.map((svc, i) => (
                  <span key={i} className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-lg">
                    {svc.name} — {svc.price.toLocaleString('vi-VN')}đ
                  </span>
                ))}
              </div>
              {record.serviceNote && <p className="text-xs text-slate-500 mt-1">{record.serviceNote}</p>}
            </div>
          )}

          {record.prescription?.length > 0 && (
            <div>
              <RxBuilder items={record.prescription} onChange={() => {}} readOnly />
            </div>
          )}

          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1 block">
              Ghi chú của nhà thuốc
            </label>
            <textarea value={pharmacyNote} onChange={(e) => setPharmacyNote(e.target.value)}
              placeholder="Thay Amoxicillin 500mg bằng Augmentin 625mg do hết hàng…" rows={2}
              className="w-full text-sm px-3 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-400 resize-none bg-slate-50" />
          </div>

          <div className="bg-slate-50 rounded-xl p-3 flex justify-between items-center">
            <div className="text-xs text-slate-500 space-y-0.5">
              <div>Thuốc: <span className="font-medium text-slate-700">{record.prescription.reduce((s,p)=>s+p.quantity*p.unitPrice,0).toLocaleString('vi-VN')}đ</span></div>
              <div>Dịch vụ: <span className="font-medium text-slate-700">{record.services.reduce((s,sv)=>s+sv.price,0).toLocaleString('vi-VN')}đ</span></div>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-500">Tổng</p>
              <p className="text-lg font-bold text-emerald-600">{record.totalPrice.toLocaleString('vi-VN')}đ</p>
            </div>
          </div>

          <button onClick={handleComplete} disabled={completing}
            className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white text-sm font-semibold rounded-xl transition flex items-center justify-center gap-2">
            {completing
              ? <><svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.37 0 0 5.37 0 12h4z"/></svg>Đang xử lý…</>
              : <>✓ Đã giao thuốc &amp; Thu tiền</>}
          </button>
        </div>
      )}
    </div>
  )
}
