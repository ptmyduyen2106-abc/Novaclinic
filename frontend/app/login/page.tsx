'use client'

import { useState, FormEvent, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Image from 'next/image'

function LoginForm() {
  const searchParams = useSearchParams()
  const redirect     = searchParams.get('redirect')

  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(''); setLoading(true)

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password })
      if (signInError) throw signInError

      let role: string | null = null

      const { data: userRow } = await supabase
        .from('users')
        .select('role')
        .eq('id', data.user.id)
        .maybeSingle()

      if (userRow?.role) {
        role = userRow.role
      } else {
        const { data: patientRow } = await supabase
          .from('patients')
          .select('id')
          .eq('id', data.user.id)
          .maybeSingle()

        if (patientRow) role = 'patient'
      }

      const dest = redirect
        ? redirect
        : role === 'pharma'  ? '/pharmacy'
        : role === 'admin'   ? '/finance'
        : role === 'patient' ? '/patient'
        : role === 'doctor'  ? '/doctor'
        : null

      if (!dest) {
        setError('Tai khoan chua duoc gan vai tro hop le. Vui long lien he quan tri vien.')
        setLoading(false)
        return
      }

      window.location.href = dest
    } catch (err: any) {
      console.error('Login error:', err)

      const rawMessage: string = err?.message ?? ''
      setError(
        rawMessage.includes('Email not confirmed')
          ? 'Email chua duoc xac thuc. Vui long kiem tra hop thu de xac nhan tai khoan truoc khi dang nhap.'
          : 'Email hoac mat khau khong dung. Vui long thu lai.'
      )
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8">
      <h2 className="text-xl font-semibold text-slate-800 mb-6">Dang nhap</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="label-sm">Email</label>
          <input id="email" type="email" value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="bacsi@phongkham.vn" required className="input-field" />
        </div>
        <div>
          <div className="flex items-center justify-between">
            <label htmlFor="password" className="label-sm">Mat khau</label>
            <a href="/forgot-password" className="text-xs text-blue-600 hover:text-blue-700">
              Quen mat khau?
            </a>
          </div>
          <input id="password" type="password" value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="********" required className="input-field" />
        </div>
        {error && (
          <div className="bg-red-50 border border-red-100 text-red-600 text-sm rounded-lg px-4 py-3">
            {error}
          </div>
        )}
        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? 'Dang dang nhap...' : 'Dang nhap'}
        </button>
      </form>

      <div className="mt-4 text-center">
        <a href="/register" className="text-sm text-blue-600 hover:text-blue-700">
          Benh nhan? Dang ky tai khoan
        </a>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <div
      className="
        min-h-screen
        flex
        items-center
        justify-center
        p-4
        bg-[radial-gradient(circle_at_top_left,rgba(96,165,250,0.2),transparent_30%),radial-gradient(circle_at_top_right,rgba(34,197,94,0.2),transparent_30%),radial-gradient(circle_at_bottom_center,rgba(59,130,246,0.15),transparent_40%),linear-gradient(135deg,#f8fafc,#eff6ff)]
      "
    >
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <Image
            src="/logo.png"
            alt="NovaClinic"
            width={195}
            height={154}
            className="object-contain mx-auto mb-2 h-28 w-auto"
            priority
          />
          <p className="text-slate-500 text-sm mt-1">He thong quan ly phong kham thong minh</p>
        </div>
        <Suspense fallback={<div className="bg-white rounded-2xl p-8 text-center text-slate-400 text-sm">Dang tai...</div>}>
          <LoginForm />
        </Suspense>
        <p className="text-center text-xs text-slate-400 mt-6">2026 Nhom 2</p>
      </div>
    </div>
  )
}