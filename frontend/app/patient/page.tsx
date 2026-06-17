'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

interface UserProfile {
  id: string;
  name: string;
  role: string;
}

interface Appointment {
  id: string;
  doctor_name: string;
  specialty: string;
  appointment_date: string;
  appointment_time: string;
  status: 'upcoming' | 'completed' | 'cancelled';
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Chào buổi sáng';
  if (h < 18) return 'Chào buổi chiều';
  return 'Chào buổi tối';
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('vi-VN', {
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export default function PatientDashboardPage() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [todayStr] = useState(() =>
    new Date().toLocaleDateString('vi-VN', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  );

  useEffect(() => {
    const init = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) return;

      const { data: profile } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single();

      if (profile) setUser(profile);

      // Fetch appointments — graceful if table not yet created
      try {
        const { data: appts } = await supabase
          .from('appointments')
          .select('*')
          .eq('patient_id', authUser.id)
          .order('appointment_date', { ascending: true })
          .limit(10);
        if (appts) setAppointments(appts);
      } catch {
        // appointments table may not exist yet
      }
    };
    init();
  }, []);

  const upcoming = appointments.filter(a => a.status === 'upcoming');
  const completed = appointments.filter(a => a.status === 'completed');
  const nextAppt = upcoming[0] ?? null;

  const firstName = user?.name?.trim().split(' ').pop() ?? 'bạn';

  return (
    <div className="p-6 lg:p-8 space-y-8">
      {/* ── Greeting ── */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          {getGreeting()}, {firstName} 👋
        </h1>
        <p className="text-gray-400 text-sm mt-0.5 capitalize">{todayStr}</p>
      </div>

      {/* ── Stats row ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          {
            label: 'Lịch hẹn sắp tới',
            value: upcoming.length,
            unit: 'lịch hẹn',
            icon: (
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            ),
            color: '#1B6CA8',
            bg: '#EBF4FC',
          },
          {
            label: 'Đã khám',
            value: completed.length,
            unit: 'lần khám',
            icon: (
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ),
            color: '#10b981',
            bg: '#ECFDF5',
          },
          {
            label: 'Thông báo mới',
            value: 0,
            unit: 'thông báo',
            icon: (
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            ),
            color: '#f59e0b',
            bg: '#FFFBEB',
          },
        ].map((stat, i) => (
          <div
            key={i}
            className="bg-white rounded-2xl border border-gray-100 p-5 flex items-center gap-4"
          >
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
              style={{ backgroundColor: stat.bg, color: stat.color }}
            >
              {stat.icon}
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              <p className="text-sm text-gray-400">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Main grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Next appointment (spans 2 cols) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-gray-800">Lịch hẹn sắp tới</h2>
            <Link
              href="/patient/appointments"
              className="text-sm font-medium hover:underline"
              style={{ color: '#1B6CA8' }}
            >
              Xem tất cả →
            </Link>
          </div>

          {nextAppt ? (
            /* ── Appointment card ── */
            <div
              className="rounded-2xl p-6 text-white relative overflow-hidden"
              style={{ background: 'linear-gradient(135deg, #1B6CA8 0%, #0D4A7A 100%)' }}
            >
              {/* decorative circles */}
              <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full bg-white/10" />
              <div className="absolute -bottom-6 right-8 w-24 h-24 rounded-full bg-white/5" />

              <div className="relative z-10">
                <div className="flex items-start justify-between mb-5">
                  <div>
                    <p className="text-blue-200 text-xs uppercase tracking-wider mb-1">Bác sĩ khám</p>
                    <p className="text-xl font-bold leading-tight">{nextAppt.doctor_name}</p>
                    <p className="text-blue-200 text-sm mt-0.5">{nextAppt.specialty}</p>
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-white/20 backdrop-blur-sm">
                    Sắp tới
                  </span>
                </div>

                <div className="flex flex-wrap gap-5">
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-blue-200 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className="text-sm">{formatDate(nextAppt.appointment_date)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-blue-200 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-sm">{nextAppt.appointment_time}</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* ── Empty state ── */
            <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-10 flex flex-col items-center text-center">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
                style={{ backgroundColor: '#EBF4FC' }}
              >
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="#1B6CA8" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <p className="font-semibold text-gray-700 mb-1">Chưa có lịch hẹn nào</p>
              <p className="text-gray-400 text-sm mb-6 max-w-xs">
                Đặt lịch khám để bác sĩ theo dõi và chăm sóc sức khỏe cho bạn.
              </p>
              <Link
                href="/patient/appointments"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90"
                style={{ backgroundColor: '#1B6CA8' }}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                Đặt lịch khám ngay
              </Link>
            </div>
          )}

          {/* ── Health tips ── */}
          <div>
            <h2 className="font-semibold text-gray-800 mb-3">Lời khuyên sức khỏe</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { icon: '💧', title: 'Uống đủ nước', desc: 'Uống 2–3 lít mỗi ngày để duy trì sức khỏe tốt.' },
                { icon: '🏃', title: 'Vận động mỗi ngày', desc: '30 phút đi bộ hoặc tập nhẹ giúp tăng sức đề kháng.' },
                { icon: '😴', title: 'Ngủ đủ giấc', desc: '7–8 tiếng mỗi đêm giúp cơ thể phục hồi tốt hơn.' },
              ].map((tip, i) => (
                <div key={i} className="bg-white rounded-xl border border-gray-100 p-4">
                  <span className="text-2xl block mb-2">{tip.icon}</span>
                  <p className="text-sm font-semibold text-gray-700 mb-1">{tip.title}</p>
                  <p className="text-xs text-gray-400 leading-relaxed">{tip.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Quick actions ── */}
        <div className="space-y-4">
          <h2 className="font-semibold text-gray-800">Thao tác nhanh</h2>
          <div className="space-y-3">
            {[
              {
                href: '/patient/appointments',
                label: 'Đặt lịch khám',
                desc: 'Chọn bác sĩ & thời gian phù hợp',
                icon: (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                ),
                color: '#1B6CA8',
                bg: '#EBF4FC',
              },
              {
                href: '/patient/history',
                label: 'Lịch sử khám bệnh',
                desc: 'Xem kết quả & đơn thuốc cũ',
                icon: (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                ),
                color: '#10b981',
                bg: '#ECFDF5',
              },
              {
                href: '/patient/profile',
                label: 'Cập nhật hồ sơ',
                desc: 'Chỉnh sửa thông tin cá nhân',
                icon: (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                ),
                color: '#f59e0b',
                bg: '#FFFBEB',
              },
            ].map((action, i) => (
              <Link
                key={i}
                href={action.href}
                className="flex items-center gap-4 p-4 bg-white rounded-xl border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all group"
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform"
                  style={{ backgroundColor: action.bg, color: action.color }}
                >
                  {action.icon}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-gray-800">{action.label}</p>
                  <p className="text-xs text-gray-400 truncate">{action.desc}</p>
                </div>
                <svg className="w-4 h-4 text-gray-300 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            ))}
          </div>

          {/* Mini calendar placeholder */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-gray-700">
                {new Date().toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' })}
              </h3>
              <div className="flex gap-1">
                <button className="p-1 rounded text-gray-400 hover:text-gray-600 hover:bg-gray-50">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button className="p-1 rounded text-gray-400 hover:text-gray-600 hover:bg-gray-50">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
            {/* Day labels */}
            <div className="grid grid-cols-7 text-center mb-2">
              {['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'].map(d => (
                <p key={d} className="text-xs text-gray-400 font-medium">{d}</p>
              ))}
            </div>
            {/* Days grid */}
            <MiniCalendar appointments={upcoming} />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Mini calendar component ── */
function MiniCalendar({ appointments }: { appointments: Appointment[] }) {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  const firstDay = new Date(year, month, 1).getDay(); // 0=Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const apptDays = new Set(
    appointments.map(a => new Date(a.appointment_date).getDate())
  );

  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  // Pad to full rows
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <div className="grid grid-cols-7 gap-y-1 text-center">
      {cells.map((day, i) => {
        if (!day) return <div key={i} />;
        const isToday = day === today.getDate();
        const hasAppt = apptDays.has(day);
        return (
          <div
            key={i}
            className={`relative text-xs w-7 h-7 flex items-center justify-center rounded-full mx-auto font-medium transition-all ${
              isToday
                ? 'text-white font-bold'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
            style={isToday ? { backgroundColor: '#1B6CA8' } : {}}
          >
            {day}
            {hasAppt && !isToday && (
              <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-blue-400" />
            )}
          </div>
        );
      })}
    </div>
  );
}
