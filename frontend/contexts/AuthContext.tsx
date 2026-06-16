'use client'
// ─────────────────────────────────────────────
// contexts/AuthContext.tsx
// ─────────────────────────────────────────────

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
    const { data } = await supabase
      .from('users').select('*').eq('id', userId).single()
    setUser(data ?? null)
  }, [])

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        loadUser(session.user.id).finally(() => setLoading(false))
      } else {
        setLoading(false)
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) loadUser(session.user.id)
      else setUser(null)
    })

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
