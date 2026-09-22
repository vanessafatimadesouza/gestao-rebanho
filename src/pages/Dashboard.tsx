import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { AlertCircle, ArrowRight, Baby, Beef, CalendarDays, Check, ChevronRight, HeartPulse, Leaf, ListChecks, PawPrint, Search, ShieldCheck, Sprout, Syringe, Tag, UsersRound } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { Vaccination } from '../types'

interface Stats { totalAnimals: number; activeAnimals: number; females: number; males: number; recentBirths: number }
interface UpcomingPregnancy { id: string; expected_birth_date: string; mother: { id: string; tag: string | null; name: string | null } | null }
interface TimelineEntry { id: string; date: string; title: string; animal: string; category: 'Sanidade' | 'Parto'; to: string; icon: typeof Syringe }

const initialHerd = [
  { tag: 'VACA-001', name: 'Aurora', sex: 'F' as const, breed: 'Nelore', birth_date: '2019-03-14', notes: 'Matriz do rebanho inicial.' },
  { tag: 'BOI-001', name: 'Trovão', sex: 'M' as const, breed: 'Nelore', birth_date: '2018-08-22', notes: 'Reprodutor do rebanho inicial.' },
  { tag: 'VACA-002', name: 'Brisa', sex: 'F' as const, breed: 'Nelore', birth_date: '2020-01-18', notes: null },
  { tag: 'VACA-003', name: 'Canela', sex: 'F' as const, breed: 'Nelore', birth_date: '2019-11-05', notes: null },
  { tag: 'VACA-004', name: 'Dourada', sex: 'F' as const, breed: 'Nelore', birth_date: '2021-02-10', notes: null },
  { tag: 'VACA-005', name: 'Estrela', sex: 'F' as const, breed: 'Nelore', birth_date: '2020-07-29', notes: null },
  { tag: 'VACA-006', name: 'Flora', sex: 'F' as const, breed: 'Nelore', birth_date: '2021-06-16', notes: null },
  { tag: 'BOI-002', name: 'Guerreiro', sex: 'M' as const, breed: 'Nelore', birth_date: '2019-09-03', notes: null },
  { tag: 'BEZERRA-001', name: 'Jade', sex: 'F' as const, breed: 'Nelore', birth_date: '2025-02-11', notes: 'Bezerra do rebanho inicial.' },
  { tag: 'BEZERRO-001', name: 'Luar', sex: 'M' as const, breed: 'Nelore', birth_date: '2025-04-20', notes: 'Bezerro do rebanho inicial.' },
]

function StatCard({ label, value, detail, icon: Icon }: { label: string; value: number | string; detail: string; icon: typeof PawPrint }) {
  return <div className="dashboard-summary-stat">
    <span className="dashboard-summary-icon"><Icon size={24} strokeWidth={2.35} /></span>
    <span className="min-w-0">
      <span className="dashboard-summary-label">{label}</span>
      <strong className="dashboard-summary-value">{value}</strong>
      <span className="dashboard-summary-detail">{detail}</span>
    </span>
  </div>
}

function DateCard({ today }: { today: string }) {
  return <div className="dashboard-summary-date text-white">
    <svg className="dashboard-date-shape" aria-hidden="true" viewBox="0 0 430 98" preserveAspectRatio="none">
      <defs>
        <linearGradient id="dashboard-date-gradient" x1="0" y1="0" x2="1" y2=".75">
          <stop offset="0%" stopColor="#155332" />
          <stop offset="56%" stopColor="#0f6037" />
          <stop offset="100%" stopColor="#176a40" />
        </linearGradient>
      </defs>
      <path d="M30 0H329C354 0 364 12 375 35C391 68 399 91 430 98H30C13.4 98 0 84.6 0 68V30C0 13.4 13.4 0 30 0Z" fill="url(#dashboard-date-gradient)" />
    </svg>
    <span className="dashboard-date-icon"><CalendarDays size={22} strokeWidth={2.2} /></span>
    <span className="min-w-0 flex-1"><span className="block truncate text-sm font-bold">Hoje é {today}</span><span className="mt-1 block truncate text-xs text-[#c8ddce]">Informação certa para decisões melhores.</span></span>
    <ChevronRight className="dashboard-date-chevron" size={22} />
  </div>
}

function HerdChart({ total, femalePercent, malePercent }: { total: number; femalePercent: number; malePercent: number }) {
  const radius = 76
  const circumference = 2 * Math.PI * radius
  const gap = 34
  const available = circumference - gap * 2
  const combined = femalePercent + malePercent
  const femaleLength = combined ? available * (femalePercent / combined) : 0
  const maleLength = combined ? available - femaleLength : 0

  return <div style={{ position: 'relative', width: 176, height: 176, flexShrink: 0 }}>
    <svg viewBox="0 0 200 200" width="176" height="176" aria-label={`${total} animais no rebanho`}>
      <defs>
        <linearGradient id="herd-dark-gradient" gradientUnits="userSpaceOnUse" x1="100" y1="15" x2="100" y2="185">
          <stop offset="0%" stopColor="#086843" />
          <stop offset="52%" stopColor="#10875a" />
          <stop offset="100%" stopColor="#27b77b" />
        </linearGradient>
        <linearGradient id="herd-light-gradient" gradientUnits="userSpaceOnUse" x1="100" y1="15" x2="100" y2="185">
          <stop offset="0%" stopColor="#b0efc5" />
          <stop offset="50%" stopColor="#7ee1a8" />
          <stop offset="100%" stopColor="#43ca8d" />
        </linearGradient>
      </defs>
      {femaleLength > 0 && <circle cx="100" cy="100" r={radius} fill="none" stroke="url(#herd-dark-gradient)" strokeWidth="23" strokeLinecap="round" strokeDasharray={`${femaleLength} ${circumference - femaleLength}`} transform="rotate(-90 100 100)" />}
      {maleLength > 0 && <circle cx="100" cy="100" r={radius} fill="none" stroke="url(#herd-light-gradient)" strokeWidth="23" strokeLinecap="round" strokeDasharray={`${maleLength} ${circumference - maleLength}`} strokeDashoffset={-(femaleLength + gap)} transform="rotate(-90 100 100)" />}
    </svg>
    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
      <span className="text-3xl font-bold text-brand-900">{total}</span>
      <span className="text-sm text-[#66758d]">animais</span>
    </div>
  </div>
}

function QuickAction({ to, label, detail, icon: Icon }: { to: string; label: string; detail: string; icon: typeof PawPrint }) {
  return <Link to={to} className="group flex items-center gap-4 rounded-2xl border border-[#e5eee7] bg-white/80 p-4 transition-all hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-[0_10px_24px_rgba(22,60,40,.08)]">
    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700"><Icon size={22} /></span>
    <span className="min-w-0 flex-1"><span className="block text-sm font-bold text-[#1c2d24]">{label}</span><span className="mt-1 block text-xs leading-4 text-[#7a887f]">{detail}</span></span>
    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-800 transition-transform group-hover:translate-x-0.5"><ChevronRight size={17} /></span>
  </Link>
}

function SectionTitle({ children, to, label = 'Ver todos' }: { children: React.ReactNode; to?: string; label?: string }) {
  return <div className="mb-4 flex items-center justify-between gap-3"><h2 className="text-lg font-bold tracking-tight text-[#16271e]">{children}</h2>{to && <Link to={to} className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-3 py-1.5 text-xs font-bold text-brand-800 transition-colors hover:bg-brand-100">{label}<ArrowRight size={13} /></Link>}</div>
}

export function Dashboard() {
  const { farm } = useAuth()
  const [stats, setStats] = useState<Stats | null>(null)
  const [upcoming, setUpcoming] = useState<Vaccination[]>([])
  const [upcomingPregnancies, setUpcomingPregnancies] = useState<UpcomingPregnancy[]>([])
  const today = new Date().toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })

  useEffect(() => { if (farm) { loadStats(); loadUpcomingVaccinations(); loadUpcomingPregnancies() } }, [farm])

  useEffect(() => {
    if (!farm || !stats || stats.totalAnimals > 2) return

    const seedKey = `manejo-initial-herd-${farm.id}`
    if (sessionStorage.getItem(seedKey)) return
    sessionStorage.setItem(seedKey, 'done')
    populateInitialHerd()
  }, [farm, stats?.totalAnimals])

  async function loadStats() {
    const { data: animals } = await supabase.from('animals').select('sex, status').eq('farm_id', farm!.id)
    const { count: recentBirths } = await supabase.from('births').select('*', { count: 'exact', head: true }).eq('farm_id', farm!.id).gte('birth_date', new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0])
    if (animals) setStats({ totalAnimals: animals.length, activeAnimals: animals.filter(animal => animal.status === 'active').length, females: animals.filter(animal => animal.sex === 'F' && animal.status === 'active').length, males: animals.filter(animal => animal.sex === 'M' && animal.status === 'active').length, recentBirths: recentBirths ?? 0 })
  }

  async function loadUpcomingVaccinations() {
    const todayDate = new Date().toISOString().split('T')[0]
    const in30 = new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]
    const { data } = await supabase.from('vaccinations').select('*, animal:animals(id, tag, name)').eq('farm_id', farm!.id).gte('next_due_date', todayDate).lte('next_due_date', in30).order('next_due_date').limit(5)
    if (data) setUpcoming(data as Vaccination[])
  }

  async function loadUpcomingPregnancies() {
    const todayDate = new Date().toISOString().split('T')[0]
    const in120 = new Date(Date.now() + 120 * 86400000).toISOString().split('T')[0]
    const { data } = await supabase.from('pregnancies').select('id, expected_birth_date, mother:animals(id, tag, name)').eq('farm_id', farm!.id).eq('status', 'pregnant').gte('expected_birth_date', todayDate).lte('expected_birth_date', in120).order('expected_birth_date').limit(5)
    if (data) setUpcomingPregnancies(data as unknown as UpcomingPregnancy[])
  }

  async function populateInitialHerd() {
    if (!farm) return

    const { data: existingAnimals } = await supabase.from('animals').select('id').eq('farm_id', farm.id)
    const existingCount = existingAnimals?.length ?? 0
    const animalsToInsert = initialHerd.slice(Math.min(existingCount, 2)).map(animal => ({ ...animal, farm_id: farm.id, status: 'active' as const }))

    if (animalsToInsert.length === 0) return
    const { error } = await supabase.from('animals').insert(animalsToInsert)
    if (!error) await loadStats()
  }

  const femalePercent = stats?.activeAnimals ? Math.round(((stats.females ?? 0) / stats.activeAnimals) * 100) : 0
  const malePercent = stats?.activeAnimals ? Math.round(((stats.males ?? 0) / stats.activeAnimals) * 100) : 0
  const timelineItems: TimelineEntry[] = [
    ...upcoming.filter(item => item.next_due_date).map(item => ({ id: `v-${item.id}`, date: item.next_due_date!, title: item.vaccine_name, animal: item.animal?.name || item.animal?.tag || 'Animal cadastrado', category: 'Sanidade' as const, to: '/vacinas', icon: Syringe })),
    ...upcomingPregnancies.map(item => ({ id: `p-${item.id}`, date: item.expected_birth_date, title: 'Nascimento previsto', animal: item.mother?.name || item.mother?.tag || 'Matriz cadastrada', category: 'Parto' as const, to: item.mother?.id ? `/animais/${item.mother.id}` : '/partos', icon: Baby })),
  ].sort((a, b) => a.date.localeCompare(b.date)).slice(0, 4)

  return <div className="space-y-6">
    <section className="dashboard-hero relative min-h-[330px] overflow-hidden rounded-[28px] bg-[#f7fbf8] shadow-[0_16px_35px_rgba(25,66,42,.08)] lg:min-h-[350px]">
      <div className="absolute inset-0 overflow-hidden rounded-[28px]">
        <div className="absolute inset-y-0 right-0 w-[72%] bg-cover" style={{ backgroundImage: "url('/images/dashboard-herd-hero.png')", backgroundPosition: 'center 30%' }} />
        <div className="absolute inset-y-0 left-0 w-[78%]" style={{ background: 'linear-gradient(90deg, #f7fbf8 0%, #f7fbf8 46%, rgba(247,251,248,.86) 62%, rgba(247,251,248,0) 100%)' }} />
      </div>
      <div className="relative p-6 sm:p-8 lg:p-9">
        <div style={{ position: 'relative', maxWidth: 576, paddingLeft: 28 }}>
          <span
            aria-hidden="true"
            style={{
              position: 'absolute',
              left: 0,
              top: 4,
              zIndex: 10,
              display: 'block',
              width: 8,
              height: 46,
              borderRadius: 999,
              background: 'linear-gradient(180deg, #d8ed84 0%, #70b875 46%, #27734f 100%)',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,.85), 0 2px 8px rgba(30,105,65,.28)',
            }}
          />
          <p className="text-[10px] font-bold uppercase tracking-[0.26em] text-brand-700">Bem-vindo ao Manejo</p>
          <h1 className="mt-2 text-4xl font-bold leading-none tracking-[-0.035em] text-[#102117] sm:text-[46px]">Panorama do manejo</h1>
          <p className="mt-2 max-w-md text-[15px] leading-5 text-[#315540]">Tudo sob controle para uma pecuária mais produtiva,<br className="hidden sm:block" /> saudável e eficiente.</p>
        </div>
      </div>
      <div className="dashboard-hero-cards">
        <DateCard today={today} />
        <div className="dashboard-summary-metrics">
          <StatCard icon={Beef} label="Plantel ativo" value={stats?.activeAnimals ?? '—'} detail={`${stats?.females ?? 0} fêmeas · ${stats?.males ?? 0} machos`} />
          <StatCard icon={Syringe} label="Vacinas próximas" value={upcoming.length} detail="Vencimentos em 30 dias" />
          <StatCard icon={HeartPulse} label="Partos recentes" value={stats?.recentBirths ?? '—'} detail="Registros nos últimos 30 dias" />
          <StatCard icon={UsersRound} label="Total cadastrado" value={stats?.totalAnimals ?? '—'} detail="Inclui animais baixados" />
        </div>
      </div>
    </section>

    <section><div className="mb-4"><SectionTitle>Ações rápidas</SectionTitle></div><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><QuickAction to="/animais/novo" label="Cadastrar animal" detail="Adicionar um novo animal ao rebanho" icon={Tag} /><QuickAction to="/vacinas/nova" label="Registrar vacina" detail="Aplicar vacina ou reforço" icon={ShieldCheck} /><QuickAction to="/partos/novo" label="Registrar parto" detail="Incluir uma nova cria" icon={HeartPulse} /><QuickAction to="/animais" label="Consultar rebanho" detail="Acessar todos os animais" icon={Search} /></div></section>

    <section className="grid gap-5 xl:grid-cols-[.9fr_1.55fr]">
      <div className="rounded-3xl border border-[#e6eee8] bg-white/85 p-5 shadow-[0_8px_25px_rgba(22,60,40,.04)]"><SectionTitle to="/animais" label="Ver detalhes">Situação do rebanho</SectionTitle><div className="flex flex-col items-center gap-5 sm:flex-row"><HerdChart total={stats?.activeAnimals ?? 0} femalePercent={femalePercent} malePercent={malePercent} /><div className="w-full space-y-2.5"><Legend color="bg-brand-700" label="Fêmeas" value={`${stats?.females ?? 0} (${femalePercent}%)`} /><Legend color="bg-[#acd9b9]" label="Machos" value={`${stats?.males ?? 0} (${malePercent}%)`} /><Legend color="bg-[#e4eee7]" label="Outros / baixados" value={`${Math.max(0, (stats?.totalAnimals ?? 0) - (stats?.activeAnimals ?? 0))}`} /></div></div></div>
      <TimelineCard items={timelineItems} />
    </section>

    <section className="grid gap-5 lg:grid-cols-2">
      <div className="rounded-3xl border border-[#e6eee8] bg-white/85 p-5 shadow-[0_8px_25px_rgba(22,60,40,.04)]"><SectionTitle to="/vacinas">Prioridades de hoje</SectionTitle><div className="space-y-2">{upcoming.length > 0 ? upcoming.slice(0, 3).map(vaccination => <Priority key={vaccination.id} icon={Syringe} title={vaccination.vaccine_name} detail={`Vencimento: ${vaccination.next_due_date ? new Date(vaccination.next_due_date + 'T12:00:00').toLocaleDateString('pt-BR') : 'a confirmar'}`} alert />) : <Priority icon={Check} title="Vacinas em dia" detail="Nenhuma vacina vence nos próximos 30 dias" />}{(stats?.recentBirths ?? 0) > 0 ? <Priority icon={Baby} title="Partos registrados" detail={`${stats?.recentBirths} registro(s) nos últimos 30 dias`} /> : <Priority icon={ListChecks} title="Verificações de manejo" detail="Nenhum lembrete pendente" />}</div></div>
      <div className="rounded-3xl border border-[#e6eee8] bg-white/85 p-5 shadow-[0_8px_25px_rgba(22,60,40,.04)]"><SectionTitle>Insights do manejo</SectionTitle><div className="space-y-2"><Insight icon={Leaf} title="Rebanho acompanhado" detail="Mantenha os dados atualizados para decisões mais precisas." /><Insight icon={Syringe} title="Vacinação em dia" detail={upcoming.length ? `${upcoming.length} vacina(s) precisam de atenção nos próximos 30 dias.` : 'Nenhuma vacina prevista para os próximos 30 dias.'} /><Insight icon={Sprout} title="Registre os manejos" detail="Um histórico completo melhora a gestão da fazenda." /></div></div>
    </section>
  </div>
}

function TimelineCard({ items }: { items: TimelineEntry[] }) {
  return <div className="rounded-3xl border border-[#e6eee8] bg-white/90 p-5 shadow-[0_8px_25px_rgba(22,60,40,.04)]">
    <div className="mb-4 flex items-start justify-between gap-4">
      <div className="flex items-center gap-3"><span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-50 text-brand-700"><CalendarDays size={21} /></span><span><h2 className="text-lg font-bold tracking-tight text-[#16271e]">Linha do tempo</h2><p className="text-xs text-[#78877e]">Próximas datas importantes do seu rebanho</p></span></div>
      <Link to="/vacinas" className="inline-flex shrink-0 items-center gap-1 rounded-full bg-brand-50 px-3 py-1.5 text-xs font-bold text-brand-800 hover:bg-brand-100">Ver todas <ArrowRight size={13} /></Link>
    </div>
    {items.length === 0 ? <div className="flex min-h-44 flex-col items-center justify-center rounded-2xl bg-[#f8fbf9] px-5 text-center"><CalendarDays size={28} className="text-brand-300" /><p className="mt-3 text-sm font-semibold text-[#33483b]">Nenhuma data programada</p><p className="mt-1 text-xs text-[#829087]">Vacinas e partos previstos aparecerão aqui.</p></div> : <div>{items.map((item, index) => {
      const date = new Date(item.date + 'T12:00:00')
      const Icon = item.icon
      const isLast = index === items.length - 1
      return <Link key={item.id} to={item.to} className="group grid grid-cols-[60px_24px_42px_minmax(0,1fr)_auto_18px] items-center gap-3 border-b border-[#edf2ee] py-2.5 last:border-0">
        <span className="flex h-14 flex-col items-center justify-center rounded-xl bg-brand-50 text-brand-900"><strong className="text-lg leading-5">{String(date.getDate()).padStart(2, '0')}</strong><span className="text-[11px] font-semibold lowercase">{date.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '')}</span></span>
        <span className="relative flex h-full items-center justify-center"><span className="relative z-10 h-3 w-3 rounded-full bg-[#43cf8d]" />{!isLast && <span className="absolute left-1/2 top-1/2 h-[calc(100%+20px)] w-px -translate-x-1/2 bg-[#d8e6dc]" />}</span>
        <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${item.category === 'Parto' ? 'bg-[#fff4df] text-[#bd7b18]' : 'bg-brand-50 text-brand-700'}`}><Icon size={19} /></span>
        <span className="min-w-0"><span className="block truncate text-sm font-bold text-[#24372b]">{item.title}</span><span className="block truncate text-xs text-[#7d8a82]">{item.animal}</span></span>
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${item.category === 'Parto' ? 'bg-[#fff3df] text-[#bb7413]' : 'bg-brand-50 text-brand-700'}`}>{item.category}</span>
        <ChevronRight size={17} className="text-[#819087] transition-transform group-hover:translate-x-0.5" />
      </Link>
    })}</div>}
  </div>
}

function Legend({ color, label, value }: { color: string; label: string; value: string }) { return <div className="flex items-center justify-between border-b border-[#edf2ee] pb-2 text-sm last:border-0"><span className="flex items-center gap-2 text-[#526158]"><span className={`h-3 w-3 rounded-full ${color}`} />{label}</span><span className="font-bold text-[#2b3e32]">{value}</span></div> }

function Priority({ icon: Icon, title, detail, alert = false }: { icon: typeof Syringe; title: string; detail: string; alert?: boolean }) { return <div className="flex items-center gap-3 rounded-xl border border-[#edf2ee] p-3"><span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${alert ? 'bg-[#fff3db] text-[#b57919]' : 'bg-brand-50 text-brand-700'}`}><Icon size={17} /></span><span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold text-[#25372b]">{title}</span><span className="block truncate text-xs text-[#7b8880]">{detail}</span></span>{alert ? <AlertCircle size={17} className="shrink-0 text-[#b57919]" /> : <Check size={17} className="shrink-0 text-brand-600" />}</div> }

function Insight({ icon: Icon, title, detail }: { icon: typeof Leaf; title: string; detail: string }) { return <div className="flex gap-3 rounded-xl bg-[#f8fbf8] p-3"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-700"><Icon size={17} /></span><span><span className="block text-sm font-semibold text-[#25372b]">{title}</span><span className="mt-0.5 block text-xs leading-4 text-[#7b8880]">{detail}</span></span></div> }
