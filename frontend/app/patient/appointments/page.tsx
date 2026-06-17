'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

interface Doctor {
  id: string;
  name: string;
  specialty: string;
  avatar_url?: string;
  experience_years?: number;
  rating?: number;
}

interface TimeSlot {
  time: string;
  available: boolean;
}

const TIME_SLOTS: TimeSlot[] = [
  { time: '08:00', available: true },
  { time: '08:30', available: true },
  { time: '09:00', available: true },
  { time: '09:30', available: true },
  { time: '10:00', available: true },
  { time: '10:30', available: true },
  { time: '11:00', available: true },
  { time: '11:30', available: true },
  { time: '13:30', available: true },
  { time: '14:00', available: true },
  { time: '14:30', available: true },
  { time: '15:00', available: true },
  { time: '15:30', available: true },
  { time: '16:00', available: true },
  { time: '16:30', available: true },
];

const SPECIALTIES = [
  'Tất cả',
  'Nội tổng quát',
  'Tim mạch',
  'Da liễu',
  'Nhi khoa',
  'Thần kinh',
  'Chỉnh hình',
  'Tai mũi họng',
];

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

export default function AppointmentsPage() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [specialty, setSpecialty] = useState('Tất cả');
  const [search, setSearch] = useState('');
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [takenSlots, setTakenSlots] = useState<string[]>([]);
  const [note, setNote] = useState('');

  // Calendar state
  const today = new Date();
  const [calYear, setCalYear] = useState(today.getFullYear());
  const [calMonth, setCalMonth] = useState(today.getMonth());

  useEffect(() => {
    fetchDoctors();
  }, []);

  useEffect(() => {
    if (selectedDoctor && selectedDate) {
      fetchTakenSlots(selectedDoctor.id, selectedDate);
    }
  }, [selectedDoctor, selectedDate]);

  async function fetchDoctors() {
    setLoading(true);
    const { data } = await supabase.from('doctors').select('*').order('name');
    if (data) setDoctors(data);
    setLoading(false);
  }

  async function fetchTakenSlots(doctorId: string, date: string) {
    const { data } = await supabase
      .from('appointments')
      .select('appointment_time')
      .eq('doctor_id', doctorId)
      .eq('appointment_date', date)
      .eq('status', 'upcoming');
    if (data) setTakenSlots(data.map((d: { appointment_time: string }) => d.appointment_time));
  }

  async function handleSubmit() {
    if (!selectedDoctor || !selectedDate || !selectedTime) return;
    setSubmitting(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from('appointments').insert({
      patient_id: user.id,
      doctor_id: selectedDoctor.id,
      doctor_name: selectedDoctor.name,
      specialty: selectedDoctor.specialty,
      appointment_date: selectedDate,
      appointment_time: selectedTime,
      status: 'upcoming',
      note: note || null,
    });

    setSubmitting(false);
    if (!error) {
      setSuccess(true);
    }
  }

  function resetAll() {
    setStep(1);
    setSelectedDoctor(null);
    setSelectedDate('');
    setSelectedTime('');
    setNote('');
    setSuccess(false);
  }

  const filteredDoctors = doctors.filter(d => {
    const matchSpecialty = specialty === 'Tất cả' || d.specialty === specialty;
    const matchSearch = d.name.toLowerCase().includes(search.toLowerCase()) ||
      d.specialty.toLowerCase().includes(search.toLowerCase());
    return matchSpecialty && matchSearch;
  });

  // Calendar helpers
  const daysInMonth = getDaysInMonth(calYear, calMonth);
  const firstDay = getFirstDayOfMonth(calYear, calMonth);
  const calCells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (calCells.length % 7 !== 0) calCells.push(null);

  function handleDayClick(day: number) {
    const d = new Date(calYear, calMonth, day);
    const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    if (d < todayMidnight) return; // past
    if (d.getDay() === 0) return; // Sunday
    const iso = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    setSelectedDate(iso);
    setSelectedTime('');
  }

  function isPast(day: number) {
    const d = new Date(calYear, calMonth, day);
    const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    return d < todayMidnight;
  }

  const monthName = new Date(calYear, calMonth).toLocaleDateString('vi-VN', {
    month: 'long', year: 'numeric',
  });

  // ── Success screen ──
  if (success) {
    return (
      <div className="p-6 lg:p-8 flex items-center justify-center min-h-[60vh]">
        <div className="bg-white rounded-2xl border border-gray-100 p-10 max-w-md w-full text-center">
          <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
            style={{ backgroundColor: '#ECFDF5' }}>
            <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="#10b981" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Đặt lịch thành công!</h2>
          <p className="text-gray-400 text-sm mb-2">
            Bác sĩ <span className="font-semibold text-gray-700">{selectedDoctor?.name}</span>
          </p>
          <p className="text-gray-400 text-sm mb-6">
            {new Date(selectedDate).toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' })}
            {' · '}{selectedTime}
          </p>
          <button
            onClick={resetAll}
            className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90"
            style={{ backgroundColor: '#1B6CA8' }}
          >
            Đặt lịch khác
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Đặt lịch khám</h1>
        <p className="text-gray-400 text-sm mt-0.5">Chọn bác sĩ, ngày và giờ phù hợp với bạn</p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-2">
        {(['Chọn bác sĩ', 'Chọn ngày giờ', 'Xác nhận'] as const).map((label, i) => {
          const s = (i + 1) as 1 | 2 | 3;
          const active = step === s;
          const done = step > s;
          return (
            <div key={i} className="flex items-center gap-2">
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                active ? 'text-white' : done ? 'text-emerald-600 bg-emerald-50' : 'text-gray-400 bg-gray-100'
              }`} style={active ? { backgroundColor: '#1B6CA8' } : {}}>
                {done
                  ? <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                  : <span>{s}</span>
                }
                <span>{label}</span>
              </div>
              {i < 2 && <div className="w-6 h-px bg-gray-200" />}
            </div>
          );
        })}
      </div>

      {/* ── Step 1: Chọn bác sĩ ── */}
      {step === 1 && (
        <div className="space-y-4">
          {/* Search + filter */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Tìm bác sĩ hoặc chuyên khoa..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              />
            </div>
            <select
              value={specialty}
              onChange={e => setSpecialty(e.target.value)}
              className="px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-blue-400 bg-white"
            >
              {SPECIALTIES.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <svg className="w-6 h-6 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="#1B6CA8" strokeWidth="4" />
                <path className="opacity-75" fill="#1B6CA8" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
            </div>
          ) : filteredDoctors.length === 0 ? (
            <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-10 text-center">
              <p className="text-gray-400 text-sm">Không tìm thấy bác sĩ phù hợp</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredDoctors.map(doc => (
                <button
                  key={doc.id}
                  onClick={() => { setSelectedDoctor(doc); setStep(2); }}
                  className="bg-white rounded-2xl border p-5 text-left hover:border-blue-300 hover:shadow-md transition-all group"
                  style={{ borderColor: selectedDoctor?.id === doc.id ? '#1B6CA8' : '#f3f4f6' }}
                >
                  <div className="flex items-start gap-4">
                    {/* Avatar */}
                    <div className="w-14 h-14 rounded-xl flex items-center justify-center shrink-0 text-xl font-bold text-white"
                      style={{ backgroundColor: '#1B6CA8' }}>
                      {doc.name.charAt(0)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-gray-800 text-sm leading-tight">{doc.name}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{doc.specialty}</p>
                      <div className="flex items-center gap-3 mt-2">
                        {doc.experience_years && (
                          <span className="text-xs text-gray-500">{doc.experience_years} năm KN</span>
                        )}
                        {doc.rating && (
                          <span className="flex items-center gap-1 text-xs text-amber-500 font-medium">
                            ★ {doc.rating}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-gray-50 flex items-center justify-between">
                    <span className="text-xs text-gray-400">Thứ 2 – Thứ 7</span>
                    <span className="text-xs font-semibold group-hover:text-blue-600 transition-colors" style={{ color: '#1B6CA8' }}>
                      Chọn →
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Step 2: Chọn ngày & giờ ── */}
      {step === 2 && selectedDoctor && (
        <div className="space-y-5">
          {/* Back + doctor summary */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setStep(1)}
              className="p-2 rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 transition-all"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div className="flex items-center gap-3 bg-white rounded-xl border border-gray-100 px-4 py-2.5 flex-1">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold text-white shrink-0"
                style={{ backgroundColor: '#1B6CA8' }}>
                {selectedDoctor.name.charAt(0)}
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-800">{selectedDoctor.name}</p>
                <p className="text-xs text-gray-400">{selectedDoctor.specialty}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Calendar */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm font-semibold text-gray-700 capitalize">{monthName}</p>
                <div className="flex gap-1">
                  <button
                    onClick={() => {
                      if (calMonth === 0) { setCalMonth(11); setCalYear(y => y - 1); }
                      else setCalMonth(m => m - 1);
                    }}
                    className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-50 hover:text-gray-600"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <button
                    onClick={() => {
                      if (calMonth === 11) { setCalMonth(0); setCalYear(y => y + 1); }
                      else setCalMonth(m => m + 1);
                    }}
                    className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-50 hover:text-gray-600"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-7 text-center mb-2">
                {['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'].map(d => (
                  <p key={d} className="text-xs text-gray-400 font-medium py-1">{d}</p>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-y-1 text-center">
                {calCells.map((day, i) => {
                  if (!day) return <div key={i} />;
                  const iso = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                  const isSelected = selectedDate === iso;
                  const past = isPast(day);
                  const isSunday = new Date(calYear, calMonth, day).getDay() === 0;
                  const disabled = past || isSunday;
                  const isToday = calYear === today.getFullYear() && calMonth === today.getMonth() && day === today.getDate();

                  return (
                    <button
                      key={i}
                      onClick={() => !disabled && handleDayClick(day)}
                      disabled={disabled}
                      className={`relative text-xs w-8 h-8 flex items-center justify-center rounded-full mx-auto font-medium transition-all ${
                        isSelected
                          ? 'text-white shadow-sm'
                          : disabled
                          ? 'text-gray-300 cursor-not-allowed'
                          : isToday
                          ? 'ring-2 ring-blue-400 text-blue-600 font-bold'
                          : 'text-gray-600 hover:bg-blue-50'
                      }`}
                      style={isSelected ? { backgroundColor: '#1B6CA8' } : {}}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>

              {selectedDate && (
                <p className="text-xs text-center text-gray-400 mt-3 pt-3 border-t border-gray-50">
                  Đã chọn:{' '}
                  <span className="font-semibold text-gray-700">
                    {new Date(selectedDate).toLocaleDateString('vi-VN', {
                      weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric',
                    })}
                  </span>
                </p>
              )}
            </div>

            {/* Time slots */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <p className="text-sm font-semibold text-gray-700 mb-4">
                {selectedDate ? 'Chọn giờ khám' : 'Chọn ngày trước'}
              </p>
              {!selectedDate ? (
                <div className="flex flex-col items-center justify-center h-40 text-gray-300">
                  <svg className="w-10 h-10 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="text-xs">Vui lòng chọn ngày trên lịch</p>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  {TIME_SLOTS.map(slot => {
                    const taken = takenSlots.includes(slot.time);
                    const isSelected = selectedTime === slot.time;
                    return (
                      <button
                        key={slot.time}
                        onClick={() => !taken && setSelectedTime(slot.time)}
                        disabled={taken}
                        className={`py-2 rounded-xl text-xs font-semibold transition-all ${
                          isSelected
                            ? 'text-white shadow-sm'
                            : taken
                            ? 'bg-gray-50 text-gray-300 cursor-not-allowed line-through'
                            : 'bg-gray-50 text-gray-600 hover:bg-blue-50 hover:text-blue-600'
                        }`}
                        style={isSelected ? { backgroundColor: '#1B6CA8' } : {}}
                      >
                        {slot.time}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Note */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <label className="text-sm font-semibold text-gray-700 block mb-2">
              Ghi chú triệu chứng <span className="text-gray-400 font-normal">(không bắt buộc)</span>
            </label>
            <textarea
              value={note}
              onChange={e => setNote(e.target.value)}
              rows={3}
              placeholder="Mô tả ngắn về triệu chứng hoặc lý do khám..."
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 resize-none"
            />
          </div>

          <div className="flex justify-end">
            <button
              onClick={() => setStep(3)}
              disabled={!selectedDate || !selectedTime}
              className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90"
              style={{ backgroundColor: '#1B6CA8' }}
            >
              Tiếp theo →
            </button>
          </div>
        </div>
      )}

      {/* ── Step 3: Xác nhận ── */}
      {step === 3 && selectedDoctor && (
        <div className="max-w-lg space-y-4">
          <button
            onClick={() => setStep(2)}
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Quay lại
          </button>

          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="p-5 text-white" style={{ background: 'linear-gradient(135deg, #1B6CA8 0%, #0D4A7A 100%)' }}>
              <p className="text-blue-200 text-xs uppercase tracking-wider mb-1">Xác nhận lịch hẹn</p>
              <p className="text-xl font-bold">{selectedDoctor.name}</p>
              <p className="text-blue-200 text-sm">{selectedDoctor.specialty}</p>
            </div>

            <div className="p-5 space-y-4">
              {[
                {
                  label: 'Ngày khám',
                  value: new Date(selectedDate).toLocaleDateString('vi-VN', {
                    weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric',
                  }),
                  icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
                },
                {
                  label: 'Giờ khám',
                  value: selectedTime,
                  icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
                },
                {
                  label: 'Chuyên khoa',
                  value: selectedDoctor.specialty,
                  icon: 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z',
                },
              ].map((row, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: '#EBF4FC' }}>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="#1B6CA8" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d={row.icon} />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">{row.label}</p>
                    <p className="text-sm font-semibold text-gray-800">{row.value}</p>
                  </div>
                </div>
              ))}
              {note && (
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: '#EBF4FC' }}>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="#1B6CA8" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Ghi chú</p>
                    <p className="text-sm text-gray-700">{note}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full py-3 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 disabled:opacity-60 flex items-center justify-center gap-2"
            style={{ backgroundColor: '#1B6CA8' }}
          >
            {submitting ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="white" strokeWidth="4" />
                  <path className="opacity-75" fill="white" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Đang đặt lịch...
              </>
            ) : 'Xác nhận đặt lịch'}
          </button>
        </div>
      )}
    </div>
  );
}
