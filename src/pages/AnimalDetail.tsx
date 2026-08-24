import { useEffect, useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { AlertTriangle, ArrowLeft, Pencil, Syringe, Baby, Trash2, X, PawPrint, CalendarHeart } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { Animal, Vaccination, Birth, AnimalEvent, Pregnancy } from '../types'

type Tab = 'vacinas' | 'partos' | 'eventos' | 'reproducao'

const STATUS_COLOR: Record<Animal['status'], string> = {
  active: 'bg-green-100 text-green-800',
  sold: 'bg-blue-100 text-blue-800',
  dead: 'bg-gray-100 text-gray-600',
}
const STATUS_LABEL: Record<Animal['status'], string> = {
  active: 'Ativo', sold: 'Vendido', dead: 'Morto',
}
const EVENT_LABEL: Record<AnimalEvent['event_type'], string> = { weight: 'Pesagem', treatment: 'Tratamento', sale: 'Venda', purchase: 'Compra', other: 'Outro' }

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
  const [events] = useState<AnimalEvent[]>([])
  const [pregnancies, setPregnancies] = useState<Pregnancy[]>([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState('')
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  useEffect(() => {
    if (id) loadAnimal(id)
  }, [id])

  useEffect(() => {
    if (!id) return
    if (tab === 'vacinas') loadVaccinations(id)
    if (tab === 'reproducao') { loadPregnancies(id); loadBirths(id) }
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

  async function loadPregnancies(animalId: string) {
    const { data } = await supabase.from('pregnancies').select('*').eq('mother_id', animalId).order('breeding_date', { ascending: false })
    if (data) setPregnancies(data as Pregnancy[])
  }

  async function handleDelete() {
    if (!animal || deleting) return
    setDeleteError('')
    setDeleting(true)
    const { error } = await supabase.from('animals').delete().eq('id', animal.id)
    if (error) {
      setDeleteError(`Não foi possível excluir o animal: ${error.message}`)
      setDeleting(false)
      return
    }
    navigate('/animais')
  }

  if (loading) return <div className="text-center text-gray-400 py-12">Carregando...</div>
  if (!animal) return <div className="text-center text-gray-400 py-12">Animal não encontrado.</div>

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [{ key: 'vacinas', label: 'Vacinação', icon: <Syringe size={14} /> }]
  if (animal.sex === 'F') tabs.push({ key: 'reproducao', label: 'Reprodução', icon: <CalendarHeart size={14} /> })

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-lg">
          <ArrowLeft size={18} />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            {animal.image_url ? <img src={animal.image_url} alt={animal.name ?? 'Animal'} className="h-11 w-11 rounded-xl object-cover shadow-sm" /> : <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-700"><PawPrint size={21} /></span>}
            <div><span className="block text-xl font-bold text-gray-800">{animal.name ?? animal.tag ?? 'Sem nome'}</span>{animal.tag && <span className="text-xs font-mono text-gray-400">#{animal.tag}</span>}</div>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ml-auto ${STATUS_COLOR[animal.status]}`}>
              {STATUS_LABEL[animal.status]}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Link to={`/animais/${animal.id}/editar`} className="p-2 hover:bg-gray-100 rounded-lg text-gray-600" aria-label="Editar animal">
            <Pencil size={16} />
          </Link>
          <button onClick={() => setDeleteDialogOpen(true)} disabled={deleting} className="rounded-lg p-2 text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50" aria-label="Excluir animal" title="Excluir animal">
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {deleteError && <p className="rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700">{deleteError}</p>}

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
              : animal.mother_name ?? '—'}
          </p>
        </div>
        <div>
          <span className="text-gray-400 text-xs">Mãe</span>
          <p className="font-medium">
            {animal.mother
              ? <Link to={`/animais/${animal.mother.id}`} className="text-brand-700 hover:underline">
                  {animal.mother.name ?? animal.mother.tag ?? 'Sem nome'}
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
            <><div className="mb-4 flex items-center justify-between gap-3"><div><p className="text-sm font-bold text-[#24362b]">Histórico de vacinação</p><p className="text-xs text-[#718078]">Registre aplicações e próximas doses.</p></div><Link to={`/vacinas/nova?animal=${animal.id}`} className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-brand-700 px-3 py-2 text-xs font-semibold text-white shadow-sm hover:bg-brand-800"><Syringe size={14} /> Registrar</Link></div>{vaccinations.length === 0
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
                </div>}</>
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
                              Cria: {(b.calf as unknown as Animal).name ?? (b.calf as unknown as Animal).tag ?? 'Sem nome'}
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

          {tab === 'reproducao' && <div className="space-y-6">
            <div className="flex flex-wrap gap-2"><Link to={`/reproducao/nova?animal=${animal.id}`} className="inline-flex items-center gap-1.5 rounded-xl bg-brand-700 px-3 py-2 text-xs font-semibold text-white shadow-sm hover:bg-brand-800"><CalendarHeart size={14} /> Registrar quando pegou cria</Link><Link to={`/partos/novo?animal=${animal.id}`} className="inline-flex items-center gap-1.5 rounded-xl border border-brand-200 bg-brand-50 px-3 py-2 text-xs font-semibold text-brand-700 hover:bg-brand-100"><Baby size={14} /> Registrar parto</Link></div>
            <section><p className="mb-2 text-sm font-bold text-[#24362b]">Gestação</p>{pregnancies.length === 0 ? <p className="rounded-xl bg-[#f6f9f7] px-3 py-4 text-center text-sm text-[#718078]">Nenhuma gestação registrada.</p> : <div className="divide-y divide-gray-50">{pregnancies.map(pregnancy => <div key={pregnancy.id} className="py-3"><div className="flex items-start justify-between gap-3"><div><p className="text-sm font-medium text-gray-800">{pregnancy.status === 'gave_birth' ? 'Parto registrado' : pregnancy.status === 'not_pregnant' ? 'Gestação não confirmada' : 'Prenhe'}</p><p className="mt-0.5 text-xs text-gray-500">Pegou cria: {new Date(pregnancy.breeding_date + 'T12:00:00').toLocaleDateString('pt-BR')}</p>{pregnancy.notes && <p className="mt-1 text-xs text-gray-400">{pregnancy.notes}</p>}</div><div className={`rounded-lg px-2 py-1 text-right text-xs font-semibold ${pregnancy.status === 'pregnant' ? 'bg-brand-50 text-brand-700' : 'bg-gray-100 text-gray-600'}`}>{pregnancy.status === 'pregnant' ? <>Previsão<br />{new Date(pregnancy.expected_birth_date + 'T12:00:00').toLocaleDateString('pt-BR')}</> : pregnancy.status === 'gave_birth' ? 'Pariu' : 'Não prenhe'}</div></div></div>)}</div>}</section>
            <section><p className="mb-2 text-sm font-bold text-[#24362b]">Partos</p>{births.length === 0 ? <p className="rounded-xl bg-[#f6f9f7] px-3 py-4 text-center text-sm text-[#718078]">Nenhum parto registrado.</p> : <div className="divide-y divide-gray-50">{births.map(birth => <div key={birth.id} className="flex items-start justify-between py-3"><div><p className="text-sm font-medium text-gray-800">Parto {birth.birth_type === 'natural' ? 'natural' : birth.birth_type === 'assisted' ? 'assistido' : 'cesárea'}</p>{birth.calf && <Link to={`/animais/${(birth.calf as unknown as Animal).id}`} className="text-xs text-brand-700 hover:underline">Cria: {(birth.calf as unknown as Animal).name ?? (birth.calf as unknown as Animal).tag ?? 'Sem nome'}</Link>}</div><p className="text-xs text-gray-500">{new Date(birth.birth_date + 'T12:00:00').toLocaleDateString('pt-BR')}</p></div>)}</div>}</section>
          </div>}
        </div>
      </div>

      {deleteDialogOpen && <div className="fixed inset-0 z-50 flex items-end bg-[#10291c]/40 p-4 backdrop-blur-sm sm:items-center sm:justify-center" role="dialog" aria-modal="true" aria-labelledby="delete-title">
        <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-[0_24px_70px_rgba(11,37,24,.28)]">
          <div className="flex items-start justify-between gap-4"><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-red-50 text-red-600"><AlertTriangle size={21} /></span><button onClick={() => setDeleteDialogOpen(false)} disabled={deleting} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700 disabled:opacity-50" aria-label="Fechar aviso"><X size={18} /></button></div>
          <h2 id="delete-title" className="mt-5 text-xl font-bold tracking-tight text-[#1c2f24]">Excluir animal?</h2>
          <p className="mt-2 text-sm leading-6 text-[#68756d]">Você está prestes a excluir <strong className="font-semibold text-[#304238]">{animal.name ?? animal.tag ?? 'este animal'}</strong>. Esta ação é permanente.</p>
          <p className="mt-3 rounded-xl bg-[#fff7f6] px-3 py-2.5 text-xs leading-5 text-[#91504a]">Vacinas e eventos vinculados a este animal também serão excluídos.</p>
          <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"><button onClick={() => setDeleteDialogOpen(false)} disabled={deleting} className="rounded-xl px-4 py-2.5 text-sm font-semibold text-[#526158] transition-colors hover:bg-[#f1f5f2] disabled:opacity-50">Cancelar</button><button onClick={handleDelete} disabled={deleting} className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white shadow-[0_8px_18px_rgba(220,38,38,.18)] transition-colors hover:bg-red-700 disabled:opacity-60"><Trash2 size={15} />{deleting ? 'Excluindo...' : 'Excluir animal'}</button></div>
        </div>
      </div>}
    </div>
  )
}
