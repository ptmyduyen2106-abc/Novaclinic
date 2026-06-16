'use client'
// components/InventoryModal.tsx — Nhập phiếu hàng

import { useState, FormEvent } from 'react'
import type { InventoryItem, PaymentMethod } from '@/types'

interface InventoryModalProps {
  open:    boolean
  onClose: () => void
  onSave:  (item: Omit<InventoryItem, 'id' | 'createdAt'>) => Promise<void>
}

const ITEM_TYPES = ['Thuốc kháng sinh','Thuốc hạ sốt / giảm đau','Thuốc tiêu hóa','Thuốc tim mạch','Vitamin / Bổ sung','Vật tư y tế','Hóa chất xét nghiệm','Khác']

export function InventoryModal({ open, onClose, onSave }: InventoryModalProps) {
  const today = new Date().toISOString().split('T')[0]
  const [date,          setDate]          = useState(today)
  const [invoiceNumber, setInvoiceNumber] = useState('')
  const [itemType,      setItemType]      = useState('')
  const [customType,    setCustomType]    = useState('')
  const [amount,        setAmount]        = useState('')
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('TM')
  const [note,          setNote]          = useState('')
  const [saving,        setSaving]        = useState(false)
  const [error,         setError]         = useState('')

  if (!open) return null

  function reset() {
    setDate(today); setInvoiceNumber(''); setItemType(''); setCustomType('')
    setAmount(''); setPaymentMethod('TM'); setNote(''); setError('')
  }

  function handleClose() { reset(); onClose() }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const finalType = itemType === 'Khác' ? customType : itemType
    if (!finalType || !amount) { setError('Vui lòng điền đầy đủ thông tin'); return }
    setSaving(true); setError('')
    try {
      await onSave({ date, invoiceNumber: invoiceNumber.trim(), itemType: finalType.trim(),
                     amount: Number(amount), paymentMethod, note: note.trim() })
      reset(); onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lỗi lưu dữ liệu')
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40" onClick={handleClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-md animate-fadeIn">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
            <h2 className="font-semibold text-slate-800">Thêm phiếu nhập hàng</h2>
            <button onClick={handleClose} className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition">×</button>
          </div>
          <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
            {error && <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-3 py-2">{error}</div>}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label-sm">Ngày nhập *</label>
                <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required className="input-field" />
              </div>
              <div>
                <label className="label-sm">Số hóa đơn</label>
                <input type="text" value={invoiceNumber} onChange={(e) => setInvoiceNumber(e.target.value)} placeholder="HD-2024-001" className="input-field" />
              </div>
            </div>
            <div>
              <label className="label-sm">Loại hàng *</label>
              <select value={itemType} onChange={(e) => setItemType(e.target.value)} required className="input-field">
                <option value="">Chọn loại hàng…</option>
                {ITEM_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
              {itemType === 'Khác' && (
                <input type="text" value={customType} onChange={(e) => setCustomType(e.target.value)}
                  placeholder="Mô tả hàng hóa…" className="input-field mt-2" required />
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label-sm">Số tiền (đ) *</label>
                <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)}
                  placeholder="5,000,000" min={0} step={1000} required className="input-field" />
              </div>
              <div>
                <label className="label-sm">Thanh toán *</label>
                <div className="flex gap-1 mt-1.5">
                  {(['TM','CK','No'] as PaymentMethod[]).map((m) => (
                    <button key={m} type="button" onClick={() => setPaymentMethod(m)}
                      className={`flex-1 py-2 text-xs font-semibold rounded-lg border transition ${
                        paymentMethod === m ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-slate-200 text-slate-600 hover:border-blue-300'
                      }`}>
                      {m === 'TM' ? 'Tiền mặt' : m === 'CK' ? 'Chuyển khoản' : 'Nợ'}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div>
              <label className="label-sm">Ghi chú</label>
              <input type="text" value={note} onChange={(e) => setNote(e.target.value)}
                placeholder="Nhà cung cấp, lô hàng, hạn dùng…" className="input-field" />
            </div>
            <div className="flex gap-2 pt-2">
              <button type="button" onClick={handleClose}
                className="flex-1 py-2.5 border border-slate-200 text-slate-600 text-sm font-medium rounded-xl hover:bg-slate-50 transition">Hủy</button>
              <button type="submit" disabled={saving}
                className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-semibold rounded-xl transition">
                {saving ? 'Đang lưu…' : 'Lưu phiếu nhập'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  )
}
