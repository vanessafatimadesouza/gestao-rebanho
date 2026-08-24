import { useEffect, useState, FormEvent } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { Plus, ArrowLeft } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { Vaccination, Animal } from '../types'

export function VaccinationsList() {
  const { farm } = useAuth()
  const [vaccinations, setVaccinations] = useState<Vaccination[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (farm) load()
  }, [farm])

  async function load() {
    const { data } = await supabase
      .from('vaccinations')
      .select('*, animal:animals(id, tag, name)')
      .eq('farm_id', farm!.id)
      .order('date', { ascending: false })
    if (data) setVaccinations(data as Vaccination[])
    setLoading(false)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-800">Vacinas</h1>
        <Link
          to="/vacinas/nova"
          className="flex items-center gap-1.5 bg-brand-700 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-brand-800 transition-colors"
        >
          <Plus size={16} /> Nova
        </Link>
      </div>

      {loading ? (
        <div className="text-center text-gray-400 py-12">Carregando...</div>
      ) : vaccinations.length === 0 ? (
        <div className="text-center text-gray-400 py-12">
          <p>Nenhuma vacina registrada.</p>
          <Link to="/vacinas/nova" className="mt-2 inline-block text-brand-700 hover:underline text-sm">
            Registrar primeira vacina →
          </Link>
        </div>
      ) : (
        <div className="grid gap-2">
          {vaccinations.map(v => {
            const animal = v.animal as unknown as Animal | null
            return (
              <div key={v.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-gray-800 text-sm">{v.vaccine_name}</p>
                    {animal && (
                      <Link
                        to={`/animais/${animal.id}`}
                        className="text-xs text-brand-700 hover:underline"
                      >
                        🐄 {animal.name ?? animal.tag ?? 'Sem nome'}
                      </Link>
                    )}
                    {v.dose && <p className="text-xs text-gray-400 mt-0.5">Dose: {v.dose}</p>}
                    {v.notes && <p className="text-xs text-gray-400">{v.notes}</p>}
                  </div>
                  <div className="text-right text-xs shrink-0">
                    <p className="text-gray-500">{new Date(v.date + 'T12:00:00').toLocaleDateString('pt-BR')}</p>
                    {v.next_due_date && (
                      <p className="text-amber-600 mt-1 bg-amber-50 px-2 py-0.5 rounded-full">
                        Próxima: {new Date(v.next_due_date + 'T12:00:00').toLocaleDateString('pt-BR')}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export function VaccinationForm() {
  const { farm, user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const preAnimalId = new URLSearchParams(location.search).get('animal') ?? ''

  const [animals, setAnimals] = useState<Pick<Animal, 'id' | 'tag' | 'name'>[]>([])
  const [animalId, setAnimalId] = useState(preAnimalId)
  const [vaccineName, setVaccineName] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [nextDueDate, setNextDueDate] = useState('')
  const [dose, setDose] = useState('')
  const [notes, setNotes] = useState('')
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
      .eq('status', 'active')
      .order('tag')
    if (data) setAnimals(data)
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!farm || !user) return
    setError('')
    setLoading(true)

    const { error: err } = await supabase.from('vaccinations').insert({
      animal_id: animalId,
      farm_id: farm.id,
      vaccine_name: vaccineName.trim(),
      date,
      next_due_date: nextDueDate || null,
      dose: dose.trim() || null,
      notes: notes.trim() || null,
      created_by: user.id,
    })

    if (err) { setError(err.message); setLoading(false); return }
    navigate(preAnimalId ? `/animais/${preAnimalId}` : '/vacinas')
  }

  const inputClass = 'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500'
  const labelClass = 'block text-sm font-medium text-gray-700 mb-1'

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-lg">
          <ArrowLeft size={18} />
        </button>
        <h1 className="text-xl font-bold text-gray-800">Registrar vacina</h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 space-y-4">
        <div>
          <label className={labelClass}>Animal *</label>
          <select value={animalId} onChange={e => setAnimalId(e.target.value)} required className={inputClass}>
            <option value="">— Selecionar animal —</option>
            {animals.map(a => (
              <option key={a.id} value={a.id}>
                {a.name ?? a.tag ?? 'Sem nome'}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className={labelClass}>Vacina *</label>
          <input
            type="text"
            value={vaccineName}
            onChange={e => setVaccineName(e.target.value)}
            required
            className={inputClass}
            placeholder="Ex: Aftosa, Brucelose, Raiva..."
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Data de aplicação *</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} required className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Próxima dose</label>
            <input type="date" value={nextDueDate} onChange={e => setNextDueDate(e.target.value)} className={inputClass} />
          </div>
        </div>

        <div>
          <label className={labelClass}>Dose / Lote</label>
          <input
            type="text"
            value={dose}
            onChange={e => setDose(e.target.value)}
            className={inputClass}
            placeholder="Ex: 2ml, Lote 1234"
          />
        </div>

        <div>
          <label className={labelClass}>Observações</label>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            rows={2}
            className={inputClass}
            placeholder="Informações adicionais..."
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
