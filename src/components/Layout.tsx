import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { LayoutDashboard, Tag, Syringe, CalendarHeart, Menu, X, ChevronRight } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { ProfileMenu } from './ProfileMenu'

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard }, { to: '/animais', label: 'Animais', icon: Tag },
  { to: '/vacinas', label: 'Vacinas', icon: Syringe }, { to: '/partos', label: 'Partos', icon: CalendarHeart },
]

export function Layout({ children }: { children: React.ReactNode }) {
  const { farm, user, signOut } = useAuth(); const location = useLocation(); const navigate = useNavigate(); const [menuOpen, setMenuOpen] = useState(false)
  async function handleSignOut() { await signOut(); navigate('/login') }
  const isCurrent = (to: string) => to === '/' ? location.pathname === to : location.pathname === to || location.pathname.startsWith(`${to}/`)
  const itemClass = (to: string) => `flex items-center gap-2 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-all ${isCurrent(to) ? 'bg-brand-50 text-brand-900' : 'text-[#304238] hover:bg-brand-50 hover:text-brand-900'}`

  return <div className="min-h-screen bg-[#f6faf7] flex flex-col">
    <a className="skip-link" href="#conteudo-principal">Pular para o conteúdo principal</a>
    <header className="sticky top-0 z-30 border-b border-[#e8f0ea] bg-white/95 text-[#173326] shadow-[0_2px_18px_rgba(18,57,35,.04)] backdrop-blur">
      <div className="mx-auto flex h-[70px] max-w-[1440px] items-center justify-between px-5 lg:px-8">
        <Link to="/" className="inline-flex shrink-0 items-center" aria-label="Manejo — página inicial"><img src="/brand/manejo-logo-transparent.png" alt="" width="2072" height="759" className="h-[58px] w-auto max-w-[176px] object-contain" /></Link>
        <nav aria-label="Navegação principal" className="hidden items-center gap-2 md:flex">{navItems.map(({ to, label, icon: Icon }) => <Link key={to} to={to} aria-current={isCurrent(to) ? 'page' : undefined} className={itemClass(to)}><Icon size={18} aria-hidden="true" />{label}</Link>)}<span className="mx-2 h-7 w-px bg-[#dbe6de]" /><ProfileMenu email={user?.email} farmName={farm?.name} onSignOut={handleSignOut} /></nav>
        <button className="flex h-11 w-11 items-center justify-center rounded-xl hover:bg-brand-50 md:hidden" onClick={() => setMenuOpen(!menuOpen)} aria-label={menuOpen ? 'Fechar menu' : 'Abrir menu'} aria-expanded={menuOpen}>{menuOpen ? <X size={20} /> : <Menu size={20} />}</button>
      </div>
      {menuOpen && <nav aria-label="Menu móvel" className="flex flex-col gap-1 border-t border-[#e8f0ea] px-4 py-2 md:hidden">{navItems.map(({ to, label, icon: Icon }) => <Link key={to} to={to} onClick={() => setMenuOpen(false)} aria-current={isCurrent(to) ? 'page' : undefined} className={`${itemClass(to)} min-h-11 py-2`}><Icon size={18} aria-hidden="true" />{label}<ChevronRight size={14} className="ml-auto" aria-hidden="true" /></Link>)}<ProfileMenu email={user?.email} farmName={farm?.name} onSignOut={handleSignOut} mobile /></nav>}
    </header>
    <main id="conteudo-principal" tabIndex={-1} className="mx-auto w-full max-w-[1360px] flex-1 px-4 py-6 pb-32 sm:px-10 md:pb-[96px] lg:px-16 lg:pt-8 xl:px-20">{children}</main>
    <footer className="app-footer hidden md:block">
      <svg className="app-footer-waves" aria-hidden="true" viewBox="0 0 430 92" preserveAspectRatio="none">
        <path d="M0 7C77 46 165 25 279 60C329 75 375 86 430 92H0V7Z" fill="#d8e8dc" />
        <path d="M0 17C82 53 164 34 270 63C327 79 373 88 430 92H0V17Z" fill="#8db79a" />
        <path d="M0 27C87 60 164 43 260 67C322 82 370 89 430 92H0V27Z" fill="#185b3b" />
      </svg>
    </footer>
    <nav aria-label="Navegação inferior" className="mobile-bottom-nav fixed bottom-0 left-0 right-0 z-50 flex border-t border-[#e0e9e3] bg-white pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_22px_rgba(21,57,37,.08)] md:hidden">{navItems.map(({ to, label, icon: Icon }) => <Link key={to} to={to} aria-current={isCurrent(to) ? 'page' : undefined} className={`flex min-h-[56px] flex-1 flex-col items-center justify-center py-2 text-xs font-medium ${isCurrent(to) ? 'text-brand-700' : 'text-gray-500'}`}><Icon size={20} className="mb-0.5" aria-hidden="true" />{label}</Link>)}</nav>
  </div>
}
