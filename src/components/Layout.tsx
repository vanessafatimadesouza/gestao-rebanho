import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { LayoutDashboard, PawPrint, Syringe, Baby, LogOut, Menu, X, ChevronRight, Sprout } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard }, { to: '/animais', label: 'Animais', icon: PawPrint },
  { to: '/vacinas', label: 'Vacinas', icon: Syringe }, { to: '/partos', label: 'Partos', icon: Baby },
]

export function Layout({ children }: { children: React.ReactNode }) {
  const { farm, signOut } = useAuth(); const location = useLocation(); const navigate = useNavigate(); const [menuOpen, setMenuOpen] = useState(false)
  async function handleSignOut() { await signOut(); navigate('/login') }
  const itemClass = (to: string) => `flex items-center gap-2 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-all ${location.pathname === to ? 'bg-brand-50 text-brand-900' : 'text-[#304238] hover:bg-brand-50 hover:text-brand-900'}`

  return <div className="min-h-screen bg-[#f6faf7] flex flex-col">
    <header className="sticky top-0 z-30 border-b border-[#e8f0ea] bg-white/95 text-[#173326] shadow-[0_2px_18px_rgba(18,57,35,.04)] backdrop-blur">
      <div className="mx-auto flex h-[70px] max-w-[1440px] items-center justify-between px-5 lg:px-8">
        <Link to="/" className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-700 text-[#d8e97a] shadow-sm"><Sprout size={21} strokeWidth={2.5} /></span><span><span className="block text-[22px] font-bold leading-5 tracking-tight text-brand-900">manejo</span><span className="mt-1 block text-[11px] text-[#819086]">Gestão pecuária</span></span></Link>
        <nav className="hidden items-center gap-2 md:flex">{navItems.map(({ to, label, icon: Icon }) => <Link key={to} to={to} className={itemClass(to)}><Icon size={17} />{label}</Link>)}<span className="mx-3 h-7 w-px bg-[#dbe6de]" /><button onClick={handleSignOut} className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-semibold text-[#304238] transition-colors hover:bg-brand-50 hover:text-brand-900"><LogOut size={17} />Sair</button><span className="ml-3 flex h-10 w-10 items-center justify-center rounded-full bg-brand-100 text-sm font-bold text-brand-800">{farm?.name?.slice(0, 2).toUpperCase() ?? 'FA'}</span><span className="hidden text-left lg:block"><span className="block text-xs font-semibold text-brand-900">{farm?.name ?? 'Sua fazenda'}</span><span className="block text-[11px] text-[#819086]">Produtor</span></span></nav>
        <button className="rounded-lg p-2 hover:bg-brand-50 md:hidden" onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? <X size={20} /> : <Menu size={20} />}</button>
      </div>
      {menuOpen && <nav className="flex flex-col gap-1 border-t border-[#e8f0ea] px-4 py-2 md:hidden">{navItems.map(({ to, label, icon: Icon }) => <Link key={to} to={to} onClick={() => setMenuOpen(false)} className={`${itemClass(to)} py-2`}><Icon size={16} />{label}<ChevronRight size={14} className="ml-auto" /></Link>)}<button onClick={handleSignOut} className="flex items-center gap-2 px-3 py-2 text-sm font-semibold text-[#304238] hover:bg-brand-50"><LogOut size={16} />Sair</button></nav>}
    </header>
    <main className="mx-auto w-full max-w-[1360px] flex-1 px-8 py-6 sm:px-10 md:pb-[112px] lg:px-16 lg:pt-8 xl:px-20">{children}</main>
    <footer className="app-footer hidden md:block">
      <svg className="app-footer-waves" aria-hidden="true" viewBox="0 0 430 92" preserveAspectRatio="none">
        <path d="M0 7C77 46 165 25 279 60C329 75 375 86 430 92H0V7Z" fill="#d8e8dc" />
        <path d="M0 17C82 53 164 34 270 63C327 79 373 88 430 92H0V17Z" fill="#8db79a" />
        <path d="M0 27C87 60 164 43 260 67C322 82 370 89 430 92H0V27Z" fill="#185b3b" />
      </svg>
      <div className="app-footer-content">
        <div className="app-footer-brand">
          <Sprout size={16} strokeWidth={2.5} />
          <strong>manejo</strong>
          <span className="app-footer-separator" />
          <span>Gestão pecuária</span>
        </div>
        <div className="app-footer-signature">
          <span>Pecuária hoje. Um futuro maior amanhã.</span>
          <span className="app-footer-line" />
        </div>
      </div>
    </footer>
    <nav className="fixed bottom-0 left-0 right-0 z-30 flex border-t border-[#e0e9e3] bg-white/95 backdrop-blur md:hidden">{navItems.map(({ to, label, icon: Icon }) => <Link key={to} to={to} className={`flex flex-1 flex-col items-center py-2 text-xs font-medium ${location.pathname === to ? 'text-brand-700' : 'text-gray-500'}`}><Icon size={20} className="mb-0.5" />{label}</Link>)}</nav>
    <div className="h-16 md:hidden" />
  </div>
}
