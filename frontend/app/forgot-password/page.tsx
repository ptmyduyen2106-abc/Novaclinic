'use client'
// app/forgot-password/page.tsx — Quên mật khẩu

import { useState, FormEvent } from 'react'
import Image from 'next/image'
import { supabase } from '@/lib/supabase'

export default function ForgotPasswordPage() {
  const [email, setEmail]     = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const [sent, setSent]       = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })
      if (resetError) throw resetError
      setSent(true)
    } catch (err: any) {
      console.error('Forgot password error:', err)
      // Không tiết lộ email có tồn tại hay không — tránh lộ thông tin tài khoản
      setError('Có lỗi xảy ra. Vui lòng thử lại sau.')
    } finally {
      setLoading(false)
    }
  }

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
          {sent ? (
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="#10b981" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-slate-800 mb-2">Đã gửi email</h2>
              <p className="text-sm text-slate-500 mb-6">
                Nếu <strong>{email}</strong> có trong hệ thống, bạn sẽ nhận được email
                hướng dẫn đặt lại mật khẩu trong vài phút tới. Vui lòng kiểm tra cả hộp thư rác (spam).
              </p>
              <a href="/login" className="text-sm text-blue-600 hover:text-blue-700">
                ← Quay lại đăng nhập
              </a>
            </div>
          ) : (
            <>
              <h2 className="text-xl font-semibold text-slate-800 mb-2">Quên mật khẩu</h2>
              <p className="text-sm text-slate-500 mb-6">
                Nhập email đã đăng ký, chúng tôi sẽ gửi liên kết để bạn đặt lại mật khẩu.
              </p>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="email" className="label-sm">Email</label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ban@email.com"
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
                  {loading ? 'Đang gửi…' : 'Gửi liên kết đặt lại mật khẩu'}
                </button>
              </form>
              <div className="mt-4 text-center">
                <a href="/login" className="text-sm text-blue-600 hover:text-blue-700">
                  ← Quay lại đăng nhập
                </a>
              </div>
            </>
          )}
        </div>
        <p className="text-center text-xs text-slate-400 mt-6">© 2026 Nhóm 2</p>
      </div>
    </div>
  )
}
