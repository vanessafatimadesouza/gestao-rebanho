import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, CalendarDays, ChevronDown, ChevronRight, Plus, Search } from 'lucide-react'
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

const simulatedFemaleImages = [
  '/images/cattle-cow-holstein.png',
  '/images/cattle-cow-nelore.png',
  '/images/cattle-cow-holstein.png',
  '/images/cattle-cow-nelore.png',
  '/images/cattle-cow-spotted.png',
  '/images/cattle-cow-blackwhite.png',
]
const simulatedMaleImages = [
  '/images/cattle-bull-white.png',
  '/images/cattle-bull-white-2.png',
  '/images/cattle-bull-black.png',
  '/images/cattle-bull-white-3.png',
]

function speciesFor(animal: Animal) {
  const breed = animal.breed?.toLocaleLowerCase('pt-BR') ?? ''
  return /equino|cavalo|égua|mangalarga|quarto de milha|criollo|appaloosa|puro-sangue/.test(breed) ? 'equine' : 'bovine'
}

function simulatedImageFor(animal: Animal) {
  const source = `${animal.id}${animal.tag ?? ''}${animal.name ?? ''}`
  const index = [...source].reduce((total, character) => total + character.charCodeAt(0), 0)
  const images = animal.sex === 'F' ? simulatedFemaleImages : simulatedMaleImages
  return images[index % images.length]
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
        <span className="absolute right-4 top-4 z-10 flex h-9 w-9 translate-y-[-3px] items-center justify-center rounded-full bg-[#4ca968] text-white opacity-0 shadow-[0_8px_16px_rgba(32,117,68,.3)] transition-all duration-200 group-hover:translate-y-0 group-hover:opacity-100"><ChevronRight size={19} strokeWidth={2.6} /></span>

        {/* Simulated animal photo for records without an uploaded image */}
        {!animal.image_url && <><div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url('${simulatedImageFor(animal)}')`, backgroundPosition: 'center 42%' }} /><div className={`absolute inset-0 ${isFemaleCow ? 'bg-emerald-900/10' : 'bg-sky-950/15'}`} /></>}
      </div>

      {/* Card body */}
      <div className="px-4 py-4">
        <div className="flex w-full items-start justify-between gap-3">
          <div>
          <p className={`flex items-center gap-2 text-base font-bold ${accentColor}`}>
            <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-500/15" title={STATUS_LABEL[animal.status]} aria-label={STATUS_LABEL[animal.status]}><span className={`h-2 w-2 rounded-full ${STATUS_STYLE[animal.status]}`} /></span>
            {animal.name ?? animal.tag ?? 'Sem nome'}
          </p>
          <p className="pl-6 text-xs text-gray-400">
            {animal.sex === 'F' ? 'Fêmea' : 'Macho'}
            {animal.breed ? ` · ${animal.breed}` : ''}
          </p>
          </div>
          {animal.birth_date && <span className="flex shrink-0 items-center gap-1.5 text-right text-[11px] font-medium text-[#789080]" title="Data de nascimento"><CalendarDays size={13} />{new Date(animal.birth_date + 'T12:00:00').toLocaleDateString('pt-BR')}</span>}
        </div>
      </div>
    </Link>
  )
}

export function Animals() {
  const { farm } = useAuth(); const navigate = useNavigate()
  const [animals, setAnimals] = useState<Animal[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [sexFilter, setSexFilter] = useState<'all' | 'M' | 'F'>('all')
  const [speciesFilter, setSpeciesFilter] = useState<'all' | 'bovine' | 'equine'>('all')
  const [speciesMenuOpen, setSpeciesMenuOpen] = useState(false)

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
    const matchSpecies = speciesFilter === 'all' || speciesFor(a) === speciesFilter
    return matchSearch && matchSex && matchSpecies
  })

  const totalActive = animals.filter(a => a.status === 'active').length
  const totalF = animals.filter(a => a.sex === 'F' && a.status === 'active').length
  const totalM = animals.filter(a => a.sex === 'M' && a.status === 'active').length

  return (
    <div className="animals-page">
      <section className="animals-intro">
        <div className="animals-intro-content">
          <div className="flex items-start gap-3">
            <button type="button" onClick={() => navigate(-1)} className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-[#456353] transition-colors hover:bg-white/70 hover:text-brand-800" aria-label="Voltar"><ArrowLeft size={19} /></button>
            <div><p className="page-kicker">Rebanho</p><h1 className="mt-1 text-3xl font-bold tracking-tight text-[#17231b]">Animais</h1></div>
          </div>
          <div className="flex w-full max-w-[660px] gap-4">
            <div className="relative min-w-0 flex-1"><Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#91a09a]" /><input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por nome, código ou raça..." className="h-12 w-full rounded-xl border border-white/70 bg-white/90 pl-12 pr-4 text-sm text-[#385146] shadow-[0_8px_20px_rgba(32,72,48,.05)] outline-none" /></div>
            <Link to="/animais/novo" className="flex h-12 shrink-0 items-center gap-2 rounded-xl bg-brand-700 px-5 text-sm font-semibold text-white shadow-[0_9px_20px_rgba(25,80,49,.2)] transition-colors hover:bg-brand-800"><Plus size={18} />Adicionar</Link>
          </div>
        </div>
      </section>

      <section className="animals-toolbar">
        <div className="flex flex-wrap items-center gap-2"><span className="mr-3 text-sm font-semibold text-[#52675c]">Filtros:</span>{(['all', 'F', 'M'] as const).map(s => <button key={s} onClick={() => setSexFilter(s)} className={`rounded-full px-4 py-2 text-xs font-medium transition-colors ${sexFilter === s ? 'bg-brand-700 text-white shadow-sm' : 'bg-[#f4f7f5] text-[#536a5e] hover:bg-[#eaf1ec]'}`}>{s === 'all' ? 'Todos' : s === 'F' ? 'Fêmea' : 'Macho'}</button>)}<div className="relative ml-1"><button type="button" onClick={() => setSpeciesMenuOpen(open => !open)} className="flex items-center gap-2 rounded-full bg-[#f4f7f5] px-4 py-2 text-xs font-medium text-[#536a5e] transition-colors hover:bg-[#eaf1ec]" aria-haspopup="menu" aria-expanded={speciesMenuOpen}>{speciesFilter === 'all' ? 'Todas espécies' : speciesFilter === 'bovine' ? 'Bovino' : 'Equino'}<ChevronDown size={14} className={`transition-transform ${speciesMenuOpen ? 'rotate-180' : ''}`} /></button>{speciesMenuOpen && <div role="menu" className="absolute left-0 top-[calc(100%+8px)] z-20 min-w-[154px] rounded-2xl border border-[#e0e9e3] bg-white p-1.5 shadow-[0_12px_28px_rgba(24,64,42,.13)]">{([['all', 'Todas espécies'], ['bovine', 'Bovino'], ['equine', 'Equino']] as const).map(([value, label]) => <button key={value} type="button" role="menuitem" onClick={() => { setSpeciesFilter(value); setSpeciesMenuOpen(false) }} className={`block w-full rounded-xl px-3 py-2 text-left text-xs font-medium transition-colors ${speciesFilter === value ? 'bg-brand-50 text-brand-800' : 'text-[#536a5e] hover:bg-[#f4f7f5]'}`}>{label}</button>)}</div>}</div></div>
        {animals.length > 0 && <div className="animals-toolbar-stats"><div><strong>{totalActive}</strong><span>Total no rebanho</span></div><div><strong className="with-dot dot-female">{totalF}</strong><span>Fêmeas</span></div><div><strong className="with-dot dot-male">{totalM}</strong><span>Machos</span></div></div>}
      </section>

      {/* Animal grid */}
      <div className="mt-6">{loading ? (
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
      )}</div>
    </div>
  )
}
