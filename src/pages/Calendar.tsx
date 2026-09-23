import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { CalendarDays, CalendarHeart, ChevronLeft, ChevronRight, ClipboardList, Syringe } from 'lucide-react'
import { PageHeader } from '../components/PageHeader'
import { useAuth } from '../contexts/AuthContext'
import { toLocalISO } from '../lib/date'
import { supabase } from '../lib/supabase'
import type { AnimalEvent } from '../types'

type EventKind = 'vacina' | 'parto' | 'manejo'
type AnimalRef = { id: string; tag: string | null; name: string | null } | null
type CalendarEntry = { id: string; date: string; title: string; animal: string; kind: EventKind; to: string | null; preview?: boolean }
type VaccinationRow = { id: string; vaccine_name: string; date: string; next_due_date: string | null; animal: AnimalRef }
type PregnancyRow = { id: string; expected_birth_date: string; mother: AnimalRef }
type BirthRow = { id: string; birth_date: string; mother: AnimalRef }
type ManagementRow = Pick<AnimalEvent, 'id' | 'date' | 'event_type'> & { animal: AnimalRef }

const weekdays = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom']
const kindStyle: Record<EventKind, { dot: string; badge: string; icon: typeof Syringe; label: string }> = {
  vacina: { dot: 'bg-[#2b9b69]', badge: 'bg-brand-50 text-brand-800', icon: Syringe, label: 'Vacina' },
  parto: { dot: 'bg-[#d99430]', badge: 'bg-[#fff3df] text-[#985f14]', icon: CalendarHeart, label: 'Parto' },
  manejo: { dot: 'bg-[#6889aa]', badge: 'bg-[#edf3f9] text-[#375a78]', icon: ClipboardList, label: 'Manejo' },
}
const managementLabel: Record<AnimalEvent['event_type'], string> = {
  weight: 'Pesagem', treatment: 'Tratamento', sale: 'Venda', purchase: 'Compra', other: 'Evento de manejo',
}

function animalName(animal: AnimalRef) {
  return animal?.name || animal?.tag || 'Animal cadastrado'
}

function parseDate(date: string) {
  return new Date(`${date}T12:00:00`)
}

function previewEntriesForMonth(monthKey: string, emptyMonth: boolean, pregnancyUnavailable: boolean): CalendarEntry[] {
  if (!emptyMonth && !pregnancyUnavailable) return []
  const birth: CalendarEntry = { id: 'preview-birth', date: `${monthKey}-17`, title: 'Nascimento previsto', animal: '', kind: 'parto', to: null, preview: true }
  if (!emptyMonth) return [birth]
  return [
    { id: 'preview-vaccine', date: `${monthKey}-08`, title: 'Reforço de vacinação', animal: '', kind: 'vacina', to: null, preview: true },
    birth,
    { id: 'preview-management', date: `${monthKey}-26`, title: 'Pesagem do rebanho', animal: '', kind: 'manejo', to: null, preview: true },
  ]
}

export function Calendar() {
  const { farm } = useAuth()
  const [month, setMonth] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1))
  const [selectedDay, setSelectedDay] = useState<string | null>(null)
  const [entries, setEntries] = useState<CalendarEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [pregnancyUnavailable, setPregnancyUnavailable] = useState(false)
  const [retry, setRetry] = useState(0)
  const year = month.getFullYear()
  const monthIndex = month.getMonth()
  const monthKey = `${year}-${String(monthIndex + 1).padStart(2, '0')}`
  const monthLabel = month.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })

  useEffect(() => {
    if (!farm?.id) return
    let cancelled = false
    const start = toLocalISO(new Date(year, monthIndex, 1))
    const end = toLocalISO(new Date(year, monthIndex + 1, 1))
    setLoading(true)
    setError('')
    setPregnancyUnavailable(false)

    async function loadMonth() {
      const results = await Promise.allSettled([
        supabase.from('vaccinations').select('id, vaccine_name, date, next_due_date, animal:animals(id, tag, name)').eq('farm_id', farm!.id).gte('date', start).lt('date', end),
        supabase.from('vaccinations').select('id, vaccine_name, date, next_due_date, animal:animals(id, tag, name)').eq('farm_id', farm!.id).gte('next_due_date', start).lt('next_due_date', end),
        supabase.from('pregnancies').select('id, expected_birth_date, mother:animals(id, tag, name)').eq('farm_id', farm!.id).eq('status', 'pregnant').gte('expected_birth_date', start).lt('expected_birth_date', end),
        supabase.from('births').select('id, birth_date, mother:animals!mother_id(id, tag, name)').eq('farm_id', farm!.id).gte('birth_date', start).lt('birth_date', end),
        supabase.from('events').select('id, date, event_type, animal:animals(id, tag, name)').eq('farm_id', farm!.id).gte('date', start).lt('date', end),
      ])
      if (cancelled) return
      const sources = ['vacinas aplicadas', 'próximas doses', 'gestações', 'partos', 'manejos']
      const failedSources = results.flatMap((result, index) => {
        const failure = result.status === 'rejected' ? result.reason : result.value.error
        if (!failure) return []
        console.error(`Calendário: falha ao carregar ${sources[index]}`, failure)
        return [sources[index]]
      })
      if (failedSources.length === results.length) {
        setError('Não foi possível carregar o calendário. Tente novamente.')
        setLoading(false)
        return
      }
      setPregnancyUnavailable(failedSources.includes('gestações'))

      const dataAt = (index: number): unknown[] => {
        const result = results[index]
        return result.status === 'fulfilled' && !result.value.error ? (result.value.data ?? []) : []
      }

      const appliedRows = dataAt(0) as VaccinationRow[]
      const dueRows = dataAt(1) as VaccinationRow[]
      const pregnancyRows = dataAt(2) as PregnancyRow[]
      const birthRows = dataAt(3) as BirthRow[]
      const managementRows = dataAt(4) as ManagementRow[]
      const nextEntries: CalendarEntry[] = [
        ...appliedRows.map(row => ({ id: `v-applied-${row.id}`, date: row.date, title: `${row.vaccine_name} aplicada`, animal: animalName(row.animal), kind: 'vacina' as const, to: '/vacinas' })),
        ...dueRows.filter(row => row.next_due_date && row.next_due_date !== row.date).map(row => ({ id: `v-due-${row.id}`, date: row.next_due_date!, title: `${row.vaccine_name} — próxima dose`, animal: animalName(row.animal), kind: 'vacina' as const, to: '/vacinas' })),
        ...pregnancyRows.map(row => ({ id: `p-${row.id}`, date: row.expected_birth_date, title: 'Nascimento previsto', animal: animalName(row.mother), kind: 'parto' as const, to: row.mother?.id ? `/animais/${row.mother.id}` : '/partos' })),
        ...birthRows.map(row => ({ id: `b-${row.id}`, date: row.birth_date, title: 'Parto registrado', animal: animalName(row.mother), kind: 'parto' as const, to: '/partos' })),
        ...managementRows.map(row => ({ id: `e-${row.id}`, date: row.date, title: managementLabel[row.event_type], animal: animalName(row.animal), kind: 'manejo' as const, to: row.animal?.id ? `/animais/${row.animal.id}` : '/animais' })),
      ].sort((a, b) => a.date.localeCompare(b.date) || a.title.localeCompare(b.title, 'pt-BR'))
      setEntries(nextEntries)
      setLoading(false)
    }

    void loadMonth()
    return () => { cancelled = true }
  }, [farm?.id, year, monthIndex, retry])

  const previews = !loading && !error ? previewEntriesForMonth(monthKey, entries.length === 0, pregnancyUnavailable) : []
  const visibleEntries = [...entries, ...previews].sort((a, b) => a.date.localeCompare(b.date) || a.title.localeCompare(b.title, 'pt-BR'))
  const agendaEntries = selectedDay ? visibleEntries.filter(entry => entry.date === selectedDay) : visibleEntries
  const firstWeekday = (new Date(year, monthIndex, 1).getDay() + 6) % 7
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate()
  const cellCount = Math.ceil((firstWeekday + daysInMonth) / 7) * 7
  const cells = Array.from({ length: cellCount }, (_, index) => {
    const day = index - firstWeekday + 1
    return day >= 1 && day <= daysInMonth ? day : null
  })

  function changeMonth(offset: number) {
    setMonth(new Date(year, monthIndex + offset, 1))
    setSelectedDay(null)
  }

  function goToToday() {
    const now = new Date()
    setMonth(new Date(now.getFullYear(), now.getMonth(), 1))
    setSelectedDay(toLocalISO(now))
  }

  return <div className="space-y-5">
    <PageHeader backTo="/" kicker="Planejamento" title="Calendário" description="Vacinas, partos e manejos importantes em um só lugar." actions={<><Link to="/vacinas/nova" className="inline-flex min-h-11 items-center rounded-xl border border-brand-200 bg-white px-4 text-sm font-semibold text-brand-800 hover:bg-brand-50">Registrar vacina</Link><Link to="/partos/novo" className="inline-flex min-h-11 items-center rounded-xl border border-brand-200 bg-white px-4 text-sm font-semibold text-brand-800 hover:bg-brand-50">Registrar parto</Link></>} />

    {error ? <div role="alert" className="app-surface p-8 text-center"><p className="text-sm text-red-700">{error}</p><button type="button" onClick={() => setRetry(value => value + 1)} className="mt-3 min-h-11 rounded-xl px-4 text-sm font-semibold text-brand-800 hover:bg-brand-50">Tentar novamente</button></div> : loading ? <div role="status" className="app-surface flex min-h-64 items-center justify-center p-8 text-sm text-[#526158]">Carregando calendário...</div> : <>
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.55fr)_minmax(280px,.85fr)]">
        <section className="app-surface min-w-0 p-3 sm:p-5" aria-label={`Calendário de ${monthLabel}`}>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3 px-1">
            <h2 className="text-xl font-bold capitalize text-brand-900">{monthLabel}</h2>
            <div className="flex items-center gap-1"><button type="button" onClick={() => changeMonth(-1)} aria-label="Mês anterior" className="flex h-11 w-11 items-center justify-center rounded-xl text-brand-800 hover:bg-brand-50"><ChevronLeft size={20} aria-hidden="true" /></button><button type="button" onClick={goToToday} className="min-h-11 rounded-xl px-3 text-sm font-semibold text-brand-800 hover:bg-brand-50">Hoje</button><button type="button" onClick={() => changeMonth(1)} aria-label="Próximo mês" className="flex h-11 w-11 items-center justify-center rounded-xl text-brand-800 hover:bg-brand-50"><ChevronRight size={20} aria-hidden="true" /></button></div>
          </div>
          <div className="overflow-x-auto pb-1">
            <div className="min-w-[350px]">
              <div className="grid grid-cols-7 gap-1 text-center">{weekdays.map(day => <span key={day} className="py-2 text-xs font-bold uppercase tracking-wide text-[#65766a]">{day}</span>)}</div>
              <div className="grid grid-cols-7 gap-1">{cells.map((day, index) => {
                if (!day) return <span key={`empty-${index}`} aria-hidden="true" className="min-h-[72px]" />
                const iso = toLocalISO(new Date(year, monthIndex, day))
                const dayEntries = visibleEntries.filter(entry => entry.date === iso)
                const selected = selectedDay === iso
                const today = iso === toLocalISO(new Date())
                const fullDate = parseDate(iso).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })
                return <button key={iso} type="button" onClick={() => setSelectedDay(current => current === iso ? null : iso)} aria-pressed={selected} aria-label={`${fullDate}. ${dayEntries.length ? `${dayEntries.length} evento(s): ${dayEntries.map(entry => entry.title).join(', ')}` : 'Nenhum evento'}`} className={`flex min-h-[72px] flex-col items-start rounded-xl border p-2 text-left transition-colors sm:min-h-[88px] ${selected ? 'border-brand-700 bg-brand-700 text-white' : `border-transparent bg-[#f8fbf9] text-[#203529] hover:border-brand-200 hover:bg-brand-50 ${today ? 'ring-2 ring-brand-300' : ''}`}`}>
                  <span className="text-sm font-bold tabular-nums">{day}</span>
                  {dayEntries.length > 0 && <span className="mt-auto flex flex-wrap items-center gap-1" aria-hidden="true">{dayEntries.slice(0, 3).map(entry => <span key={entry.id} className={`h-2 w-2 rounded-full ${kindStyle[entry.kind].dot} ${selected ? 'ring-1 ring-white' : ''}`} />)}{dayEntries.length > 3 && <span className={`text-[10px] font-semibold ${selected ? 'text-white' : 'text-[#526158]'}`}>+{dayEntries.length - 3}</span>}</span>}
                </button>
              })}</div>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-4 border-t border-[#e8efea] pt-4">{(Object.keys(kindStyle) as EventKind[]).map(kind => <span key={kind} className="inline-flex items-center gap-2 text-xs font-medium text-[#526158]"><span className={`h-2.5 w-2.5 rounded-full ${kindStyle[kind].dot}`} aria-hidden="true" />{kindStyle[kind].label}</span>)}</div>
        </section>

        <section className="app-surface min-w-0 p-4 sm:p-5" aria-live="polite">
          <div className="mb-4 flex flex-wrap items-start justify-between gap-2"><div><p className="page-kicker">Agenda</p><h2 className="mt-1 text-lg font-bold text-brand-900">{selectedDay ? parseDate(selectedDay).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' }) : `Eventos de ${monthLabel}`}</h2><p className="mt-1 text-sm text-[#526158]">{agendaEntries.length} {agendaEntries.length === 1 ? 'marcação' : 'marcações'}</p></div>{selectedDay && <button type="button" onClick={() => setSelectedDay(null)} className="min-h-11 rounded-xl px-3 text-xs font-semibold text-brand-800 hover:bg-brand-50">Ver mês inteiro</button>}</div>
          {agendaEntries.length ? <div className="space-y-3">{agendaEntries.map(entry => {
            const style = kindStyle[entry.kind]
            const Icon = style.icon
            return <article key={entry.id} className="rounded-2xl border border-[#e5eee7] bg-[#fbfdfb] p-4"><div className="flex items-start gap-3"><span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${style.badge}`}><Icon size={19} aria-hidden="true" /></span><div className="min-w-0 flex-1"><span className="block text-sm font-bold text-[#203529]">{entry.title}</span><span className="mt-1 block text-xs text-[#526158]">{parseDate(entry.date).toLocaleDateString('pt-BR')}{entry.animal ? ` · ${entry.animal}` : ''}</span></div></div><div className="mt-3 flex items-center justify-between gap-2"><span className="flex items-center gap-2"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${style.badge}`}>{style.label}</span>{entry.preview && <span className="text-xs font-medium text-[#65766a]">Ilustrativo</span>}</span>{entry.to && <Link to={entry.to} className="inline-flex min-h-9 items-center text-xs font-semibold text-brand-800 hover:underline">Ver registro <ChevronRight size={15} aria-hidden="true" /></Link>}</div></article>
          })}</div> : <div className="rounded-2xl bg-[#f8fbf9] px-5 py-9 text-center"><CalendarDays size={26} className="mx-auto text-brand-300" aria-hidden="true" /><p className="mt-3 text-sm font-semibold text-[#33483b]">Nenhuma data {selectedDay ? 'neste dia' : 'neste mês'}</p><p className="mt-1 text-xs leading-5 text-[#65766a]">Novas vacinas, partos e manejos aparecerão aqui.</p></div>}
        </section>
      </div>
    </>}
  </div>
}
