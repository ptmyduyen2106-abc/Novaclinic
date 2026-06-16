'use client'
// components/NavBar.tsx — Top navigation (role-aware)

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'

const NAV_LINKS = [
  { href: '/doctor',    label: 'Bác sĩ',   roles: ['doctor', 'admin'],          icon: '🩺' },
  { href: '/pharmacy',  label: 'Nhà thuốc', roles: ['pharma', 'admin'],          icon: '💊' },
  { href: '/finance',   label: 'Tài chính', roles: ['admin'],                    icon: '📊' },
  { href: '/dashboard', label: 'Trang chủ', roles: ['patient'],                  icon: '🏠' },
  { href: '/booking',   label: 'Đặt lịch',  roles: ['patient'],                  icon: '📅' },
  { href: '/queue',     label: 'Hàng chờ',  roles: ['patient'],                  icon: '🔢' },
  { href: '/records',   label: 'Hồ sơ',     roles: ['patient'],                  icon: '📋' },
]

export function NavBar() {
  const { user, signOut } = useAuth()
  const pathname = usePathname()
  const router   = useRouter()

  if (!user) return null

  const visibleLinks = NAV_LINKS.filter((l) => l.roles.includes(user.role))

  const roleLabel =
    user.role === 'doctor'  ? 'Bác sĩ'
  : user.role === 'pharma'  ? 'Dược sĩ'
  : user.role === 'admin'   ? 'Quản lý'
  : 'Bệnh nhân'

  async function handleSignOut() {
    await signOut()
    router.replace('/login')
  }

  return (
    <nav className="bg-white border-b border-slate-200 sticky top-0 z-30">
      <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M7 1.5C3.96 1.5 1.5 3.96 1.5 7S3.96 12.5 7 12.5 12.5 10.04 12.5 7 10.04 1.5 7 1.5z" fill="white" opacity="0.4"/>
              <path d="M9 6.5H7.5V5a.5.5 0 00-1 0v1.5H5a.5.5 0 000 1h1.5V9a.5.5 0 001 0V7.5H9a.5.5 0 000-1z" fill="white"/>
            </svg>
          </div>
          <span className="font-bold text-slate-800 text-sm hidden sm:block">Phòng Khám</span>
        </Link>

        {/* Nav links */}
        <div className="flex items-center gap-1">
          {visibleLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                pathname.startsWith(link.href)
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <span className="text-base leading-none">{link.icon}</span>
              <span className="hidden sm:inline">{link.label}</span>
            </Link>
          ))}
        </div>

        {/* User menu */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="text-right hidden sm:block">
            <p className="text-xs font-semibold text-slate-700 leading-tight">{user.name}</p>
            <p className="text-[10px] text-slate-400">{roleLabel}</p>
          </div>
          <button
            onClick={handleSignOut}
            title="Đăng xuất"
            className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </div>
    </nav>
  )
}
