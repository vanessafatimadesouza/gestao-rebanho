import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Search } from 'lucide-react'
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
      className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md hover:border-brand-200 transition-all"
    >
      {/* Card header with gradient background */}
      <div className={`bg-gradient-to-br ${bgGradient} px-4 pt-4 pb-6 relative`}>
        {/* Status badge */}
        <div className="flex justify-between items-start mb-3">
          <span className={`text-white text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_STYLE[animal.status]}`}>
            {STATUS_LABEL[animal.status]}
          </span>
          <span className="text-xs text-gray-400 font-mono bg-white/60 px-2 py-0.5 rounded-full">
            #{animal.tag}
          </span>
        </div>

        {/* Animal icon */}
        <div className="flex justify-center">
          <span className="text-6xl drop-shadow-sm">
            {animal.sex === 'F' ? '🐄' : '🐂'}
          </span>
        </div>
      </div>

      {/* Card body */}
      <div className="px-4 py-3">
        <div className="mb-2">
          <p className={`font-bold text-base ${accentColor}`}>
            {animal.name ?? animal.tag}
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
      .order('tag')
    if (data) setAnimals(data as Animal[])
    setLoading(false)
  }

  const filtered = animals.filter(a => {
    const matchSearch = search === '' ||
      a.tag.toLowerCase().includes(search.toLowerCase()) ||
      (a.name ?? '').toLowerCase().includes(search.toLowerCase())
    const matchSex = sexFilter === 'all' || a.sex === sexFilter
    const matchStatus = statusFilter === 'all' || a.status === statusFilter
    return matchSearch && matchSex && matchStatus
  })

  const totalActive = animals.filter(a => a.status === 'active').length
  const totalF = animals.filter(a => a.sex === 'F' && a.status === 'active').length
  const totalM = animals.filter(a => a.sex === 'M' && a.status === 'active').length

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Animais do Rebanho</h1>
          <p className="text-sm text-gray-400">Acompanhe e gerencie seus animais</p>
        </div>
        <Link
          to="/animais/novo"
          className="flex items-center gap-1.5 bg-brand-700 text-white px-3 py-2 rounded-xl text-sm font-medium hover:bg-brand-800 transition-colors shadow-sm"
        >
          <Plus size={16} />
          Adicionar
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-3 space-y-2">
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por brinco ou nome..."
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-100 bg-gray-50 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-400"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {(['all', 'F', 'M'] as const).map(s => (
            <button
              key={s}
              onClick={() => setSexFilter(s)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors
                ${sexFilter === s ? 'bg-brand-700 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
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
                ${statusFilter === s ? 'bg-brand-700 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
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
        <div className="text-center text-gray-400 py-12 bg-white rounded-2xl border border-gray-100">
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
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm grid grid-cols-3 divide-x divide-gray-100">
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
