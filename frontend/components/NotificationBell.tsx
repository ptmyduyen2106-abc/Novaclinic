'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

interface UpcomingAppointment {
  id: string;
  doctor_name: string;
  specialty: string;
  appointment_date: string;
  appointment_time: string;
}

interface NotificationBellProps {
  userId: string;
}

// Lịch hẹn trong vòng N ngày tới được tính là "thông báo mới" (chấm đỏ)
const SOON_THRESHOLD_DAYS = 3;

function formatRelativeDate(dateStr: string): string {
  const today = new Date();
  const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const target = new Date(dateStr);
  const targetMidnight = new Date(target.getFullYear(), target.getMonth(), target.getDate());
  const diffDays = Math.round((targetMidnight.getTime() - todayMidnight.getTime()) / 86400000);

  if (diffDays === 0) return 'Hôm nay';
  if (diffDays === 1) return 'Ngày mai';
  if (diffDays > 1 && diffDays <= 7) return `${diffDays} ngày nữa`;

  return target.toLocaleDateString('vi-VN', { weekday: 'short', day: '2-digit', month: '2-digit' });
}

export function NotificationBell({ userId }: NotificationBellProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [appointments, setAppointments] = useState<UpcomingAppointment[]>([]);
  const [loading, setLoading] = useState(true);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchUpcoming();
  }, [userId]);

  // Đóng dropdown khi click ra ngoài
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  async function fetchUpcoming() {
    setLoading(true);
    const todayIso = new Date().toISOString().split('T')[0];

    const { data } = await supabase
      .from('appointments')
      .select('id, doctor_name, specialty, appointment_date, appointment_time')
      .eq('patient_id', userId)
      .eq('status', 'upcoming')
      .gte('appointment_date', todayIso)
      .order('appointment_date', { ascending: true })
      .order('appointment_time', { ascending: true });

    if (data) setAppointments(data);
    setLoading(false);
  }

  const soonCount = appointments.filter((a) => {
    const target = new Date(a.appointment_date);
    const diffDays = Math.round(
      (new Date(target.getFullYear(), target.getMonth(), target.getDate()).getTime() -
        new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate()).getTime()) /
        86400000
    );
    return diffDays <= SOON_THRESHOLD_DAYS;
  }).length;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative p-2 rounded-xl text-gray-400 hover:bg-gray-50 hover:text-gray-600 transition-all"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {soonCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500 ring-2 ring-white" />
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl border border-gray-100 shadow-lg z-50 overflow-hidden">
          {/* Header */}
          <div className="px-4 py-3 border-b border-gray-50 flex items-center justify-between">
            <p className="text-sm font-semibold text-gray-800">Nhắc lịch hẹn</p>
            <button
              onClick={fetchUpcoming}
              className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
            >
              Làm mới
            </button>
          </div>

          {/* Body */}
          <div className="max-h-80 overflow-y-auto">
            {loading ? (
              <div className="px-4 py-8 flex justify-center">
                <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="#1B6CA8" strokeWidth="4" />
                  <path className="opacity-75" fill="#1B6CA8" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
              </div>
            ) : appointments.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <p className="text-sm text-gray-400">Bạn chưa có lịch hẹn sắp tới</p>
              </div>
            ) : (
              appointments.map((appt) => {
                const target = new Date(appt.appointment_date);
                const diffDays = Math.round(
                  (new Date(target.getFullYear(), target.getMonth(), target.getDate()).getTime() -
                    new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate()).getTime()) /
                    86400000
                );
                const isSoon = diffDays <= SOON_THRESHOLD_DAYS;

                return (
                  <button
                    key={appt.id}
                    onClick={() => {
                      setOpen(false);
                      router.push('/patient/history');
                    }}
                    className="w-full text-left px-4 py-3 flex items-start gap-3 hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-b-0"
                  >
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                      style={{ backgroundColor: isSoon ? '#FEF3C7' : '#EBF4FC' }}
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke={isSoon ? '#D97706' : '#1B6CA8'}
                        strokeWidth={1.5}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-800 truncate">
                        BS. {appt.doctor_name}
                      </p>
                      <p className="text-xs text-gray-400 truncate">{appt.specialty}</p>
                      <p className={`text-xs mt-0.5 font-medium ${isSoon ? 'text-amber-600' : 'text-gray-500'}`}>
                        {formatRelativeDate(appt.appointment_date)} · {appt.appointment_time}
                      </p>
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Footer */}
          {appointments.length > 0 && (
            <div className="px-4 py-2.5 border-t border-gray-50">
              <button
                onClick={() => {
                  setOpen(false);
                  router.push('/patient/history');
                }}
                className="text-xs font-medium hover:underline"
                style={{ color: '#1B6CA8' }}
              >
                Xem tất cả lịch sử khám →
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}