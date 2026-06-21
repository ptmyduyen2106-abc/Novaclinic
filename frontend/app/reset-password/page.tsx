'use client'
// app/reset-password/page.tsx — Đặt lại mật khẩu (đích đến từ link trong email)

import { useState, FormEvent, useEffect, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { supabase } from '@/lib/supabase'

function ResetPasswordForm() {
  const router = useRouter()

  const [password, setPassword]               = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading]                 = useState(false)
  const [error, setError]                     = useState('')
  const [success, setSuccess]                 = useState(false)
  const [sessionReady, setSessionReady]       = useState(false)
  const [sessionError, setSessionError]       = useState(false)

  // Supabase tự động xử lý token từ URL hash (#access_token=...) khi trang load
  // và tạo session tạm. Ta chỉ cần đợi session đó sẵn sàng trước khi cho đổi mật khẩu.
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setSessionReady(true)
      } else {
        setSessionError(true)
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN') {
        setSessionReady(true)
        setSessionError(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  function validate(): string {
    if (password.length < 8) return 'Mật khẩu phải có ít nhất 8 ký tự.'
    if (password !== confirmPassword) return 'Mật khẩu xác nhận không khớp.'
    return ''
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const validationError = validate()
    if (validationError) {
      setError(validationError)
      return
    }

    setError('')
    setLoading(true)
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password })
      if (updateError) throw updateError
      setSuccess(true)
    } catch (err: any) {
      console.error('Reset password error:', err)
      setError(err?.message ?? 'Không thể đặt lại mật khẩu. Vui lòng thử lại.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="text-center">
        <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="#10b981" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-slate-800 mb-2">Đặt lại mật khẩu thành công!</h2>
        <p className="text-sm text-slate-500 mb-6">
          Bạn có thể đăng nhập bằng mật khẩu mới ngay bây giờ.
        </p>
        <a href="/login" className="btn-primary inline-block w-full text-center">
          Đến trang đăng nhập
        </a>
      </div>
    )
  }

  if (sessionError) {
    return (
      <div className="text-center">
        <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="#ef4444" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-slate-800 mb-2">Liên kết không hợp lệ</h2>
        <p className="text-sm text-slate-500 mb-6">
          Liên kết đặt lại mật khẩu đã hết hạn hoặc không hợp lệ. Vui lòng yêu cầu liên kết mới.
        </p>
        <a href="/forgot-password" className="btn-primary inline-block w-full text-center">
          Gửi lại liên kết
        </a>
      </div>
    )
  }

  if (!sessionReady) {
    return (
      <div className="text-center text-slate-400 text-sm py-8">
        Đang xác thực liên kết…
      </div>
    )
  }

  return (
    <>
      <h2 className="text-xl font-semibold text-slate-800 mb-2">Đặt lại mật khẩu</h2>
      <p className="text-sm text-slate-500 mb-6">
        Nhập mật khẩu mới cho tài khoản của bạn.
      </p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="password" className="label-sm">Mật khẩu mới</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Tối thiểu 8 ký tự"
            required
            className="input-field"
          />
        </div>
        <div>
          <label htmlFor="confirmPassword" className="label-sm">Xác nhận mật khẩu mới</label>
          <input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Nhập lại mật khẩu mới"
            required
            className="input-field"
          />
        </div>
        {error && (
          <div className="bg-red-50 border border-red-100 text-red-600 text-sm rounded-lg px-4 py-3">
            {error}
          </div>
        )}
        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? 'Đang lưu…' : 'Đặt lại mật khẩu'}
        </button>
      </form>
    </>
  )
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
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
          <p className="text-slate-500 text-sm mt-1">Hệ thống quản lý phòng khám thông minh</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8">
          <Suspense fallback={<div className="text-center text-slate-400 text-sm py-8">Đang tải…</div>}>
            <ResetPasswordForm />
          </Suspense>
        </div>
        <p className="text-center text-xs text-slate-400 mt-6">© 2026 Nhóm 2</p>
      </div>
    </div>
  )
}
