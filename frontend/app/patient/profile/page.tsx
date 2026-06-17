'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone?: string;
  date_of_birth?: string;
  gender?: 'male' | 'female' | 'other';
  address?: string;
  blood_type?: string;
  allergies?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
}

const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

const GENDER_OPTIONS = [
  { value: 'male', label: 'Nam' },
  { value: 'female', label: 'Nữ' },
  { value: 'other', label: 'Khác' },
];

function InputField({
  label, value, onChange, type = 'text', placeholder, disabled,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  disabled?: boolean;
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-50 disabled:text-gray-400 transition-all"
      />
    </div>
  );
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [form, setForm] = useState<Partial<UserProfile>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [tab, setTab] = useState<'info' | 'health' | 'security'>('info');

  // Password change
  const [pwForm, setPwForm] = useState({ current: '', next: '', confirm: '' });
  const [pwError, setPwError] = useState('');
  const [pwSaving, setPwSaving] = useState(false);
  const [pwSaved, setPwSaved] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  async function fetchProfile() {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    if (data) {
      setProfile(data);
      setForm(data);
    }
    setLoading(false);
  }

  function set(key: keyof UserProfile, value: string) {
    setForm(prev => ({ ...prev, [key]: value }));
  }

  async function handleSave() {
    if (!profile) return;
    setSaving(true);
    await supabase.from('users').update(form).eq('id', profile.id);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
    await fetchProfile();
  }

  async function handleChangePassword() {
    setPwError('');
    if (pwForm.next !== pwForm.confirm) {
      setPwError('Mật khẩu mới không khớp.');
      return;
    }
    if (pwForm.next.length < 8) {
      setPwError('Mật khẩu mới phải có ít nhất 8 ký tự.');
      return;
    }
    setPwSaving(true);
    const { error } = await supabase.auth.updateUser({ password: pwForm.next });
    setPwSaving(false);
    if (error) {
      setPwError(error.message);
    } else {
      setPwSaved(true);
      setPwForm({ current: '', next: '', confirm: '' });
      setTimeout(() => setPwSaved(false), 3000);
    }
  }

  const initials = profile?.name?.trim().split(' ').map(w => w[0]).slice(-2).join('').toUpperCase() ?? 'BN';

  if (loading) {
    return (
      <div className="p-6 lg:p-8 flex justify-center py-16">
        <svg className="w-6 h-6 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="#1B6CA8" strokeWidth="4" />
          <path className="opacity-75" fill="#1B6CA8" d="M4 12a8 8 0 018-8v8H4z" />
        </svg>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Hồ sơ cá nhân</h1>
        <p className="text-gray-400 text-sm mt-0.5">Quản lý thông tin và cài đặt tài khoản của bạn</p>
      </div>

      {/* Profile hero card */}
      <div
        className="rounded-2xl p-6 text-white relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #1B6CA8 0%, #0D4A7A 100%)' }}
      >
        <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full bg-white/5" />
        <div className="absolute -bottom-8 right-16 w-28 h-28 rounded-full bg-white/5" />
        <div className="relative z-10 flex items-center gap-5">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-xl font-bold bg-white shrink-0"
            style={{ color: '#1B6CA8' }}>
            {initials}
          </div>
          <div>
            <p className="text-xl font-bold">{profile?.name ?? 'Bệnh nhân'}</p>
            <p className="text-blue-200 text-sm mt-0.5">{profile?.email}</p>
            {profile?.blood_type && (
              <span className="inline-block mt-2 px-3 py-1 rounded-full text-xs font-bold bg-white/20">
                Nhóm máu {profile.blood_type}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
        {(
          [
            { key: 'info', label: 'Thông tin cá nhân' },
            { key: 'health', label: 'Sức khoẻ' },
            { key: 'security', label: 'Bảo mật' },
          ] as const
        ).map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === t.key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Tab: Thông tin cá nhân ── */}
      {tab === 'info' && (
        <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-5 max-w-2xl">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <InputField
              label="Họ và tên"
              value={form.name ?? ''}
              onChange={v => set('name', v)}
              placeholder="Nguyễn Văn A"
            />
            <InputField
              label="Email"
              value={form.email ?? ''}
              onChange={() => {}}
              disabled
            />
            <InputField
              label="Số điện thoại"
              value={form.phone ?? ''}
              onChange={v => set('phone', v)}
              placeholder="0901 234 567"
              type="tel"
            />
            <InputField
              label="Ngày sinh"
              value={form.date_of_birth ?? ''}
              onChange={v => set('date_of_birth', v)}
              type="date"
            />
          </div>

          {/* Gender */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
              Giới tính
            </label>
            <div className="flex gap-2">
              {GENDER_OPTIONS.map(g => (
                <button
                  key={g.value}
                  onClick={() => set('gender', g.value)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all ${
                    form.gender === g.value
                      ? 'text-white border-transparent'
                      : 'text-gray-500 border-gray-200 hover:border-gray-300'
                  }`}
                  style={form.gender === g.value ? { backgroundColor: '#1B6CA8', borderColor: '#1B6CA8' } : {}}
                >
                  {g.label}
                </button>
              ))}
            </div>
          </div>

          <InputField
            label="Địa chỉ"
            value={form.address ?? ''}
            onChange={v => set('address', v)}
            placeholder="123 Đường ABC, Quận 1, TP.HCM"
          />

          <div className="flex items-center justify-between pt-2">
            {saved && (
              <span className="flex items-center gap-1.5 text-sm text-emerald-600 font-medium">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                Đã lưu thành công
              </span>
            )}
            <div className="ml-auto">
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 disabled:opacity-60 flex items-center gap-2"
                style={{ backgroundColor: '#1B6CA8' }}
              >
                {saving && (
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="white" strokeWidth="4" />
                    <path className="opacity-75" fill="white" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                )}
                {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Tab: Sức khoẻ ── */}
      {tab === 'health' && (
        <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-5 max-w-2xl">
          {/* Blood type */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
              Nhóm máu
            </label>
            <div className="flex flex-wrap gap-2">
              {BLOOD_TYPES.map(bt => (
                <button
                  key={bt}
                  onClick={() => set('blood_type', bt)}
                  className={`w-14 py-2 rounded-xl text-sm font-bold border transition-all ${
                    form.blood_type === bt
                      ? 'text-white border-transparent shadow-sm'
                      : 'text-gray-600 border-gray-200 hover:border-gray-300'
                  }`}
                  style={form.blood_type === bt ? { backgroundColor: '#1B6CA8', borderColor: '#1B6CA8' } : {}}
                >
                  {bt}
                </button>
              ))}
            </div>
          </div>

          {/* Allergies */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
              Dị ứng
            </label>
            <textarea
              value={form.allergies ?? ''}
              onChange={e => set('allergies', e.target.value)}
              rows={3}
              placeholder="VD: Penicillin, hải sản, phấn hoa..."
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 resize-none"
            />
            <p className="text-xs text-gray-400 mt-1">Liệt kê các loại thuốc, thực phẩm hoặc chất gây dị ứng.</p>
          </div>

          {/* Emergency contact */}
          <div className="pt-2 border-t border-gray-50">
            <p className="text-sm font-semibold text-gray-700 mb-3">Liên hệ khẩn cấp</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <InputField
                label="Họ tên người liên hệ"
                value={form.emergency_contact_name ?? ''}
                onChange={v => set('emergency_contact_name', v)}
                placeholder="Nguyễn Văn B"
              />
              <InputField
                label="Số điện thoại"
                value={form.emergency_contact_phone ?? ''}
                onChange={v => set('emergency_contact_phone', v)}
                placeholder="0901 234 567"
                type="tel"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            {saved && (
              <span className="flex items-center gap-1.5 text-sm text-emerald-600 font-medium">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                Đã lưu thành công
              </span>
            )}
            <div className="ml-auto">
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 disabled:opacity-60 flex items-center gap-2"
                style={{ backgroundColor: '#1B6CA8' }}
              >
                {saving && (
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="white" strokeWidth="4" />
                    <path className="opacity-75" fill="white" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                )}
                {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Tab: Bảo mật ── */}
      {tab === 'security' && (
        <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-5 max-w-md">
          <div>
            <p className="text-sm font-semibold text-gray-700 mb-4">Đổi mật khẩu</p>
            <div className="space-y-4">
              {[
                { label: 'Mật khẩu hiện tại', key: 'current' as const, placeholder: '••••••••' },
                { label: 'Mật khẩu mới', key: 'next' as const, placeholder: 'Ít nhất 8 ký tự' },
                { label: 'Xác nhận mật khẩu mới', key: 'confirm' as const, placeholder: '••••••••' },
              ].map(f => (
                <div key={f.key}>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                    {f.label}
                  </label>
                  <input
                    type="password"
                    value={pwForm[f.key]}
                    onChange={e => setPwForm(p => ({ ...p, [f.key]: e.target.value }))}
                    placeholder={f.placeholder}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                  />
                </div>
              ))}
            </div>

            {pwError && (
              <div className="mt-3 flex items-center gap-2 text-sm text-red-500 bg-red-50 rounded-xl px-4 py-3">
                <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                {pwError}
              </div>
            )}

            {pwSaved && (
              <div className="mt-3 flex items-center gap-2 text-sm text-emerald-600 bg-emerald-50 rounded-xl px-4 py-3">
                <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                Đổi mật khẩu thành công
              </div>
            )}

            <button
              onClick={handleChangePassword}
              disabled={pwSaving || !pwForm.current || !pwForm.next || !pwForm.confirm}
              className="mt-4 w-full py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 disabled:opacity-40 flex items-center justify-center gap-2"
              style={{ backgroundColor: '#1B6CA8' }}
            >
              {pwSaving && (
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="white" strokeWidth="4" />
                  <path className="opacity-75" fill="white" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
              )}
              {pwSaving ? 'Đang cập nhật...' : 'Cập nhật mật khẩu'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
