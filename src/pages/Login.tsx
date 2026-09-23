import { useState, FormEvent } from 'react'
import { Navigate } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

type Mode = 'login' | 'register' | 'reset'

export function Login() {
  const { session } = useAuth()
  const [mode, setMode] = useState<Mode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [loading, setLoading] = useState(false)

  if (session) return <Navigate to="/" replace />

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setInfo('')
    setLoading(true)

    if (mode === 'login') {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setError(error.message)
    } else {
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) setError(error.message)
      else setInfo('Conta criada! Verifique seu e-mail para confirmar.')
    }

    setLoading(false)
  }

  async function handlePasswordReset(event: FormEvent) {
    event.preventDefault()
    setError('')
    setInfo('')

    if (!email) {
      setError('Informe seu e-mail para receber o link de redefinição.')
      return
    }

    setLoading(true)
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/redefinir-senha`,
    })

    if (error) setError(error.message)
    else setInfo('Enviamos um link para redefinir sua senha. Verifique seu e-mail.')
    setLoading(false)
  }

  return (
    <main
      className="relative flex min-h-screen items-center justify-center overflow-hidden bg-brand-900 bg-cover bg-center p-5 sm:p-8"
      style={{ backgroundImage: "url('/images/login-landscape-sunset.png')" }}
    >
      <div className="absolute inset-0 bg-black/30" aria-hidden="true" />

      <section className="relative w-full max-w-md rounded-3xl border border-white/55 bg-white/80 p-6 shadow-[0_24px_65px_rgba(7,30,18,.38)] backdrop-blur-md sm:p-8">
        <header className="mb-7 text-center">
          <img src="/brand/manejo-logo-transparent.png" alt="Manejo — Gestão pecuária" width="2072" height="759" className="mx-auto h-auto w-[290px] max-w-full" />
          <h1 className="sr-only">Entrar no Manejo</h1>
          <p className="mt-1 text-sm text-brand-800">
            {mode === 'reset' ? 'Informe seu e-mail e enviaremos um link seguro para criar uma nova senha.' : 'Gestão inteligente do seu rebanho'}
          </p>
        </header>

        <div>
          {mode !== 'reset' && <div className="mb-6 flex overflow-hidden rounded-xl border border-brand-200/80 bg-white/55 p-1">
            <button
              onClick={() => { setMode('login'); setError(''); setInfo('') }}
              className={`flex-1 rounded-lg py-2 text-sm font-semibold transition-colors
                ${mode === 'login' ? 'bg-brand-700 text-white shadow-sm' : 'text-brand-800 hover:bg-white/70'}`}
            >
              Entrar
            </button>
            <button
              onClick={() => { setMode('register'); setError(''); setInfo('') }}
              className={`flex-1 rounded-lg py-2 text-sm font-semibold transition-colors
                ${mode === 'register' ? 'bg-brand-700 text-white shadow-sm' : 'text-brand-800 hover:bg-white/70'}`}
            >
              Criar conta
            </button>
          </div>}

          <form onSubmit={mode === 'reset' ? handlePasswordReset : handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="login-email" className="block text-sm font-medium text-gray-700 mb-1">E-mail</label>
              <input
                id="login-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="w-full rounded-xl border border-white/80 bg-white/80 px-3 py-2.5 text-sm outline-none placeholder:text-gray-400"
                placeholder="seu@email.com"
              />
            </div>
            {mode !== 'reset' && <div>
              <label htmlFor="login-password" className="block text-sm font-medium text-gray-700 mb-1">Senha</label>
              <div className="relative">
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full rounded-xl border border-white/80 bg-white/80 px-3 py-2.5 pr-11 text-sm outline-none placeholder:text-gray-400"
                  placeholder="mínimo 6 caracteres"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(current => !current)}
                  className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-brand-800 transition-colors hover:text-brand-600"
                  aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <div className="mt-2 text-right">
                <button
                  type="button"
                  onClick={() => { setMode('reset'); setError(''); setInfo('') }}
                  disabled={loading}
                  className="text-sm font-medium text-brand-800 underline-offset-4 transition-colors hover:text-brand-600 hover:underline disabled:opacity-60"
                >
                  Esqueceu sua senha?
                </button>
              </div>
            </div>}

            {error && <p role="alert" className="rounded-lg bg-red-50/90 px-3 py-2 text-sm text-red-700">{error}</p>}
            {info && <p role="status" className="rounded-lg bg-brand-50/90 px-3 py-2 text-sm text-brand-800">{info}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-brand-700 py-3 font-semibold text-white shadow-[0_8px_18px_rgba(31,73,51,.28)] transition-colors hover:bg-brand-800 disabled:opacity-60"
            >
              {loading ? 'Aguarde...' : mode === 'login' ? 'Entrar' : mode === 'register' ? 'Criar conta' : 'Enviar link de redefinição'}
            </button>

            {mode === 'reset' && (
              <button
                type="button"
                onClick={() => { setMode('login'); setError(''); setInfo('') }}
                className="w-full py-1 text-sm font-medium text-brand-800 transition-colors hover:text-brand-600 hover:underline"
              >
                Voltar para entrar
              </button>
            )}
          </form>
        </div>
      </section>
    </main>
  )
}
