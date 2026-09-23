import { useEffect, useState, FormEvent } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { Plus, ArrowRight, Baby, CalendarDays } from 'lucide-react'
import { PageHeader } from '../components/PageHeader'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { Birth, Animal } from '../types'
import { AnimalPicker } from '../components/AnimalPicker'

export function BirthsList() {
  const { farm } = useAuth()
  const [births, setBirths] = useState<Birth[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')

  useEffect(() => {
    if (farm) load()
  }, [farm])

  async function load() {
    setLoading(true)
    setLoadError('')
    const { data, error } = await supabase
      .from('births')
      .select('*, mother:animals!mother_id(id, tag, name), calf:animals!calf_id(id, tag, name)')
      .eq('farm_id', farm!.id)
      .order('birth_date', { ascending: false })
    if (data) setBirths(data as Birth[])
    if (error) setLoadError('Não foi possível carregar os partos. Tente novamente.')
    setLoading(false)
  }

  const BIRTH_LABEL: Record<Birth['birth_type'], string> = {
    natural: 'Natural', assisted: 'Assistido', cesarean: 'Cesárea',
  }

  return (
    <div className="space-y-5">
      <PageHeader backTo="/" kicker="Reprodução" title="Partos" description="Consulte os nascimentos registrados no rebanho." actions={<Link
          to="/partos/novo"
          className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-brand-700 px-4 text-sm font-semibold text-white transition-colors hover:bg-brand-800"
        >
          <Plus size={17} aria-hidden="true" /> Registrar parto
        </Link>} />

      {loading ? (
        <div role="status" className="app-surface p-8 text-center text-sm text-[#526158]">Carregando partos...</div>
      ) : loadError ? (
        <div role="alert" className="app-surface p-8 text-center"><p className="text-sm text-red-700">{loadError}</p><button type="button" onClick={() => void load()} className="mt-3 rounded-xl px-4 py-2 text-sm font-semibold text-brand-800 hover:bg-brand-50">Tentar novamente</button></div>
      ) : births.length === 0 ? (
        <div className="app-surface flex flex-col items-center px-6 py-12 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-700"><Baby size={26} aria-hidden="true" /></span>
          <h2 className="mt-4 text-lg font-bold text-brand-900">Nenhum parto registrado</h2>
          <p className="mt-1 max-w-sm text-sm text-[#526158]">Registre o primeiro nascimento para acompanhar a reprodução da fazenda.</p>
          <Link to="/partos/novo" className="mt-5 inline-flex min-h-11 items-center rounded-xl bg-brand-700 px-4 text-sm font-semibold text-white hover:bg-brand-800">Registrar primeiro parto</Link>
        </div>
      ) : (
        <div className="grid gap-3">
          {births.map(b => {
            const mother = b.mother as unknown as Animal | null
            const calf = b.calf as unknown as Animal | null
            return (
              <article key={b.id} className="app-surface flex flex-col gap-3 p-4 sm:flex-row sm:items-start sm:justify-between sm:p-5">
                  <div className="min-w-0 space-y-1">
                    <h2 className="text-base font-bold text-[#203529]">
                      Parto {BIRTH_LABEL[b.birth_type]}
                    </h2>
                    {mother && (
                      <p className="text-sm text-[#526158]">
                        Mãe:{' '}
                        <Link to={`/animais/${mother.id}`} className="font-medium text-brand-700 hover:underline">
                          {mother.name ?? mother.tag ?? 'Sem nome'}
                        </Link>
                      </p>
                    )}
                    {calf && (
                      <p className="text-sm text-[#526158]">
                        Cria:{' '}
                        <Link to={`/animais/${calf.id}`} className="font-medium text-brand-700 hover:underline">
                          {calf.name ?? calf.tag ?? 'Sem nome'}
                        </Link>
                      </p>
                    )}
                    {b.notes && <p className="text-sm text-[#526158]">{b.notes}</p>}
                  </div>
                  <p className="inline-flex shrink-0 items-center gap-1.5 text-sm tabular-nums text-[#526158]">
                    <CalendarDays size={16} aria-hidden="true" />{new Date(b.birth_date + 'T12:00:00').toLocaleDateString('pt-BR')}
                  </p>
              </article>
            )
          })}
        </div>
      )}
    </div>
  )
}

export function BirthForm() {
  const { farm, user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const preAnimalId = new URLSearchParams(location.search).get('animal') ?? ''

  const [females, setFemales] = useState<Pick<Animal, 'id' | 'tag' | 'name'>[]>([])
  const [males, setMales] = useState<Pick<Animal, 'id' | 'tag' | 'name'>[]>([])
  const [motherId, setMotherId] = useState(preAnimalId)
  const [birthDate, setBirthDate] = useState(new Date().toISOString().split('T')[0])
  const [birthType, setBirthType] = useState<Birth['birth_type']>('natural')
  const [notes, setNotes] = useState('')
  // Calf fields (optional)
  const [calfName, setCalfName] = useState('')
  const [calfSex, setCalfSex] = useState<'M' | 'F'>('F')
  const [calfBreed, setCalfBreed] = useState('')
  const [fatherId, setFatherId] = useState('')
  const [registerCalf, setRegisterCalf] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (farm) loadParents()
  }, [farm])

  async function loadParents() {
    const { data } = await supabase
      .from('animals')
      .select('id, tag, name, sex')
      .eq('farm_id', farm!.id)
      .eq('status', 'active')
      .order('tag')
    if (data) {
      setFemales(data.filter(animal => animal.sex === 'F'))
      setMales(data.filter(animal => animal.sex === 'M'))
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!farm || !user) return
    setError('')
    if (!motherId) {
      setError('Selecione a mãe para registrar o parto.')
      return
    }
    setLoading(true)

    let calfId: string | null = null

    // Create calf animal first if requested
    if (registerCalf && calfName.trim()) {
      const { data: calf, error: calfErr } = await supabase
        .from('animals')
        .insert({
          farm_id: farm.id,
          tag: null,
          name: calfName.trim(),
          sex: calfSex,
          breed: calfBreed.trim() || null,
          birth_date: birthDate,
          mother_id: motherId || null,
          father_id: fatherId || null,
          status: 'active',
        })
        .select()
        .single()

      if (calfErr) {
        setError(calfErr.message)
        setLoading(false)
        return
      }
      calfId = calf.id
    }

    const { error: birthErr } = await supabase.from('births').insert({
      mother_id: motherId || null,
      farm_id: farm.id,
      birth_date: birthDate,
      calf_id: calfId,
      birth_type: birthType,
      notes: notes.trim() || null,
      created_by: user.id,
    })

    if (birthErr) { setError(birthErr.message); setLoading(false); return }
    if (motherId) await supabase.from('pregnancies').update({ status: 'gave_birth' }).eq('mother_id', motherId).eq('status', 'pregnant')
    navigate(preAnimalId ? `/animais/${preAnimalId}` : '/partos')
  }

  const inputClass = 'w-full rounded-xl border border-[#dce7df] bg-[#fbfdfb] px-3 py-2.5 text-sm outline-none'
  const labelClass = 'mb-1.5 block text-sm font-semibold text-[#415148]'

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <PageHeader backTo="/partos" kicker="Reprodução" title="Registrar parto" />
      <form onSubmit={handleSubmit} className="app-surface space-y-6 p-5 sm:p-7">
        <div className={`relative grid gap-5 ${registerCalf ? 'lg:grid-cols-2' : ''}`}>
          <section className="space-y-5 rounded-2xl border border-[#e2ebe5] bg-white p-4 sm:p-5">
            <div><p className="text-sm font-bold text-[#24362b]">Dados do parto</p><p className="mt-1 text-xs text-[#718078]">Informe os dados principais do nascimento.</p></div>
            <div className="grid gap-4 sm:grid-cols-2"><div className="sm:col-span-2"><p className={labelClass}>Mãe *</p><AnimalPicker value={motherId} onChange={setMotherId} options={females} placeholder="Selecionar fêmea" /></div><div><label htmlFor="birth-date" className={labelClass}>Data do parto *</label><input id="birth-date" type="date" value={birthDate} onChange={e => setBirthDate(e.target.value)} required className={inputClass} /></div><div><label htmlFor="birth-type" className={labelClass}>Tipo de parto</label><select id="birth-type" value={birthType} onChange={e => setBirthType(e.target.value as Birth['birth_type'])} className={inputClass}><option value="natural">Natural</option><option value="assisted">Assistido</option><option value="cesarean">Cesárea</option></select></div></div>
            <label className="flex cursor-pointer items-start gap-3 rounded-xl bg-[#f2f7f3] p-3"><input type="checkbox" checked={registerCalf} onChange={e => setRegisterCalf(e.target.checked)} className="mt-0.5 h-4 w-4 rounded border-[#b9cbbf] accent-[#1f6b43] focus:ring-brand-500" /><span><span className="block text-sm font-bold text-[#24362b]">Cadastrar a cria agora</span><span className="mt-0.5 block text-xs text-[#526158]">Informe os dados básicos da cria junto com este parto.</span></span></label>
          </section>

          {registerCalf && <><div className="pointer-events-none absolute left-1/2 top-1/2 z-10 hidden h-11 w-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-[#c5ddcc] bg-white text-brand-700 shadow-[0_5px_14px_rgba(32,79,53,.12)] lg:flex" title="Dados vinculados automaticamente"><ArrowRight size={19} strokeWidth={2.3} /></div><section className="rounded-2xl border border-[#cfe2d4] bg-[#f6f9f7] p-4 sm:p-5"><div className="mb-5"><p className="text-sm font-bold text-[#24362b]">Dados da cria</p><p className="mt-1 text-xs text-[#718078]">O nascimento e a mãe serão vinculados automaticamente.</p></div><div className="grid gap-4 sm:grid-cols-2"><div className="sm:col-span-2"><label htmlFor="calf-name" className={labelClass}>Nome do animal *</label><input id="calf-name" type="text" value={calfName} onChange={e => setCalfName(e.target.value)} className={inputClass} required placeholder="Ex.: Pintada" /></div><div><label htmlFor="calf-sex" className={labelClass}>Sexo *</label><select id="calf-sex" value={calfSex} onChange={e => setCalfSex(e.target.value as 'M' | 'F')} className={inputClass}><option value="F">Fêmea</option><option value="M">Macho</option></select></div><div><label htmlFor="calf-breed" className={labelClass}>Raça</label><input id="calf-breed" type="text" value={calfBreed} onChange={e => setCalfBreed(e.target.value)} className={inputClass} placeholder="Ex.: Nelore" /></div><div className="sm:col-span-2"><p className={labelClass}>Pai</p><AnimalPicker value={fatherId} onChange={setFatherId} options={males} placeholder="Selecionar macho" /></div><div className="sm:col-span-2"><label htmlFor="calf-birth-date" className={labelClass}>Data de nascimento</label><input id="calf-birth-date" type="date" value={birthDate} readOnly className={`${inputClass} text-[#748078]`} /></div></div></section></>}
        </div>
        <div><label htmlFor="birth-notes" className={labelClass}>Observações</label><textarea id="birth-notes" value={notes} onChange={e => setNotes(e.target.value)} rows={3} className={inputClass} placeholder="Intercorrências, observações ou cuidados necessários" /></div>
        {error && <p role="alert" className="rounded-xl border border-red-100 bg-red-50 px-3 py-2.5 text-sm text-red-700">{error}</p>}
        <div className="flex flex-col-reverse gap-3 border-t border-[#e7eee9] pt-5 sm:flex-row sm:justify-end"><button type="button" onClick={() => navigate(-1)} className="rounded-xl px-5 py-2.5 text-sm font-semibold text-[#526158] hover:bg-[#f1f5f2]">Cancelar</button><button type="submit" disabled={loading} className="rounded-xl bg-brand-700 px-5 py-2.5 text-sm font-semibold text-white shadow-[0_8px_18px_rgba(31,73,51,.18)] transition-colors hover:bg-brand-800 disabled:opacity-60">{loading ? 'Salvando...' : 'Registrar parto'}</button></div>
      </form>
    </div>
  )
}
