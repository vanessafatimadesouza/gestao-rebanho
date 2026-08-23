import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { PawPrint, Syringe, Baby, AlertCircle, Copy, Check } from 'lucide-react'
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

function StatCard({ label, value, sub, icon }: {
  label: string
  value: number | string
  sub?: string
  icon: React.ReactNode
}) {
  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex items-center gap-4">
      <div className="p-3 bg-brand-50 rounded-lg text-brand-700">{icon}</div>
      <div>
        <div className="text-2xl font-bold text-gray-800">{value}</div>
        <div className="text-sm text-gray-500">{label}</div>
        {sub && <div className="text-xs text-brand-600">{sub}</div>}
      </div>
    </div>
  )
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-800">Dashboard</h1>
        <button
          onClick={copyFarmCode}
          title="Copiar código da fazenda para compartilhar"
          className="flex items-center gap-1.5 text-xs text-brand-700 bg-brand-50 border border-brand-200 px-3 py-1.5 rounded-lg hover:bg-brand-100 transition-colors"
        >
          {copied ? <Check size={14} /> : <Copy size={14} />}
          {copied ? 'Copiado!' : 'Código da fazenda'}
        </button>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard
          label="Animais ativos"
          value={stats?.activeAnimals ?? '—'}
          sub={`${stats?.females ?? 0}F / ${stats?.males ?? 0}M`}
          icon={<PawPrint size={22} />}
        />
        <StatCard
          label="Partos (30 dias)"
          value={stats?.recentBirths ?? '—'}
          icon={<Baby size={22} />}
        />
        <StatCard
          label="Vacinas próximas"
          value={upcoming.length}
          sub="próximos 30 dias"
          icon={<Syringe size={22} />}
        />
        <StatCard
          label="Total rebanho"
          value={stats?.totalAnimals ?? '—'}
          icon={<PawPrint size={22} />}
        />
      </div>

      {/* Upcoming vaccinations */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-gray-700 flex items-center gap-2">
            <AlertCircle size={16} className="text-amber-500" />
            Vacinas a vencer (30 dias)
          </h2>
          <Link to="/vacinas" className="text-xs text-brand-700 hover:underline">Ver todas</Link>
        </div>

        {upcoming.length === 0 ? (
          <p className="text-gray-400 text-sm py-4 text-center">Nenhuma vacina a vencer nos próximos 30 dias</p>
        ) : (
          <div className="divide-y divide-gray-50">
            {upcoming.map(v => (
              <div key={v.id} className="py-2.5 flex items-center justify-between">
                <div>
                  <span className="font-medium text-sm text-gray-800">{v.vaccine_name}</span>
                  <span className="text-gray-500 text-sm"> — </span>
                  <span className="text-sm text-gray-600">
                    {(v.animal as unknown as { tag: string; name: string | null })?.tag}
                    {(v.animal as unknown as { tag: string; name: string | null })?.name
                      ? ` (${(v.animal as unknown as { tag: string; name: string | null }).name})`
                      : ''}
                  </span>
                </div>
                <span className="text-xs text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full font-medium">
                  {new Date(v.next_due_date + 'T12:00:00').toLocaleDateString('pt-BR')}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-3">
        <Link
          to="/animais/novo"
          className="bg-brand-700 text-white rounded-xl p-4 flex items-center gap-3 hover:bg-brand-800 transition-colors"
        >
          <PawPrint size={20} />
          <span className="font-medium text-sm">Novo animal</span>
        </Link>
        <Link
          to="/vacinas/nova"
          className="bg-brand-600 text-white rounded-xl p-4 flex items-center gap-3 hover:bg-brand-700 transition-colors"
        >
          <Syringe size={20} />
          <span className="font-medium text-sm">Registrar vacina</span>
        </Link>
        <Link
          to="/partos/novo"
          className="bg-brand-500 text-white rounded-xl p-4 flex items-center gap-3 hover:bg-brand-600 transition-colors"
        >
          <Baby size={20} />
          <span className="font-medium text-sm">Registrar parto</span>
        </Link>
      </div>
    </div>
  )
}
