'use client'
// app/login/page.tsx — Trang đăng nhập

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
      const { data: userData } = await supabase
        .from('users').select('role').eq('id', data.user.id).single()
      const dest = redirect
        ? redirect
        : userData?.role === 'pharma'   ? '/pharmacy'
        : userData?.role === 'admin'    ? '/finance'
        : userData?.role === 'patient'  ? '/patient'
        : '/doctor'
      window.location.href = dest
    } catch {
      setError('Email hoặc mật khẩu không đúng. Vui lòng thử lại.')
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8">
      <h2 className="text-xl font-semibold text-slate-800 mb-6">Đăng nhập</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="label-sm">Email</label>
          <input id="email" type="email" value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="bacsi@phongkham.vn" required className="input-field" />
        </div>
        <div>
          <label htmlFor="password" className="label-sm">Mật khẩu</label>
          <input id="password" type="password" value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••" required className="input-field" />
        </div>
        {error && (
          <div className="bg-red-50 border border-red-100 text-red-600 text-sm rounded-lg px-4 py-3">
            {error}
          </div>
        )}
        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? 'Đang đăng nhập…' : 'Đăng nhập'}
        </button>
      </form>

      <div className="mt-4 text-center">
        <a href="/register" className="text-sm text-blue-600 hover:text-blue-700">
          Bệnh nhân? Đăng ký tài khoản →
        </a>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <Image
            src="/logo.png"
            alt="NovaClinic"
            width={128}
            height={128}
            className="object-contain mx-auto mb-2"
            priority
          />
          <p className="text-slate-500 text-sm mt-1">Hệ thống quản lý phòng khám thông minh</p>
        </div>
        <Suspense fallback={<div className="bg-white rounded-2xl p-8 text-center text-slate-400 text-sm">Đang tải…</div>}>
          <LoginForm />
        </Suspense>
        <p className="text-center text-xs text-slate-400 mt-6">© 2026 Nhóm 2</p>
      </div>
    </div>
  )
}