import { useEffect, useState, FormEvent } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { Plus, ArrowLeft } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { Birth, Animal } from '../types'

export function BirthsList() {
  const { farm } = useAuth()
  const [births, setBirths] = useState<Birth[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (farm) load()
  }, [farm])

  async function load() {
    const { data } = await supabase
      .from('births')
      .select('*, mother:animals!mother_id(id, tag, name), calf:animals!calf_id(id, tag, name)')
      .eq('farm_id', farm!.id)
      .order('birth_date', { ascending: false })
    if (data) setBirths(data as Birth[])
    setLoading(false)
  }

  const BIRTH_LABEL: Record<Birth['birth_type'], string> = {
    natural: 'Natural', assisted: 'Assistido', cesarean: 'Cesárea',
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-800">Partos</h1>
        <Link
          to="/partos/novo"
          className="flex items-center gap-1.5 bg-brand-700 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-brand-800 transition-colors"
        >
          <Plus size={16} /> Novo
        </Link>
      </div>

      {loading ? (
        <div className="text-center text-gray-400 py-12">Carregando...</div>
      ) : births.length === 0 ? (
        <div className="text-center text-gray-400 py-12">
          <p>Nenhum parto registrado.</p>
          <Link to="/partos/novo" className="mt-2 inline-block text-brand-700 hover:underline text-sm">
            Registrar primeiro parto →
          </Link>
        </div>
      ) : (
        <div className="grid gap-2">
          {births.map(b => {
            const mother = b.mother as unknown as Animal | null
            const calf = b.calf as unknown as Animal | null
            return (
              <div key={b.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1">
                    <p className="font-semibold text-gray-800 text-sm">
                      Parto {BIRTH_LABEL[b.birth_type]}
                    </p>
                    {mother && (
                      <p className="text-xs text-gray-500">
                        Mãe:{' '}
                        <Link to={`/animais/${mother.id}`} className="text-brand-700 hover:underline">
                          {mother.name ?? mother.tag ?? 'Sem nome'}
                        </Link>
                      </p>
                    )}
                    {calf && (
                      <p className="text-xs text-gray-500">
                        Cria:{' '}
                        <Link to={`/animais/${calf.id}`} className="text-brand-700 hover:underline">
                          {calf.name ?? calf.tag ?? 'Sem nome'}
                        </Link>
                      </p>
                    )}
                    {b.notes && <p className="text-xs text-gray-400">{b.notes}</p>}
                  </div>
                  <p className="text-xs text-gray-500 shrink-0">
                    {new Date(b.birth_date + 'T12:00:00').toLocaleDateString('pt-BR')}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export function BirthForm() {
  const { farm, user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const preAnimalId = new URLSearchParams(location.search).get('animal') ?? ''

  const [females, setFemales] = useState<Pick<Animal, 'id' | 'tag' | 'name'>[]>([])
  const [motherId, setMotherId] = useState(preAnimalId)
  const [birthDate, setBirthDate] = useState(new Date().toISOString().split('T')[0])
  const [birthType, setBirthType] = useState<Birth['birth_type']>('natural')
  const [notes, setNotes] = useState('')
  // Calf fields (optional)
  const [calfName, setCalfName] = useState('')
  const [calfSex, setCalfSex] = useState<'M' | 'F'>('F')
  const [registerCalf, setRegisterCalf] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (farm) loadFemales()
  }, [farm])

  async function loadFemales() {
    const { data } = await supabase
      .from('animals')
      .select('id, tag, name')
      .eq('farm_id', farm!.id)
      .eq('sex', 'F')
      .eq('status', 'active')
      .order('tag')
    if (data) setFemales(data)
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!farm || !user) return
    setError('')
    setLoading(true)

    let calfId: string | null = null

    // Create calf animal first if requested
    if (registerCalf && calfName.trim()) {
      const { data: calf, error: calfErr } = await supabase
        .from('animals')
        .insert({
          farm_id: farm.id,
          tag: null,
          name: calfName.trim(),
          sex: calfSex,
          birth_date: birthDate,
          mother_id: motherId || null,
          status: 'active',
        })
        .select()
        .single()

      if (calfErr) {
        setError(calfErr.message)
        setLoading(false)
        return
      }
      calfId = calf.id
    }

    const { error: birthErr } = await supabase.from('births').insert({
      mother_id: motherId || null,
      farm_id: farm.id,
      birth_date: birthDate,
      calf_id: calfId,
      birth_type: birthType,
      notes: notes.trim() || null,
      created_by: user.id,
    })

    if (birthErr) { setError(birthErr.message); setLoading(false); return }
    if (motherId) await supabase.from('pregnancies').update({ status: 'gave_birth' }).eq('mother_id', motherId).eq('status', 'pregnant')
    navigate(preAnimalId ? `/animais/${preAnimalId}` : '/partos')
  }

  const inputClass = 'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500'
  const labelClass = 'block text-sm font-medium text-gray-700 mb-1'

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-lg">
          <ArrowLeft size={18} />
        </button>
        <h1 className="text-xl font-bold text-gray-800">Registrar parto</h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 space-y-4">
        <div>
          <label className={labelClass}>Mãe *</label>
          <select value={motherId} onChange={e => setMotherId(e.target.value)} required className={inputClass}>
            <option value="">— Selecionar fêmea —</option>
            {females.map(a => (
              <option key={a.id} value={a.id}>
                {a.name ?? a.tag ?? 'Sem nome'}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Data do parto *</label>
            <input type="date" value={birthDate} onChange={e => setBirthDate(e.target.value)} required className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Tipo de parto</label>
            <select value={birthType} onChange={e => setBirthType(e.target.value as Birth['birth_type'])} className={inputClass}>
              <option value="natural">Natural</option>
              <option value="assisted">Assistido</option>
              <option value="cesarean">Cesárea</option>
            </select>
          </div>
        </div>

        <div>
          <label className={labelClass}>Observações</label>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            rows={2}
            className={inputClass}
            placeholder="Intercorrências, observações..."
          />
        </div>

        {/* Calf registration */}
        <div className="border border-gray-200 rounded-lg p-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={registerCalf}
              onChange={e => setRegisterCalf(e.target.checked)}
              className="rounded text-brand-700"
            />
            <span className="text-sm font-medium text-gray-700">Cadastrar a cria agora</span>
          </label>

          {registerCalf && (
            <div className="mt-3 space-y-3">
              <div>
                <div>
                  <label className={labelClass}>Sexo da cria *</label>
                  <select value={calfSex} onChange={e => setCalfSex(e.target.value as 'M' | 'F')} className={inputClass}>
                    <option value="F">Fêmea</option>
                    <option value="M">Macho</option>
                  </select>
                </div>
              </div>
              <div>
                <label className={labelClass}>Nome da cria *</label>
                <input
                  type="text"
                  value={calfName}
                  onChange={e => setCalfName(e.target.value)}
                  className={inputClass}
                  required={registerCalf}
                  placeholder="Ex: Pintada"
                />
              </div>
            </div>
          )}
        </div>

        {error && <p className="text-red-600 text-sm bg-red-50 rounded-lg px-3 py-2">{error}</p>}

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex-1 border border-gray-300 text-gray-700 font-medium py-2.5 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-brand-700 text-white font-medium py-2.5 rounded-lg hover:bg-brand-800 transition-colors disabled:opacity-60"
          >
            {loading ? 'Salvando...' : 'Registrar'}
          </button>
        </div>
      </form>
    </div>
  )
}
