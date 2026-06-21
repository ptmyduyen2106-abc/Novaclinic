'use client';

import { useEffect, useState } from 'react';
import { supabase, apiCreateRecord } from '@/lib/supabase';
import { NavBar } from '@/components/NavBar';
import { RxBuilder } from '@/components/RxBuilder';
import type { PrescriptionItem, Service } from '@/types';

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

const SERVICE_PRESETS: Service[] = [
  { name: 'Khám bệnh',        price: 100000 },
  { name: 'Tái khám',         price: 50000  },
  { name: 'Khám chuyên khoa', price: 150000 },
  { name: 'Siêu âm',          price: 120000 },
  { name: 'Xét nghiệm máu',   price: 200000 },
  { name: 'Điện tâm đồ',      price: 80000  },
];

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
  const [formError, setFormError]       = useState('');

  // form state cho modal
  const [diagnosis, setDiagnosis]       = useState('');
  const [advice, setAdvice]             = useState('');
  const [serviceNote, setServiceNote]   = useState('');
  const [prescription, setPrescription] = useState<PrescriptionItem[]>([]);
  const [selectedServices, setSelectedServices] = useState<Service[]>([SERVICE_PRESETS[0]]);
  const [customService, setCustomService]           = useState('');
  const [customServicePrice, setCustomServicePrice] = useState('');

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

    // appointments.patient_id → patients.id (bệnh nhân nằm ở bảng "patients",
    // không phải "users" — bảng đó chỉ chứa bác sĩ/admin/dược).
    const { data } = await supabase
      .from('appointments')
      .select(`
        *,
        patient:patient_id (
          full_name,
          phone,
          date_of_birth
        )
      `)
      .eq('doctor_id', doctor.id)
      .order('appointment_date', { ascending: true })
      .order('appointment_time', { ascending: true });

    if (data) {
      const mapped = data.map((a: Appointment & { patient?: Record<string, string> }) => ({
        ...a,
        patient_name:          a.patient?.full_name,
        patient_phone:         a.patient?.phone,
        patient_date_of_birth: a.patient?.date_of_birth,
        // Các cột này chưa có trong bảng "patients" hiện tại — giữ undefined, UI sẽ hiện "—"
        patient_blood_type:    undefined,
        patient_allergies:     undefined,
      }));
      setAppointments(mapped);
    }
    setLoading(false);
  }

  function openModal(appt: Appointment) {
    setSelected(appt);
    setDiagnosis(appt.diagnosis ?? '');
    setAdvice('');
    setServiceNote('');
    setPrescription([]);
    setSelectedServices([SERVICE_PRESETS[0]]);
    setFormError('');
  }

  function closeModal() {
    setSelected(null);
    setFormError('');
  }

  function toggleService(svc: Service) {
    setSelectedServices(prev =>
      prev.find(s => s.name === svc.name)
        ? prev.filter(s => s.name !== svc.name)
        : [...prev, svc]
    );
  }

  function addCustomService() {
    if (!customService.trim()) return;
    setSelectedServices(prev => [...prev, { name: customService.trim(), price: Number(customServicePrice) || 0 }]);
    setCustomService('');
    setCustomServicePrice('');
  }

  const drugTotal    = prescription.reduce((s, p) => s + p.quantity * p.unitPrice, 0);
  const serviceTotal = selectedServices.reduce((s, sv) => s + sv.price, 0);
  const totalPrice   = drugTotal + serviceTotal;

  async function handleComplete() {
    if (!selected) return;
    if (!diagnosis.trim()) { setFormError('Vui lòng nhập chẩn đoán'); return; }

    setSaving(true);
    setFormError('');
    try {
      await apiCreateRecord({
        patientName: selected.patient_name ?? 'Bệnh nhân',
        yearOfBirth: selected.patient_date_of_birth
          ? new Date(selected.patient_date_of_birth).getFullYear()
          : 0,
        phone:       selected.patient_phone ?? '',
        diagnosis:   diagnosis.trim(),
        prescription,
        services:    selectedServices,
        serviceNote: serviceNote.trim(),
        advice:      advice.trim(),
        status:      'pending',
      });

      await supabase
        .from('appointments')
        .update({ status: 'completed', diagnosis: diagnosis.trim() })
        .eq('id', selected.id);

      setSavedId(selected.id);
      closeModal();
      setTimeout(() => setSavedId(null), 3000);
      await fetchAppointments();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Lỗi lưu dữ liệu');
    } finally {
      setSaving(false);
    }
  }

  async function handleCancel(id: string) {
    await supabase.from('appointments').update({ status: 'cancelled' }).eq('id', id);
    await fetchAppointments();
  }

  const filtered = filter === 'all'
    ? appointments
    : appointments.filter(a => a.status === filter);

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
            Đã hoàn tất ca khám &amp; gửi sang nhà thuốc
          </div>
        )}

        {/* Modal */}
        {selected && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm overflow-y-auto">
            <div className="bg-white rounded-2xl w-full max-w-2xl shadow-xl my-8">
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
                  onClick={closeModal}
                  className="p-1.5 rounded-xl text-gray-400 hover:bg-gray-50 hover:text-gray-600 transition-all"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
                {formError && (
                  <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3">
                    {formError}
                  </div>
                )}

                {/* Patient summary */}
                <div className="bg-gray-50 rounded-xl p-4 grid grid-cols-2 gap-2 text-sm">
                  {[
                    { label: 'Họ tên', value: selected.patient_name },
                    { label: 'Tuổi',   value: calcAge(selected.patient_date_of_birth) ? `${calcAge(selected.patient_date_of_birth)} tuổi` : '—' },
                    { label: 'SĐT',    value: selected.patient_phone ?? '—' },
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

                {/* Chẩn đoán & lời dặn */}
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                      Chẩn đoán *
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
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                      Lời dặn bệnh nhân
                    </label>
                    <textarea
                      value={advice}
                      onChange={e => setAdvice(e.target.value)}
                      disabled={selected.status === 'completed'}
                      rows={2}
                      placeholder="Nghỉ ngơi, uống nhiều nước, tái khám sau 5 ngày..."
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 resize-none disabled:bg-gray-50 disabled:text-gray-500"
                    />
                  </div>
                </div>

                {/* Toa thuốc */}
                {selected.status !== 'completed' && (
                  <RxBuilder items={prescription} onChange={setPrescription} />
                )}

                {/* Dịch vụ */}
                {selected.status !== 'completed' && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 mb-3">Dịch vụ</h3>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {SERVICE_PRESETS.map(svc => {
                        const isSelected = selectedServices.some(s => s.name === svc.name);
                        return (
                          <button
                            key={svc.name}
                            type="button"
                            onClick={() => toggleService(svc)}
                            className={`text-xs px-3 py-1.5 rounded-full border transition font-medium ${
                              isSelected
                                ? 'bg-blue-600 border-blue-600 text-white'
                                : 'bg-white border-gray-200 text-gray-600 hover:border-blue-300'
                            }`}
                          >
                            {svc.name} — {svc.price.toLocaleString('vi-VN')}đ
                          </button>
                        );
                      })}
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={customService}
                        onChange={e => setCustomService(e.target.value)}
                        placeholder="Dịch vụ khác…"
                        className="flex-1 px-3 py-2 rounded-lg border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-blue-100"
                      />
                      <input
                        type="number"
                        value={customServicePrice}
                        onChange={e => setCustomServicePrice(e.target.value)}
                        placeholder="Giá"
                        min={0}
                        step={1000}
                        className="w-28 px-3 py-2 rounded-lg border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-blue-100"
                      />
                      <button
                        type="button"
                        onClick={addCustomService}
                        className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700 transition"
                      >
                        Thêm
                      </button>
                    </div>
                    {selectedServices.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {selectedServices.map((svc, i) => (
                          <div key={i} className="flex justify-between text-xs text-gray-600 px-1">
                            <span>{svc.name}</span>
                            <span>{svc.price.toLocaleString('vi-VN')}đ</span>
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="mt-3">
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                        Ghi chú dịch vụ
                      </label>
                      <input
                        type="text"
                        value={serviceNote}
                        onChange={e => setServiceNote(e.target.value)}
                        placeholder="Kết quả xét nghiệm, siêu âm…"
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-blue-100"
                      />
                    </div>
                  </div>
                )}

                {/* Tổng tiền */}
                {selected.status !== 'completed' && (
                  <div className="border-t border-gray-100 pt-3 flex gap-6 text-xs text-gray-500">
                    <span>Thuốc: <strong className="text-gray-700">{drugTotal.toLocaleString('vi-VN')}đ</strong></span>
                    <span>Dịch vụ: <strong className="text-gray-700">{serviceTotal.toLocaleString('vi-VN')}đ</strong></span>
                    <span className="ml-auto font-bold" style={{ color: '#1B6CA8' }}>
                      Tổng: {totalPrice.toLocaleString('vi-VN')}đ
                    </span>
                  </div>
                )}
              </div>

              {/* Modal footer */}
              <div className="flex gap-3 px-6 pb-6 pt-2">
                <button
                  onClick={closeModal}
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
                    {saving ? 'Đang lưu...' : '✓ Hoàn tất & Gửi nhà thuốc'}
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
