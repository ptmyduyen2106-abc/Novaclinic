'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

interface Appointment {
  id: string;
  doctor_name: string;
  specialty: string;
  appointment_date: string;
  appointment_time: string;
  status: 'upcoming' | 'completed' | 'cancelled';
  note?: string;
  diagnosis?: string;
  prescription?: string;
}

const STATUS_CONFIG = {
  upcoming: {
    label: 'Sắp tới',
    color: '#1B6CA8',
    bg: '#EBF4FC',
    dot: '#1B6CA8',
  },
  completed: {
    label: 'Đã khám',
    color: '#10b981',
    bg: '#ECFDF5',
    dot: '#10b981',
  },
  cancelled: {
    label: 'Đã huỷ',
    color: '#ef4444',
    bg: '#FEF2F2',
    dot: '#ef4444',
  },
};

type FilterStatus = 'all' | 'upcoming' | 'completed' | 'cancelled';

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('vi-VN', {
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export default function HistoryPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterStatus>('all');
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState<string | null>(null);

  useEffect(() => {
    fetchAppointments();
  }, []);

  async function fetchAppointments() {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('appointments')
      .select('*')
      .eq('patient_id', user.id)
      .order('appointment_date', { ascending: false });

    if (data) setAppointments(data);
    setLoading(false);
  }

  async function handleCancel(id: string) {
    setCancelling(id);
    await supabase
      .from('appointments')
      .update({ status: 'cancelled' })
      .eq('id', id);
    await fetchAppointments();
    setCancelling(null);
  }

  const filtered = appointments.filter(a => {
    const matchStatus = filter === 'all' || a.status === filter;
    const matchSearch =
      a.doctor_name.toLowerCase().includes(search.toLowerCase()) ||
      a.specialty.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  const counts = {
    all: appointments.length,
    upcoming: appointments.filter(a => a.status === 'upcoming').length,
    completed: appointments.filter(a => a.status === 'completed').length,
    cancelled: appointments.filter(a => a.status === 'cancelled').length,
  };

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Lịch sử khám bệnh</h1>
        <p className="text-gray-400 text-sm mt-0.5">Xem lại toàn bộ lịch hẹn và kết quả khám</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {(
          [
            { key: 'all', label: 'Tất cả', color: '#6b7280', bg: '#f9fafb' },
            { key: 'upcoming', label: 'Sắp tới', color: '#1B6CA8', bg: '#EBF4FC' },
            { key: 'completed', label: 'Đã khám', color: '#10b981', bg: '#ECFDF5' },
            { key: 'cancelled', label: 'Đã huỷ', color: '#ef4444', bg: '#FEF2F2' },
          ] as const
        ).map(item => (
          <button
            key={item.key}
            onClick={() => setFilter(item.key)}
            className={`p-4 rounded-2xl border text-left transition-all ${
              filter === item.key ? 'border-transparent shadow-sm' : 'bg-white border-gray-100 hover:border-gray-200'
            }`}
            style={filter === item.key ? { backgroundColor: item.bg, borderColor: item.color + '33' } : {}}
          >
            <p className="text-2xl font-bold" style={{ color: item.color }}>
              {counts[item.key]}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">{item.label}</p>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <svg className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          placeholder="Tìm theo tên bác sĩ hoặc chuyên khoa..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
        />
      </div>

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <svg className="w-6 h-6 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="#1B6CA8" strokeWidth="4" />
            <path className="opacity-75" fill="#1B6CA8" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-12 text-center">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: '#EBF4FC' }}>
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="#1B6CA8" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <p className="font-semibold text-gray-700 mb-1">Chưa có lịch hẹn nào</p>
          <p className="text-gray-400 text-sm">
            {filter !== 'all' ? 'Không có lịch hẹn trong nhóm này.' : 'Đặt lịch khám đầu tiên của bạn.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(appt => {
            const cfg = STATUS_CONFIG[appt.status];
            const isOpen = expanded === appt.id;

            return (
              <div
                key={appt.id}
                className="bg-white rounded-2xl border border-gray-100 overflow-hidden transition-shadow hover:shadow-sm"
              >
                {/* Row */}
                <button
                  className="w-full flex items-center gap-4 p-5 text-left"
                  onClick={() => setExpanded(isOpen ? null : appt.id)}
                >
                  {/* Doctor avatar */}
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 text-sm font-bold text-white"
                    style={{ backgroundColor: '#1B6CA8' }}>
                    {appt.doctor_name.charAt(0)}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-800 truncate">{appt.doctor_name}</p>
                        <p className="text-xs text-gray-400">{appt.specialty}</p>
                      </div>
                      <span
                        className="px-2.5 py-1 rounded-full text-xs font-semibold shrink-0"
                        style={{ backgroundColor: cfg.bg, color: cfg.color }}
                      >
                        <span className="inline-block w-1.5 h-1.5 rounded-full mr-1.5 align-middle"
                          style={{ backgroundColor: cfg.dot }} />
                        {cfg.label}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1.5">
                      <span className="flex items-center gap-1 text-xs text-gray-400">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        {formatDate(appt.appointment_date)}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-gray-400">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {appt.appointment_time}
                      </span>
                    </div>
                  </div>

                  <svg
                    className={`w-4 h-4 text-gray-300 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                    fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Expanded detail */}
                {isOpen && (
                  <div className="px-5 pb-5 border-t border-gray-50 pt-4 space-y-3">
                    {appt.note && (
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Ghi chú</p>
                        <p className="text-sm text-gray-700 bg-gray-50 rounded-xl px-4 py-3">{appt.note}</p>
                      </div>
                    )}
                    {appt.diagnosis && (
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Chẩn đoán</p>
                        <p className="text-sm text-gray-700 bg-blue-50 rounded-xl px-4 py-3">{appt.diagnosis}</p>
                      </div>
                    )}
                    {appt.prescription && (
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Đơn thuốc</p>
                        <p className="text-sm text-gray-700 bg-emerald-50 rounded-xl px-4 py-3 whitespace-pre-line">{appt.prescription}</p>
                      </div>
                    )}

                    {appt.status === 'upcoming' && (
                      <div className="flex justify-end pt-1">
                        <button
                          onClick={() => handleCancel(appt.id)}
                          disabled={cancelling === appt.id}
                          className="px-4 py-2 rounded-xl text-xs font-semibold text-red-500 border border-red-200 hover:bg-red-50 transition-all disabled:opacity-50"
                        >
                          {cancelling === appt.id ? 'Đang huỷ...' : 'Huỷ lịch hẹn'}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
