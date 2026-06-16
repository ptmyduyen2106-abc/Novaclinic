// app/finance/page.tsx — Module tài chính
import { NavBar }           from '@/components/NavBar'
import { FinanceDashboard } from '@/components/FinanceDashboard'

export const metadata = { title: 'Tài chính — Phòng Khám' }

export default function FinancePage() {
  return (
    <>
      <NavBar />
      <main className="max-w-2xl mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-xl font-bold text-slate-800">📊 Tài chính</h1>
          <p className="text-sm text-slate-500 mt-1">
            Doanh thu · Chi phí · Nhập hàng · Lợi nhuận — cập nhật theo thời gian thực.
          </p>
        </div>
        <FinanceDashboard />
      </main>
    </>
  )
}
