import { useEffect, useState, FormEvent } from 'react'
import { useNavigate, useLocation, Link, useParams } from 'react-router-dom'
import { Plus, CalendarDays, Syringe, PawPrint, Pencil } from 'lucide-react'
import { PageHeader } from '../components/PageHeader'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { Vaccination, Animal } from '../types'
import { AnimalPicker } from '../components/AnimalPicker'

export function VaccinationsList() {
  const { farm } = useAuth()
  const [vaccinations, setVaccinations] = useState<Vaccination[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')

  useEffect(() => {
    if (farm) load()
  }, [farm])

  async function load() {
    setLoading(true)
    setLoadError('')
    const { data, error } = await supabase
      .from('vaccinations')
      .select('*, animal:animals(id, tag, name)')
      .eq('farm_id', farm!.id)
      .order('date', { ascending: false })
    if (data) setVaccinations(data as Vaccination[])
    if (error) setLoadError('Não foi possível carregar as vacinas. Tente novamente.')
    setLoading(false)
  }

  return (
    <div className="space-y-5">
      <PageHeader backTo="/" kicker="Sanidade" title="Vacinas" description="Acompanhe aplicações e próximas doses do rebanho." actions={<Link
          to="/vacinas/nova"
          className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-brand-700 px-4 text-sm font-semibold text-white transition-colors hover:bg-brand-800"
        >
          <Plus size={17} aria-hidden="true" /> Registrar vacina
        </Link>} />

      {loading ? (
        <div role="status" className="app-surface p-8 text-center text-sm text-[#526158]">Carregando vacinas...</div>
      ) : loadError ? (
        <div role="alert" className="app-surface p-8 text-center"><p className="text-sm text-red-700">{loadError}</p><button type="button" onClick={() => void load()} className="mt-3 rounded-xl px-4 py-2 text-sm font-semibold text-brand-800 hover:bg-brand-50">Tentar novamente</button></div>
      ) : vaccinations.length === 0 ? (
        <div className="app-surface flex flex-col items-center px-6 py-12 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-700"><Syringe size={26} aria-hidden="true" /></span>
          <h2 className="mt-4 text-lg font-bold text-brand-900">Nenhuma vacina registrada</h2>
          <p className="mt-1 max-w-sm text-sm text-[#526158]">Comece registrando a primeira aplicação para acompanhar o histórico do rebanho.</p>
          <Link to="/vacinas/nova" className="mt-5 inline-flex min-h-11 items-center rounded-xl bg-brand-700 px-4 text-sm font-semibold text-white hover:bg-brand-800">Registrar primeira vacina</Link>
        </div>
      ) : (
        <div className="grid gap-3">
          {vaccinations.map(v => {
            const animal = v.animal as unknown as Animal | null
            return (
              <article key={v.id} className="app-surface flex flex-col gap-4 p-4 sm:flex-row sm:items-start sm:justify-between sm:p-5">
                  <div className="min-w-0">
                    <h2 className="text-base font-bold text-[#203529]">{v.vaccine_name}</h2>
                    {animal && (
                      <Link
                        to={`/animais/${animal.id}`}
                        className="mt-1 inline-flex min-h-7 items-center gap-1.5 text-sm font-medium text-brand-700 hover:underline"
                      >
                        <PawPrint size={15} aria-hidden="true" /> {animal.name ?? animal.tag ?? 'Sem nome'}
                      </Link>
                    )}
                    {v.dose && <p className="mt-1 text-sm text-[#526158]">Dose: {v.dose}</p>}
                    {v.notes && <p className="mt-1 text-sm text-[#526158]">{v.notes}</p>}
                  </div>
                  <div className="flex shrink-0 flex-wrap items-center gap-3 sm:justify-end">
                    <p className="inline-flex items-center gap-1.5 text-sm tabular-nums text-[#526158]"><CalendarDays size={16} aria-hidden="true" />{new Date(v.date + 'T12:00:00').toLocaleDateString('pt-BR')}</p>
                    {v.next_due_date && (
                      <p className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold tabular-nums text-amber-800">
                        Próxima: {new Date(v.next_due_date + 'T12:00:00').toLocaleDateString('pt-BR')}
                      </p>
                    )}
                    <Link to={`/vacinas/${v.id}/editar`} className="flex h-11 w-11 items-center justify-center rounded-xl text-brand-800 hover:bg-brand-50" aria-label={`Editar vacina ${v.vaccine_name}`}><Pencil size={18} /></Link>
                  </div>
              </article>
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
  const { id } = useParams<{ id?: string }>()
  const isEdit = Boolean(id)
  const preAnimalId = new URLSearchParams(location.search).get('animal') ?? ''

  const [animals, setAnimals] = useState<Pick<Animal, 'id' | 'tag' | 'name'>[]>([])
  const [animalId, setAnimalId] = useState(preAnimalId)
  const [vaccineName, setVaccineName] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [nextDueDate, setNextDueDate] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [recordLoading, setRecordLoading] = useState(isEdit)

  useEffect(() => {
    if (farm) loadAnimals()
  }, [farm])

  useEffect(() => {
    if (id && farm) loadVaccination(id)
  }, [id, farm])

  async function loadVaccination(vaccinationId: string) {
    const { data, error: loadError } = await supabase.from('vaccinations').select('*').eq('id', vaccinationId).eq('farm_id', farm!.id).single()
    setRecordLoading(false)
    if (loadError || !data) { setError('Não foi possível carregar esta vacina. Volte à lista e tente novamente.'); return }
    setAnimalId(data.animal_id)
    setVaccineName(data.vaccine_name)
    setDate(data.date)
    setNextDueDate(data.next_due_date ?? '')
  }

  async function loadAnimals() {
    let query = supabase
      .from('animals')
      .select('id, tag, name')
      .eq('farm_id', farm!.id)
      .order('tag')
    if (!isEdit) query = query.eq('status', 'active')
    const { data } = await query
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

    const values = {
      animal_id: animalId,
      vaccine_name: vaccineName.trim(),
      date,
      next_due_date: nextDueDate || null,
    }
    const { error: err } = isEdit
      ? await supabase.from('vaccinations').update(values).eq('id', id!).eq('farm_id', farm.id)
      : await supabase.from('vaccinations').insert({ ...values, farm_id: farm.id, dose: null, notes: null, created_by: user.id })

    if (err) { setError(err.message); setLoading(false); return }
    navigate(preAnimalId || isEdit ? `/animais/${animalId}` : '/vacinas')
  }

  const inputClass = 'w-full rounded-xl border border-[#dce7df] bg-[#fbfdfb] px-3 py-2.5 text-sm outline-none'
  const labelClass = 'mb-1.5 block text-sm font-semibold text-[#415148]'

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <PageHeader backTo={preAnimalId ? `/animais/${preAnimalId}` : '/vacinas'} kicker="Sanidade" title={isEdit ? 'Editar vacina' : 'Registrar vacina'} />
      <form onSubmit={handleSubmit} className="app-surface space-y-6 p-5 sm:p-7" aria-busy={recordLoading}>
        <div className="grid gap-4 sm:grid-cols-2"><div className="sm:col-span-2"><p className={labelClass}>Animal *</p><AnimalPicker value={animalId} onChange={setAnimalId} options={animals} placeholder="Selecionar animal" /></div><div className="sm:col-span-2"><label htmlFor="vaccine-name" className={labelClass}>Vacina *</label><input id="vaccine-name" type="text" value={vaccineName} onChange={e => setVaccineName(e.target.value)} required className={inputClass} placeholder="Ex.: Aftosa, Brucelose, Raiva" /></div><div><label htmlFor="vaccine-date" className={labelClass}>Data de aplicação *</label><input id="vaccine-date" type="date" value={date} onChange={e => setDate(e.target.value)} required className={inputClass} /></div><div><label htmlFor="vaccine-next-date" className={labelClass}>Próxima dose</label><input id="vaccine-next-date" type="date" value={nextDueDate} onChange={e => setNextDueDate(e.target.value)} className={inputClass} /></div></div>
        {error && <p role="alert" className="rounded-xl border border-red-100 bg-red-50 px-3 py-2.5 text-sm text-red-700">{error}</p>}
        <div className="flex flex-col-reverse gap-3 border-t border-[#e7eee9] pt-5 sm:flex-row sm:justify-end"><button type="button" onClick={() => navigate(-1)} className="rounded-xl px-5 py-2.5 text-sm font-semibold text-[#526158] hover:bg-[#f1f5f2]">Cancelar</button><button type="submit" disabled={loading || recordLoading || Boolean(error && isEdit && !vaccineName)} className="rounded-xl bg-brand-700 px-5 py-2.5 text-sm font-semibold text-white shadow-[0_8px_18px_rgba(31,73,51,.18)] transition-colors hover:bg-brand-800 disabled:opacity-60">{recordLoading ? 'Carregando...' : loading ? 'Salvando...' : isEdit ? 'Salvar alterações' : 'Registrar vacina'}</button></div>
      </form>
    </div>
  )
}
