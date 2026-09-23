import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

type PageHeaderProps = {
  backTo: string
  kicker: string
  title: string
  description?: string
  actions?: ReactNode
  className?: string
}

export function PageHeader({ backTo, kicker, title, description, actions, className = '' }: PageHeaderProps) {
  return (
    <header className={`flex flex-wrap items-start justify-between gap-4 ${className}`}>
      <div className="flex min-w-0 items-start gap-3">
        <Link to={backTo} aria-label="Voltar" className="mt-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[#e1ebe4] bg-white text-brand-800 transition-colors hover:bg-brand-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700">
          <ArrowLeft size={19} aria-hidden="true" />
        </Link>
        <div className="min-w-0">
          <p className="page-kicker">{kicker}</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-[#17231b]">{title}</h1>
          {description && <p className="mt-1 text-sm text-[#526158]">{description}</p>}
        </div>
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2 sm:pt-1">{actions}</div>}
    </header>
  )
}
