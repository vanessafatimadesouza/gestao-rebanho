import { useEffect, useState, FormEvent } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { PageHeader } from '../components/PageHeader'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { Animal, AnimalEvent } from '../types'

const EVENT_LABELS: { value: AnimalEvent['event_type']; label: string }[] = [
  { value: 'weight', label: 'Pesagem (kg)' },
  { value: 'treatment', label: 'Tratamento / Medicamento' },
  { value: 'sale', label: 'Venda' },
  { value: 'purchase', label: 'Compra' },
  { value: 'other', label: 'Outro' },
]

export function EventForm() {
  const { farm, user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const preAnimalId = new URLSearchParams(location.search).get('animal') ?? ''

  const [animals, setAnimals] = useState<Pick<Animal, 'id' | 'tag' | 'name'>[]>([])
  const [animalId, setAnimalId] = useState(preAnimalId)
  const [eventType, setEventType] = useState<AnimalEvent['event_type']>('weight')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [value, setValue] = useState('')
  const [description, setDescription] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (farm) loadAnimals()
  }, [farm])

  async function loadAnimals() {
    const { data } = await supabase
      .from('animals')
      .select('id, tag, name')
      .eq('farm_id', farm!.id)
      .order('tag')
    if (data) setAnimals(data)
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!farm || !user) return
    setError('')
    setLoading(true)

    const { error: err } = await supabase.from('events').insert({
      animal_id: animalId,
      farm_id: farm.id,
      event_type: eventType,
      date,
      value: value ? parseFloat(value) : null,
      description: description.trim() || null,
      created_by: user.id,
    })

    if (err) { setError(err.message); setLoading(false); return }
    navigate(preAnimalId ? `/animais/${preAnimalId}` : '/')
  }

  const inputClass = 'w-full rounded-xl border border-[#dce7df] bg-[#fbfdfb] px-3 py-2.5 text-sm outline-none'
  const labelClass = 'mb-1.5 block text-sm font-semibold text-[#415148]'

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <PageHeader backTo={preAnimalId ? `/animais/${preAnimalId}` : '/animais'} kicker="Manejo" title="Registrar evento" />

      <form onSubmit={handleSubmit} className="app-surface space-y-5 p-5 sm:p-7">
        <div>
          <label htmlFor="event-animal" className={labelClass}>Animal *</label>
          <select id="event-animal" value={animalId} onChange={e => setAnimalId(e.target.value)} required className={inputClass}>
            <option value="">— Selecionar animal —</option>
            {animals.map(a => (
              <option key={a.id} value={a.id}>
                {a.tag}{a.name ? ` (${a.name})` : ''}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="event-type" className={labelClass}>Tipo de evento *</label>
          <select id="event-type" value={eventType} onChange={e => setEventType(e.target.value as AnimalEvent['event_type'])} className={inputClass}>
            {EVENT_LABELS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="event-date" className={labelClass}>Data *</label>
            <input id="event-date" type="date" value={date} onChange={e => setDate(e.target.value)} required className={inputClass} />
          </div>
          <div>
            <label htmlFor="event-value" className={labelClass}>
              {eventType === 'weight' ? 'Peso (kg)' : eventType === 'sale' || eventType === 'purchase' ? 'Valor (R$)' : 'Valor'}
            </label>
            <input
              id="event-value"
              type="number"
              step="0.01"
              value={value}
              onChange={e => setValue(e.target.value)}
              className={inputClass}
              placeholder="0,00"
            />
          </div>
        </div>

        <div>
          <label htmlFor="event-description" className={labelClass}>Descrição</label>
          <textarea
            id="event-description"
            value={description}
            onChange={e => setDescription(e.target.value)}
            rows={2}
            className={inputClass}
            placeholder="Detalhes do evento..."
          />
        </div>

        {error && <p role="alert" className="rounded-xl border border-red-100 bg-red-50 px-3 py-2.5 text-sm text-red-700">{error}</p>}

        <div className="flex flex-col-reverse gap-3 border-t border-[#e7eee9] pt-5 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="rounded-xl px-5 py-2.5 text-sm font-semibold text-[#526158] transition-colors hover:bg-[#f1f5f2]"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="rounded-xl bg-brand-700 px-5 py-2.5 text-sm font-semibold text-white shadow-[0_8px_18px_rgba(31,73,51,.18)] transition-colors hover:bg-brand-800 disabled:opacity-60"
          >
            {loading ? 'Salvando...' : 'Registrar'}
          </button>
        </div>
      </form>
    </div>
  )
}
