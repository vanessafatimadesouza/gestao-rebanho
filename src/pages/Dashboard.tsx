import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { PawPrint, Syringe, Baby, AlertCircle, Copy, Check, TrendingUp } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { Vaccination } from '../types'

interface Stats {
  totalAnimals: number
  activeAnimals: number
  females: number
  males: number
  recentBirths: number
}

export function Dashboard() {
  const { farm } = useAuth()
  const [stats, setStats] = useState<Stats | null>(null)
  const [upcoming, setUpcoming] = useState<Vaccination[]>([])
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!farm) return
    loadStats()
    loadUpcomingVaccinations()
  }, [farm])

  async function loadStats() {
    const { data: animals } = await supabase
      .from('animals')
      .select('sex, status')
      .eq('farm_id', farm!.id)

    const { count: recentBirths } = await supabase
      .from('births')
      .select('*', { count: 'exact', head: true })
      .eq('farm_id', farm!.id)
      .gte('birth_date', new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0])

    if (animals) {
      setStats({
        totalAnimals: animals.length,
        activeAnimals: animals.filter(a => a.status === 'active').length,
        females: animals.filter(a => a.sex === 'F' && a.status === 'active').length,
        males: animals.filter(a => a.sex === 'M' && a.status === 'active').length,
        recentBirths: recentBirths ?? 0,
      })
    }
  }

  async function loadUpcomingVaccinations() {
    const today = new Date().toISOString().split('T')[0]
    const in30 = new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]

    const { data } = await supabase
      .from('vaccinations')
      .select('*, animal:animals(id, tag, name)')
      .eq('farm_id', farm!.id)
      .gte('next_due_date', today)
      .lte('next_due_date', in30)
      .order('next_due_date')
      .limit(5)

    if (data) setUpcoming(data as Vaccination[])
  }

  function copyFarmCode() {
    if (!farm) return
    navigator.clipboard.writeText(farm.id)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-5">
      {/* Welcome banner */}
      <div className="bg-gradient-to-r from-brand-700 to-brand-600 rounded-2xl p-5 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">{farm?.name}</h1>
            <p className="text-brand-200 text-sm mt-0.5">Bem-vinda ao painel do rebanho</p>
          </div>
          <span className="text-5xl">🐄</span>
        </div>
        <button
          onClick={copyFarmCode}
          className="mt-4 flex items-center gap-1.5 text-xs text-brand-100 bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg transition-colors"
        >
          {copied ? <Check size={12} /> : <Copy size={12} />}
          {copied ? 'Código copiado!' : 'Copiar código para convidar pessoas'}
        </button>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-400 font-medium">Total plantel</span>
            <div className="p-1.5 bg-brand-50 rounded-lg"><PawPrint size={14} className="text-brand-600" /></div>
          </div>
          <p className="text-3xl font-bold text-gray-800">{stats?.activeAnimals ?? '—'}</p>
          <p className="text-xs text-gray-400 mt-1">{stats?.females ?? 0} fêmeas · {stats?.males ?? 0} machos</p>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-400 font-medium">Partos (30d)</span>
            <div className="p-1.5 bg-pink-50 rounded-lg"><Baby size={14} className="text-pink-500" /></div>
          </div>
          <p className="text-3xl font-bold text-gray-800">{stats?.recentBirths ?? '—'}</p>
          <p className="text-xs text-gray-400 mt-1">últimos 30 dias</p>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-400 font-medium">Vacinas</span>
            <div className="p-1.5 bg-amber-50 rounded-lg"><Syringe size={14} className="text-amber-500" /></div>
          </div>
          <p className="text-3xl font-bold text-gray-800">{upcoming.length}</p>
          <p className="text-xs text-gray-400 mt-1">a vencer em 30 dias</p>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-400 font-medium">Rebanho total</span>
            <div className="p-1.5 bg-purple-50 rounded-lg"><TrendingUp size={14} className="text-purple-500" /></div>
          </div>
          <p className="text-3xl font-bold text-gray-800">{stats?.totalAnimals ?? '—'}</p>
          <p className="text-xs text-gray-400 mt-1">incl. vendidos/mortos</p>
        </div>
      </div>

      {/* Upcoming vaccinations */}
      {upcoming.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-amber-100">
          <div className="flex items-center justify-between px-4 pt-4 pb-2">
            <h2 className="font-semibold text-gray-700 flex items-center gap-2 text-sm">
              <AlertCircle size={15} className="text-amber-500" />
              Vacinas a vencer nos próximos 30 dias
            </h2>
            <Link to="/vacinas" className="text-xs text-brand-700 hover:underline">Ver todas</Link>
          </div>
          <div className="divide-y divide-gray-50 px-4 pb-2">
            {upcoming.map(v => {
              const animal = v.animal as unknown as { id: string; tag: string; name: string | null } | null
              return (
                <div key={v.id} className="py-2.5 flex items-center justify-between">
                  <div>
                    <span className="font-medium text-sm text-gray-800">{v.vaccine_name}</span>
                    {animal && (
                      <span className="text-gray-400 text-xs ml-2">
                        {animal.tag}{animal.name ? ` · ${animal.name}` : ''}
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full font-medium">
                    {new Date(v.next_due_date + 'T12:00:00').toLocaleDateString('pt-BR')}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Quick actions */}
      <div>
        <p className="text-xs text-gray-400 font-medium mb-2 uppercase tracking-wide">Ações rápidas</p>
        <div className="grid grid-cols-2 gap-3">
          <Link to="/animais/novo" className="bg-brand-700 text-white rounded-2xl p-4 flex items-center gap-3 hover:bg-brand-800 transition-colors shadow-sm">
            <div className="p-2 bg-white/20 rounded-xl"><PawPrint size={18} /></div>
            <div>
              <p className="font-semibold text-sm">Novo animal</p>
              <p className="text-brand-200 text-xs">Cadastrar no rebanho</p>
            </div>
          </Link>
          <Link to="/vacinas/nova" className="bg-amber-500 text-white rounded-2xl p-4 flex items-center gap-3 hover:bg-amber-600 transition-colors shadow-sm">
            <div className="p-2 bg-white/20 rounded-xl"><Syringe size={18} /></div>
            <div>
              <p className="font-semibold text-sm">Registrar vacina</p>
              <p className="text-amber-100 text-xs">Aplicação ou reforço</p>
            </div>
          </Link>
          <Link to="/partos/novo" className="bg-pink-500 text-white rounded-2xl p-4 flex items-center gap-3 hover:bg-pink-600 transition-colors shadow-sm">
            <div className="p-2 bg-white/20 rounded-xl"><Baby size={18} /></div>
            <div>
              <p className="font-semibold text-sm">Registrar parto</p>
              <p className="text-pink-100 text-xs">Nova cria no rebanho</p>
            </div>
          </Link>
          <Link to="/animais" className="bg-white border border-gray-200 text-gray-700 rounded-2xl p-4 flex items-center gap-3 hover:border-brand-300 hover:bg-brand-50 transition-colors shadow-sm">
            <div className="p-2 bg-brand-50 rounded-xl"><PawPrint size={18} className="text-brand-600" /></div>
            <div>
              <p className="font-semibold text-sm">Ver rebanho</p>
              <p className="text-gray-400 text-xs">Lista completa</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  )
}
