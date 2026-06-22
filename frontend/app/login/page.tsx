```tsx
'use client'

import { useState, FormEvent, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Image from 'next/image'

function LoginForm() {
  const searchParams = useSearchParams()
  const redirect = searchParams.get('redirect')

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const { data, error: signInError } =
        await supabase.auth.signInWithPassword({
          email,
          password,
        })

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
        : role === 'pharma'
        ? '/pharmacy'
        : role === 'admin'
        ? '/finance'
        : role === 'patient'
        ? '/patient'
        : role === 'doctor'
        ? '/doctor'
        : null

      if (!dest) {
        setError(
          'Tài khoản chưa được gán vai trò hợp lệ. Vui lòng liên hệ quản trị viên.'
        )
        setLoading(false)
        return
      }

      window.location.href = dest
    } catch (err: any) {
      console.error('Login error:', err)

      const rawMessage: string = err?.message ?? ''

      setError(
        rawMessage.includes('Email not confirmed')
          ? 'Email chưa được xác thực. Vui lòng kiểm tra hộp thư để xác nhận tài khoản trước khi đăng nhập.'
          : 'Email hoặc mật khẩu không đúng. Vui lòng thử lại.'
      )

      setLoading(false)
    }
  }

  return (
    <div
      className="
        rounded-3xl
        p-8
        bg-white/75
        backdrop-blur-xl
        border border-white/50
        shadow-[0_20px_60px_rgba(0,0,0,0.12)]
      "
    >
      <h2 className="text-2xl font-bold text-slate-800 mb-6">
        Đăng nhập
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="label-sm">
            Email
          </label>

          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="bacsi@phongkham.vn"
            required
            className="input-field"
          />
        </div>

        <div>
          <div className="flex items-center justify-between">
            <label htmlFor="password" className="label-sm">
              Mật khẩu
            </label>

            <a
              href="/forgot-password"
              className="text-xs text-blue-600 hover:text-blue-700"
            >
              Quên mật khẩu?
            </a>
          </div>

          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            className="input-field"
          />
        </div>

        {error && (
          <div className="bg-red-50 border border-red-100 text-red-600 text-sm rounded-lg px-4 py-3">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full"
        >
          {loading ? 'Đang đăng nhập…' : 'Đăng nhập'}
        </button>
      </form>

      <div className="mt-4 text-center">
        <a
          href="/register"
          className="text-sm text-blue-600 hover:text-blue-700"
        >
          Bệnh nhân? Đăng ký tài khoản →
        </a>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <div
      className="
        relative
        min-h-screen
        overflow-hidden
        flex
        items-center
        justify-center
        p-4
        bg-gradient-to-br
        from-slate-50
        via-blue-50
        to-emerald-50
      "
    >
      {/* Blob 1 */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl" />

      {/* Blob 2 */}
      <div className="absolute top-1/4 -right-32 w-96 h-96 bg-green-500/20 rounded-full blur-3xl" />

      {/* Blob 3 */}
      <div className="absolute -bottom-40 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-cyan-400/10 rounded-full blur-3xl" />

      <div className="relative z-10 w-full max-w-md">
        <div className="text-center mb-10">
          <Image
            src="/logo.png"
            alt="NovaClinic"
            width={195}
            height={154}
            priority
            className="
              object-contain
              mx-auto
              mb-2
              h-28
              w-auto
              drop-shadow-[0_10px_20px_rgba(37,99,235,0.15)]
            "
          />

          <p className="text-slate-600 text-sm mt-1">
            Hệ thống quản lý phòng khám thông minh
          </p>
        </div>

        <Suspense
          fallback={
            <div className="bg-white rounded-2xl p-8 text-center text-slate-400 text-sm">
              Đang tải...
            </div>
          }
        >
          <LoginForm />
        </Suspense>

        <p className="text-center text-xs text-slate-500 mt-6">
          © 2026 Nhóm 2
        </p>
      </div>
    </div>
  )
}
```
