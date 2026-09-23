import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { Check, ChevronDown, Search } from 'lucide-react'

type AnimalOption = {
  id: string
  tag: string | null
  name: string | null
}

type AnimalPickerProps = {
  value: string
  onChange: (value: string) => void
  options: AnimalOption[]
  placeholder: string
}

export function AnimalPicker({ value, onChange, options, placeholder }: AnimalPickerProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const pickerRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)
  const menuId = useId()
  const selected = options.find(option => option.id === value)
  const filteredOptions = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase('pt-BR')
    if (!normalized) return options
    return options.filter(option => `${option.name ?? ''} ${option.tag ?? ''}`.toLocaleLowerCase('pt-BR').includes(normalized))
  }, [options, query])

  useEffect(() => {
    if (!open) { setQuery(''); return }
    searchRef.current?.focus()
    function handlePointerDown(event: PointerEvent) {
      if (!pickerRef.current?.contains(event.target as Node)) setOpen(false)
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setOpen(false)
        triggerRef.current?.focus()
      }
    }
    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open])

  function choose(id: string) {
    onChange(id)
    setQuery('')
    setOpen(false)
  }

  return (
    <div className="relative" ref={pickerRef} onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false) }}>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(current => !current)}
        className="flex min-h-11 w-full items-center justify-between rounded-xl border border-[#dce7df] bg-[#fbfdfb] px-3 py-2.5 text-left text-sm text-[#25352b] outline-none transition focus:border-brand-600 focus:ring-2 focus:ring-brand-100"
        aria-label={`${placeholder}: ${selected ? selected.name ?? selected.tag ?? 'Sem nome' : 'nenhum selecionado'}`}
        aria-expanded={open}
        aria-controls={menuId}
      >
        <span className={selected ? '' : 'text-[#87928b]'}>{selected ? (selected.name ?? selected.tag ?? 'Sem nome') : placeholder}</span>
        <ChevronDown size={17} className={`text-[#68776d] transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div id={menuId} className="absolute z-30 mt-2 w-full overflow-hidden rounded-xl border border-[#dce7df] bg-white p-2 shadow-[0_18px_38px_rgba(23,55,38,.16)]">
          <div className="mb-1.5 flex items-center gap-2 rounded-lg bg-[#f5f8f6] px-2.5 py-2">
            <Search size={15} className="text-[#738078]" />
            <input
              ref={searchRef}
              value={query}
              onChange={event => setQuery(event.target.value)}
              placeholder="Buscar animal"
              aria-label="Buscar animal na lista"
              className="min-w-0 flex-1 bg-transparent text-sm text-[#25352b] outline-none placeholder:text-[#8b968f]"
            />
          </div>
          <div className="max-h-52 overflow-y-auto py-1">
            {selected && <button type="button" onClick={() => choose('')} className="flex min-h-11 w-full items-center rounded-lg px-2.5 text-left text-sm font-medium text-[#526158] hover:bg-[#f1f7f3]">Limpar seleção</button>}
            {filteredOptions.length === 0 ? (
              <p className="px-2.5 py-3 text-sm text-[#7c8880]">Nenhum animal encontrado.</p>
            ) : filteredOptions.map(option => {
              const label = option.name ?? option.tag ?? 'Sem nome'
              const detail = option.name && option.tag ? option.tag : null
              const isSelected = option.id === value
              return (
                <button
                  key={option.id}
                  type="button"
                  aria-current={isSelected ? 'true' : undefined}
                  onClick={() => choose(option.id)}
                  className="flex min-h-11 w-full items-center justify-between rounded-lg px-2.5 py-2 text-left transition hover:bg-[#f1f7f3]"
                >
                  <span><span className="block text-sm font-semibold text-[#26372c]">{label}</span>{detail && <span className="block text-xs text-[#78857e]">{detail}</span>}</span>
                  {isSelected && <Check size={16} className="shrink-0 text-brand-700" />}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
