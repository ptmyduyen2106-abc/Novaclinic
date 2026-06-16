// app/pharmacy/page.tsx — Module nhà thuốc
import { NavBar }        from '@/components/NavBar'
import { PharmacyQueue } from '@/components/PharmacyQueue'

export const metadata = { title: 'Nhà thuốc — Novaclinic' }

export default function PharmacyPage() {
  return (
    <>
      <NavBar />
      <main className="max-w-2xl mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-xl font-bold text-slate-800">💊 Hàng chờ nhà thuốc</h1>
          <p className="text-sm text-slate-500 mt-1">
            Đơn thuốc mới từ bác sĩ sẽ xuất hiện tức thì — không cần tải lại trang.
          </p>
        </div>
        <PharmacyQueue />
      </main>
    </>
  )
}
