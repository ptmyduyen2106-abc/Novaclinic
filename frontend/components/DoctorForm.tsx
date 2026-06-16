'use client'
// components/DoctorForm.tsx — Khám & kê đơn

import { useState, FormEvent } from 'react'
import { RxBuilder }           from './RxBuilder'
import { apiCreateRecord } from '@/lib/supabase'
import { useAuth }             from '@/contexts/AuthContext'
import type { PrescriptionItem, Service } from '@/types'

const SERVICE_PRESETS: Service[] = [
  { name: 'Khám bệnh',       price: 100000 },
  { name: 'Tái khám',        price: 50000  },
  { name: 'Khám chuyên khoa',price: 150000 },
  { name: 'Siêu âm',         price: 120000 },
  { name: 'Xét nghiệm máu',  price: 200000 },
  { name: 'Điện tâm đồ',     price: 80000  },
]

export function DoctorForm() {
  const { user } = useAuth()

  const [patientName, setPatientName]   = useState('')
  const [yearOfBirth, setYearOfBirth]   = useState('')
  const [weight,      setWeight]        = useState('')
  const [phone,       setPhone]         = useState('')
  const [diagnosis,   setDiagnosis]     = useState('')
  const [advice,      setAdvice]        = useState('')
  const [serviceNote, setServiceNote]   = useState('')
  const [prescription, setPrescription] = useState<PrescriptionItem[]>([])
  const [selectedServices, setSelectedServices] = useState<Service[]>([SERVICE_PRESETS[0]])
  const [customService,    setCustomService]     = useState('')
  const [customServicePrice, setCustomServicePrice] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [success,    setSuccess]    = useState(false)
  const [error,      setError]      = useState('')

  const drugTotal    = prescription.reduce((s, p) => s + p.quantity * p.unitPrice, 0)
  const serviceTotal = selectedServices.reduce((s, sv) => s + sv.price, 0)
  const totalPrice   = drugTotal + serviceTotal

  function toggleService(svc: Service) {
    setSelectedServices((prev) =>
      prev.find((s) => s.name === svc.name)
        ? prev.filter((s) => s.name !== svc.name)
        : [...prev, svc]
    )
  }

  function addCustomService() {
    if (!customService.trim()) return
    setSelectedServices((prev) => [...prev, { name: customService.trim(), price: Number(customServicePrice) || 0 }])
    setCustomService(''); setCustomServicePrice('')
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!user) return
    if (!patientName || !diagnosis) { setError('Vui lòng điền tên bệnh nhân và chẩn đoán'); return }

    setSubmitting(true); setError('')
    try {
      await apiCreateRecord({
        patientName: patientName.trim(),
        yearOfBirth: Number(yearOfBirth) || 0,
        weight:      weight ? Number(weight) : undefined,
        phone:       phone.trim(),
        diagnosis:   diagnosis.trim(),
        prescription,
        services:    selectedServices,
        serviceNote: serviceNote.trim(),
        advice:      advice.trim(),
        status:      'pending',
      })  
      // Reset
      setPatientName(''); setYearOfBirth(''); setWeight(''); setPhone('')
      setDiagnosis(''); setAdvice(''); setServiceNote('')
      setPrescription([]); setSelectedServices([SERVICE_PRESETS[0]])
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lỗi lưu dữ liệu')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {success && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm rounded-xl px-4 py-3 flex items-center gap-2 animate-fadeIn">
          <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          Đã gửi bệnh nhân sang nhà thuốc thành công!
        </div>
      )}
      {error && <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3">{error}</div>}

      {/* Thông tin bệnh nhân */}
      <section>
        <h3 className="section-title mb-3">Thông tin bệnh nhân</h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <label className="label-sm">Họ tên *</label>
            <input type="text" value={patientName} onChange={(e) => setPatientName(e.target.value)}
              placeholder="Nguyễn Văn A" required className="input-field" />
          </div>
          <div>
            <label className="label-sm">Năm sinh</label>
            <input type="number" value={yearOfBirth} onChange={(e) => setYearOfBirth(e.target.value)}
              placeholder="1990" min={1900} max={new Date().getFullYear()} className="input-field" />
          </div>
          <div>
            <label className="label-sm">Cân nặng (kg)</label>
            <input type="number" value={weight} onChange={(e) => setWeight(e.target.value)}
              placeholder="65" min={0} step={0.5} className="input-field" />
          </div>
          <div className="col-span-2">
            <label className="label-sm">Số điện thoại</label>
            <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
              placeholder="09xxxxxxxx" className="input-field" />
          </div>
        </div>
      </section>

      {/* Chẩn đoán */}
      <section>
        <h3 className="section-title mb-3">Chẩn đoán &amp; Lời dặn</h3>
        <div className="space-y-3">
          <div>
            <label className="label-sm">Chẩn đoán *</label>
            <textarea value={diagnosis} onChange={(e) => setDiagnosis(e.target.value)}
              placeholder="Viêm họng cấp, viêm amidan…" required rows={2} className="input-field resize-none" />
          </div>
          <div>
            <label className="label-sm">Lời dặn bệnh nhân</label>
            <textarea value={advice} onChange={(e) => setAdvice(e.target.value)}
              placeholder="Nghỉ ngơi, uống nhiều nước, tái khám sau 5 ngày…" rows={2} className="input-field resize-none" />
          </div>
        </div>
      </section>

      {/* Toa thuốc */}
      <section>
        <RxBuilder items={prescription} onChange={setPrescription} />
      </section>

      {/* Dịch vụ */}
      <section>
        <h3 className="section-title mb-3">Dịch vụ</h3>
        <div className="flex flex-wrap gap-2 mb-3">
          {SERVICE_PRESETS.map((svc) => {
            const selected = selectedServices.some((s) => s.name === svc.name)
            return (
              <button key={svc.name} type="button" onClick={() => toggleService(svc)}
                className={`text-xs px-3 py-1.5 rounded-full border transition font-medium ${
                  selected ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-slate-200 text-slate-600 hover:border-blue-300'
                }`}>
                {svc.name} — {svc.price.toLocaleString('vi-VN')}đ
              </button>
            )
          })}
        </div>
        <div className="flex gap-2">
          <input type="text" value={customService} onChange={(e) => setCustomService(e.target.value)}
            placeholder="Dịch vụ khác…" className="input-field flex-1" />
          <input type="number" value={customServicePrice} onChange={(e) => setCustomServicePrice(e.target.value)}
            placeholder="Giá" min={0} step={1000} className="input-field w-28" />
          <button type="button" onClick={addCustomService}
            className="px-3 py-2 text-sm bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-700 transition">Thêm</button>
        </div>
        {selectedServices.length > 0 && (
          <div className="mt-2 space-y-1">
            {selectedServices.map((svc, i) => (
              <div key={i} className="flex justify-between text-xs text-slate-600 px-1">
                <span>{svc.name}</span>
                <span>{svc.price.toLocaleString('vi-VN')}đ</span>
              </div>
            ))}
          </div>
        )}
        <div className="mt-3">
          <label className="label-sm">Ghi chú dịch vụ</label>
          <input type="text" value={serviceNote} onChange={(e) => setServiceNote(e.target.value)}
            placeholder="Kết quả xét nghiệm, siêu âm…" className="input-field" />
        </div>
      </section>

      {/* Total + Submit */}
      <div className="border-t border-slate-200 pt-4">
        <div className="flex items-center justify-between mb-4">
          <div className="space-y-1">
            <div className="flex gap-6 text-xs text-slate-500">
              <span>Thuốc: <strong className="text-slate-700">{drugTotal.toLocaleString('vi-VN')}đ</strong></span>
              <span>Dịch vụ: <strong className="text-slate-700">{serviceTotal.toLocaleString('vi-VN')}đ</strong></span>
            </div>
            <div className="text-sm font-bold text-blue-700">Tổng: {totalPrice.toLocaleString('vi-VN')}đ</div>
          </div>
          <button type="submit" disabled={submitting}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-semibold rounded-xl shadow-sm transition flex items-center gap-2">
            {submitting ? (
              <><svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.37 0 0 5.37 0 12h4z" />
              </svg>Đang gửi…</>
            ) : <>Hoàn tất &amp; Gửi nhà thuốc</>}
          </button>
        </div>
      </div>
    </form>
  )
}
