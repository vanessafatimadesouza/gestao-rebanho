import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { Session, User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import { Farm } from '../types'

interface AuthContextType {
  session: Session | null
  user: User | null
  farm: Farm | null
  setFarm: (farm: Farm | null) => void
  loading: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [farm, setFarm] = useState<Farm | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session) loadFarm(session.user.id)
      else setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (session) loadFarm(session.user.id)
      else {
        setFarm(null)
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  async function loadFarm(userId: string) {
    const { data } = await supabase
      .from('farm_members')
      .select('farm:farms(*)')
      .eq('user_id', userId)
      .limit(1)
      .single()

    if (data?.farm && !Array.isArray(data.farm)) {
      setFarm(data.farm as Farm)
    }
    setLoading(false)
  }

  async function signOut() {
    await supabase.auth.signOut()
    setFarm(null)
  }

  return (
    <AuthContext.Provider value={{
      session,
      user: session?.user ?? null,
      farm,
      setFarm,
      loading,
      signOut,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
