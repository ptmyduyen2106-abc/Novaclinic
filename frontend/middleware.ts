// middleware.ts — Edge route guard
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

const PUBLIC_ROUTES = ['/login', '/register']

const ROLE_ROUTES: Record<string, string[]> = {
  doctor:  ['/doctor'],
  pharma:  ['/pharmacy'],
  admin:   ['/doctor', '/pharmacy', '/finance'],
  patient: ['/patient'],
}

export async function middleware(req: NextRequest) {
  let res = NextResponse.next({ request: req })
  const path = req.nextUrl.pathname

  if (PUBLIC_ROUTES.some((r) => path.startsWith(r))) return res

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => req.cookies.set(name, value))
          res = NextResponse.next({ request: req })
          cookiesToSet.forEach(({ name, value, options }) =>
            res.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    const loginUrl = new URL('/login', req.url)
    loginUrl.searchParams.set('redirect', path)
    return NextResponse.redirect(loginUrl)
  }

  // ── Xác định role ──────────────────────────────────────────────
  // Bảng "users" chứa role cho bác sĩ / admin / dược.
  // Bệnh nhân nằm ở bảng "patients" riêng (không có cột role),
  // nên nếu không tìm thấy ở "users" thì kiểm tra tiếp ở "patients".
  const { data: userRow } = await supabase
    .from('users').select('role').eq('id', session.user.id).maybeSingle()

  let role: string | null = userRow?.role ?? null

  if (!role) {
    const { data: patientRow } = await supabase
      .from('patients').select('id').eq('id', session.user.id).maybeSingle()
    if (patientRow) role = 'patient'
  }

  if (!role) return NextResponse.redirect(new URL('/login', req.url))

  const allowed = ROLE_ROUTES[role] ?? []
  const isAllowed = allowed.some((r) => path.startsWith(r))

  if (!isAllowed) {
    const home = role === 'doctor'  ? '/doctor'
               : role === 'pharma'  ? '/pharmacy'
               : role === 'admin'   ? '/finance'
               : '/patient'
    return NextResponse.redirect(new URL(home, req.url))
  }

  return res
}

export const config = {
  matcher: ['/doctor/:path*', '/pharmacy/:path*', '/finance/:path*',
            '/patient/:path*'],
}