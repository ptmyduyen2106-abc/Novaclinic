'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { TermsModal } from '@/components/TermsModal';
import { PrivacyModal } from '@/components/PrivacyModal';

interface FormData {
  fullName: string;
  dateOfBirth: string;
  gender: string;
  idNumber: string;
  phone: string;
  email: string;
  address: string;
  username: string;
  password: string;
  confirmPassword: string;
  agreeTerms: boolean;
}

interface FormErrors {
  [key: string]: string;
}

export default function RegisterPage() {
  const [formData, setFormData] = useState<FormData>({
    fullName: '',
    dateOfBirth: '',
    gender: '',
    idNumber: '',
    phone: '',
    email: '',
    address: '',
    username: '',
    password: '',
    confirmPassword: '',
    agreeTerms: false,
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);

  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.fullName.trim()) newErrors.fullName = 'Vui lòng nhập họ và tên.';
    if (!formData.dateOfBirth) newErrors.dateOfBirth = 'Vui lòng chọn ngày sinh.';
    if (!formData.gender) newErrors.gender = 'Vui lòng chọn giới tính.';
    if (!formData.idNumber.trim()) {
      newErrors.idNumber = 'Vui lòng nhập số CCCD/CMND.';
    } else if (!/^\d{9,12}$/.test(formData.idNumber)) {
      newErrors.idNumber = 'Số CCCD/CMND không hợp lệ (9–12 chữ số).';
    }
    if (!formData.phone.trim()) {
      newErrors.phone = 'Vui lòng nhập số điện thoại.';
    } else if (!/^(0[3|5|7|8|9])\d{8}$/.test(formData.phone)) {
      newErrors.phone = 'Số điện thoại không hợp lệ.';
    }
    if (!formData.email.trim()) {
      newErrors.email = 'Vui lòng nhập email.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Địa chỉ email không hợp lệ.';
    }
    if (!formData.address.trim()) newErrors.address = 'Vui lòng nhập địa chỉ.';
    if (!formData.username.trim()) {
      newErrors.username = 'Vui lòng nhập tên đăng nhập.';
    } else if (formData.username.length < 4) {
      newErrors.username = 'Tên đăng nhập phải có ít nhất 4 ký tự.';
    }
    if (!formData.password) {
      newErrors.password = 'Vui lòng nhập mật khẩu.';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Mật khẩu phải có ít nhất 8 ký tự.';
    }
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Vui lòng xác nhận mật khẩu.';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Mật khẩu xác nhận không khớp.';
    }
    if (!formData.agreeTerms) newErrors.agreeTerms = 'Bạn cần đồng ý với điều khoản sử dụng.';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    const checked =
      type === 'checkbox' ? (e.target as HTMLInputElement).checked : undefined;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setIsSubmitting(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName,
            phone: formData.phone,
          },
        },
      });

      if (error) throw error;
      if (!data.user) throw new Error('Không tạo được tài khoản');

      const { error: dbError } = await supabase.from('users').insert([
        {
          id: data.user.id,
          name: formData.fullName,
          role: 'patient',
        },
      ]);

      if (dbError) throw dbError;

      setSubmitSuccess(true);
    } catch (err) {
      setErrors({ submit: err instanceof Error ? err.message : 'Đăng ký thất bại' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const passwordStrength = (
    pwd: string
  ): { level: number; label: string; color: string } => {
    if (!pwd) return { level: 0, label: '', color: '' };
    let score = 0;
    if (pwd.length >= 8) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;
    if (score <= 1) return { level: 1, label: 'Yếu', color: '#ef4444' };
    if (score === 2) return { level: 2, label: 'Trung bình', color: '#f59e0b' };
    if (score === 3) return { level: 3, label: 'Khá', color: '#3b82f6' };
    return { level: 4, label: 'Mạnh', color: '#10b981' };
  };

  const strength = passwordStrength(formData.password);

  // ─── Success screen ───────────────────────────────────────────────────────────
  if (submitSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="bg-white rounded-2xl shadow-lg p-10 max-w-md w-full text-center">
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
            style={{ backgroundColor: '#EBF4FC' }}
          >
            <svg
              className="w-10 h-10"
              fill="none"
              viewBox="0 0 24 24"
              stroke="#1B6CA8"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Đăng ký thành công!</h2>
          <p className="text-gray-500 mb-8">
            Tài khoản của bạn đã được tạo. Vui lòng kiểm tra email để xác thực tài khoản
            trước khi đăng nhập.
          </p>
          {/* ✅ FIX: thêm <Link> thay cho <a bị thiếu ở bản gốc */}
          <Link
            href="/login"
            className="inline-block w-full py-3 rounded-xl font-semibold text-white text-center transition-opacity hover:opacity-90"
            style={{ backgroundColor: '#1B6CA8' }}
          >
            Đến trang đăng nhập
          </Link>
        </div>
      </div>
    );
  }

  // ─── Register form ────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex" style={{ backgroundColor: '#F7F9FC' }}>
      {/* Left panel */}
      <div
        className="hidden lg:flex lg:w-2/5 flex-col justify-between p-12 relative overflow-hidden"
        style={{ background: 'linear-gradient(160deg, #1B6CA8 0%, #0D4A7A 100%)' }}
      >
        <div
          className="absolute -top-20 -left-20 w-64 h-64 rounded-full opacity-10"
          style={{ backgroundColor: '#fff' }}
        />
        <div
          className="absolute -bottom-16 -right-16 w-80 h-80 rounded-full opacity-10"
          style={{ backgroundColor: '#fff' }}
        />
        <div
          className="absolute top-1/2 -right-8 w-40 h-40 rounded-full opacity-5"
          style={{ backgroundColor: '#fff' }}
        />

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-16">
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="#1B6CA8">
                <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm1 13h-2v-6h2v6zm0-8h-2V5h2v2z" />
              </svg>
            </div>
            <span className="text-white font-bold text-lg tracking-wide">NovaClinic</span>
          </div>
          <h1 className="text-4xl font-bold text-white leading-snug mb-4">
            Chăm sóc sức khỏe
            <br />
            mọi lúc, mọi nơi
          </h1>
          <p className="text-blue-200 text-base leading-relaxed">
            Đặt lịch khám, theo dõi hồ sơ sức khỏe và kết nối với bác sĩ — tất cả trong
            một ứng dụng.
          </p>
        </div>

        <div className="relative z-10 space-y-5">
          {[
            { icon: '🗓️', text: 'Đặt lịch khám trực tuyến nhanh chóng' },
            { icon: '📋', text: 'Hồ sơ y tế được lưu trữ an toàn' },
            { icon: '💬', text: 'Tư vấn sức khỏe với bác sĩ chuyên khoa' },
            { icon: '🔔', text: 'Nhắc nhở lịch uống thuốc & tái khám' },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-3">
              <span className="text-xl">{item.icon}</span>
              <span className="text-blue-100 text-sm">{item.text}</span>
            </div>
          ))}
        </div>

        <p className="relative z-10 text-blue-300 text-xs">
          © 2026 NovaClinic. Bảo mật thông tin theo tiêu chuẩn y tế quốc gia.
        </p>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex flex-col justify-center px-6 py-10 lg:px-16 xl:px-24 overflow-y-auto">
        <div className="max-w-2xl w-full mx-auto">
          {/* Mobile logo */}
          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: '#1B6CA8' }}
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="white">
                <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm1 13h-2v-6h2v6zm0-8h-2V5h2v2z" />
              </svg>
            </div>
            <span className="font-bold text-gray-900">NovaClinic</span>
          </div>

          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-1">Tạo tài khoản</h2>
            <p className="text-gray-500 text-sm">
              Đã có tài khoản?{' '}
              <Link href="/login" style={{ color: '#1B6CA8' }} className="font-medium hover:underline">
                Đăng nhập ngay
              </Link>
            </p>
          </div>

          <form onSubmit={handleSubmit} noValidate>
            {/* ── Thông tin cá nhân ── */}
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-5">
                <div className="w-1 h-5 rounded-full" style={{ backgroundColor: '#1B6CA8' }} />
                <h3 className="font-semibold text-gray-800 text-sm uppercase tracking-wider">
                  Thông tin cá nhân
                </h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Họ tên */}
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Họ và tên <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    placeholder="Nguyễn Văn A"
                    className={`w-full px-4 py-2.5 rounded-xl border text-sm transition-all outline-none focus:ring-2 ${
                      errors.fullName
                        ? 'border-red-400 focus:ring-red-100'
                        : 'border-gray-200 focus:border-blue-400 focus:ring-blue-50'
                    }`}
                  />
                  {errors.fullName && (
                    <p className="mt-1 text-xs text-red-500">{errors.fullName}</p>
                  )}
                </div>

                {/* Ngày sinh */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ngày sinh <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    name="dateOfBirth"
                    value={formData.dateOfBirth}
                    onChange={handleChange}
                    max={new Date().toISOString().split('T')[0]}
                    className={`w-full px-4 py-2.5 rounded-xl border text-sm transition-all outline-none focus:ring-2 ${
                      errors.dateOfBirth
                        ? 'border-red-400 focus:ring-red-100'
                        : 'border-gray-200 focus:border-blue-400 focus:ring-blue-50'
                    }`}
                  />
                  {errors.dateOfBirth && (
                    <p className="mt-1 text-xs text-red-500">{errors.dateOfBirth}</p>
                  )}
                </div>

                {/* Giới tính */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Giới tính <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    className={`w-full px-4 py-2.5 rounded-xl border text-sm transition-all outline-none focus:ring-2 bg-white ${
                      errors.gender
                        ? 'border-red-400 focus:ring-red-100'
                        : 'border-gray-200 focus:border-blue-400 focus:ring-blue-50'
                    }`}
                  >
                    <option value="">-- Chọn giới tính --</option>
                    <option value="male">Nam</option>
                    <option value="female">Nữ</option>
                    <option value="other">Khác</option>
                  </select>
                  {errors.gender && (
                    <p className="mt-1 text-xs text-red-500">{errors.gender}</p>
                  )}
                </div>

                {/* CCCD */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Số CCCD / CMND <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="idNumber"
                    value={formData.idNumber}
                    onChange={handleChange}
                    placeholder="001234567890"
                    maxLength={12}
                    className={`w-full px-4 py-2.5 rounded-xl border text-sm transition-all outline-none focus:ring-2 ${
                      errors.idNumber
                        ? 'border-red-400 focus:ring-red-100'
                        : 'border-gray-200 focus:border-blue-400 focus:ring-blue-50'
                    }`}
                  />
                  {errors.idNumber && (
                    <p className="mt-1 text-xs text-red-500">{errors.idNumber}</p>
                  )}
                </div>

                {/* Điện thoại */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Số điện thoại <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="0901234567"
                    className={`w-full px-4 py-2.5 rounded-xl border text-sm transition-all outline-none focus:ring-2 ${
                      errors.phone
                        ? 'border-red-400 focus:ring-red-100'
                        : 'border-gray-200 focus:border-blue-400 focus:ring-blue-50'
                    }`}
                  />
                  {errors.phone && (
                    <p className="mt-1 text-xs text-red-500">{errors.phone}</p>
                  )}
                </div>

                {/* Email */}
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="example@email.com"
                    className={`w-full px-4 py-2.5 rounded-xl border text-sm transition-all outline-none focus:ring-2 ${
                      errors.email
                        ? 'border-red-400 focus:ring-red-100'
                        : 'border-gray-200 focus:border-blue-400 focus:ring-blue-50'
                    }`}
                  />
                  {errors.email && (
                    <p className="mt-1 text-xs text-red-500">{errors.email}</p>
                  )}
                </div>

                {/* Địa chỉ */}
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Địa chỉ <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    placeholder="Số nhà, đường, phường/xã, quận/huyện, tỉnh/thành phố"
                    rows={2}
                    className={`w-full px-4 py-2.5 rounded-xl border text-sm transition-all outline-none focus:ring-2 resize-none ${
                      errors.address
                        ? 'border-red-400 focus:ring-red-100'
                        : 'border-gray-200 focus:border-blue-400 focus:ring-blue-50'
                    }`}
                  />
                  {errors.address && (
                    <p className="mt-1 text-xs text-red-500">{errors.address}</p>
                  )}
                </div>
              </div>
            </div>

            {/* ── Thông tin tài khoản ── */}
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-5">
                <div className="w-1 h-5 rounded-full" style={{ backgroundColor: '#1B6CA8' }} />
                <h3 className="font-semibold text-gray-800 text-sm uppercase tracking-wider">
                  Thông tin tài khoản
                </h3>
              </div>
              <div className="grid grid-cols-1 gap-4">
                {/* Username */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tên đăng nhập <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    placeholder="Tối thiểu 4 ký tự, không dấu"
                    className={`w-full px-4 py-2.5 rounded-xl border text-sm transition-all outline-none focus:ring-2 ${
                      errors.username
                        ? 'border-red-400 focus:ring-red-100'
                        : 'border-gray-200 focus:border-blue-400 focus:ring-blue-50'
                    }`}
                  />
                  {errors.username && (
                    <p className="mt-1 text-xs text-red-500">{errors.username}</p>
                  )}
                </div>

                {/* Mật khẩu */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mật khẩu <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="Tối thiểu 8 ký tự"
                      className={`w-full px-4 py-2.5 pr-11 rounded-xl border text-sm transition-all outline-none focus:ring-2 ${
                        errors.password
                          ? 'border-red-400 focus:ring-red-100'
                          : 'border-gray-200 focus:border-blue-400 focus:ring-blue-50'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      tabIndex={-1}
                    >
                      {showPassword ? (
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      )}
                    </button>
                  </div>
                  {formData.password && (
                    <div className="mt-2">
                      <div className="flex gap-1 mb-1">
                        {[1, 2, 3, 4].map(i => (
                          <div
                            key={i}
                            className="h-1 flex-1 rounded-full transition-all duration-300"
                            style={{
                              backgroundColor: i <= strength.level ? strength.color : '#e5e7eb',
                            }}
                          />
                        ))}
                      </div>
                      <p className="text-xs" style={{ color: strength.color }}>
                        Độ mạnh: {strength.label}
                      </p>
                    </div>
                  )}
                  {errors.password && (
                    <p className="mt-1 text-xs text-red-500">{errors.password}</p>
                  )}
                </div>

                {/* Xác nhận mật khẩu */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Xác nhận mật khẩu <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      placeholder="Nhập lại mật khẩu"
                      className={`w-full px-4 py-2.5 pr-11 rounded-xl border text-sm transition-all outline-none focus:ring-2 ${
                        errors.confirmPassword
                          ? 'border-red-400 focus:ring-red-100'
                          : formData.confirmPassword &&
                            formData.password === formData.confirmPassword
                          ? 'border-green-400 focus:ring-green-50'
                          : 'border-gray-200 focus:border-blue-400 focus:ring-blue-50'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      tabIndex={-1}
                    >
                      {showConfirmPassword ? (
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      )}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="mt-1 text-xs text-red-500">{errors.confirmPassword}</p>
                  )}
                  {formData.confirmPassword &&
                    !errors.confirmPassword &&
                    formData.password === formData.confirmPassword && (
                      <p className="mt-1 text-xs text-green-600">✓ Mật khẩu khớp</p>
                    )}
                </div>
              </div>
            </div>

            {/* ── Điều khoản ── */}
            <div className="mb-6">
              <label className="flex items-start gap-3 cursor-pointer">
                <div className="relative mt-0.5 shrink-0">
                  <input
                    type="checkbox"
                    name="agreeTerms"
                    checked={formData.agreeTerms}
                    onChange={handleChange}
                    className="sr-only"
                  />
                  <div
                    className="w-5 h-5 rounded border-2 flex items-center justify-center transition-all"
                    style={{
                      borderColor: formData.agreeTerms
                        ? '#1B6CA8'
                        : errors.agreeTerms
                        ? '#ef4444'
                        : '#d1d5db',
                      backgroundColor: formData.agreeTerms ? '#1B6CA8' : 'white',
                    }}
                  >
                    {formData.agreeTerms && (
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                </div>
                <span className="text-sm text-gray-600 leading-relaxed">
                  Tôi đã đọc và đồng ý với{' '}
                  <button
                    type="button"
                    onClick={() => setShowTerms(true)}
                    style={{ color: '#1B6CA8' }}
                    className="font-medium hover:underline"
                  >
                    Điều khoản sử dụng
                  </button>{' '}
                  và{' '}
                  <button
                    type="button"
                    onClick={() => setShowPrivacy(true)}
                    style={{ color: '#1B6CA8' }}
                    className="font-medium hover:underline"
                  >
                    Chính sách bảo mật
                  </button>{' '}
                  của NovaClinic.
                </span>
              </label>
              {errors.agreeTerms && (
                <p className="mt-1 text-xs text-red-500 ml-8">{errors.agreeTerms}</p>
              )}
            </div>

            {/* ── Lỗi submit ── */}
            {errors.submit && (
              <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl">
                {errors.submit}
              </div>
            )}

            {/* ── Submit button ── */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 rounded-xl font-semibold text-white text-sm transition-all duration-200 flex items-center justify-center gap-2"
              style={{
                backgroundColor: isSubmitting ? '#93c5fd' : '#1B6CA8',
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
              }}
            >
              {isSubmitting ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="white" strokeWidth="4" />
                    <path className="opacity-75" fill="white" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  Đang xử lý...
                </>
              ) : (
                'Tạo tài khoản'
              )}
            </button>

            <p className="text-center text-sm text-gray-500 mt-5">
              Đã có tài khoản?{' '}
              <Link href="/login" style={{ color: '#1B6CA8' }} className="font-medium hover:underline">
                Đăng nhập
              </Link>
            </p>
          </form>
        </div>
      </div>

      <TermsModal open={showTerms} onClose={() => setShowTerms(false)} />
      <PrivacyModal open={showPrivacy} onClose={() => setShowPrivacy(false)} />
    </div>
  );
}