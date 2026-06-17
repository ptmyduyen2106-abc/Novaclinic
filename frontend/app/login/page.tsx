'use client'
// app/login/page.tsx — Trang đăng nhập

import { useState, FormEvent, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'

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

      <div className="mt-6 pt-5 border-t border-slate-100">
        <p className="text-xs text-slate-400 font-medium mb-2">💡 Tài khoản demo (click để điền):</p>
        <div className="space-y-1 text-xs text-slate-500">
          {[
            { role: 'Bác sĩ',  email: 'doctor@demo.vn' },
            { role: 'Dược sĩ', email: 'pharma@demo.vn' },
            { role: 'Quản lý', email: 'admin@demo.vn'  },
          ].map((u) => (
            <div key={u.email} className="flex items-center gap-2">
              <span className="w-20 text-slate-400">{u.role}</span>
              <code
                className="bg-slate-50 px-2 py-0.5 rounded cursor-pointer hover:bg-blue-50 transition"
                onClick={() => { setEmail(u.email); setPassword('123456') }}
              >
                {u.email} / 123456
              </code>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-600 shadow-lg mb-4">
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
              <path d="M16 4C9.37 4 4 9.37 4 16s5.37 12 12 12 12-5.37 12-12S22.63 4 16 4z" fill="white" opacity="0.3"/>
              <path d="M20 15h-3v-3a1 1 0 00-2 0v3h-3a1 1 0 000 2h3v3a1 1 0 002 0v-3h3a1 1 0 000-2z" fill="white"/>
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-slate-800">NovaClinic</h1>
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
