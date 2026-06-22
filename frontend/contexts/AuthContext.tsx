'use client'
// contexts/AuthContext.tsx

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react'
import { supabase, signInWithEmail, signOut as supabaseSignOut } from '@/lib/supabase'
import type { User, AuthContextType } from '@/types'

const AuthContext = createContext<AuthContextType>({
  user: null, loading: true,
  signIn: async () => {}, signOut: async () => {},
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser]       = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  const loadUser = useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .maybeSingle()          // ← không throw 406 khi 0 dòng

    if (error) {
      console.error('[AuthContext] loadUser error:', error.message)
      setUser(null)
      return
    }

    setUser(data ?? null)
  }, [])

  useEffect(() => {
    // Dùng onAuthStateChange làm nguồn duy nhất — nó bắn INITIAL_SESSION
    // ngay khi subscribe nên không cần getSession() riêng nữa
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (session?.user) {
          await loadUser(session.user.id)
        } else {
          setUser(null)
        }
        // setLoading(false) sau lần đầu tiên (INITIAL_SESSION)
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [loadUser])

  const signIn = useCallback(async (email: string, password: string) => {
    await signInWithEmail(email, password)
  }, [])

  const signOut = useCallback(async () => {
    await supabaseSignOut()
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() { return useContext(AuthContext) }