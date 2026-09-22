import { useEffect, useState, FormEvent } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { Plus, ArrowLeft } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { Vaccination, Animal } from '../types'
import { AnimalPicker } from '../components/AnimalPicker'

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
    if (!animalId) {
      setError('Selecione o animal que receberá a vacina.')
      return
    }
    setLoading(true)

    const { error: err } = await supabase.from('vaccinations').insert({
      animal_id: animalId,
      farm_id: farm.id,
      vaccine_name: vaccineName.trim(),
      date,
      next_due_date: nextDueDate || null,
      dose: null,
      notes: null,
      created_by: user.id,
    })

    if (err) { setError(err.message); setLoading(false); return }
    navigate(preAnimalId ? `/animais/${preAnimalId}` : '/vacinas')
  }

  const inputClass = 'w-full rounded-xl border border-[#dce7df] bg-[#fbfdfb] px-3 py-2.5 text-sm outline-none'
  const labelClass = 'mb-1.5 block text-sm font-semibold text-[#415148]'

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div className="flex items-center gap-3"><button onClick={() => navigate(-1)} className="rounded-xl p-2 text-[#516058] transition-colors hover:bg-white"><ArrowLeft size={18} /></button><div><p className="page-kicker">Sanidade</p><h1 className="mt-1 text-2xl font-bold tracking-tight text-[#17231b]">Registrar vacina</h1></div></div>
      <form onSubmit={handleSubmit} className="app-surface space-y-6 p-5 sm:p-7">
        <div className="grid gap-4 sm:grid-cols-2"><div className="sm:col-span-2"><label className={labelClass}>Animal *</label><AnimalPicker value={animalId} onChange={setAnimalId} options={animals} placeholder="Selecionar animal" /></div><div className="sm:col-span-2"><label className={labelClass}>Vacina *</label><input type="text" value={vaccineName} onChange={e => setVaccineName(e.target.value)} required className={inputClass} placeholder="Ex.: Aftosa, Brucelose, Raiva" /></div><div><label className={labelClass}>Data de aplicação *</label><input type="date" value={date} onChange={e => setDate(e.target.value)} required className={inputClass} /></div><div><label className={labelClass}>Próxima dose</label><input type="date" value={nextDueDate} onChange={e => setNextDueDate(e.target.value)} className={inputClass} /></div></div>
        {error && <p className="rounded-xl border border-red-100 bg-red-50 px-3 py-2.5 text-sm text-red-700">{error}</p>}
        <div className="flex flex-col-reverse gap-3 border-t border-[#e7eee9] pt-5 sm:flex-row sm:justify-end"><button type="button" onClick={() => navigate(-1)} className="rounded-xl px-5 py-2.5 text-sm font-semibold text-[#526158] hover:bg-[#f1f5f2]">Cancelar</button><button type="submit" disabled={loading} className="rounded-xl bg-brand-700 px-5 py-2.5 text-sm font-semibold text-white shadow-[0_8px_18px_rgba(31,73,51,.18)] transition-colors hover:bg-brand-800 disabled:opacity-60">{loading ? 'Salvando...' : 'Registrar vacina'}</button></div>
      </form>
    </div>
  )
}
