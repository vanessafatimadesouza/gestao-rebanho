import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Search, Filter } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { Animal } from '../types'

const STATUS_LABEL: Record<Animal['status'], string> = {
  active: 'Ativo',
  sold: 'Vendido',
  dead: 'Morto',
}
const STATUS_COLOR: Record<Animal['status'], string> = {
  active: 'bg-green-100 text-green-800',
  sold: 'bg-blue-100 text-blue-800',
  dead: 'bg-gray-100 text-gray-600',
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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-800">Animais</h1>
        <Link
          to="/animais/novo"
          className="flex items-center gap-1.5 bg-brand-700 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-brand-800 transition-colors"
        >
          <Plus size={16} />
          Novo
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 space-y-2">
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por brinco ou nome..."
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <Filter size={12} />
            Sexo:
          </div>
          {(['all', 'F', 'M'] as const).map(s => (
            <button
              key={s}
              onClick={() => setSexFilter(s)}
              className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors
                ${sexFilter === s ? 'bg-brand-700 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
              {s === 'all' ? 'Todos' : s === 'F' ? 'Fêmea' : 'Macho'}
            </button>
          ))}
          <div className="flex items-center gap-1 text-xs text-gray-500 ml-2">Status:</div>
          {(['active', 'sold', 'dead', 'all'] as const).map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors
                ${statusFilter === s ? 'bg-brand-700 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
              {s === 'all' ? 'Todos' : STATUS_LABEL[s]}
            </button>
          ))}
        </div>
      </div>

      {/* Count */}
      <p className="text-sm text-gray-500">{filtered.length} animal(is) encontrado(s)</p>

      {/* List */}
      {loading ? (
        <div className="text-center text-gray-400 py-12">Carregando...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center text-gray-400 py-12">
          <p>Nenhum animal encontrado.</p>
          {animals.length === 0 && (
            <Link to="/animais/novo" className="mt-2 inline-block text-brand-700 hover:underline text-sm">
              Cadastrar primeiro animal →
            </Link>
          )}
        </div>
      ) : (
        <div className="grid gap-2">
          {filtered.map(animal => (
            <Link
              key={animal.id}
              to={`/animais/${animal.id}`}
              className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-3 hover:border-brand-300 transition-colors"
            >
              <div className="text-2xl">{animal.sex === 'F' ? '🐄' : '🐂'}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-gray-800 font-mono">{animal.tag}</span>
                  {animal.name && (
                    <span className="text-gray-500 text-sm truncate">{animal.name}</span>
                  )}
                </div>
                <div className="text-xs text-gray-400 mt-0.5">
                  {animal.sex === 'F' ? 'Fêmea' : 'Macho'}
                  {animal.breed && ` · ${animal.breed}`}
                  {animal.birth_date && ` · ${new Date(animal.birth_date + 'T12:00:00').toLocaleDateString('pt-BR')}`}
                </div>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLOR[animal.status]}`}>
                {STATUS_LABEL[animal.status]}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
