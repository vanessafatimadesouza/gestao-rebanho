import { useEffect, useState, FormEvent } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
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

  const inputClass = 'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500'
  const labelClass = 'block text-sm font-medium text-gray-700 mb-1'

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-lg">
          <ArrowLeft size={18} />
        </button>
        <h1 className="text-xl font-bold text-gray-800">Registrar evento</h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 space-y-4">
        <div>
          <label className={labelClass}>Animal *</label>
          <select value={animalId} onChange={e => setAnimalId(e.target.value)} required className={inputClass}>
            <option value="">— Selecionar animal —</option>
            {animals.map(a => (
              <option key={a.id} value={a.id}>
                {a.tag}{a.name ? ` (${a.name})` : ''}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className={labelClass}>Tipo de evento *</label>
          <select value={eventType} onChange={e => setEventType(e.target.value as AnimalEvent['event_type'])} className={inputClass}>
            {EVENT_LABELS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Data *</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} required className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>
              {eventType === 'weight' ? 'Peso (kg)' : eventType === 'sale' || eventType === 'purchase' ? 'Valor (R$)' : 'Valor'}
            </label>
            <input
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
          <label className={labelClass}>Descrição</label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            rows={2}
            className={inputClass}
            placeholder="Detalhes do evento..."
          />
        </div>

        {error && <p className="text-red-600 text-sm bg-red-50 rounded-lg px-3 py-2">{error}</p>}

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex-1 border border-gray-300 text-gray-700 font-medium py-2.5 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-brand-700 text-white font-medium py-2.5 rounded-lg hover:bg-brand-800 transition-colors disabled:opacity-60"
          >
            {loading ? 'Salvando...' : 'Registrar'}
          </button>
        </div>
      </form>
    </div>
  )
}
