import { useEffect, useState, FormEvent } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { Plus, ArrowLeft, ArrowRight } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { Birth, Animal } from '../types'
import { AnimalPicker } from '../components/AnimalPicker'

export function BirthsList() {
  const { farm } = useAuth()
  const [births, setBirths] = useState<Birth[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (farm) load()
  }, [farm])

  async function load() {
    const { data } = await supabase
      .from('births')
      .select('*, mother:animals!mother_id(id, tag, name), calf:animals!calf_id(id, tag, name)')
      .eq('farm_id', farm!.id)
      .order('birth_date', { ascending: false })
    if (data) setBirths(data as Birth[])
    setLoading(false)
  }

  const BIRTH_LABEL: Record<Birth['birth_type'], string> = {
    natural: 'Natural', assisted: 'Assistido', cesarean: 'Cesárea',
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-800">Partos</h1>
        <Link
          to="/partos/novo"
          className="flex items-center gap-1.5 bg-brand-700 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-brand-800 transition-colors"
        >
          <Plus size={16} /> Novo
        </Link>
      </div>

      {loading ? (
        <div className="text-center text-gray-400 py-12">Carregando...</div>
      ) : births.length === 0 ? (
        <div className="text-center text-gray-400 py-12">
          <p>Nenhum parto registrado.</p>
          <Link to="/partos/novo" className="mt-2 inline-block text-brand-700 hover:underline text-sm">
            Registrar primeiro parto →
          </Link>
        </div>
      ) : (
        <div className="grid gap-2">
          {births.map(b => {
            const mother = b.mother as unknown as Animal | null
            const calf = b.calf as unknown as Animal | null
            return (
              <div key={b.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1">
                    <p className="font-semibold text-gray-800 text-sm">
                      Parto {BIRTH_LABEL[b.birth_type]}
                    </p>
                    {mother && (
                      <p className="text-xs text-gray-500">
                        Mãe:{' '}
                        <Link to={`/animais/${mother.id}`} className="text-brand-700 hover:underline">
                          {mother.name ?? mother.tag ?? 'Sem nome'}
                        </Link>
                      </p>
                    )}
                    {calf && (
                      <p className="text-xs text-gray-500">
                        Cria:{' '}
                        <Link to={`/animais/${calf.id}`} className="text-brand-700 hover:underline">
                          {calf.name ?? calf.tag ?? 'Sem nome'}
                        </Link>
                      </p>
                    )}
                    {b.notes && <p className="text-xs text-gray-400">{b.notes}</p>}
                  </div>
                  <p className="text-xs text-gray-500 shrink-0">
                    {new Date(b.birth_date + 'T12:00:00').toLocaleDateString('pt-BR')}
                  </p>
                </div>
              </div>
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
      <div className="flex items-center gap-3"><button onClick={() => navigate(-1)} className="rounded-xl p-2 text-[#516058] transition-colors hover:bg-white"><ArrowLeft size={18} /></button><div><p className="page-kicker">Reprodução</p><h1 className="mt-1 text-2xl font-bold tracking-tight text-[#17231b]">Registrar parto</h1></div></div>
      <form onSubmit={handleSubmit} className="app-surface space-y-6 p-5 sm:p-7">
        <div className={`relative grid gap-5 ${registerCalf ? 'lg:grid-cols-2' : ''}`}>
          <section className="space-y-5 rounded-2xl border border-[#e2ebe5] bg-white p-4 sm:p-5">
            <div><p className="text-sm font-bold text-[#24362b]">Dados do parto</p><p className="mt-1 text-xs text-[#718078]">Informe os dados principais do nascimento.</p></div>
            <div className="grid gap-4 sm:grid-cols-2"><div className="sm:col-span-2"><label className={labelClass}>Mãe *</label><AnimalPicker value={motherId} onChange={setMotherId} options={females} placeholder="Selecionar fêmea" /></div><div><label className={labelClass}>Data do parto *</label><input type="date" value={birthDate} onChange={e => setBirthDate(e.target.value)} required className={inputClass} /></div><div><label className={labelClass}>Tipo de parto</label><select value={birthType} onChange={e => setBirthType(e.target.value as Birth['birth_type'])} className={inputClass}><option value="natural">Natural</option><option value="assisted">Assistido</option><option value="cesarean">Cesárea</option></select></div></div>
            <label className="flex cursor-pointer items-start gap-3 rounded-xl bg-[#f2f7f3] p-3"><input type="checkbox" checked={registerCalf} onChange={e => setRegisterCalf(e.target.checked)} className="mt-0.5 h-4 w-4 rounded border-[#b9cbbf] accent-[#1f6b43] focus:ring-brand-500" /><span><span className="block text-sm font-bold text-[#24362b]">Cadastrar a cria agora</span><span className="mt-0.5 block text-xs text-[#718078]">Abra o cadastro completo da cria junto com este parto.</span></span></label>
          </section>

          {registerCalf && <><div className="pointer-events-none absolute left-1/2 top-1/2 z-10 hidden h-11 w-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-[#c5ddcc] bg-white text-brand-700 shadow-[0_5px_14px_rgba(32,79,53,.12)] lg:flex" title="Dados vinculados automaticamente"><ArrowRight size={19} strokeWidth={2.3} /></div><section className="rounded-2xl border border-[#cfe2d4] bg-[#f6f9f7] p-4 sm:p-5"><div className="mb-5"><p className="text-sm font-bold text-[#24362b]">Dados da cria</p><p className="mt-1 text-xs text-[#718078]">O nascimento e a mãe serão vinculados automaticamente.</p></div><div className="grid gap-4 sm:grid-cols-2"><div className="sm:col-span-2"><label className={labelClass}>Nome do animal *</label><input type="text" value={calfName} onChange={e => setCalfName(e.target.value)} className={inputClass} required placeholder="Ex.: Pintada" autoFocus /></div><div><label className={labelClass}>Sexo *</label><select value={calfSex} onChange={e => setCalfSex(e.target.value as 'M' | 'F')} className={inputClass}><option value="F">Fêmea</option><option value="M">Macho</option></select></div><div><label className={labelClass}>Raça</label><input type="text" value={calfBreed} onChange={e => setCalfBreed(e.target.value)} className={inputClass} placeholder="Ex.: Nelore" /></div><div className="sm:col-span-2"><label className={labelClass}>Pai</label><AnimalPicker value={fatherId} onChange={setFatherId} options={males} placeholder="Selecionar macho" /></div><div className="sm:col-span-2"><label className={labelClass}>Data de nascimento</label><input type="date" value={birthDate} readOnly className={`${inputClass} cursor-not-allowed text-[#748078]`} /></div></div></section></>}
        </div>
        <div><label className={labelClass}>Observações</label><textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} className={inputClass} placeholder="Intercorrências, observações ou cuidados necessários" /></div>
        {error && <p className="rounded-xl border border-red-100 bg-red-50 px-3 py-2.5 text-sm text-red-700">{error}</p>}
        <div className="flex flex-col-reverse gap-3 border-t border-[#e7eee9] pt-5 sm:flex-row sm:justify-end"><button type="button" onClick={() => navigate(-1)} className="rounded-xl px-5 py-2.5 text-sm font-semibold text-[#526158] hover:bg-[#f1f5f2]">Cancelar</button><button type="submit" disabled={loading} className="rounded-xl bg-brand-700 px-5 py-2.5 text-sm font-semibold text-white shadow-[0_8px_18px_rgba(31,73,51,.18)] transition-colors hover:bg-brand-800 disabled:opacity-60">{loading ? 'Salvando...' : 'Registrar parto'}</button></div>
      </form>
    </div>
  )
}
