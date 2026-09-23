import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { Session, User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import { Farm } from '../types'

interface AuthContextType {
  session: Session | null
  user: User | null
  farm: Farm | null
  farms: Farm[]
  farmLoadError: string
  selectFarm: (farm: Farm) => void
  reloadFarms: () => Promise<void>
  loading: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [farm, setFarm] = useState<Farm | null>(null)
  const [farms, setFarms] = useState<Farm[]>([])
  const [farmLoadError, setFarmLoadError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session) void loadFarms(session.user.id)
      else setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'INITIAL_SESSION' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') return
      setSession(session)
      if (session) void loadFarms(session.user.id)
      else {
        setFarm(null)
        setFarms([])
        setFarmLoadError('')
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  async function loadFarms(userId: string) {
    const { data, error } = await supabase
      .from('farm_members')
      .select('farm:farms(*)')
      .eq('user_id', userId)
    if (error) {
      setFarmLoadError('Não foi possível carregar suas fazendas. Tente novamente.')
      setLoading(false)
      return
    }
    const availableFarms = (data ?? []).flatMap(member => member.farm && !Array.isArray(member.farm) ? [member.farm as Farm] : [])
      .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))
    setFarms(availableFarms)
    setFarmLoadError('')
    const savedId = sessionStorage.getItem(`manejo-farm-${userId}`)
    setFarm(availableFarms.find(item => item.id === savedId) ?? null)
    setLoading(false)
  }

  function selectFarm(selected: Farm) {
    if (!session) return
    setFarms(current => current.some(item => item.id === selected.id) ? current : [...current, selected].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR')))
    sessionStorage.setItem(`manejo-farm-${session.user.id}`, selected.id)
    setFarm(selected)
  }

  async function reloadFarms() {
    if (session) await loadFarms(session.user.id)
  }

  async function signOut() {
    if (session) sessionStorage.removeItem(`manejo-farm-${session.user.id}`)
    await supabase.auth.signOut()
    setFarm(null)
    setFarms([])
  }

  return (
    <AuthContext.Provider value={{
      session,
      user: session?.user ?? null,
      farm,
      farms,
      farmLoadError,
      selectFarm,
      reloadFarms,
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
