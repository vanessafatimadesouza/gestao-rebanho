import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, ArrowUpRight, Check, ChevronRight, GitFork, Pencil } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import type { Animal } from '../types'

type Relative = Pick<Animal, 'id' | 'name' | 'tag' | 'breed' | 'sex' | 'image_url' | 'mother_id' | 'mother_name' | 'father_id' | 'father_tag'>
type Slot = { animal?: Relative; label?: string | null }
type Tree = { mother: Slot; father: Slot; maternalGrandmother: Slot; maternalGrandfather: Slot; paternalGrandmother: Slot; paternalGrandfather: Slot }
type Branch = 'maternal' | 'paternal'
type Sex = 'F' | 'M'

const fields = 'id, name, tag, breed, sex, image_url, mother_id, mother_name, father_id, father_tag'
const emptyTree: Tree = { mother: {}, father: {}, maternalGrandmother: {}, maternalGrandfather: {}, paternalGrandmother: {}, paternalGrandfather: {} }
const displayName = (relative: Relative) => relative.name || relative.tag || 'Sem nome'
const examples: Record<string, { name: string; image: string }> = {
  Mãe: { name: 'Aurora', image: '/images/cattle-cow-nelore.png' },
  Pai: { name: 'Trovão', image: '/images/cattle-bull-white-2.png' },
  'Avó materna': { name: 'Estrela', image: '/images/cattle-cow-brown.png' },
  'Avô materno': { name: 'Bento', image: '/images/cattle-bull-white.png' },
  'Avó paterna': { name: 'Safira', image: '/images/cattle-cow-spotted.png' },
  'Avô paterno': { name: 'Imperador', image: '/images/cattle-bull-white-3.png' },
}

const relationSex: Record<string, Sex> = {
  Mãe: 'F',
  Pai: 'M',
  'Avó materna': 'F',
  'Avô materno': 'M',
  'Avó paterna': 'F',
  'Avô paterno': 'M',
}

function GenderIcon({ sex, size = 18 }: { sex: Sex; size?: number }) {
  return sex === 'F'
    ? <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true"><circle cx="12" cy="8" r="5" /><path d="M12 13v8M8 18h8" /></svg>
    : <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true"><circle cx="9" cy="15" r="5" /><path d="m13 11 7-7M15 4h5v5" /></svg>
}

function Portrait({ relative, illustration, large = false, compact = false, branch = 'maternal' }: { relative?: Relative; illustration?: string; large?: boolean; compact?: boolean; branch?: Branch }) {
  const image = relative?.image_url || illustration || (relative?.sex === 'M' ? '/images/cattle-bull-white.png' : '/images/cattle-cow-nelore.png')
  return <span className={`flex shrink-0 items-center justify-center overflow-hidden rounded-full border-[4px] bg-white shadow-sm ${large ? 'h-24 w-24 sm:h-28 sm:w-28' : compact ? 'h-11 w-11 sm:h-12 sm:w-12' : 'h-14 w-14 sm:h-16 sm:w-16'} ${branch === 'maternal' ? 'border-[#e5f4ea] text-[#498665]' : 'border-[#f5ede3] text-[#947350]'}`}>
    <img src={image} alt="" loading="lazy" className="h-full w-full object-cover" />
  </span>
}

function RelativeCard({ relation, slot, branch, onOpen, compact = false }: { relation: string; slot: Slot; branch: Branch; onOpen: (relative: Relative) => void; compact?: boolean }) {
  const { animal, label } = slot
  const example = examples[relation]
  const name = animal ? displayName(animal) : label?.trim() || example.name
  const maternal = branch === 'maternal'
  const sex = animal?.sex ?? relationSex[relation]
  const contents = <>
    <Portrait relative={animal} illustration={example.image} branch={branch} compact={compact} />
    <span className="min-w-0 flex-1"><span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[9px] font-bold uppercase tracking-[0.1em] ${maternal ? 'bg-[#e7f6ec] text-[#276743]' : 'bg-[#fbf1e6] text-[#856442]'}`}><GenderIcon sex={sex} size={12} />{relation}</span><span className={`mt-1 block break-words font-bold leading-snug text-[#152a32] ${compact ? 'text-sm sm:text-base' : 'text-lg sm:text-xl'}`}>{name}</span>{(animal?.breed || (animal ? 'Cadastro vinculado' : label ? 'Nome informado' : null)) && <span className="mt-0.5 block text-[11px] text-[#61747b]">{animal?.breed || (animal ? 'Cadastro vinculado' : 'Nome informado')}</span>}</span>
    {animal && <span className={`flex shrink-0 items-center justify-center rounded-full border border-[#d9e9e0] text-[#2c6a4a] transition-transform group-hover:translate-x-0.5 ${compact ? 'h-6 w-6' : 'h-8 w-8'}`}><ChevronRight size={compact ? 14 : 17} aria-hidden="true" /></span>}
  </>
  const className = `group flex w-full items-center gap-2 rounded-[22px] border bg-white/95 text-left shadow-[0_12px_28px_rgba(23,58,44,.05)] ${compact ? 'min-h-[86px] p-2.5' : 'min-h-[108px] p-3 sm:p-4'} ${maternal ? 'border-[#d3eadb]' : 'border-[#eadbcc]'} ${animal ? 'cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-[0_18px_38px_rgba(23,58,44,.12)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700' : ''}`
  return animal ? <button type="button" onClick={() => onOpen(animal)} className={className} aria-label={`${relation}: ${name}. Explorar ascendência`}>{contents}</button> : <div className={className}>{contents}</div>
}

function BranchPanel({ title, subtitle, branch, parent, grandmother, grandfather, parentRelation, grandmotherRelation, grandfatherRelation, onOpen }: {
  title: string; subtitle: string; branch: Branch; parent: Slot; grandmother: Slot; grandfather: Slot
  parentRelation: string; grandmotherRelation: string; grandfatherRelation: string; onOpen: (relative: Relative) => void
}) {
  const maternal = branch === 'maternal'
  return <section aria-label={title} className="min-w-0">
    <div className="mb-4 flex items-center gap-2.5"><span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${maternal ? 'bg-[#e5f6eb] text-[#22724a]' : 'bg-[#f5eee6] text-[#8b6a45]'}`}><GenderIcon sex={maternal ? 'F' : 'M'} size={24} /></span><div className="min-w-0"><h3 className="text-lg font-bold text-[#172e34]">{title}</h3><p className="text-xs text-[#647782]">{subtitle}</p></div><span className={`ml-2 hidden h-px flex-1 sm:block ${maternal ? 'bg-[#cce5d3]' : 'bg-[#ecdfd0]'}`} /></div>
    <RelativeCard relation={parentRelation} slot={parent} branch={branch} onOpen={onOpen} />
    <div className={`relative mx-auto hidden h-12 w-1/2 sm:block ${maternal ? 'text-[#64ae80]' : 'text-[#c49b6e]'}`} aria-hidden="true"><span className="absolute left-1/2 top-0 h-5 w-px -translate-x-1/2 bg-current" /><span className="absolute inset-x-0 top-5 h-px bg-current" /><span className="absolute left-0 top-5 h-7 w-px bg-current" /><span className="absolute right-0 top-5 h-7 w-px bg-current" /><span className="absolute left-1/2 top-3 h-4 w-4 -translate-x-1/2 rounded-full border-[3px] border-white bg-current" /></div>
    <div className="mt-3 grid gap-2 sm:mt-0 sm:grid-cols-2"><RelativeCard relation={grandmotherRelation} slot={grandmother} branch={branch} onOpen={onOpen} compact /><RelativeCard relation={grandfatherRelation} slot={grandfather} branch={branch} onOpen={onOpen} compact /></div>
  </section>
}

export function AnimalGenealogy({ animal }: { animal: Animal }) {
  const { farm } = useAuth()
  const [trail, setTrail] = useState<Relative[]>([])
  const [tree, setTree] = useState<Tree>(emptyTree)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [retry, setRetry] = useState(0)
  const focus: Relative = trail[trail.length - 1] ?? animal

  useEffect(() => { setTrail([]) }, [animal.id])

  useEffect(() => {
    if (!farm) return
    let cancelled = false
    const farmId = farm.id
    setLoading(true)
    setError('')
    setTree(emptyTree)

    async function resolveParent(id: string | null, text: string | null, sex: 'F' | 'M'): Promise<Slot> {
      const label = text?.trim() || null
      if (id) {
        const { data, error: queryError } = await supabase.from('animals').select(fields).eq('farm_id', farmId).eq('id', id).maybeSingle()
        if (queryError) throw queryError
        return { animal: (data as Relative | null) ?? undefined, label }
      }
      if (!label) return {}
      const [byName, byTag] = await Promise.all([
        supabase.from('animals').select(fields).eq('farm_id', farmId).eq('sex', sex).eq('name', label).limit(2),
        supabase.from('animals').select(fields).eq('farm_id', farmId).eq('sex', sex).eq('tag', label).limit(2),
      ])
      if (byName.error || byTag.error) throw byName.error || byTag.error
      const matches = [...(byName.data ?? []), ...(byTag.data ?? [])].filter((candidate, index, all) => all.findIndex(item => item.id === candidate.id) === index && candidate.id !== focus.id)
      return { animal: matches.length === 1 ? matches[0] as Relative : undefined, label }
    }

    async function loadTree() {
      try {
        const [mother, father] = await Promise.all([resolveParent(focus.mother_id, focus.mother_name, 'F'), resolveParent(focus.father_id, focus.father_tag, 'M')])
        if (cancelled) return
        const [maternalGrandmother, maternalGrandfather, paternalGrandmother, paternalGrandfather] = await Promise.all([
          mother.animal ? resolveParent(mother.animal.mother_id, mother.animal.mother_name, 'F') : {},
          mother.animal ? resolveParent(mother.animal.father_id, mother.animal.father_tag, 'M') : {},
          father.animal ? resolveParent(father.animal.mother_id, father.animal.mother_name, 'F') : {},
          father.animal ? resolveParent(father.animal.father_id, father.animal.father_tag, 'M') : {},
        ])
        if (!cancelled) setTree({ mother, father, maternalGrandmother, maternalGrandfather, paternalGrandmother, paternalGrandfather })
      } catch {
        if (!cancelled) setError('Não foi possível carregar o parentesco. Tente novamente.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void loadTree()
    return () => { cancelled = true }
  }, [focus.id, focus.mother_id, focus.mother_name, focus.father_id, focus.father_tag, farm?.id, retry])

  const linkedCount = Object.values(tree).filter(slot => slot.animal).length
  const informedCount = Object.values(tree).filter(slot => slot.label && !slot.animal).length

  return <section className="relative isolate overflow-hidden rounded-[32px] border border-[#e2eee8] bg-white shadow-[0_18px_48px_rgba(22,61,38,.055)]">
    <div className="pointer-events-none absolute inset-x-0 top-28 h-[420px] overflow-hidden" aria-hidden="true"><img src="/images/dashboard-herd-hero.png" alt="" className="h-full w-full object-cover object-center opacity-[0.075]" /><div className="absolute inset-0 bg-gradient-to-b from-white/75 via-white/60 to-white" /></div>
    <div className="relative px-5 pb-7 pt-7 sm:px-7 sm:pt-8 lg:px-8">
      <div className="flex flex-wrap items-center justify-between gap-4"><div className="flex min-w-0 items-center gap-4"><span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#edf8f0] text-[#205b3d]"><GitFork size={25} strokeWidth={1.8} aria-hidden="true" /></span><div><h2 className="text-lg font-bold text-[#1d3024]">Árvore genealógica</h2><p className="mt-1 text-sm text-[#526158]">Acompanhe as linhagens materna e paterna deste animal.</p></div></div><Link to={`/animais/${focus.id}/editar`} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[#bddaca] bg-white/90 px-4 text-sm font-semibold text-[#173d2b] shadow-sm transition-colors hover:bg-[#f2faf4]"><Pencil size={17} aria-hidden="true" />Completar parentesco</Link></div>
      {trail.length > 0 && <nav aria-label="Caminho da árvore" className="mt-5 flex flex-wrap items-center gap-1.5 text-xs text-[#5c7262]"><button type="button" onClick={() => setTrail([])} className="rounded-lg px-2 py-1.5 font-semibold hover:bg-[#e8f3eb]">{displayName(animal)}</button>{trail.map((relative, index) => <span key={`${relative.id}-${index}`} className="inline-flex items-center gap-1.5"><ChevronRight size={14} aria-hidden="true" /><button type="button" onClick={() => setTrail(current => current.slice(0, index + 1))} aria-current={index === trail.length - 1 ? 'page' : undefined} className={`rounded-lg px-2 py-1.5 ${index === trail.length - 1 ? 'bg-[#e5f3e8] font-bold text-[#205b39]' : 'font-semibold hover:bg-[#e8f3eb]'}`}>{displayName(relative)}</button></span>)}</nav>}
      {trail.length > 0 && <button type="button" onClick={() => setTrail(current => current.slice(0, -1))} className="mt-2 inline-flex min-h-10 items-center gap-2 rounded-xl px-2 text-sm font-semibold text-[#35684a] hover:bg-[#f1f7f2]"><ArrowLeft size={16} aria-hidden="true" />Voltar uma geração</button>}

      <div className="mx-auto mt-7 flex max-w-[500px] items-center gap-3 rounded-[32px] border border-[#d6e9de] bg-white/90 p-3 shadow-[0_18px_46px_rgba(29,83,52,.095)] backdrop-blur-sm sm:gap-4"><Portrait relative={focus} large /><div className="min-w-0"><span className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#26563a]">Animal selecionado</span><h3 className="mt-1 break-words text-xl font-bold leading-tight text-[#142b31] sm:text-2xl">{displayName(focus)}</h3><p className="mt-1 text-sm text-[#586b78]">{focus.breed || (focus.sex === 'F' ? 'Fêmea' : 'Macho')}</p><div className="mt-2 flex flex-wrap gap-1.5"><span className="inline-flex items-center gap-1 rounded-full border border-[#d5e9dd] bg-[#f7fcf8] px-2.5 py-1 text-[11px] font-semibold text-[#286144]"><GenderIcon sex={focus.sex} size={14} />{focus.sex === 'F' ? 'Fêmea' : 'Macho'}</span>{focus.tag && <span className="rounded-full border border-[#d5e9dd] bg-[#f7fcf8] px-2.5 py-1 text-[11px] font-semibold text-[#286144]">{focus.tag}</span>}</div>{trail.length > 0 && <Link to={`/animais/${focus.id}?aba=genealogia`} className="mt-2 inline-flex min-h-9 items-center gap-1 text-xs font-bold text-[#246a44] hover:underline">Abrir ficha deste animal <ArrowUpRight size={14} aria-hidden="true" /></Link>}</div></div>

      {loading ? <div role="status" className="py-16 text-center text-sm text-[#597264]">Carregando parentesco...</div> : error ? <div role="alert" className="py-12 text-center"><p className="text-sm text-red-700">{error}</p><button type="button" onClick={() => setRetry(value => value + 1)} className="mt-3 min-h-11 rounded-xl px-4 text-sm font-semibold text-brand-800 hover:bg-brand-50">Tentar novamente</button></div> : <>
        <div className="relative mx-auto hidden h-12 w-1/2 xl:block" aria-hidden="true"><span className="absolute left-1/2 top-0 h-6 w-px -translate-x-1/2 bg-[#7bb593]" /><span className="absolute inset-x-0 top-6 h-px bg-[#6bab84]" /><span className="absolute left-0 top-6 h-6 w-px bg-[#6bab84]" /><span className="absolute right-0 top-6 h-6 w-px bg-[#b99b7c]" /><span className="absolute left-1/2 top-[15px] h-5 w-5 -translate-x-1/2 rounded-full border-[5px] border-white bg-[#17613d] shadow-sm" /></div>
        <div className="mt-7 grid gap-8 xl:mt-0 xl:grid-cols-2 xl:gap-5"><BranchPanel title="Linhagem materna" subtitle="Mãe e avós maternos" branch="maternal" parent={tree.mother} grandmother={tree.maternalGrandmother} grandfather={tree.maternalGrandfather} parentRelation="Mãe" grandmotherRelation="Avó materna" grandfatherRelation="Avô materno" onOpen={relative => setTrail(current => [...current, relative])} /><BranchPanel title="Linhagem paterna" subtitle="Pai e avós paternos" branch="paternal" parent={tree.father} grandmother={tree.paternalGrandmother} grandfather={tree.paternalGrandfather} parentRelation="Pai" grandmotherRelation="Avó paterna" grandfatherRelation="Avô paterno" onOpen={relative => setTrail(current => [...current, relative])} /></div>
        <div className="mt-9 flex flex-wrap items-center justify-between gap-3 border-t border-[#e5eee9] pt-5 text-xs text-[#64766a]"><p><span className="inline-flex items-center gap-1 font-bold text-[#2e7850]"><Check size={14} aria-hidden="true" />{linkedCount} de 6 vinculados</span>{informedCount > 0 && <span> · {informedCount} {informedCount === 1 ? 'nome informado' : 'nomes informados'}</span>}</p></div>
      </>}
    </div>
  </section>
}
