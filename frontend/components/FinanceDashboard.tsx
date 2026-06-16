'use client'
// components/FinanceDashboard.tsx — Tổng quan tài chính

import { useState }          from 'react'
import { useFinance }        from '@/hooks/useFinance'
import { InventoryModal }    from './InventoryModal'
import { useAuth }           from '@/contexts/AuthContext'
import type { Expense }      from '@/types'

type ActiveTab = 'overview' | 'expenses' | 'inventory' | 'patients'

const MONTHS = Array.from({ length: 12 }, (_, i) => {
  const d = new Date()
  d.setMonth(d.getMonth() - i)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  return { value: `${y}-${m}`, label: `Tháng ${d.getMonth() + 1}/${y}` }
})

export function FinanceDashboard() {
  const { user } = useAuth()
  const {
    expenses, inventory, completedRecords, summary,
    loading, error, selectedMonth, setSelectedMonth,
    addExpense, addInventoryItem,
  } = useFinance()

  const [tab,               setTab]               = useState<ActiveTab>('overview')
  const [showInventoryModal,setShowInventoryModal] = useState(false)
  const [showExpenseForm,   setShowExpenseForm]    = useState(false)
  const [expenseDetail,     setExpenseDetail]      = useState('')
  const [expenseAmount,     setExpenseAmount]      = useState('')
  const [expenseDate,       setExpenseDate]        = useState(new Date().toISOString().split('T')[0])
  const [savingExpense,     setSavingExpense]      = useState(false)

  async function handleAddExpense() {
    if (!expenseDetail || !expenseAmount || !user) return
    setSavingExpense(true)
    try {
      await addExpense({ date: expenseDate, amount: Number(expenseAmount), detail: expenseDetail.trim(), createdBy: user.id })
      setExpenseDetail(''); setExpenseAmount(''); setShowExpenseForm(false)
    } finally { setSavingExpense(false) }
  }

  if (loading) return (
    <div className="grid grid-cols-2 gap-3">
      {[1,2,3,4].map((i) => <div key={i} className="h-24 bg-slate-100 rounded-2xl animate-pulse" />)}
    </div>
  )

  if (error) return (
    <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-600 text-sm">{error}</div>
  )

  const tabs: { key: ActiveTab; label: string }[] = [
    { key: 'overview',  label: 'Tổng quan' },
    { key: 'patients',  label: `Bệnh nhân (${completedRecords.length})` },
    { key: 'expenses',  label: `Chi phí (${expenses.length})` },
    { key: 'inventory', label: `Nhập hàng (${inventory.length})` },
  ]

  return (
    <div className="space-y-5">
      {/* Month selector */}
      <div className="flex items-center gap-3">
        <label className="text-sm font-medium text-slate-600 shrink-0">Tháng:</label>
        <select value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} className="input-field max-w-[180px]">
          {MONTHS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
        </select>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3">
        <SummaryCard label="Doanh thu"  value={summary.totalRevenue}   sub={`${summary.patientCount} bệnh nhân`} color="emerald" icon="💰" />
        <SummaryCard label="Lợi nhuận"  value={summary.net}             sub="Sau chi phí & nhập hàng"             color={summary.net >= 0 ? 'blue' : 'red'} icon={summary.net >= 0 ? '📈' : '📉'} />
        <SummaryCard label="Chi phí"    value={summary.totalExpense}    sub={`${expenses.length} khoản`}          color="orange" icon="📋" />
        <SummaryCard label="Nhập hàng"  value={summary.totalInventory}  sub={`${inventory.length} phiếu`}         color="violet" icon="📦" />
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200">
        <div className="flex gap-0 overflow-x-auto">
          {tabs.map((t) => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`px-4 py-2.5 text-xs font-semibold border-b-2 whitespace-nowrap transition ${
                tab === t.key ? 'border-blue-600 text-blue-700' : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div>
        {/* OVERVIEW */}
        {tab === 'overview' && (
          <div className="bg-slate-50 rounded-xl p-4 space-y-2.5">
            <FinanceRow label="Tổng doanh thu"     value={summary.totalRevenue}   positive />
            <FinanceRow label="Chi phí vận hành"   value={-summary.totalExpense} />
            <FinanceRow label="Nhập hàng / thuốc"  value={-summary.totalInventory} />
            <div className="border-t border-slate-200 pt-2 flex justify-between">
              <span className="text-sm font-bold text-slate-700">Lợi nhuận ròng</span>
              <span className={`text-sm font-bold ${summary.net >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                {summary.net >= 0 ? '+' : ''}{summary.net.toLocaleString('vi-VN')}đ
              </span>
            </div>
          </div>
        )}

        {/* PATIENTS */}
        {tab === 'patients' && (
          <div className="space-y-2">
            {completedRecords.filter((r) => r.status === 'done').length === 0
              ? <EmptyState text="Không có bệnh nhân trong tháng này" />
              : completedRecords.filter((r) => r.status === 'done').map((r) => (
                <div key={r.id} className="flex items-center justify-between py-2.5 px-3 bg-white border border-slate-200 rounded-xl">
                  <div>
                    <p className="text-sm font-medium text-slate-800">{r.patientName}</p>
                    <p className="text-xs text-slate-500">{r.diagnosis}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-emerald-600">{r.totalPrice.toLocaleString('vi-VN')}đ</p>
                    <p className="text-xs text-slate-400">{new Date(r.createdAt).toLocaleDateString('vi-VN')}</p>
                  </div>
                </div>
              ))
            }
          </div>
        )}

        {/* EXPENSES */}
        {tab === 'expenses' && (
          <div className="space-y-2">
            <button onClick={() => setShowExpenseForm((v) => !v)}
              className="w-full py-2 border-2 border-dashed border-slate-200 rounded-xl text-sm text-slate-500 hover:border-blue-300 hover:text-blue-600 transition">
              + Thêm chi phí
            </button>
            {showExpenseForm && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 space-y-2">
                <input type="date" value={expenseDate} onChange={(e) => setExpenseDate(e.target.value)} className="input-field" />
                <input type="text" value={expenseDetail} onChange={(e) => setExpenseDetail(e.target.value)} placeholder="Điện, nước, lương, vật tư…" className="input-field" />
                <input type="number" value={expenseAmount} onChange={(e) => setExpenseAmount(e.target.value)} placeholder="Số tiền (đ)" min={0} step={1000} className="input-field" />
                <div className="flex gap-2">
                  <button onClick={() => setShowExpenseForm(false)} className="flex-1 py-2 text-sm border border-slate-200 rounded-lg text-slate-600 hover:bg-white transition">Hủy</button>
                  <button onClick={handleAddExpense} disabled={savingExpense} className="flex-1 py-2 text-sm bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition">
                    {savingExpense ? 'Đang lưu…' : 'Lưu'}
                  </button>
                </div>
              </div>
            )}
            {expenses.length === 0
              ? <EmptyState text="Chưa có chi phí trong tháng này" />
              : expenses.map((exp) => (
                <div key={exp.id} className="flex items-center justify-between py-2.5 px-3 bg-white border border-slate-200 rounded-xl">
                  <div>
                    <p className="text-sm text-slate-800">{exp.detail}</p>
                    <p className="text-xs text-slate-400">{new Date(exp.date).toLocaleDateString('vi-VN')}</p>
                  </div>
                  <p className="text-sm font-semibold text-orange-600">-{exp.amount.toLocaleString('vi-VN')}đ</p>
                </div>
              ))
            }
          </div>
        )}

        {/* INVENTORY */}
        {tab === 'inventory' && (
          <div className="space-y-2">
            <button onClick={() => setShowInventoryModal(true)}
              className="w-full py-2 border-2 border-dashed border-slate-200 rounded-xl text-sm text-slate-500 hover:border-blue-300 hover:text-blue-600 transition">
              + Thêm phiếu nhập hàng
            </button>
            {inventory.length === 0
              ? <EmptyState text="Chưa có phiếu nhập trong tháng này" />
              : inventory.map((item) => (
                <div key={item.id} className="flex items-center justify-between py-2.5 px-3 bg-white border border-slate-200 rounded-xl">
                  <div>
                    <p className="text-sm text-slate-800">{item.itemType}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-slate-400">{new Date(item.date).toLocaleDateString('vi-VN')}</span>
                      {item.invoiceNumber && <span className="text-xs bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">{item.invoiceNumber}</span>}
                      <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                        item.paymentMethod === 'TM' ? 'bg-emerald-50 text-emerald-700'
                      : item.paymentMethod === 'CK' ? 'bg-blue-50 text-blue-700'
                      : 'bg-orange-50 text-orange-700'}`}>
                        {item.paymentMethod === 'TM' ? 'Tiền mặt' : item.paymentMethod === 'CK' ? 'CK' : 'Nợ'}
                      </span>
                    </div>
                  </div>
                  <p className="text-sm font-semibold text-violet-600">-{item.amount.toLocaleString('vi-VN')}đ</p>
                </div>
              ))
            }
          </div>
        )}
      </div>

      <InventoryModal open={showInventoryModal} onClose={() => setShowInventoryModal(false)} onSave={addInventoryItem} />
    </div>
  )
}

// ── Sub-components ────────────────────────────

function SummaryCard({ label, value, sub, color, icon }: { label: string; value: number; sub: string; color: string; icon: string }) {
  const colorMap: Record<string, string> = {
    emerald: 'bg-emerald-50 border-emerald-200', blue: 'bg-blue-50 border-blue-200',
    red: 'bg-red-50 border-red-200', orange: 'bg-orange-50 border-orange-200', violet: 'bg-violet-50 border-violet-200',
  }
  const textMap: Record<string, string> = {
    emerald: 'text-emerald-700', blue: 'text-blue-700', red: 'text-red-600', orange: 'text-orange-700', violet: 'text-violet-700',
  }
  return (
    <div className={`rounded-2xl border p-4 ${colorMap[color] ?? colorMap.blue}`}>
      <div className="flex items-start justify-between">
        <p className="text-xs text-slate-500 font-medium">{label}</p>
        <span className="text-lg">{icon}</span>
      </div>
      <p className={`text-xl font-bold mt-1 ${textMap[color] ?? textMap.blue}`}>{Math.abs(value).toLocaleString('vi-VN')}đ</p>
      <p className="text-xs text-slate-400 mt-0.5">{sub}</p>
    </div>
  )
}

function FinanceRow({ label, value, positive = false }: { label: string; value: number; positive?: boolean }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-sm text-slate-600">{label}</span>
      <span className={`text-sm font-semibold ${positive ? 'text-emerald-600' : value >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
        {value >= 0 && positive ? '+' : ''}{value.toLocaleString('vi-VN')}đ
      </span>
    </div>
  )
}

function EmptyState({ text }: { text: string }) {
  return <div className="text-center py-8 text-slate-400 text-sm"><p>{text}</p></div>
}
