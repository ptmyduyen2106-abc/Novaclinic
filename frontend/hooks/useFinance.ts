// hooks/useFinance.ts — Finance data via backend API
'use client'
import { useState, useEffect, useCallback } from 'react'
import {
  apiFetchExpenses,
  apiFetchInventory,
  apiFetchAllRecords,
  apiCreateExpense,
  apiCreateInventoryItem,
} from '@/lib/supabase'
import type { Expense, InventoryItem, PatientRecord, FinanceSummary } from '@/types'

interface UseFinanceReturn {
  expenses:         Expense[]
  inventory:        InventoryItem[]
  completedRecords: PatientRecord[]
  summary:          FinanceSummary
  loading:          boolean
  error:            string | null
  selectedMonth:    string
  setSelectedMonth: (month: string) => void
  addExpense:       (expense: Omit<Expense, 'id' | 'createdAt'>) => Promise<void>
  addInventoryItem: (item: Omit<InventoryItem, 'id' | 'createdAt'>) => Promise<void>
}

function currentMonth(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

function computeSummary(
  records: PatientRecord[],
  expenses: Expense[],
  inventory: InventoryItem[]
): FinanceSummary {
  const done           = records.filter((r) => r.status === 'done')
  const totalRevenue   = done.reduce((s, r) => s + (r.totalPrice ?? 0), 0)
  const totalExpense   = expenses.reduce((s, e) => s + e.amount, 0)
  const totalInventory = inventory.reduce((s, i) => s + i.amount, 0)
  return { totalRevenue, totalExpense, totalInventory,
           net: totalRevenue - totalExpense - totalInventory,
           patientCount: done.length }
}

export function useFinance(): UseFinanceReturn {
  const [expenses,         setExpenses]         = useState<Expense[]>([])
  const [inventory,        setInventory]        = useState<InventoryItem[]>([])
  const [completedRecords, setCompletedRecords] = useState<PatientRecord[]>([])
  const [loading,          setLoading]          = useState(true)
  const [error,            setError]            = useState<string | null>(null)
  const [selectedMonth,    setSelectedMonth]    = useState(currentMonth())

  const loadAll = useCallback(async (month: string) => {
    setLoading(true); setError(null)
    try {
      const [exp, inv, records] = await Promise.all([
        apiFetchExpenses(month),
        apiFetchInventory(month),
        apiFetchAllRecords(500),
      ])

      setExpenses(exp)
      setInventory(inv)

      // Lọc record theo tháng (backend getAllRecords không filter theo tháng)
      const start = `${month}-01`
      const [y, m] = month.split('-').map(Number)
      const lastDay = new Date(y, m, 0).getDate()
      const end = `${month}-${String(lastDay).padStart(2, '0')}T23:59:59`

      setCompletedRecords(
        records.filter((r) => r.createdAt >= `${start}T00:00:00` && r.createdAt <= end)
      )
    } catch (err: unknown) {
      setError((err as Error)?.message ?? 'Lỗi tải dữ liệu tài chính')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadAll(selectedMonth) }, [selectedMonth, loadAll])

  const addExpense = useCallback(async (expense: Omit<Expense, 'id' | 'createdAt'>) => {
    const created = await apiCreateExpense(expense)
    setExpenses((prev) => [created, ...prev])
  }, [])

  const addInventoryItem = useCallback(async (item: Omit<InventoryItem, 'id' | 'createdAt'>) => {
    const created = await apiCreateInventoryItem(item)
    setInventory((prev) => [created, ...prev])
  }, [])

  return {
    expenses, inventory, completedRecords,
    summary: computeSummary(completedRecords, expenses, inventory),
    loading, error, selectedMonth, setSelectedMonth, addExpense, addInventoryItem,
  }
}