import { FormEvent, useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { CalendarHeart } from 'lucide-react'
import { PageHeader } from '../components/PageHeader'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { Animal } from '../types'

const formatDate = (date: Date) => date.toLocaleDateString('pt-BR')
const dateToInput = (date: Date) => date.toLocaleDateString('pt-BR').replace(/\//g, '/')

function formatMask(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 8)
  if (digits.length <= 2) return digits
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`
}

function parseInputDate(value: string) {
  const match = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
  if (!match) return null
  const [, day, month, year] = match
  const parsed = new Date(`${year}-${month}-${day}T12:00:00`)
  return parsed.getFullYear() === Number(year) && parsed.getMonth() + 1 === Number(month) && parsed.getDate() === Number(day) ? parsed : null
}

export function ReproductionForm() {
  const { farm, user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const preselectedMother = new URLSearchParams(location.search).get('animal') ?? ''
  const [mothers, setMothers] = useState<Pick<Animal, 'id' | 'name' | 'tag'>[]>([])
  const [motherId, setMotherId] = useState(preselectedMother)
  const [breedingDate, setBreedingDate] = useState(dateToInput(new Date()))
  const [notes, setNotes] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => { if (farm) loadMothers() }, [farm])
  async function loadMothers() {
    const { data } = await supabase.from('animals').select('id, name, tag').eq('farm_id', farm!.id).eq('sex', 'F').eq('status', 'active').order('name')
    if (data) setMothers(data as Pick<Animal, 'id' | 'name' | 'tag'>[])
  }

  const expectedBirth = useMemo(() => {
    const date = parseInputDate(breedingDate)
    if (!date) return null
    const expected = new Date(date)
    expected.setDate(expected.getDate() + 283)
    return expected
  }, [breedingDate])

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const parsedDate = parseInputDate(breedingDate)
    if (!farm || !user || !parsedDate) { setError('Informe a data em que a fêmea pegou cria no formato dia/mês/ano.'); return }
    if (!motherId) { setError('Selecione a fêmea.'); return }
    setError(''); setLoading(true)
    const expected = new Date(parsedDate); expected.setDate(expected.getDate() + 283)
    const toIso = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
    const { error: saveError } = await supabase.from('pregnancies').insert({ farm_id: farm.id, mother_id: motherId, breeding_date: toIso(parsedDate), expected_birth_date: toIso(expected), status: 'pregnant', notes: notes.trim() || null, created_by: user.id })
    if (saveError) { setError(saveError.message); setLoading(false); return }
    navigate(`/animais/${motherId}`)
  }

  const inputClass = 'w-full rounded-xl border border-[#dce7df] bg-[#fbfdfb] px-3 py-2.5 text-sm outline-none'
  const labelClass = 'mb-1.5 block text-sm font-semibold text-[#415148]'
  return (
    <div className="mx-auto max-w-xl space-y-5">
      <PageHeader backTo={preselectedMother ? `/animais/${preselectedMother}` : '/animais'} kicker="Reprodução" title="Registrar gestação" />
      <form onSubmit={handleSubmit} className="app-surface space-y-5 p-5 sm:p-7">
        <div><label htmlFor="pregnancy-mother" className={labelClass}>Fêmea *</label><select id="pregnancy-mother" value={motherId} onChange={event => setMotherId(event.target.value)} required className={inputClass}><option value="">Selecione a fêmea</option>{mothers.map(mother => <option key={mother.id} value={mother.id}>{mother.name ?? mother.tag ?? 'Sem nome'}</option>)}</select></div>
        <div><label htmlFor="pregnancy-date" className={labelClass}>Quando pegou cria? *</label><input id="pregnancy-date" type="text" inputMode="numeric" maxLength={10} value={breedingDate} onChange={event => setBreedingDate(formatMask(event.target.value))} required className={inputClass} placeholder="dd/mm/aaaa" /></div>
        {expectedBirth && <div className="rounded-2xl bg-brand-50 p-4"><div className="flex gap-3"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-brand-700"><CalendarHeart size={18} aria-hidden="true" /></span><div><p className="text-sm font-bold text-[#254331]">Previsão de parto</p><p className="mt-0.5 text-sm text-brand-700">{formatDate(expectedBirth)}</p><p className="mt-1 text-xs text-[#678070]">Cálculo estimado em 283 dias de gestação.</p></div></div></div>}
        <div><label htmlFor="pregnancy-notes" className={labelClass}>Observações</label><textarea id="pregnancy-notes" value={notes} onChange={event => setNotes(event.target.value)} className={inputClass} rows={3} placeholder="Ex.: inseminação artificial, touro utilizado..." /></div>
        {error && <p role="alert" className="rounded-xl border border-red-100 bg-red-50 px-3 py-2.5 text-sm text-red-700">{error}</p>}
        <div className="flex flex-col-reverse gap-3 border-t border-[#e7eee9] pt-5 sm:flex-row sm:justify-end"><button type="button" onClick={() => navigate(-1)} className="rounded-xl px-5 py-2.5 text-sm font-semibold text-[#526158] hover:bg-[#f1f5f2]">Cancelar</button><button type="submit" disabled={loading} className="rounded-xl bg-brand-700 px-5 py-2.5 text-sm font-semibold text-white shadow-[0_8px_18px_rgba(31,73,51,.18)] hover:bg-brand-800 disabled:opacity-60">{loading ? 'Salvando...' : 'Registrar gestação'}</button></div>
      </form>
    </div>
  )
}
