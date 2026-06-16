// ─────────────────────────────────────────────
// types/index.ts — Global Types
// ─────────────────────────────────────────────

export type UserRole = 'doctor' | 'pharma' | 'admin' | 'patient'

export interface User {
  id: string
  name: string
  role: UserRole
  createdAt: string
}

export interface Service {
  name: string
  price: number
}

export type PatientStatus = 'pending' | 'done' | 'cancelled'

export interface PatientRecord {
  id: string
  patientName: string
  yearOfBirth: number
  weight?: number
  phone?: string
  diagnosis: string
  prescription: PrescriptionItem[]
  services: Service[]
  serviceNote?: string
  totalPrice: number
  advice?: string
  pharmacyNote?: string
  status: PatientStatus
  doctorId: string
  doctorName?: string
  createdAt: string
  completedAt?: string
}

export interface PrescriptionItem {
  drugName: string
  dosage: string
  quantity: number
  instruction: string
  unitPrice: number
}

export type PaymentMethod = 'TM' | 'CK' | 'No'

export interface Expense {
  id: string
  date: string
  amount: number
  detail: string
  createdBy: string
  createdAt: string
}

export interface InventoryItem {
  id: string
  date: string
  invoiceNumber: string
  itemType: string
  amount: number
  paymentMethod: PaymentMethod
  note?: string
  createdAt: string
}

export interface FinanceSummary {
  totalRevenue: number
  totalExpense: number
  totalInventory: number
  net: number
  patientCount: number
}

export interface AuthContextType {
  user: User | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
}

// ── Patient-specific types ────────────────────
export type AppointmentStatus = 'pending' | 'confirmed' | 'cancelled' | 'done'

export interface Appointment {
  id: string
  patientId: string
  doctorId: string
  doctorName?: string
  date: string
  timeSlot: string
  reason?: string
  status: AppointmentStatus
  createdAt: string
}

export interface QueueNumber {
  id: string
  appointmentId: string
  queueNumber: number
  date: string
  calledAt?: string
  status: 'waiting' | 'called' | 'done' | 'skipped'
}

export interface Patient {
  id: string
  fullName: string
  dateOfBirth?: string
  gender?: string
  phone?: string
  address?: string
  bloodType?: string
  allergies?: string
  insuranceId?: string
  createdAt: string
}

export interface MedicalRecord {
  id: string
  patientId: string
  patientRecordId: string
  visitDate: string
  doctorId: string
  doctorName?: string
  summary?: string
  createdAt: string
}

export interface FollowUp {
  id: string
  patientId: string
  doctorId: string
  doctorName?: string
  dueDate: string
  reason?: string
  note?: string
  status: 'pending' | 'booked' | 'done'
}

export interface Notification {
  id: string
  userId: string
  type: 'appointment_reminder' | 'queue_update' | 'follow_up' | 'general'
  title: string
  body: string
  read: boolean
  createdAt: string
}
