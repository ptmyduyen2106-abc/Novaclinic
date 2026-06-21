// app/patient-list/page.tsx — Danh sách bệnh nhân (admin)
'use client'

import { useEffect, useState } from 'react'
import { NavBar } from '@/components/NavBar'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'

interface PatientRow {
  id: string
  full_name: string
  date_of_birth: string | null
  gender: string | null
  phone: string | null
  address: string | null
  blood_type: string | null
  allergies: string | null
  created_at: string
}

const GENDER_LABEL: Record<string, string> = {
  male: 'Nam',
  female: 'Nữ',
  other: 'Khác',
}

function calcAge(dob: string | null): string {
  if (!dob) return '—'
  const birth = new Date(dob)
  const today = new Date()
  let age = today.getFullYear() - birth.getFullYear()
  const m = today.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--
  return `${age} tuổi`
}

export default function AdminPatientsPage() {
  const { user } = useAuth()
  const [patients, setPatients] = useState<PatientRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  useEffect(() => {
    if (!user) return
    fetchPatients()
  }, [user])

  async function fetchPatients() {
    setLoading(true)
    setError(null)
    const { data, error } = await supabase
      .from('patients')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      setError(error.message)
    } else {
      setPatients(data ?? [])
    }
    setLoading(false)
  }

  const filtered = patients.filter((p) => {
    const q = search.trim().toLowerCase()
    if (!q) return true
    return (
      p.full_name.toLowerCase().includes(q) ||
      (p.phone ?? '').toLowerCase().includes(q) ||
      (p.address ?? '').toLowerCase().includes(q)
    )
  })

  return (
    <>
      <NavBar />
      <main className="max-w-2xl mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-xl font-bold text-slate-800">🧑‍🤝‍🧑 Danh sách bệnh nhân</h1>
          <p className="text-sm text-slate-500 mt-1">
            Toàn bộ bệnh nhân đã đăng ký tài khoản — không phụ thuộc tháng hay lượt khám.
          </p>
        </div>

        {/* Search */}
        <div className="mb-4">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo tên, số điện thoại, địa chỉ…"
            className="input-field"
          />
        </div>

        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-20 bg-slate-100 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-600 text-sm">
            {error}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-slate-400 text-sm">
            <p>{search ? 'Không tìm thấy bệnh nhân phù hợp' : 'Chưa có bệnh nhân nào đăng ký'}</p>
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-xs text-slate-400 mb-1">{filtered.length} bệnh nhân</p>
            {filtered.map((p) => (
              <div
                key={p.id}
                className="bg-white border border-slate-200 rounded-xl p-4 flex items-start justify-between gap-4"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold text-slate-800">{p.full_name}</p>
                    {p.gender && (
                      <span className="text-xs bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">
                        {GENDER_LABEL[p.gender] ?? p.gender}
                      </span>
                    )}
                    <span className="text-xs text-slate-400">{calcAge(p.date_of_birth)}</span>
                  </div>
                  <div className="mt-1.5 space-y-0.5">
                    {p.phone && (
                      <p className="text-xs text-slate-500">📞 {p.phone}</p>
                    )}
                    {p.address && (
                      <p className="text-xs text-slate-500 truncate">📍 {p.address}</p>
                    )}
                    {p.allergies && (
                      <p className="text-xs text-red-500">⚠️ Dị ứng: {p.allergies}</p>
                    )}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  {p.blood_type && (
                    <span className="text-xs font-semibold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full">
                      {p.blood_type}
                    </span>
                  )}
                  <p className="text-xs text-slate-400 mt-1.5">
                    {new Date(p.created_at).toLocaleDateString('vi-VN')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </>
  )
}