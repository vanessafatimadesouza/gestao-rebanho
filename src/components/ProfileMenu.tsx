import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronDown, LogOut, Sprout } from 'lucide-react'

function firstNameFromEmail(email?: string) {
  const firstPart = email?.split('@')[0]?.split(/[._+-]/)[0]?.replace(/\d+$/, '').trim()
  if (!firstPart) return 'Conta'
  return firstPart.charAt(0).toLocaleUpperCase('pt-BR') + firstPart.slice(1).toLocaleLowerCase('pt-BR')
}

export function ProfileMenu({ email, farmName, onSignOut, mobile = false }: {
  email?: string
  farmName?: string
  onSignOut: () => Promise<void>
  mobile?: boolean
}) {
  const [open, setOpen] = useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const name = firstNameFromEmail(email)
  const menuId = mobile ? 'perfil-menu-mobile' : 'perfil-menu-desktop'

  useEffect(() => {
    if (!open) return
    function handlePointerDown(event: PointerEvent) {
      if (!wrapperRef.current?.contains(event.target as Node)) setOpen(false)
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setOpen(false)
        buttonRef.current?.focus()
      }
    }
    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open])

  return <div ref={wrapperRef} className={mobile ? 'relative border-t border-[#e8f0ea] pt-2' : 'relative'} onBlur={event => {
    if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false)
  }}>
    <button
      ref={buttonRef}
      type="button"
      onClick={() => setOpen(current => !current)}
      aria-expanded={open}
      aria-controls={open ? menuId : undefined}
      aria-label={`Conta de ${name}. ${open ? 'Fechar opções' : 'Abrir opções'}`}
      className={`flex min-h-11 items-center gap-2 rounded-xl text-left transition-colors hover:bg-brand-50 ${mobile ? 'w-full px-3 py-2' : 'px-2 py-1.5'}`}
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-100 text-sm font-bold text-brand-800" aria-hidden="true">{name.slice(0, 2).toLocaleUpperCase('pt-BR')}</span>
      <span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold text-brand-900">{name}</span><span className="block text-xs text-[#617168]">Produtor</span></span>
      <ChevronDown size={17} className={`shrink-0 text-brand-800 transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden="true" />
    </button>
    {open && <div id={menuId} className={mobile ? 'mt-2 rounded-xl border border-[#e0e9e3] bg-white p-2' : 'absolute right-0 top-full z-40 mt-2 w-64 rounded-2xl border border-[#e0e9e3] bg-white p-2 shadow-[0_14px_34px_rgba(19,48,32,.14)]'}>
      <div className="border-b border-[#edf2ee] px-3 py-2.5">
        <p className="text-sm font-semibold text-brand-900">{name}</p>
        {email && <p className="mt-0.5 truncate text-xs text-[#617168]" title={email}>{email}</p>}
        {farmName && <p className="mt-1 truncate text-xs text-[#617168]" title={farmName}>{farmName}</p>}
      </div>
      <Link to="/fazendas" onClick={() => setOpen(false)} className="mt-1 flex min-h-11 items-center gap-2 rounded-xl px-3 text-sm font-semibold text-brand-800 transition-colors hover:bg-brand-50"><Sprout size={17} aria-hidden="true" />Trocar fazenda</Link>
      <button type="button" onClick={() => { setOpen(false); void onSignOut() }} className="mt-1 flex min-h-11 w-full items-center gap-2 rounded-xl px-3 text-left text-sm font-semibold text-red-700 transition-colors hover:bg-red-50">
        <LogOut size={17} aria-hidden="true" />Sair
      </button>
    </div>}
  </div>
}
