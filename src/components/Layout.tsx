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
  const itemClass = (to: string) => `flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition-all ${location.pathname === to ? 'bg-white text-brand-900 shadow-sm' : 'text-brand-100 hover:bg-white/10 hover:text-white'}`

  return <div className="min-h-screen bg-[#f4f7f5] flex flex-col">
    <header className="sticky top-0 z-30 border-b border-white/10 bg-[#163c29]/95 text-white shadow-[0_5px_25px_rgba(10,41,26,.12)] backdrop-blur">
      <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-5 lg:px-8">
        <Link to="/" className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#82ad76] text-[#173c2a] shadow-sm"><Sprout size={20} strokeWidth={2.2} /></span><span><span className="block text-sm font-bold tracking-wide">{farm?.name ?? 'Rebanho'}</span><span className="block text-[11px] text-brand-200">Gestão pecuária</span></span></Link>
        <nav className="hidden items-center gap-1 md:flex">{navItems.map(({ to, label, icon: Icon }) => <Link key={to} to={to} className={itemClass(to)}><Icon size={15} />{label}</Link>)}<button onClick={handleSignOut} className="ml-2 flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-brand-100 transition-colors hover:bg-white/10"><LogOut size={15} />Sair</button></nav>
        <button className="p-2 hover:bg-white/10 md:hidden" onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? <X size={20} /> : <Menu size={20} />}</button>
      </div>
      {menuOpen && <nav className="flex flex-col gap-1 border-t border-white/10 px-4 py-2 md:hidden">{navItems.map(({ to, label, icon: Icon }) => <Link key={to} to={to} onClick={() => setMenuOpen(false)} className={`${itemClass(to)} py-2`}><Icon size={16} />{label}<ChevronRight size={14} className="ml-auto" /></Link>)}<button onClick={handleSignOut} className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-brand-100 hover:bg-white/10"><LogOut size={16} />Sair</button></nav>}
    </header>
    <main className="flex-1 mx-auto w-full max-w-7xl px-5 py-7 lg:px-8 lg:py-10">{children}</main>
    <nav className="fixed bottom-0 left-0 right-0 z-30 flex border-t border-[#e0e9e3] bg-white/95 backdrop-blur md:hidden">{navItems.map(({ to, label, icon: Icon }) => <Link key={to} to={to} className={`flex flex-1 flex-col items-center py-2 text-xs font-medium ${location.pathname === to ? 'text-brand-700' : 'text-gray-500'}`}><Icon size={20} className="mb-0.5" />{label}</Link>)}</nav>
    <div className="h-16 md:hidden" />
  </div>
}
