import { FormEvent, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'
import { supabase } from '../lib/supabase'

export function ResetPassword() {
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError('')

    if (password !== confirmation) {
      setError('As senhas não coincidem.')
      return
    }

    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password })
    setLoading(false)

    if (error) {
      setError(error.message)
      return
    }

    navigate('/')
  }

  return (
    <main
      className="relative flex min-h-screen items-center justify-center overflow-hidden bg-brand-900 bg-cover bg-center p-5 sm:p-8"
      style={{ backgroundImage: "url('/images/login-pasture-hd-cool.png')" }}
    >
      <div className="absolute inset-0 bg-black/50" aria-hidden="true" />
      <section className="relative w-full max-w-md rounded-3xl border border-white/55 bg-white/70 p-6 shadow-[0_24px_65px_rgba(7,30,18,.38)] backdrop-blur-md sm:p-8">
        <h1 className="text-center text-2xl font-bold tracking-tight text-brand-900">Redefinir senha</h1>
        <p className="mt-2 text-center text-sm text-brand-800">Escolha uma nova senha para sua conta.</p>

        <form onSubmit={handleSubmit} className="mt-7 space-y-4">
          <div>
            <label htmlFor="new-password" className="mb-1 block text-sm font-medium text-gray-700">Nova senha</label>
            <div className="relative">
              <input
                id="new-password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                value={password}
                onChange={event => setPassword(event.target.value)}
                minLength={6}
                required
                className="w-full rounded-xl border border-white/80 bg-white/80 px-3 py-2.5 pr-11 text-sm outline-none"
                placeholder="mínimo 6 caracteres"
              />
              <button type="button" onClick={() => setShowPassword(current => !current)} className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-brand-800 hover:text-brand-600" aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}>
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
          <div>
            <label htmlFor="confirm-password" className="mb-1 block text-sm font-medium text-gray-700">Confirmar nova senha</label>
            <div className="relative">
              <input
                id="confirm-password"
                type={showConfirmation ? 'text' : 'password'}
                autoComplete="new-password"
                value={confirmation}
                onChange={event => setConfirmation(event.target.value)}
                minLength={6}
                required
                className="w-full rounded-xl border border-white/80 bg-white/80 px-3 py-2.5 pr-11 text-sm outline-none"
                placeholder="repita a nova senha"
              />
              <button type="button" onClick={() => setShowConfirmation(current => !current)} className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-brand-800 hover:text-brand-600" aria-label={showConfirmation ? 'Ocultar senha' : 'Mostrar senha'}>
                {showConfirmation ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {error && <p role="alert" className="rounded-lg bg-red-50/90 px-3 py-2 text-sm text-red-700">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-brand-700 py-3 font-semibold text-white shadow-[0_8px_18px_rgba(31,73,51,.28)] transition-colors hover:bg-brand-800 disabled:opacity-60"
          >
            {loading ? 'Salvando...' : 'Salvar nova senha'}
          </button>
        </form>

        <Link to="/login" className="mt-5 block text-center text-sm font-medium text-brand-800 hover:underline">
          Voltar para entrar
        </Link>
      </section>
    </main>
  )
}
