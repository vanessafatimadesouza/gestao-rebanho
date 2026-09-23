import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, LogOut, Plus, Sprout } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import type { Farm } from '../types'

export function FarmSelection() {
  const { farms, farmLoadError, reloadFarms, selectFarm, signOut, user } = useAuth()
  const navigate = useNavigate()
  const emailName = user?.email?.split('@')[0]?.split(/[._+-]/)[0] || 'produtor'
  const firstName = emailName.charAt(0).toLocaleUpperCase('pt-BR') + emailName.slice(1)

  function enterFarm(farm: Farm) {
    selectFarm(farm)
    navigate('/', { replace: true })
  }

  async function leave() {
    await signOut()
    navigate('/login', { replace: true })
  }

  return (
    <main className="min-h-dvh bg-[#f5faf6] px-4 py-6 sm:px-8 sm:py-10">
      <div className="mx-auto max-w-5xl">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <img src="/brand/manejo-logo-transparent.png" alt="Manejo — Gestão pecuária" width="2072" height="759" className="h-auto w-[170px]" />
          <button type="button" onClick={() => void leave()} className="inline-flex min-h-11 items-center gap-2 rounded-xl px-4 text-sm font-semibold text-brand-800 transition-colors hover:bg-brand-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700"><LogOut size={17} aria-hidden="true" />Sair</button>
        </header>

        <div className="mt-12 max-w-2xl sm:mt-16">
          <p className="page-kicker">Olá, {firstName}</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-brand-900 sm:text-4xl">Escolha sua fazenda</h1>
          <p className="mt-3 text-base leading-relaxed text-[#526158]">Selecione uma fazenda para acessar o painel de manejo ou adicione uma nova.</p>
        </div>

        {farmLoadError && <div role="alert" className="mt-8 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"><span>{farmLoadError}</span><button type="button" onClick={() => void reloadFarms()} className="min-h-11 rounded-xl px-3 font-semibold hover:bg-red-100">Tentar novamente</button></div>}

        <section aria-label="Suas fazendas" className="mt-9 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {farms.map(farm => <button key={farm.id} type="button" onClick={() => enterFarm(farm)} className="group flex min-h-52 flex-col rounded-3xl border border-[#dce9df] bg-white p-6 text-left shadow-[0_10px_30px_rgba(22,60,40,.05)] transition-all hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-[0_16px_34px_rgba(22,60,40,.1)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-800"><Sprout size={23} aria-hidden="true" /></span>
            <span className="mt-5 block min-w-0 text-xl font-bold text-brand-900 [overflow-wrap:anywhere]">{farm.name}</span>
            <span className="mt-auto inline-flex items-center gap-2 pt-5 text-sm font-semibold text-brand-700">Acessar fazenda <ArrowRight size={17} className="transition-transform group-hover:translate-x-1" aria-hidden="true" /></span>
          </button>)}

          <Link to="/fazendas/nova" className="group flex min-h-52 flex-col rounded-3xl border-2 border-dashed border-[#bad3c2] bg-[#eef7f0] p-6 text-left transition-colors hover:border-brand-500 hover:bg-brand-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-brand-800"><Plus size={23} aria-hidden="true" /></span>
            <span className="mt-5 block text-xl font-bold text-brand-900">Adicionar fazenda</span>
            <span className="mt-auto block pt-5 text-sm text-[#526158]">Crie uma fazenda ou entre com um código.</span>
          </Link>
        </section>
        {!farmLoadError && farms.length === 0 && <p className="mt-5 text-sm text-[#526158]">Você ainda não participa de nenhuma fazenda. Comece adicionando a primeira.</p>}
      </div>
    </main>
  )
}
