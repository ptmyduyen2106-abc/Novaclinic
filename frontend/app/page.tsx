// app/page.tsx — Root redirect theo role
import { redirect } from 'next/navigation'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
export default async function RootPage() {
  const cookieStore = await cookies()
const supabase = createServerClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll() {
        // no-op trong Server Component
      },
    },
  }
)
  const { data: { session } } = await supabase.auth.getSession()

  if (!session?.user) redirect('/login')

  const { data: user } = await supabase
    .from('users').select('role').eq('id', session.user.id).single()

  if (!user) redirect('/login')

  if (user.role === 'doctor')  redirect('/doctor')
  if (user.role === 'pharma')  redirect('/pharmacy')
  if (user.role === 'admin')   redirect('/finance')
  if (user.role === 'patient') redirect('/patient')

  redirect('/login')
}
