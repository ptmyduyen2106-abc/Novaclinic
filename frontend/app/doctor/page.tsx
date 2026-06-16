// app/doctor/page.tsx — Module bác sĩ
import { NavBar }     from '@/components/NavBar'
import { DoctorForm } from '@/components/DoctorForm'

export const metadata = { title: 'Khám bệnh — Novaclinic' }

export default function DoctorPage() {
  return (
    <>
      <NavBar />
      <main className="max-w-2xl mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-xl font-bold text-slate-800">🩺 Khám bệnh &amp; Kê đơn</h1>
          <p className="text-sm text-slate-500 mt-1">
            Điền thông tin xong bấm "Hoàn tất &amp; Gửi" — dữ liệu xuất hiện ngay tại nhà thuốc.
          </p>
        </div>
        <div className="card p-5">
          <DoctorForm />
        </div>
      </main>
    </>
  )
}
