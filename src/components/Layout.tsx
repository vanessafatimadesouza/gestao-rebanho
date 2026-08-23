import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, PawPrint, Syringe, Baby,
  LogOut, Menu, X, ChevronRight,
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/animais', label: 'Animais', icon: PawPrint },
  { to: '/vacinas', label: 'Vacinas', icon: Syringe },
  { to: '/partos', label: 'Partos', icon: Baby },
]

export function Layout({ children }: { children: React.ReactNode }) {
  const { farm, user, signOut } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)

  async function handleSignOut() {
    await signOut()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Top bar */}
      <header className="bg-brand-700 text-white shadow-md">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🐄</span>
            <div className="leading-tight">
              <div className="font-bold text-sm leading-none">{farm?.name ?? 'Rebanho'}</div>
              <div className="text-brand-200 text-xs">{user?.email}</div>
            </div>
          </div>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-sm font-medium transition-colors
                  ${location.pathname === to
                    ? 'bg-brand-600 text-white'
                    : 'text-brand-100 hover:bg-brand-600'
                  }`}
              >
                <Icon size={15} />
                {label}
              </Link>
            ))}
            <button
              onClick={handleSignOut}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded text-sm font-medium text-brand-100 hover:bg-brand-600 transition-colors ml-2"
            >
              <LogOut size={15} />
              Sair
            </button>
          </nav>

          {/* Mobile hamburger */}
          <button
            className="md:hidden p-2 rounded hover:bg-brand-600"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Mobile nav */}
        {menuOpen && (
          <nav className="md:hidden border-t border-brand-600 px-4 py-2 flex flex-col gap-1">
            {navItems.map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                onClick={() => setMenuOpen(false)}
                className={`flex items-center gap-2 px-3 py-2 rounded text-sm font-medium transition-colors
                  ${location.pathname === to
                    ? 'bg-brand-600 text-white'
                    : 'text-brand-100 hover:bg-brand-600'
                  }`}
              >
                <Icon size={16} />
                {label}
                <ChevronRight size={14} className="ml-auto" />
              </Link>
            ))}
            <button
              onClick={handleSignOut}
              className="flex items-center gap-2 px-3 py-2 rounded text-sm font-medium text-brand-100 hover:bg-brand-600 transition-colors"
            >
              <LogOut size={16} />
              Sair
            </button>
          </nav>
        )}
      </header>

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-6">
        {children}
      </main>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex">
        {navItems.map(({ to, label, icon: Icon }) => (
          <Link
            key={to}
            to={to}
            className={`flex-1 flex flex-col items-center py-2 text-xs font-medium transition-colors
              ${location.pathname === to
                ? 'text-brand-700'
                : 'text-gray-500 hover:text-brand-700'
              }`}
          >
            <Icon size={20} className="mb-0.5" />
            {label}
          </Link>
        ))}
      </nav>

      {/* Bottom padding for mobile nav */}
      <div className="md:hidden h-16" />
    </div>
  )
}
