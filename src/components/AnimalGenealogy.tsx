import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Pencil } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import type { Animal } from '../types'

type GenealogyAnimal = Pick<Animal, 'id' | 'name' | 'tag' | 'breed' | 'sex' | 'image_url' | 'mother_id' | 'mother_name' | 'father_id' | 'father_tag'>

function GenderIcon({ sex, className = 'h-5 w-5' }: { sex: 'F' | 'M'; className?: string }) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
    {sex === 'F' ? <><circle cx="12" cy="8" r="5" /><path d="M12 13v9M8 18h8" /></> : <><circle cx="9" cy="15" r="5" /><path d="m13 11 8-8M15 3h6v6" /></>}
  </svg>
}

function animalImage(animal: Pick<Animal, 'sex' | 'image_url'> | undefined, sex: 'F' | 'M') {
  return animal?.image_url || (sex === 'F' ? '/images/cattle-cow-nelore.png' : '/images/cattle-bull-white.png')
}

function AnimalPortrait({ animal, sex, compact = false, selected = false }: { animal?: Pick<Animal, 'sex' | 'image_url'>; sex: 'F' | 'M'; compact?: boolean; selected?: boolean }) {
  return <span className={`block shrink-0 overflow-hidden rounded-full border-2 border-[#d9dedc] ${selected ? 'h-20 w-20 sm:h-24 sm:w-24' : compact ? 'h-10 w-10' : 'h-14 w-14'}`}>
    <img src={animalImage(animal, animal?.sex || sex)} alt="" loading="lazy" className="h-full w-full object-cover" />
  </span>
}

function AncestorNode({ relation, animal, fallback, exampleName, sex, compact = false }: { relation: string; animal?: GenealogyAnimal; fallback?: string | null; exampleName: string; sex: 'F' | 'M'; compact?: boolean }) {
  const name = animal?.name || animal?.tag || fallback || exampleName
  const content = <>
    <AnimalPortrait animal={animal} sex={sex} compact={compact} />
    <span className="min-w-0 flex-1">
      <span className={`block font-semibold uppercase tracking-[0.08em] text-[#6b756f] ${compact ? 'text-[10px]' : 'text-[11px]'}`}>{relation}</span>
      <span className={`mt-1 block break-words font-semibold leading-tight text-[#26332b] ${compact ? 'text-sm sm:text-base' : 'text-lg'}`}>{name}</span>
      {(animal?.breed || (animal ? 'Animal cadastrado' : fallback ? 'Nome informado' : null)) && <span className="mt-1 block text-xs leading-snug text-[#69736d]">{animal?.breed || (animal ? 'Animal cadastrado' : 'Nome informado')}</span>}
    </span>
    {animal && <ArrowRight size={16} className="shrink-0 text-[#59665e]" aria-hidden="true" />}
  </>
  const className = `flex min-h-20 items-center gap-3 rounded-xl border border-[#e4e8e5] bg-white px-3 py-3 text-left shadow-[0_6px_18px_rgba(31,41,34,.04)] ${compact ? 'min-h-[76px] gap-2.5 px-2.5' : ''} ${animal ? 'cursor-pointer transition-colors hover:border-[#b7c2ba] hover:bg-[#fafbfa] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700' : ''}`
  return animal ? <Link to={`/animais/${animal.id}`} className={className} aria-label={`${relation}: ${name}. Ver animal`}>{content}</Link> : <div className={className}>{content}</div>
}

function BranchConnector() {
  return <div className="relative mx-auto h-7 w-1/2" aria-hidden="true">
    <span className="absolute left-1/2 top-0 h-3 w-px -translate-x-1/2 bg-[#bec8c1]" />
    <span className="absolute inset-x-0 top-3 h-px bg-[#bec8c1]" />
    <span className="absolute left-0 top-3 h-3 w-px bg-[#bec8c1]" />
    <span className="absolute right-0 top-3 h-3 w-px bg-[#bec8c1]" />
    <span className="absolute left-1/2 top-[9px] h-2 w-2 -translate-x-1/2 rounded-full bg-[#798b7e]" />
  </div>
}

export function AnimalGenealogy({ animal }: { animal: Animal }) {
  const { farm } = useAuth()
  const [relatives, setRelatives] = useState<Record<string, GenealogyAnimal>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [retry, setRetry] = useState(0)

  useEffect(() => {
    if (!farm) return
    let cancelled = false
    const farmId = farm.id
    setLoading(true)
    setError('')
    setRelatives({})

    async function loadRelatives() {
      const parentIds = [animal.mother_id, animal.father_id].filter((id): id is string => Boolean(id))
      if (parentIds.length === 0) {
        if (!cancelled) setLoading(false)
        return
      }
      const parents = await supabase.from('animals').select('id, name, tag, breed, sex, image_url, mother_id, mother_name, father_id, father_tag').eq('farm_id', farmId).in('id', parentIds)
      if (cancelled) return
      if (parents.error) {
        setError('Não foi possível carregar os parentes. Tente novamente.')
        setLoading(false)
        return
      }
      const parentRows = (parents.data ?? []) as GenealogyAnimal[]
      const grandparentIds = [...new Set(parentRows.flatMap(parent => [parent.mother_id, parent.father_id]).filter((id): id is string => Boolean(id)))].filter(id => !parentIds.includes(id))
      let grandparentRows: GenealogyAnimal[] = []
      if (grandparentIds.length) {
        const grandparents = await supabase.from('animals').select('id, name, tag, breed, sex, image_url, mother_id, mother_name, father_id, father_tag').eq('farm_id', farmId).in('id', grandparentIds)
        if (cancelled) return
        if (grandparents.error) {
          setError('Não foi possível carregar os avós. Tente novamente.')
          setLoading(false)
          return
        }
        grandparentRows = (grandparents.data ?? []) as GenealogyAnimal[]
      }
      setRelatives(Object.fromEntries([...parentRows, ...grandparentRows].map(relative => [relative.id, relative])))
      setLoading(false)
    }

    void loadRelatives()
    return () => { cancelled = true }
  }, [animal.id, animal.mother_id, animal.father_id, farm?.id, retry])

  const mother = animal.mother_id ? relatives[animal.mother_id] : undefined
  const father = animal.father_id ? relatives[animal.father_id] : undefined
  const maternalGrandmother = mother?.mother_id ? relatives[mother.mother_id] : undefined
  const maternalGrandfather = mother?.father_id ? relatives[mother.father_id] : undefined
  const paternalGrandmother = father?.mother_id ? relatives[father.mother_id] : undefined
  const paternalGrandfather = father?.father_id ? relatives[father.father_id] : undefined

  return <section className="relative overflow-hidden rounded-3xl border border-[#e4ece7] bg-white p-5 shadow-[0_10px_28px_rgba(22,61,38,.045)] sm:p-6">
    <div className="pointer-events-none absolute inset-x-0 top-0 h-52 overflow-hidden" aria-hidden="true"><img src="/images/dashboard-herd-hero.png" alt="" className="h-full w-full object-cover object-center opacity-[0.055]" /><div className="absolute inset-0 bg-gradient-to-b from-white/20 to-white" /></div>
    <div className="relative flex flex-wrap items-start justify-between gap-3">
      <div><p className="page-kicker">Parentesco · 3 gerações</p><h2 className="mt-1 text-xl font-bold text-[#1d3024]">Árvore genealógica</h2><p className="mt-1 text-sm text-[#526158]">Acompanhe as linhagens materna e paterna deste animal.</p></div>
      <Link to={`/animais/${animal.id}/editar`} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-brand-200 px-3 text-sm font-semibold text-brand-800 transition-colors hover:bg-brand-50"><Pencil size={16} aria-hidden="true" />Completar parentesco</Link>
    </div>

    {loading ? <div role="status" className="relative py-16 text-center text-sm text-[#526158]">Carregando árvore genealógica...</div> : error ? <div role="alert" className="relative py-12 text-center"><p className="text-sm text-red-700">{error}</p><button type="button" onClick={() => setRetry(value => value + 1)} className="mt-3 min-h-11 rounded-xl px-4 text-sm font-semibold text-brand-800 hover:bg-brand-50">Tentar novamente</button></div> : <div className="relative">
      <div className="mx-auto mt-7 flex max-w-md items-center gap-4 rounded-2xl border border-[#dce3de] bg-[#f7f9f7]/95 p-4 shadow-[0_10px_28px_rgba(31,41,34,.06)] sm:gap-5 sm:p-5">
        <AnimalPortrait animal={animal} sex={animal.sex} selected />
        <div className="min-w-0"><p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[#68756d]">Animal selecionado</p><p className="mt-1 break-words text-2xl font-semibold leading-tight text-[#26352b]">{animal.name || animal.tag || 'Sem nome'}</p>{animal.breed && <p className="mt-0.5 text-sm text-[#5b6960]">{animal.breed}</p>}<div className="mt-2 flex flex-wrap gap-1.5"><span className="inline-flex items-center gap-1 rounded-md bg-white px-2 py-1 text-xs font-medium text-[#435149]"><GenderIcon sex={animal.sex} className="h-3.5 w-3.5" />{animal.sex === 'F' ? 'Fêmea' : 'Macho'}</span>{animal.tag && <span className="rounded-md bg-white px-2 py-1 text-xs font-medium text-[#435149]">{animal.tag}</span>}</div></div>
      </div>
      <div className="mx-auto h-5 w-px bg-[#b8c5bb] lg:h-0" aria-hidden="true" />
      <div className="relative mx-auto hidden h-10 w-1/2 lg:block" aria-hidden="true"><span className="absolute left-1/2 top-0 h-5 w-px -translate-x-1/2 bg-[#b8c5bb]" /><span className="absolute inset-x-0 top-5 h-px bg-[#b8c5bb]" /><span className="absolute left-0 top-5 h-5 w-px bg-[#b8c5bb]" /><span className="absolute right-0 top-5 h-5 w-px bg-[#b8c5bb]" /><span className="absolute left-1/2 top-4 h-2 w-2 -translate-x-1/2 rounded-full border-2 border-[#718b78] bg-white" /></div>
      <div className="grid gap-4 lg:grid-cols-2 lg:gap-5">
        <div className="min-w-0 rounded-2xl border border-[#edf0ee] bg-[#fcfdfc]/95 p-3.5 sm:p-4">
          <div className="mb-3 flex items-center gap-3 px-1 py-1"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#f1f3f1] text-[#526159]"><GenderIcon sex="F" className="h-5 w-5" /></span><div className="min-w-0 flex-1"><h3 className="text-base font-semibold text-[#334139]">Linhagem materna</h3><p className="text-xs text-[#707b74]">Mãe e avós maternos</p></div></div>
          <AncestorNode relation="Mãe" animal={mother} fallback={animal.mother_name} exampleName="Aurora" sex="F" />
          <BranchConnector />
          <div className="grid grid-cols-2 gap-2.5"><AncestorNode relation="Avó materna" animal={maternalGrandmother} fallback={mother?.mother_name} exampleName="Estrela" sex="F" compact /><AncestorNode relation="Avô materno" animal={maternalGrandfather} fallback={mother?.father_tag} exampleName="Bento" sex="M" compact /></div>
        </div>
        <div className="min-w-0 rounded-2xl border border-[#edf0ee] bg-[#fcfdfc]/95 p-3.5 sm:p-4">
          <div className="mb-3 flex items-center gap-3 px-1 py-1"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#f1f3f1] text-[#526159]"><GenderIcon sex="M" className="h-5 w-5" /></span><div className="min-w-0 flex-1"><h3 className="text-base font-semibold text-[#334139]">Linhagem paterna</h3><p className="text-xs text-[#707b74]">Pai e avós paternos</p></div></div>
          <AncestorNode relation="Pai" animal={father} fallback={animal.father_tag} exampleName="Trovão" sex="M" />
          <BranchConnector />
          <div className="grid grid-cols-2 gap-2.5"><AncestorNode relation="Avó paterna" animal={paternalGrandmother} fallback={father?.mother_name} exampleName="Safira" sex="F" compact /><AncestorNode relation="Avô paterno" animal={paternalGrandfather} fallback={father?.father_tag} exampleName="Imperador" sex="M" compact /></div>
        </div>
      </div>
      <p className="mt-5 text-xs leading-5 text-[#617168]">Os nomes indicados como exemplo mostram como a árvore ficará após o cadastro. Os vínculos reais vêm dos animais registrados.</p>
    </div>}
  </section>
}
