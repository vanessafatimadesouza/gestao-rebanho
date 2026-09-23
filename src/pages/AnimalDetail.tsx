import { useEffect, useState } from 'react'
import { useNavigate, useParams, Link, useSearchParams } from 'react-router-dom'
import { AlertTriangle, CirclePlus, ListChecks, Network, Pencil, Syringe, Baby, Trash2, X, PawPrint, CalendarHeart, Tag, UserRound } from 'lucide-react'
import { PageHeader } from '../components/PageHeader'
import { AnimalGenealogy } from '../components/AnimalGenealogy'
import { supabase } from '../lib/supabase'
import { Animal, Vaccination, Birth, AnimalEvent, Pregnancy } from '../types'

type Tab = 'vacinas' | 'partos' | 'eventos' | 'reproducao' | 'genealogia'

const STATUS_LABEL: Record<Animal['status'], string> = {
  active: 'Ativo', sold: 'Vendido', dead: 'Morto',
}
const STATUS_BADGE: Record<Animal['status'], string> = {
  active: 'bg-[#e2f8eb] text-[#17623c]',
  sold: 'bg-blue-50 text-blue-800',
  dead: 'bg-gray-100 text-gray-700',
}
const STATUS_DOT: Record<Animal['status'], string> = {
  active: 'bg-[#43cf78]', sold: 'bg-blue-500', dead: 'bg-gray-500',
}
const EVENT_LABEL: Record<AnimalEvent['event_type'], string> = { weight: 'Pesagem', treatment: 'Tratamento', sale: 'Venda', purchase: 'Compra', other: 'Outro' }

function age(birthDate: string): string {
  const diff = Date.now() - new Date(birthDate + 'T12:00:00').getTime()
  const days = Math.floor(diff / 86400000)
  if (days < 30) return `${days} dias`
  if (days < 365) return `${Math.floor(days / 30)} meses`
  return `${Math.floor(days / 365)} anos`
}

function Detail({ label, value, status = false }: { label: string; value: string; status?: boolean }) {
  return <div className="min-w-0 border-b border-[#e7eeea] px-0 py-3 pr-4 sm:border-b-0 sm:border-r sm:px-4 sm:py-0 first:pl-0 sm:nth-[4n]:border-r-0">
    <span className="block text-sm text-[#88968d]">{label}</span>
    <strong className="mt-1 block truncate text-base text-[#17291e]">{status && <span className="mr-2 inline-block h-2.5 w-2.5 rounded-full bg-[#54cf7d]" />}{value}</strong>
  </div>
}

function SideDetail({ icon: Icon, label, value }: { icon: typeof CalendarHeart; label: string; value: string }) {
  return <div className="flex items-center gap-3"><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#f1f8f3] text-[#5f8c70]"><Icon size={16} /></span><span className="flex flex-1 items-center justify-between gap-3 text-sm"><span className="text-[#87958c]">{label}</span><strong className="text-right text-[#203529]">{value}</strong></span></div>
}

function ManagementCard({ icon: Icon, title, subtitle, emptyTitle, emptyText, actionTo, actionLabel, records, children }: { icon: typeof Syringe; title: string; subtitle: string; emptyTitle: string; emptyText: string; actionTo: string; actionLabel: string; records: number; children: React.ReactNode }) {
  return <section className="min-h-[330px] rounded-3xl border border-[#e4ece7] bg-white p-5 shadow-[0_10px_28px_rgba(22,61,38,.045)] sm:p-6"><div className="flex flex-wrap items-center justify-between gap-4"><div className="flex min-w-0 items-center gap-4"><span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#edf8f0] text-[#205b3d]"><Icon size={25} /></span><div><h2 className="text-lg font-bold text-[#1d3024]">{title}</h2><p className="mt-1 text-sm text-[#526158]">{subtitle}</p></div></div>{records > 0 && <Link to={actionTo} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-brand-700 px-4 text-sm font-semibold text-white hover:bg-brand-800"><CirclePlus size={17} aria-hidden="true" />{actionLabel}</Link>}</div>{records > 0 ? <div className="mt-6">{children}</div> : <div className="flex min-h-[205px] flex-col items-center justify-center px-4 text-center"><span className="flex h-16 w-16 items-center justify-center rounded-full bg-[#f0f8f2] text-[#95b7a1]"><CirclePlus size={31} /></span><h3 className="mt-5 text-base font-bold text-[#25372b]">{emptyTitle}</h3><p className="mt-1 max-w-sm text-sm leading-5 text-[#526158]">{emptyText}</p><Link to={actionTo} className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-xl border border-[#1d6a43] px-5 text-sm font-semibold text-[#1d6040] transition-colors hover:bg-brand-50"><CirclePlus size={17} />{actionLabel}</Link></div>}</section>
}

export function AnimalDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [animal, setAnimal] = useState<Animal | null>(null)
  const [tab, setTab] = useState<Tab>(() => searchParams.get('aba') === 'genealogia' ? 'genealogia' : 'vacinas')
  const [vaccinations, setVaccinations] = useState<Vaccination[]>([])
  const [births, setBirths] = useState<Birth[]>([])
  const [events, setEvents] = useState<AnimalEvent[]>([])
  const [pregnancies, setPregnancies] = useState<Pregnancy[]>([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState('')
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  useEffect(() => {
    if (id) {
      setLoading(true)
      loadAnimal(id)
    }
  }, [id])

  useEffect(() => {
    if (!id) return
    loadVaccinations(id)
    loadPregnancies(id)
    loadBirths(id)
    loadEvents(id)
  }, [id])

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

  async function loadEvents(animalId: string) {
    const { data } = await supabase.from('events').select('*').eq('animal_id', animalId).order('date', { ascending: false })
    if (data) setEvents(data as AnimalEvent[])
  }

  async function handleVaccinationDelete(vaccination: Vaccination) {
    if (!window.confirm(`Excluir o registro da vacina “${vaccination.vaccine_name}”?`)) return
    const { error } = await supabase.from('vaccinations').delete().eq('id', vaccination.id)
    if (error) { setDeleteError(`Não foi possível excluir a vacina: ${error.message}`); return }
    setVaccinations(current => current.filter(item => item.id !== vaccination.id))
  }

  if (loading) return <div className="text-center text-gray-400 py-12">Carregando...</div>
  if (!animal) return <div className="text-center text-gray-400 py-12">Animal não encontrado.</div>

  function selectTab(nextTab: Tab) {
    setTab(nextTab)
    if (nextTab === 'genealogia') setSearchParams({ aba: 'genealogia' })
    else setSearchParams({})
  }

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [{ key: 'vacinas', label: 'Vacinação', icon: <Syringe size={14} /> }]
  if (animal.sex === 'F') tabs.push({ key: 'reproducao', label: 'Reprodução', icon: <CalendarHeart size={14} /> })
  tabs.push({ key: 'genealogia', label: 'Árvore genealógica', icon: <Network size={14} /> })
  tabs.push({ key: 'eventos', label: 'Histórico', icon: <ListChecks size={14} /> })

  const historyEntries = [
    ...vaccinations.map(v => ({ id: `v-${v.id}`, date: v.date, title: v.vaccine_name, category: 'Vacinação' })),
    ...births.map(b => ({ id: `b-${b.id}`, date: b.birth_date, title: 'Parto registrado', category: 'Reprodução' })),
    ...pregnancies.map(p => ({ id: `p-${p.id}`, date: p.breeding_date, title: 'Gestação registrada', category: 'Reprodução' })),
    ...events.map(e => ({ id: `e-${e.id}`, date: e.date, title: EVENT_LABEL[e.event_type], category: 'Manejo' })),
  ].sort((a, b) => b.date.localeCompare(a.date))

  return (
    <div className="space-y-5">
      <PageHeader backTo="/animais" kicker="Rebanho" title="Animal" />

      {deleteError && <p className="rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700">{deleteError}</p>}

      <div className={`grid items-start gap-5 ${tab === 'genealogia' ? 'lg:grid-cols-[300px_minmax(0,1fr)]' : 'lg:grid-cols-[340px_minmax(0,1fr)]'}`}>
        <section className="overflow-hidden rounded-3xl border border-[#e4ece7] bg-white shadow-[0_10px_28px_rgba(22,61,38,.055)]">
          <div className="relative aspect-[1.35/1] overflow-hidden bg-brand-50"><img src={animal.image_url ?? (animal.sex === 'F' ? '/images/cattle-cow-nelore.png' : '/images/cattle-bull-white.png')} alt={animal.name ?? 'Animal'} className="h-full w-full object-cover" /><div className="absolute bottom-4 right-4 flex gap-2"><Link to={`/animais/${animal.id}/editar`} className="flex h-11 w-11 items-center justify-center rounded-full bg-white/40 text-brand-900 transition-colors hover:bg-white/60" aria-label="Editar animal"><Pencil size={18} /></Link><button onClick={() => setDeleteDialogOpen(true)} disabled={deleting} className="flex h-11 w-11 items-center justify-center rounded-full bg-white/40 text-red-700 transition-colors hover:bg-red-50/70 disabled:opacity-50" aria-label="Excluir animal"><Trash2 size={18} /></button></div></div>
          <div className="p-5"><div className="flex items-start justify-between gap-3"><div><h2 className="text-2xl font-bold tracking-tight text-[#17291e]">{animal.name ?? animal.tag ?? 'Sem nome'}</h2></div><span className={`inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs font-bold ${STATUS_BADGE[animal.status]}`}><span className={`h-2.5 w-2.5 rounded-full ${STATUS_DOT[animal.status]}`} />{STATUS_LABEL[animal.status]}</span></div><div className="mt-3 flex flex-wrap gap-2"><span className="inline-flex items-center gap-1.5 rounded-lg bg-[#f3f5f8] px-2.5 py-1.5 text-[11px] font-semibold text-[#536176]"><Tag size={13} />{animal.breed ?? 'Sem raça'}</span><span className="inline-flex items-center gap-1.5 rounded-lg bg-[#f2f4f3] px-2.5 py-1.5 text-[11px] font-semibold text-[#65746d]"><UserRound size={13} />{animal.sex === 'F' ? 'Fêmea' : 'Macho'}</span></div><div className="mt-4 space-y-3 border-t border-[#e8efea] pt-4"><SideDetail icon={CalendarHeart} label="Nascimento" value={animal.birth_date ? new Date(animal.birth_date + 'T12:00:00').toLocaleDateString('pt-BR') : '—'} /><SideDetail icon={CalendarHeart} label="Idade" value={animal.birth_date ? age(animal.birth_date) : '—'} /><SideDetail icon={PawPrint} label="Mãe" value={animal.mother?.name ?? animal.mother?.tag ?? animal.mother_name ?? 'Sem nome'} /><SideDetail icon={UserRound} label="Pai / Sêmen" value={animal.father_tag ?? '—'} /></div></div>
        </section>

        <div className="min-w-0 space-y-4">
          <nav aria-label="Seções do animal" className={`grid grid-cols-2 gap-2 rounded-3xl border border-[#e4ece7] bg-white p-2 shadow-[0_8px_22px_rgba(22,61,38,.04)] ${tabs.length === 4 ? 'sm:grid-cols-4' : 'sm:grid-cols-3'}`}>
            {tabs.map(t => <button key={t.key} type="button" aria-pressed={tab === t.key} onClick={() => selectTab(t.key)} className={`flex min-h-11 items-center justify-center gap-1.5 rounded-2xl px-2 py-3 text-xs font-semibold transition-colors sm:gap-2 sm:px-3 sm:text-sm ${tab === t.key ? 'bg-[#e8f8ed] text-[#185d3b]' : 'text-[#526158] hover:bg-[#f4f8f5]'}`}>{t.icon}{t.label}</button>)}
          </nav>
          {tab === 'vacinas' && <section className="min-h-[480px] rounded-3xl border border-[#e4ece7] bg-white p-6 shadow-[0_10px_28px_rgba(22,61,38,.045)]"><div className="flex items-start justify-between gap-4"><div><h2 className="text-2xl font-bold text-[#182b20]">Vacinação</h2><p className="mt-1 text-sm text-[#7c8e83]">Registre e acompanhe todas as vacinas de {animal.name ?? 'seu animal'}.</p></div><Link to={`/vacinas/nova?animal=${animal.id}`} className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-800"><Syringe size={16} />Registrar</Link></div>{vaccinations.length === 0 ? <div className="flex min-h-[345px] flex-col items-center justify-center text-center"><span className="flex h-28 w-28 items-center justify-center rounded-full bg-[#eaf8ef] text-[#56aa7a]"><Syringe size={52} /></span><h3 className="mt-6 text-xl font-bold text-[#1d3024]">Nenhuma vacina registrada</h3><p className="mt-2 max-w-md text-sm leading-5 text-[#7d8e84]">Mantenha o histórico de vacinação sempre atualizado para garantir a saúde e o bem-estar de {animal.name ?? 'seu animal'}.</p><Link to={`/vacinas/nova?animal=${animal.id}`} className="mt-6 inline-flex items-center gap-2 rounded-xl bg-brand-700 px-6 py-3 text-sm font-semibold text-white hover:bg-brand-800"><CirclePlus size={18} />Registrar vacina</Link></div> : <div className="mt-7 divide-y divide-[#edf2ee]"><div className="grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-4 border-b border-[#dce7df] pb-3 text-xs font-bold uppercase tracking-[0.12em] text-[#61736a]"><span>Vacina</span><span>Data</span><span>Ações</span></div>{vaccinations.map(v => <div key={v.id} className="grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-4 py-3 text-sm"><span className="min-w-0 font-semibold text-[#2d4135]">{v.vaccine_name}</span><span className="tabular-nums text-[#718078]">{new Date(v.date + 'T12:00:00').toLocaleDateString('pt-BR')}</span><span className="flex items-center gap-1"><Link to={`/vacinas/${v.id}/editar`} className="flex h-9 w-9 items-center justify-center rounded-lg text-brand-800 transition-colors hover:bg-brand-50" aria-label={`Editar vacina ${v.vaccine_name}`}><Pencil size={16} /></Link><button onClick={() => void handleVaccinationDelete(v)} className="flex h-9 w-9 items-center justify-center rounded-lg text-red-600 transition-colors hover:bg-red-50" aria-label={`Excluir vacina ${v.vaccine_name}`}><Trash2 size={16} /></button></span></div>)}</div>}</section>}
          {tab === 'reproducao' && <ManagementCard icon={CalendarHeart} title="Reprodução" subtitle="Acompanhe gestações e previsões de parto." emptyTitle="Nenhuma gestação registrada" emptyText="Registre a cobertura ou inseminação para acompanhar a previsão de parto." actionTo={`/reproducao/nova?animal=${animal.id}`} actionLabel="Registrar gestação" records={pregnancies.length}>{pregnancies.map(pregnancy => <div key={pregnancy.id} className="flex items-center justify-between gap-4 border-b border-[#edf2ee] py-4 text-sm last:border-0"><div><p className="font-semibold text-[#2d4135]">{pregnancy.status === 'pregnant' ? 'Gestação em acompanhamento' : pregnancy.status === 'gave_birth' ? 'Parto registrado' : 'Gestação não confirmada'}</p><p className="mt-1 text-xs text-[#718078]">Início: {new Date(pregnancy.breeding_date + 'T12:00:00').toLocaleDateString('pt-BR')}</p></div><div className="shrink-0 text-right"><p className="text-xs font-semibold uppercase tracking-[0.1em] text-[#718078]">Previsão</p><p className="mt-1 tabular-nums font-semibold text-brand-800">{new Date(pregnancy.expected_birth_date + 'T12:00:00').toLocaleDateString('pt-BR')}</p></div></div>)}</ManagementCard>}
          {tab === 'genealogia' && <AnimalGenealogy key={animal.id} animal={animal} />}
          {tab === 'eventos' && <ManagementCard icon={ListChecks} title="Histórico" subtitle="Vacinas, reprodução e manejos em ordem de data." emptyTitle="Nenhum registro no histórico" emptyText="Os registros de vacinação, reprodução e manejo aparecerão aqui." actionTo={`/eventos/novo?animal=${animal.id}`} actionLabel="Registrar manejo" records={historyEntries.length}>{historyEntries.map(entry => <div key={entry.id} className="flex flex-wrap items-start justify-between gap-2 border-b border-[#edf2ee] py-3 text-sm last:border-0"><div><p className="font-semibold text-[#2d4135]">{entry.title}</p><p className="mt-0.5 text-xs text-[#526158]">{entry.category}</p></div><time dateTime={entry.date} className="shrink-0 tabular-nums text-[#526158]">{new Date(entry.date + 'T12:00:00').toLocaleDateString('pt-BR')}</time></div>)}</ManagementCard>}
        </div>
      </div>

      {/* Profile and vaccination */}
      <div className="hidden grid items-stretch gap-5 xl:grid-cols-[minmax(0,1.55fr)_minmax(320px,.75fr)]">
      <section className="overflow-hidden rounded-3xl border border-[#e4ece7] bg-white shadow-[0_10px_28px_rgba(22,61,38,.055)]">
        <div className="grid gap-6 p-4 lg:grid-cols-[minmax(330px,.86fr)_minmax(0,1.65fr)] lg:p-5">
          <div className="relative aspect-[4/3] min-h-0 overflow-hidden rounded-2xl bg-brand-50"><img src={animal.image_url ?? (animal.sex === 'F' ? '/images/cattle-cow-nelore.png' : '/images/cattle-bull-white.png')} alt={animal.name ?? 'Animal'} className="h-full w-full object-cover" /><span className="absolute bottom-4 right-4 flex h-10 w-10 items-center justify-center rounded-full bg-[#173f2a]/85 text-white"><PawPrint size={18} /></span></div>
          <div className="flex min-w-0 flex-col justify-center lg:px-1 lg:py-3">
            <div className="flex flex-wrap gap-3 border-b border-[#e8efea] pb-4"><span className="inline-flex items-center gap-2 rounded-xl bg-[#e7f7ec] px-5 py-2.5 text-sm font-semibold text-[#225d3e]"><PawPrint size={18} />{animal.sex === 'F' ? 'Matriz' : 'Reprodutor'}</span><span className="inline-flex items-center gap-2 rounded-xl bg-[#f0f3f8] px-5 py-2.5 text-sm font-semibold text-[#34445c]"><Tag size={17} />{animal.breed ?? 'Sem raça'}</span><span className={`inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold ${animal.sex === 'F' ? 'bg-[#f9eafe] text-[#7b218d]' : 'bg-[#eaf3ff] text-[#2861a1]'}`}><PawPrint size={17} />{animal.sex === 'F' ? 'Fêmea' : 'Macho'}</span></div>
            <div className="mt-5 grid grid-cols-2 sm:grid-cols-4"><Detail label="Sexo" value={animal.sex === 'F' ? 'Fêmea' : 'Macho'} /><Detail label="Raça" value={animal.breed ?? '—'} /><Detail label="Brinco / Código" value={animal.tag ?? '—'} /><Detail label="Situação" value={STATUS_LABEL[animal.status]} status /><Detail label="Nascimento" value={animal.birth_date ? new Date(animal.birth_date + 'T12:00:00').toLocaleDateString('pt-BR') : '—'} /><Detail label="Idade" value={animal.birth_date ? age(animal.birth_date) : '—'} /><Detail label="Mãe" value={animal.mother?.name ?? animal.mother?.tag ?? animal.mother_name ?? 'Sem nome'} /><Detail label="Pai / Sêmen" value={animal.father_tag ?? '—'} /></div>
          </div>
        </div>
        {animal.notes && <p className="border-t border-[#e8efea] px-5 py-3 text-sm text-[#61736a]"><strong className="mr-2 text-[#334a3c]">Observações:</strong>{animal.notes}</p>}
      </section>

      <ManagementCard icon={Syringe} title="Vacinação" subtitle="Registre e acompanhe todas as vacinas do animal." emptyTitle="Nenhuma vacina registrada" emptyText="Mantenha o histórico de vacinação sempre atualizado para garantir a saúde do animal." actionTo={`/vacinas/nova?animal=${animal.id}`} actionLabel="Registrar vacina" records={vaccinations.length}>{vaccinations.slice(0, 3).map(v => <div key={v.id} className="flex items-center justify-between border-b border-[#edf2ee] py-3 text-sm last:border-0"><span className="font-semibold text-[#2d4135]">{v.vaccine_name}</span><span className="text-xs text-[#718078]">{new Date(v.date + 'T12:00:00').toLocaleDateString('pt-BR')}</span></div>)}</ManagementCard>
      </div>

      {animal && <div className="hidden">
      {/* Legacy tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="flex border-b border-gray-100">
          {tabs.map(t => (
            <button
              key={t.key}
              onClick={() => selectTab(t.key)}
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
      </div>}

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
