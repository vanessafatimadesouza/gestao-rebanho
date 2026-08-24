import { useState, FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { Farm } from '../types'

type Mode = 'create' | 'join'

export function FarmSetup() {
  const { user, setFarm } = useAuth()
  const navigate = useNavigate()
  const [mode, setMode] = useState<Mode>('create')
  const [farmName, setFarmName] = useState('')
  const [farmCode, setFarmCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleCreate(e: FormEvent) {
    e.preventDefault()
    if (!user) return
    setError('')
    setLoading(true)

    const { data: farm, error: farmErr } = await supabase
      .from('farms')
      .insert({ name: farmName.trim(), created_by: user.id })
      .select()
      .single()

    if (farmErr || !farm) {
      setError(farmErr?.message ?? 'Erro ao criar fazenda')
      setLoading(false)
      return
    }

    const { error: memberErr } = await supabase
      .from('farm_members')
      .insert({ farm_id: farm.id, user_id: user.id, role: 'owner' })

    if (memberErr) {
      setError(memberErr.message)
      setLoading(false)
      return
    }

    setFarm(farm as Farm)
    navigate('/')
  }

  async function handleJoin(e: FormEvent) {
    e.preventDefault()
    if (!user) return
    setError('')
    setLoading(true)

    const code = farmCode.trim()

    const { data: farm, error: farmErr } = await supabase
      .from('farms')
      .select()
      .eq('id', code)
      .single()

    if (farmErr || !farm) {
      setError('Fazenda não encontrada. Verifique o código.')
      setLoading(false)
      return
    }

    const { error: memberErr } = await supabase
      .from('farm_members')
      .insert({ farm_id: farm.id, user_id: user.id, role: 'member' })

    if (memberErr) {
      setError(memberErr.code === '23505' ? 'Você já é membro desta fazenda.' : memberErr.message)
      setLoading(false)
      return
    }

    setFarm(farm as Farm)
    navigate('/')
  }

  return (
    <div className="min-h-screen bg-[#edf5ef] flex items-center justify-center p-5">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <span className="text-6xl">🏡</span>
          <h1 className="mt-3 text-2xl font-bold text-brand-900">Configurar fazenda</h1>
          <p className="text-brand-700 text-sm mt-1">Crie uma fazenda ou entre em uma existente</p>
        </div>

        <div className="app-surface p-6 sm:p-7">
          <div className="mb-6 flex overflow-hidden rounded-xl border border-brand-200 bg-brand-50">
            <button
              onClick={() => setMode('create')}
              className={`flex-1 py-2 text-sm font-medium transition-colors
                ${mode === 'create' ? 'bg-brand-700 text-white shadow-sm' : 'text-brand-700 hover:bg-brand-100'}`}
            >
              Criar fazenda
            </button>
            <button
              onClick={() => setMode('join')}
              className={`flex-1 py-2 text-sm font-medium transition-colors
                ${mode === 'join' ? 'bg-brand-700 text-white shadow-sm' : 'text-brand-700 hover:bg-brand-100'}`}
            >
              Entrar com código
            </button>
          </div>

          {mode === 'create' ? (
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome da fazenda</label>
                <input
                  type="text"
                  value={farmName}
                  onChange={e => setFarmName(e.target.value)}
                  required
                  className="w-full rounded-xl border border-[#dce7df] bg-[#fbfdfb] px-3 py-2.5 text-sm outline-none"
                  placeholder="Ex: Fazenda Santa Cruz"
                />
              </div>
              {error && <p className="text-red-600 text-sm bg-red-50 rounded-lg px-3 py-2">{error}</p>}
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-brand-700 py-3 font-semibold text-white shadow-[0_8px_18px_rgba(31,73,51,.18)] transition-colors hover:bg-brand-800 disabled:opacity-60"
              >
                {loading ? 'Criando...' : 'Criar fazenda'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleJoin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Código da fazenda</label>
                <input
                  type="text"
                  value={farmCode}
                  onChange={e => setFarmCode(e.target.value)}
                  required
                  className="w-full rounded-xl border border-[#dce7df] bg-[#fbfdfb] px-3 py-2.5 text-sm font-mono outline-none"
                  placeholder="Cole o código recebido aqui"
                />
                <p className="text-gray-500 text-xs mt-1">
                  Peça ao dono da fazenda para compartilhar o código dela.
                </p>
              </div>
              {error && <p className="text-red-600 text-sm bg-red-50 rounded-lg px-3 py-2">{error}</p>}
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-brand-700 py-3 font-semibold text-white shadow-[0_8px_18px_rgba(31,73,51,.18)] transition-colors hover:bg-brand-800 disabled:opacity-60"
              >
                {loading ? 'Entrando...' : 'Entrar na fazenda'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
