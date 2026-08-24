import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { PawPrint, Plus, Search } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { Animal } from '../types'

const STATUS_LABEL: Record<Animal['status'], string> = {
  active: 'Ativo',
  sold: 'Vendido',
  dead: 'Morto',
}

const STATUS_STYLE: Record<Animal['status'], string> = {
  active: 'bg-green-500',
  sold: 'bg-blue-500',
  dead: 'bg-gray-400',
}

function AnimalCard({ animal }: { animal: Animal }) {
  const isFemaleCow = animal.sex === 'F'
  const bgGradient = isFemaleCow
    ? 'from-emerald-50 to-green-100'
    : 'from-sky-50 to-blue-100'
  const accentColor = isFemaleCow ? 'text-emerald-700' : 'text-sky-700'

  return (
    <Link
      to={`/animais/${animal.id}`}
      className="group overflow-hidden rounded-2xl border border-[#e0e9e3] bg-white shadow-[0_8px_22px_rgba(19,48,32,.04)] transition-all hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-[0_14px_30px_rgba(19,48,32,.09)]"
    >
      {/* Card header with gradient background */}
      <div className={`relative min-h-[196px] overflow-hidden bg-gradient-to-br ${bgGradient} px-4 pb-6 pt-4`}>
        {animal.image_url && <><img src={animal.image_url} alt={animal.name ?? 'Animal'} className="absolute inset-0 h-full w-full object-cover" /><div className="absolute inset-0 bg-gradient-to-t from-[#173e2b]/25 via-transparent to-black/10" /></>}
        {/* Status badge */}
        <div className="relative z-10 flex items-start justify-between">
          <span className={`rounded-full px-2.5 py-1 text-xs font-semibold text-white shadow-sm ${STATUS_STYLE[animal.status]}`}>
            {STATUS_LABEL[animal.status]}
          </span>
          {animal.tag && <span className="rounded-full bg-white/70 px-2 py-0.5 font-mono text-xs text-gray-500">#{animal.tag}</span>}
        </div>

        {/* Animal icon */}
        {!animal.image_url && <div className="relative z-10 flex h-[138px] items-center justify-center"><span className={`flex h-20 w-20 items-center justify-center rounded-2xl bg-white/65 shadow-sm ${accentColor}`}><PawPrint size={34} strokeWidth={1.5} /></span></div>}
      </div>

      {/* Card body */}
      <div className="px-4 py-4">
        <div className="mb-2">
          <p className={`text-base font-bold ${accentColor}`}>
            {animal.name ?? animal.tag ?? 'Sem nome'}
          </p>
          <p className="text-xs text-gray-400">
            {animal.sex === 'F' ? 'Fêmea' : 'Macho'}
            {animal.breed ? ` · ${animal.breed}` : ''}
          </p>
        </div>

        {animal.birth_date && (
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-50">
            <span className="text-xs text-gray-400">Nascimento</span>
            <span className="text-xs font-medium text-gray-600">
              {new Date(animal.birth_date + 'T12:00:00').toLocaleDateString('pt-BR')}
            </span>
          </div>
        )}
      </div>
    </Link>
  )
}

export function Animals() {
  const { farm } = useAuth()
  const [animals, setAnimals] = useState<Animal[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [sexFilter, setSexFilter] = useState<'all' | 'M' | 'F'>('all')
  const [statusFilter, setStatusFilter] = useState<Animal['status'] | 'all'>('active')

  useEffect(() => {
    if (farm) loadAnimals()
  }, [farm])

  async function loadAnimals() {
    const { data } = await supabase
      .from('animals')
      .select('*')
      .eq('farm_id', farm!.id)
      .order('name')
    if (data) setAnimals(data as Animal[])
    setLoading(false)
  }

  const filtered = animals.filter(a => {
    const matchSearch = search === '' ||
      (a.tag ?? '').toLowerCase().includes(search.toLowerCase()) ||
      (a.name ?? '').toLowerCase().includes(search.toLowerCase())
    const matchSex = sexFilter === 'all' || a.sex === sexFilter
    const matchStatus = statusFilter === 'all' || a.status === statusFilter
    return matchSearch && matchSex && matchStatus
  })

  const totalActive = animals.filter(a => a.status === 'active').length
  const totalF = animals.filter(a => a.sex === 'F' && a.status === 'active').length
  const totalM = animals.filter(a => a.sex === 'M' && a.status === 'active').length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="page-kicker">Rebanho</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-[#17231b]">Animais</h1>
          <p className="mt-1 text-sm text-[#728077]">Acompanhe e gerencie seu plantel.</p>
        </div>
        <Link
          to="/animais/novo"
          className="flex items-center gap-1.5 rounded-xl bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white shadow-[0_8px_18px_rgba(31,73,51,.18)] transition-colors hover:bg-brand-800"
        >
          <Plus size={16} />
          Adicionar
        </Link>
      </div>

      {/* Filters */}
      <div className="app-surface space-y-3 p-3">
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por nome..."
            className="w-full rounded-xl border border-[#e0e9e3] bg-[#f7faf8] py-2.5 pl-9 pr-3 text-sm outline-none"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {(['all', 'F', 'M'] as const).map(s => (
            <button
              key={s}
              onClick={() => setSexFilter(s)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors
                ${sexFilter === s ? 'bg-brand-700 text-white shadow-sm' : 'bg-[#f1f5f2] text-[#65736a] hover:bg-[#e5ece7]'}`}
            >
              {s === 'all' ? 'Todos' : s === 'F' ? '🐄 Fêmea' : '🐂 Macho'}
            </button>
          ))}
          <div className="w-px bg-gray-200 mx-1" />
          {(['active', 'sold', 'dead', 'all'] as const).map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors
                ${statusFilter === s ? 'bg-brand-700 text-white shadow-sm' : 'bg-[#f1f5f2] text-[#65736a] hover:bg-[#e5ece7]'}`}
            >
              {s === 'all' ? 'Todos status' : STATUS_LABEL[s]}
            </button>
          ))}
        </div>
      </div>

      {/* Animal grid */}
      {loading ? (
        <div className="text-center text-gray-400 py-12">Carregando...</div>
      ) : filtered.length === 0 ? (
        <div className="app-surface py-12 text-center text-gray-400">
          <span className="text-4xl">🐄</span>
          <p className="mt-2">Nenhum animal encontrado.</p>
          {animals.length === 0 && (
            <Link to="/animais/novo" className="mt-2 inline-block text-brand-700 hover:underline text-sm">
              Cadastrar primeiro animal →
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {filtered.map(animal => (
            <AnimalCard key={animal.id} animal={animal} />
          ))}
        </div>
      )}

      {/* Stats bar */}
      {animals.length > 0 && (
        <div className="app-surface grid grid-cols-3 divide-x divide-[#e7eee9]">
          <div className="py-3 text-center">
            <p className="text-2xl font-bold text-brand-700">{totalActive}</p>
            <p className="text-xs text-gray-400">Total plantel</p>
          </div>
          <div className="py-3 text-center">
            <p className="text-2xl font-bold text-emerald-600">{totalF}</p>
            <p className="text-xs text-gray-400">Matrizes</p>
          </div>
          <div className="py-3 text-center">
            <p className="text-2xl font-bold text-sky-600">{totalM}</p>
            <p className="text-xs text-gray-400">Machos</p>
          </div>
        </div>
      )}
    </div>
  )
}
