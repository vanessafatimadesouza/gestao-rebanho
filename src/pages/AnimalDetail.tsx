import { useEffect, useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { ArrowLeft, Pencil, Syringe, Baby, Scale, Stethoscope } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { Animal, Vaccination, Birth, AnimalEvent } from '../types'

type Tab = 'vacinas' | 'partos' | 'eventos'

const STATUS_COLOR: Record<Animal['status'], string> = {
  active: 'bg-green-100 text-green-800',
  sold: 'bg-blue-100 text-blue-800',
  dead: 'bg-gray-100 text-gray-600',
}
const STATUS_LABEL: Record<Animal['status'], string> = {
  active: 'Ativo', sold: 'Vendido', dead: 'Morto',
}
const EVENT_LABEL: Record<AnimalEvent['event_type'], string> = {
  weight: 'Pesagem', treatment: 'Tratamento', sale: 'Venda',
  purchase: 'Compra', other: 'Outro',
}

function age(birthDate: string): string {
  const diff = Date.now() - new Date(birthDate + 'T12:00:00').getTime()
  const days = Math.floor(diff / 86400000)
  if (days < 30) return `${days} dias`
  if (days < 365) return `${Math.floor(days / 30)} meses`
  return `${Math.floor(days / 365)} anos`
}

export function AnimalDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [animal, setAnimal] = useState<Animal | null>(null)
  const [tab, setTab] = useState<Tab>('vacinas')
  const [vaccinations, setVaccinations] = useState<Vaccination[]>([])
  const [births, setBirths] = useState<Birth[]>([])
  const [events, setEvents] = useState<AnimalEvent[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (id) loadAnimal(id)
  }, [id])

  useEffect(() => {
    if (!id) return
    if (tab === 'vacinas') loadVaccinations(id)
    if (tab === 'partos') loadBirths(id)
    if (tab === 'eventos') loadEvents(id)
  }, [tab, id])

  async function loadAnimal(animalId: string) {
    const { data } = await supabase
      .from('animals')
      .select('*, mother:animals!mother_id(id, tag, name)')
      .eq('id', animalId)
      .single()
    if (data) setAnimal(data as Animal)
    setLoading(false)
    loadVaccinations(animalId)
  }

  async function loadVaccinations(animalId: string) {
    const { data } = await supabase
      .from('vaccinations')
      .select('*')
      .eq('animal_id', animalId)
      .order('date', { ascending: false })
    if (data) setVaccinations(data as Vaccination[])
  }

  async function loadBirths(animalId: string) {
    const { data } = await supabase
      .from('births')
      .select('*, calf:animals!calf_id(id, tag, name)')
      .eq('mother_id', animalId)
      .order('birth_date', { ascending: false })
    if (data) setBirths(data as Birth[])
  }

  async function loadEvents(animalId: string) {
    const { data } = await supabase
      .from('events')
      .select('*')
      .eq('animal_id', animalId)
      .order('date', { ascending: false })
    if (data) setEvents(data as AnimalEvent[])
  }

  if (loading) return <div className="text-center text-gray-400 py-12">Carregando...</div>
  if (!animal) return <div className="text-center text-gray-400 py-12">Animal não encontrado.</div>

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: 'vacinas', label: 'Vacinas', icon: <Syringe size={14} /> },
    { key: 'partos', label: 'Partos', icon: <Baby size={14} /> },
    { key: 'eventos', label: 'Eventos', icon: <Scale size={14} /> },
  ]

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-lg">
          <ArrowLeft size={18} />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{animal.sex === 'F' ? '🐄' : '🐂'}</span>
            <span className="font-bold text-xl text-gray-800 font-mono">{animal.tag}</span>
            {animal.name && <span className="text-gray-500">· {animal.name}</span>}
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ml-auto ${STATUS_COLOR[animal.status]}`}>
              {STATUS_LABEL[animal.status]}
            </span>
          </div>
        </div>
        <Link to={`/animais/${animal.id}/editar`} className="p-2 hover:bg-gray-100 rounded-lg text-gray-600">
          <Pencil size={16} />
        </Link>
      </div>

      {/* Info card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 grid grid-cols-2 gap-3 text-sm">
        <div>
          <span className="text-gray-400 text-xs">Sexo</span>
          <p className="font-medium">{animal.sex === 'F' ? 'Fêmea' : 'Macho'}</p>
        </div>
        <div>
          <span className="text-gray-400 text-xs">Raça</span>
          <p className="font-medium">{animal.breed ?? '—'}</p>
        </div>
        <div>
          <span className="text-gray-400 text-xs">Nascimento</span>
          <p className="font-medium">
            {animal.birth_date
              ? `${new Date(animal.birth_date + 'T12:00:00').toLocaleDateString('pt-BR')} (${age(animal.birth_date)})`
              : '—'}
          </p>
        </div>
        <div>
          <span className="text-gray-400 text-xs">Mãe</span>
          <p className="font-medium">
            {animal.mother
              ? <Link to={`/animais/${animal.mother.id}`} className="text-brand-700 hover:underline">
                  {animal.mother.tag}{animal.mother.name ? ` (${animal.mother.name})` : ''}
                </Link>
              : '—'}
          </p>
        </div>
        <div>
          <span className="text-gray-400 text-xs">Pai / Sêmen</span>
          <p className="font-medium">{animal.father_tag ?? '—'}</p>
        </div>
        {animal.notes && (
          <div className="col-span-2">
            <span className="text-gray-400 text-xs">Observações</span>
            <p className="font-medium">{animal.notes}</p>
          </div>
        )}
      </div>

      {/* Quick actions */}
      <div className="flex gap-2">
        <Link
          to={`/vacinas/nova?animal=${animal.id}`}
          className="flex items-center gap-1.5 bg-brand-50 text-brand-700 border border-brand-200 px-3 py-2 rounded-lg text-sm font-medium hover:bg-brand-100 transition-colors"
        >
          <Syringe size={14} /> Vacinar
        </Link>
        {animal.sex === 'F' && (
          <Link
            to={`/partos/novo?animal=${animal.id}`}
            className="flex items-center gap-1.5 bg-brand-50 text-brand-700 border border-brand-200 px-3 py-2 rounded-lg text-sm font-medium hover:bg-brand-100 transition-colors"
          >
            <Baby size={14} /> Parto
          </Link>
        )}
        <Link
          to={`/eventos/novo?animal=${animal.id}`}
          className="flex items-center gap-1.5 bg-brand-50 text-brand-700 border border-brand-200 px-3 py-2 rounded-lg text-sm font-medium hover:bg-brand-100 transition-colors"
        >
          <Stethoscope size={14} /> Evento
        </Link>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="flex border-b border-gray-100">
          {tabs.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-sm font-medium transition-colors
                ${tab === t.key ? 'text-brand-700 border-b-2 border-brand-700' : 'text-gray-500 hover:text-gray-700'}`}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        <div className="p-4">
          {tab === 'vacinas' && (
            vaccinations.length === 0
              ? <p className="text-gray-400 text-sm text-center py-4">Nenhuma vacina registrada</p>
              : <div className="divide-y divide-gray-50">
                  {vaccinations.map(v => (
                    <div key={v.id} className="py-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium text-sm text-gray-800">{v.vaccine_name}</p>
                          {v.dose && <p className="text-xs text-gray-500">Dose: {v.dose}</p>}
                          {v.notes && <p className="text-xs text-gray-400 mt-0.5">{v.notes}</p>}
                        </div>
                        <div className="text-right text-xs text-gray-500">
                          <p>{new Date(v.date + 'T12:00:00').toLocaleDateString('pt-BR')}</p>
                          {v.next_due_date && (
                            <p className="text-amber-600 mt-0.5">
                              Próxima: {new Date(v.next_due_date + 'T12:00:00').toLocaleDateString('pt-BR')}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
          )}

          {tab === 'partos' && (
            births.length === 0
              ? <p className="text-gray-400 text-sm text-center py-4">Nenhum parto registrado</p>
              : <div className="divide-y divide-gray-50">
                  {births.map(b => (
                    <div key={b.id} className="py-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium text-sm text-gray-800">
                            Parto {b.birth_type === 'natural' ? 'natural' : b.birth_type === 'assisted' ? 'assistido' : 'cesárea'}
                          </p>
                          {b.calf && (
                            <Link to={`/animais/${(b.calf as unknown as Animal).id}`} className="text-xs text-brand-700 hover:underline">
                              Cria: {(b.calf as unknown as Animal).tag}
                              {(b.calf as unknown as Animal).name ? ` (${(b.calf as unknown as Animal).name})` : ''}
                            </Link>
                          )}
                          {b.notes && <p className="text-xs text-gray-400 mt-0.5">{b.notes}</p>}
                        </div>
                        <p className="text-xs text-gray-500">
                          {new Date(b.birth_date + 'T12:00:00').toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
          )}

          {tab === 'eventos' && (
            events.length === 0
              ? <p className="text-gray-400 text-sm text-center py-4">Nenhum evento registrado</p>
              : <div className="divide-y divide-gray-50">
                  {events.map(ev => (
                    <div key={ev.id} className="py-3 flex items-start justify-between">
                      <div>
                        <p className="font-medium text-sm text-gray-800">{EVENT_LABEL[ev.event_type]}</p>
                        {ev.value !== null && (
                          <p className="text-xs text-gray-500">
                            {ev.event_type === 'weight' ? `${ev.value} kg` : `R$ ${ev.value}`}
                          </p>
                        )}
                        {ev.description && <p className="text-xs text-gray-400 mt-0.5">{ev.description}</p>}
                      </div>
                      <p className="text-xs text-gray-500">
                        {new Date(ev.date + 'T12:00:00').toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  ))}
                </div>
          )}
        </div>
      </div>
    </div>
  )
}
