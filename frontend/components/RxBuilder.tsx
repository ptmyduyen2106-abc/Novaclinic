'use client'
// components/RxBuilder.tsx — Kê đơn thuốc

import { useState } from 'react'
import type { PrescriptionItem } from '@/types'

interface RxBuilderProps {
  items:    PrescriptionItem[]
  onChange: (items: PrescriptionItem[]) => void
  readOnly?: boolean
}

const EMPTY_ITEM: PrescriptionItem = { drugName: '', dosage: '', quantity: 1, instruction: '', unitPrice: 0 }
const DOSAGE_PRESETS      = ['1v x 2/ngày', '1v x 3/ngày', '2v x 2/ngày', '1/2v x 2/ngày']
const INSTRUCTION_PRESETS = ['Uống sau ăn', 'Uống trước ăn 30 phút', 'Uống khi đói', 'Ngậm dưới lưỡi', 'Bôi ngoài da']

export function RxBuilder({ items, onChange, readOnly = false }: RxBuilderProps) {
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null)

  const addItem    = () => { onChange([...items, { ...EMPTY_ITEM }]); setExpandedIdx(items.length) }
  const removeItem = (i: number) => { onChange(items.filter((_, idx) => idx !== i)); if (expandedIdx === i) setExpandedIdx(null) }
  const updateItem = (i: number, field: keyof PrescriptionItem, value: string | number) =>
    onChange(items.map((item, idx) => idx === i ? { ...item, [field]: value } : item))

  const totalDrugCost = items.reduce((s, p) => s + p.quantity * p.unitPrice, 0)

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
          <span className="w-5 h-5 rounded-md bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-bold">Rx</span>
          Toa thuốc
          {items.length > 0 && (
            <span className="bg-slate-100 text-slate-600 text-xs px-1.5 py-0.5 rounded-full">{items.length} thuốc</span>
          )}
        </h3>
        {!readOnly && (
          <button type="button" onClick={addItem}
            className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-2.5 py-1.5 rounded-lg transition">
            <span className="text-base leading-none">+</span> Thêm thuốc
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <div className="text-center py-6 text-sm text-slate-400 border-2 border-dashed border-slate-200 rounded-xl">
          {readOnly ? 'Không có thuốc kê đơn' : 'Chưa có thuốc — bấm "Thêm thuốc"'}
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((item, idx) => (
            <div key={idx} className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm">
              <div
                className={`flex items-center gap-3 px-3 py-2.5 ${!readOnly ? 'cursor-pointer hover:bg-slate-50' : ''} transition`}
                onClick={() => !readOnly && setExpandedIdx(expandedIdx === idx ? null : idx)}
              >
                <span className="w-6 h-6 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold flex items-center justify-center shrink-0">{idx + 1}</span>
                {readOnly ? (
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">{item.drugName || '—'}</p>
                    <p className="text-xs text-slate-500">{item.dosage} · SL: {item.quantity} · {item.instruction}</p>
                  </div>
                ) : (
                  <input type="text" value={item.drugName}
                    onChange={(e) => updateItem(idx, 'drugName', e.target.value)}
                    placeholder="Tên thuốc…" onClick={(e) => e.stopPropagation()}
                    className="flex-1 text-sm font-medium bg-transparent border-none outline-none placeholder:text-slate-400 text-slate-800" />
                )}
                {!readOnly && (
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-slate-400">{expandedIdx === idx ? '▲' : '▼'}</span>
                    <button type="button" onClick={(e) => { e.stopPropagation(); removeItem(idx) }}
                      className="w-6 h-6 flex items-center justify-center rounded-md text-slate-400 hover:text-red-500 hover:bg-red-50 transition text-sm">×</button>
                  </div>
                )}
              </div>

              {(expandedIdx === idx || readOnly) && (
                <div className="px-3 pb-3 pt-0 border-t border-slate-100 bg-slate-50/50 space-y-3">
                  <div className="grid grid-cols-2 gap-2 pt-2">
                    <div>
                      <label className="text-xs font-medium text-slate-500 mb-1 block">Liều dùng</label>
                      {readOnly ? <p className="text-sm text-slate-700">{item.dosage || '—'}</p> : (
                        <>
                          <input type="text" value={item.dosage}
                            onChange={(e) => updateItem(idx, 'dosage', e.target.value)}
                            placeholder="1v x 2/ngày"
                            className="w-full text-sm px-2.5 py-1.5 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-400 bg-white" />
                          <div className="flex flex-wrap gap-1 mt-1">
                            {DOSAGE_PRESETS.map((p) => (
                              <button key={p} type="button" onClick={() => updateItem(idx, 'dosage', p)}
                                className="text-[10px] px-1.5 py-0.5 rounded bg-white border border-slate-200 text-slate-500 hover:border-blue-300 hover:text-blue-600 transition">{p}</button>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                    <div>
                      <label className="text-xs font-medium text-slate-500 mb-1 block">Số lượng</label>
                      {readOnly ? <p className="text-sm text-slate-700">{item.quantity}</p> : (
                        <input type="number" min={1} value={item.quantity}
                          onChange={(e) => updateItem(idx, 'quantity', Number(e.target.value))}
                          className="w-full text-sm px-2.5 py-1.5 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-400 bg-white" />
                      )}
                    </div>
                    <div className="col-span-2">
                      <label className="text-xs font-medium text-slate-500 mb-1 block">Hướng dẫn dùng</label>
                      {readOnly ? <p className="text-sm text-slate-700">{item.instruction || '—'}</p> : (
                        <>
                          <input type="text" value={item.instruction}
                            onChange={(e) => updateItem(idx, 'instruction', e.target.value)}
                            placeholder="Uống sau ăn…"
                            className="w-full text-sm px-2.5 py-1.5 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-400 bg-white" />
                          <div className="flex flex-wrap gap-1 mt-1">
                            {INSTRUCTION_PRESETS.map((p) => (
                              <button key={p} type="button" onClick={() => updateItem(idx, 'instruction', p)}
                                className="text-[10px] px-1.5 py-0.5 rounded bg-white border border-slate-200 text-slate-500 hover:border-blue-300 hover:text-blue-600 transition">{p}</button>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                    <div>
                      <label className="text-xs font-medium text-slate-500 mb-1 block">Đơn giá (đ)</label>
                      {readOnly ? <p className="text-sm text-slate-700">{item.unitPrice.toLocaleString('vi-VN')}đ</p> : (
                        <input type="number" min={0} step={1000} value={item.unitPrice}
                          onChange={(e) => updateItem(idx, 'unitPrice', Number(e.target.value))}
                          className="w-full text-sm px-2.5 py-1.5 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-400 bg-white" />
                      )}
                    </div>
                    <div>
                      <label className="text-xs font-medium text-slate-500 mb-1 block">Thành tiền</label>
                      <p className="text-sm font-semibold text-emerald-600 py-1.5">{(item.quantity * item.unitPrice).toLocaleString('vi-VN')}đ</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
          <div className="flex justify-between items-center pt-1 px-1">
            <span className="text-xs text-slate-500">Tổng tiền thuốc</span>
            <span className="text-sm font-bold text-emerald-700">{totalDrugCost.toLocaleString('vi-VN')}đ</span>
          </div>
        </div>
      )}
    </div>
  )
}
