'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { NavBar } from '@/components/NavBar';

interface Appointment {
  id: string;
  patient_id: string;
  doctor_id: string;
  doctor_name: string;
  specialty: string;
  appointment_date: string;
  appointment_time: string;
  status: 'upcoming' | 'completed' | 'cancelled';
  note?: string;
  diagnosis?: string;
  prescription?: string;
  // joined from users
  patient_name?: string;
  patient_phone?: string;
  patient_date_of_birth?: string;
  patient_blood_type?: string;
  patient_allergies?: string;
}

type FilterStatus = 'upcoming' | 'completed' | 'cancelled' | 'all';

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('vi-VN', {
    weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric',
  });
}

function calcAge(dob?: string) {
  if (!dob) return null;
  const diff = Date.now() - new Date(dob).getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
}

const STATUS_CFG = {
  upcoming:  { label: 'Chờ khám',  color: '#1B6CA8', bg: '#EBF4FC' },
  completed: { label: 'Đã khám',   color: '#10b981', bg: '#ECFDF5' },
  cancelled: { label: 'Đã huỷ',    color: '#ef4444', bg: '#FEF2F2' },
};

export default function DoctorAppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading]           = useState(true);
  const [filter, setFilter]             = useState<FilterStatus>('upcoming');
  const [selected, setSelected]         = useState<Appointment | null>(null);
  const [saving, setSaving]             = useState(false);
  const [savedId, setSavedId]           = useState<string | null>(null);

  // form state cho modal
  const [diagnosis, setDiagnosis]       = useState('');
  const [prescription, setPrescription] = useState('');

  useEffect(() => { fetchAppointments(); }, []);

  async function fetchAppointments() {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Lấy doctor_id từ bảng doctors theo user_id
    const { data: doctor } = await supabase
      .from('doctors')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (!doctor) { setLoading(false); return; }

    // Lấy appointments + join thông tin bệnh nhân
    const { data } = await supabase
      .from('appointments')
      .select(`
        *,
        patient:patient_id (
          name,
          phone,
          date_of_birth,
          blood_type,
          allergies
        )
      `)
      .eq('doctor_id', doctor.id)
      .order('appointment_date', { ascending: true })
      .order('appointment_time', { ascending: true });

    if (data) {
      const mapped = data.map((a: Appointment & { patient?: Record<string, string> }) => ({
        ...a,
        patient_name:          a.patient?.name,
        patient_phone:         a.patient?.phone,
        patient_date_of_birth: a.patient?.date_of_birth,
        patient_blood_type:    a.patient?.blood_type,
        patient_allergies:     a.patient?.allergies,
      }));
      setAppointments(mapped);
    }
    setLoading(false);
  }

  function openModal(appt: Appointment) {
    setSelected(appt);
    setDiagnosis(appt.diagnosis ?? '');
    setPrescription(appt.prescription ?? '');
  }

  async function handleComplete() {
    if (!selected) return;
    setSaving(true);
    await supabase
      .from('appointments')
      .update({ status: 'completed', diagnosis, prescription })
      .eq('id', selected.id);
    setSaving(false);
    setSavedId(selected.id);
    setSelected(null);
    setTimeout(() => setSavedId(null), 3000);
    await fetchAppointments();
  }

  async function handleCancel(id: string) {
    await supabase.from('appointments').update({ status: 'cancelled' }).eq('id', id);
    await fetchAppointments();
  }

  const filtered = filter === 'all'
    ? appointments
    : appointments.filter(a => a.status === filter);

  // Group theo ngày
  const grouped = filtered.reduce<Record<string, Appointment[]>>((acc, a) => {
    acc[a.appointment_date] = acc[a.appointment_date] ?? [];
    acc[a.appointment_date].push(a);
    return acc;
  }, {});

  const counts = {
    all:       appointments.length,
    upcoming:  appointments.filter(a => a.status === 'upcoming').length,
    completed: appointments.filter(a => a.status === 'completed').length,
    cancelled: appointments.filter(a => a.status === 'cancelled').length,
  };

  const todayIso = new Date().toISOString().split('T')[0];

  return (
    <>
      <NavBar />
      <main className="max-w-5xl mx-auto p-6 lg:p-8 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Lịch hẹn bệnh nhân</h1>
          <p className="text-gray-400 text-sm mt-0.5">Xem và xử lý các ca khám trong lịch của bạn</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {(
            [
              { key: 'all',       label: 'Tất cả',    color: '#6b7280', bg: '#f9fafb' },
              { key: 'upcoming',  label: 'Chờ khám',  color: '#1B6CA8', bg: '#EBF4FC' },
              { key: 'completed', label: 'Đã khám',   color: '#10b981', bg: '#ECFDF5' },
              { key: 'cancelled', label: 'Đã huỷ',    color: '#ef4444', bg: '#FEF2F2' },
            ] as const
          ).map(item => (
            <button
              key={item.key}
              onClick={() => setFilter(item.key)}
              className={`p-4 rounded-2xl border text-left transition-all ${
                filter === item.key
                  ? 'border-transparent shadow-sm'
                  : 'bg-white border-gray-100 hover:border-gray-200'
              }`}
              style={filter === item.key ? { backgroundColor: item.bg } : {}}
            >
              <p className="text-2xl font-bold" style={{ color: item.color }}>
                {counts[item.key]}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">{item.label}</p>
            </button>
          ))}
        </div>

        {/* List */}
        {loading ? (
          <div className="flex justify-center py-12">
            <svg className="w-6 h-6 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="#1B6CA8" strokeWidth="4" />
              <path className="opacity-75" fill="#1B6CA8" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
          </div>
        ) : Object.keys(grouped).length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-12 text-center">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
              style={{ backgroundColor: '#EBF4FC' }}>
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="#1B6CA8" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="font-semibold text-gray-700">Không có lịch hẹn nào</p>
            <p className="text-gray-400 text-sm mt-1">Chưa có bệnh nhân đặt lịch trong nhóm này.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(grouped)
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([date, appts]) => (
                <div key={date}>
                  {/* Date header */}
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`px-3 py-1 rounded-full text-xs font-bold ${
                      date === todayIso
                        ? 'text-white'
                        : 'text-gray-500 bg-gray-100'
                    }`} style={date === todayIso ? { backgroundColor: '#1B6CA8' } : {}}>
                      {date === todayIso ? '📅 Hôm nay' : formatDate(date)}
                    </div>
                    <div className="flex-1 h-px bg-gray-100" />
                    <span className="text-xs text-gray-400">{appts.length} ca</span>
                  </div>

                  <div className="space-y-2">
                    {appts.map(appt => {
                      const cfg = STATUS_CFG[appt.status];
                      const age = calcAge(appt.patient_date_of_birth);
                      return (
                        <div
                          key={appt.id}
                          className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-4 hover:shadow-sm transition-shadow"
                        >
                          {/* Time */}
                          <div className="w-14 shrink-0 text-center">
                            <p className="text-base font-bold text-gray-800">{appt.appointment_time}</p>
                          </div>

                          <div className="w-px h-10 bg-gray-100 shrink-0" />

                          {/* Patient info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="text-sm font-semibold text-gray-800">
                                {appt.patient_name ?? 'Bệnh nhân'}
                              </p>
                              {age && (
                                <span className="text-xs text-gray-400">{age} tuổi</span>
                              )}
                              {appt.patient_blood_type && (
                                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-red-50 text-red-500">
                                  {appt.patient_blood_type}
                                </span>
                              )}
                            </div>
                            <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-0.5">
                              {appt.patient_phone && (
                                <span className="text-xs text-gray-400">📞 {appt.patient_phone}</span>
                              )}
                              {appt.patient_allergies && (
                                <span className="text-xs text-amber-600">⚠️ Dị ứng: {appt.patient_allergies}</span>
                              )}
                            </div>
                            {appt.note && (
                              <p className="text-xs text-gray-400 mt-1 truncate">
                                💬 {appt.note}
                              </p>
                            )}
                          </div>

                          {/* Status badge */}
                          <span className="px-2.5 py-1 rounded-full text-xs font-semibold shrink-0"
                            style={{ backgroundColor: cfg.bg, color: cfg.color }}>
                            {cfg.label}
                          </span>

                          {/* Actions */}
                          {appt.status === 'upcoming' && (
                            <div className="flex gap-2 shrink-0">
                              <button
                                onClick={() => openModal(appt)}
                                className="px-3 py-1.5 rounded-xl text-xs font-semibold text-white transition-opacity hover:opacity-90"
                                style={{ backgroundColor: '#1B6CA8' }}
                              >
                                Khám & kê đơn
                              </button>
                              <button
                                onClick={() => handleCancel(appt.id)}
                                className="px-3 py-1.5 rounded-xl text-xs font-semibold text-red-500 border border-red-200 hover:bg-red-50 transition-all"
                              >
                                Huỷ
                              </button>
                            </div>
                          )}

                          {appt.status === 'completed' && (
                            <button
                              onClick={() => openModal(appt)}
                              className="px-3 py-1.5 rounded-xl text-xs font-semibold text-gray-500 border border-gray-200 hover:bg-gray-50 transition-all shrink-0"
                            >
                              Xem kết quả
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
          </div>
        )}

        {/* Toast */}
        {savedId && (
          <div className="fixed bottom-6 right-6 flex items-center gap-2 bg-emerald-600 text-white text-sm font-medium px-4 py-3 rounded-xl shadow-lg">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            Đã hoàn tất ca khám
          </div>
        )}

        {/* ── Modal kê đơn / xem kết quả ── */}
        {selected && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl">
              {/* Modal header */}
              <div className="flex items-start justify-between p-6 border-b border-gray-100">
                <div>
                  <p className="font-bold text-gray-900">
                    {selected.status === 'completed' ? 'Kết quả khám' : 'Khám & kê đơn'}
                  </p>
                  <p className="text-sm text-gray-400 mt-0.5">
                    {selected.patient_name} · {selected.appointment_time} · {formatDate(selected.appointment_date)}
                  </p>
                </div>
                <button
                  onClick={() => setSelected(null)}
                  className="p-1.5 rounded-xl text-gray-400 hover:bg-gray-50 hover:text-gray-600 transition-all"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="p-6 space-y-4">
                {/* Patient summary */}
                <div className="bg-gray-50 rounded-xl p-4 grid grid-cols-2 gap-2 text-sm">
                  {[
                    { label: 'Họ tên',    value: selected.patient_name },
                    { label: 'Tuổi',      value: calcAge(selected.patient_date_of_birth) ? `${calcAge(selected.patient_date_of_birth)} tuổi` : '—' },
                    { label: 'SĐT',       value: selected.patient_phone ?? '—' },
                    { label: 'Nhóm máu', value: selected.patient_blood_type ?? '—' },
                  ].map(row => (
                    <div key={row.label}>
                      <p className="text-xs text-gray-400">{row.label}</p>
                      <p className="font-medium text-gray-800">{row.value}</p>
                    </div>
                  ))}
                  {selected.patient_allergies && (
                    <div className="col-span-2">
                      <p className="text-xs text-gray-400">Dị ứng</p>
                      <p className="font-medium text-amber-600">{selected.patient_allergies}</p>
                    </div>
                  )}
                  {selected.note && (
                    <div className="col-span-2">
                      <p className="text-xs text-gray-400">Ghi chú bệnh nhân</p>
                      <p className="font-medium text-gray-800">{selected.note}</p>
                    </div>
                  )}
                </div>

                {/* Diagnosis */}
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                    Chẩn đoán
                  </label>
                  <textarea
                    value={diagnosis}
                    onChange={e => setDiagnosis(e.target.value)}
                    disabled={selected.status === 'completed'}
                    rows={2}
                    placeholder="VD: Viêm họng cấp, viêm amidan..."
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 resize-none disabled:bg-gray-50 disabled:text-gray-500"
                  />
                </div>

                {/* Prescription */}
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                    Đơn thuốc
                  </label>
                  <textarea
                    value={prescription}
                    onChange={e => setPrescription(e.target.value)}
                    disabled={selected.status === 'completed'}
                    rows={4}
                    placeholder={`VD:\n- Paracetamol 500mg: 2 viên/ngày x 5 ngày\n- Amoxicillin 500mg: 1 viên x 3/ngày x 7 ngày`}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 resize-none disabled:bg-gray-50 disabled:text-gray-500"
                  />
                </div>
              </div>

              {/* Modal footer */}
              <div className="flex gap-3 px-6 pb-6">
                <button
                  onClick={() => setSelected(null)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-gray-600 border border-gray-200 hover:bg-gray-50 transition-all"
                >
                  {selected.status === 'completed' ? 'Đóng' : 'Huỷ bỏ'}
                </button>
                {selected.status === 'upcoming' && (
                  <button
                    onClick={handleComplete}
                    disabled={saving}
                    className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 disabled:opacity-60 flex items-center justify-center gap-2"
                    style={{ backgroundColor: '#1B6CA8' }}
                  >
                    {saving && (
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="white" strokeWidth="4" />
                        <path className="opacity-75" fill="white" d="M4 12a8 8 0 018-8v8H4z" />
                      </svg>
                    )}
                    {saving ? 'Đang lưu...' : '✓ Hoàn tất ca khám'}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </>
  );
}
