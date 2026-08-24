import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { AlertCircle, ArrowUpRight, Baby, CalendarDays, Check, Copy, PawPrint, Syringe, TrendingUp, Users } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { Vaccination } from '../types'

interface Stats { totalAnimals: number; activeAnimals: number; females: number; males: number; recentBirths: number }

function MetricCard({ label, value, detail, icon: Icon, tone = 'brand' }: { label: string; value: number | string; detail: string; icon: typeof PawPrint; tone?: 'brand' | 'earth' }) {
  return <div className="app-surface group p-5 transition-all hover:-translate-y-0.5 hover:shadow-[0_14px_35px_rgba(19,48,32,.08)]">
    <div className="mb-7 flex items-center justify-between"><span className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#748178]">{label}</span><span className={`flex h-9 w-9 items-center justify-center rounded-xl ${tone === 'earth' ? 'bg-[#fff3dc] text-[#a66a17]' : 'bg-brand-50 text-brand-700'}`}><Icon size={17} /></span></div>
    <p className="text-3xl font-bold tracking-tight text-[#183326]">{value}</p><p className="mt-2 text-xs text-[#748178]">{detail}</p>
  </div>
}

export function Dashboard() {
  const { farm } = useAuth(); const [stats, setStats] = useState<Stats | null>(null); const [upcoming, setUpcoming] = useState<Vaccination[]>([]); const [copied, setCopied] = useState(false)
  useEffect(() => { if (farm) { loadStats(); loadUpcomingVaccinations() } }, [farm])
  async function loadStats() {
    const { data: animals } = await supabase.from('animals').select('sex, status').eq('farm_id', farm!.id)
    const { count: recentBirths } = await supabase.from('births').select('*', { count: 'exact', head: true }).eq('farm_id', farm!.id).gte('birth_date', new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0])
    if (animals) setStats({ totalAnimals: animals.length, activeAnimals: animals.filter(a => a.status === 'active').length, females: animals.filter(a => a.sex === 'F' && a.status === 'active').length, males: animals.filter(a => a.sex === 'M' && a.status === 'active').length, recentBirths: recentBirths ?? 0 })
  }
  async function loadUpcomingVaccinations() {
    const today = new Date().toISOString().split('T')[0]; const in30 = new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]
    const { data } = await supabase.from('vaccinations').select('*, animal:animals(id, tag, name)').eq('farm_id', farm!.id).gte('next_due_date', today).lte('next_due_date', in30).order('next_due_date').limit(5)
    if (data) setUpcoming(data as Vaccination[])
  }
  function copyFarmCode() { if (!farm) return; navigator.clipboard.writeText(farm.id); setCopied(true); setTimeout(() => setCopied(false), 2000) }
  return <div className="space-y-8">
    <section className="relative overflow-hidden rounded-3xl bg-[#173e2b] px-6 py-7 text-white shadow-[0_18px_40px_rgba(18,63,42,.17)] sm:px-8 sm:py-9"><div className="absolute -right-20 -top-20 h-56 w-56 rounded-full bg-[#77a96f]/25 blur-2xl" /><div className="relative flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#b9d7b2]">Visão geral</p><h1 className="mt-2 text-3xl font-bold tracking-tight">Gestão em dia.</h1><p className="mt-2 text-sm text-[#d1e2d0]">Acompanhe os principais indicadores de {farm?.name ?? 'sua propriedade'}.</p></div><button onClick={copyFarmCode} className="inline-flex w-fit items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-3.5 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-white/20">{copied ? <Check size={14} /> : <Copy size={14} />}{copied ? 'Código copiado' : 'Copiar código da fazenda'}</button></div></section>
    <section className="grid grid-cols-2 gap-3 lg:grid-cols-4"><MetricCard label="Plantel ativo" value={stats?.activeAnimals ?? '—'} detail={`${stats?.females ?? 0} fêmeas · ${stats?.males ?? 0} machos`} icon={PawPrint} /><MetricCard label="Partos" value={stats?.recentBirths ?? '—'} detail="Registros nos últimos 30 dias" icon={Baby} tone="earth" /><MetricCard label="Vacinação" value={upcoming.length} detail="Vencimentos nos próximos 30 dias" icon={Syringe} tone="earth" /><MetricCard label="Total cadastrado" value={stats?.totalAnimals ?? '—'} detail="Inclui animais baixados" icon={TrendingUp} /></section>
    {upcoming.length > 0 && <section className="overflow-hidden rounded-2xl border border-[#f1dfb8] bg-[#fffaf0] shadow-[0_8px_25px_rgba(108,78,22,.05)]"><div className="flex items-center justify-between border-b border-[#f1dfb8] px-5 py-4"><h2 className="flex items-center gap-2 text-sm font-bold text-[#59451f]"><AlertCircle size={16} className="text-[#b67818]" />Atenção necessária</h2><Link to="/vacinas" className="inline-flex items-center gap-1 text-xs font-bold text-brand-700 hover:text-brand-900">Ver agenda <ArrowUpRight size={13} /></Link></div><p className="px-5 pt-3 text-xs text-[#786850]">Vacinas com vencimento nos próximos 30 dias</p><div className="divide-y divide-[#f3e9d7] px-5 pb-2">{upcoming.map(v => { const animal = v.animal as unknown as { id: string; tag: string; name: string | null } | null; return <div key={v.id} className="flex items-center justify-between py-3"><div><span className="text-sm font-semibold text-[#272e29]">{v.vaccine_name}</span>{animal && <span className="ml-2 text-xs text-[#786850]">{animal.tag}{animal.name ? ` · ${animal.name}` : ''}</span>}</div>{v.next_due_date && <span className="rounded-lg bg-[#fff0d2] px-2 py-1 text-xs font-semibold text-[#70501e]">{new Date(v.next_due_date + 'T12:00:00').toLocaleDateString('pt-BR')}</span>}</div> })}</div></section>}
    <section><div className="mb-4 flex items-center justify-between"><div><p className="page-kicker">Operação</p><h2 className="mt-1 text-lg font-bold text-[#17231b]">Ações rápidas</h2></div><CalendarDays size={18} className="text-[#8b978e]" /></div><div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4"><ActionCard to="/animais/novo" label="Cadastrar animal" detail="Adicionar ao rebanho" icon={PawPrint} primary /><ActionCard to="/vacinas/nova" label="Registrar vacina" detail="Aplicação ou reforço" icon={Syringe} /><ActionCard to="/partos/novo" label="Registrar parto" detail="Incluir uma nova cria" icon={Baby} /><ActionCard to="/animais" label="Consultar rebanho" detail="Acessar todos os animais" icon={Users} /></div></section>
  </div>
}

function ActionCard({ to, label, detail, icon: Icon, primary = false }: { to: string; label: string; detail: string; icon: typeof PawPrint; primary?: boolean }) {
  const base = primary ? 'border-brand-700 bg-brand-700 text-white hover:bg-brand-800' : 'border-[#e0e9e3] bg-white text-[#17231b] hover:border-brand-300'
  return <Link to={to} className={`group rounded-2xl border p-5 shadow-[0_8px_22px_rgba(19,48,32,.04)] transition-all hover:-translate-y-0.5 hover:shadow-[0_14px_30px_rgba(19,48,32,.08)] ${base}`}><div className="flex items-center justify-between"><span className={`flex h-9 w-9 items-center justify-center rounded-xl ${primary ? 'bg-white/15 text-white' : 'bg-brand-50 text-brand-700'}`}><Icon size={18} /></span><ArrowUpRight size={16} className={`${primary ? 'text-brand-200' : 'text-[#8b978e]'} transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5`} /></div><p className="mt-5 text-sm font-bold">{label}</p><p className={`mt-1 text-xs ${primary ? 'text-brand-200' : 'text-[#738077]'}`}>{detail}</p></Link>
}
