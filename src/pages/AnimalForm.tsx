import { useState, FormEvent, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { Animal } from '../types'

export function AnimalForm() {
  const { farm, user } = useAuth()
  const navigate = useNavigate()
  const { id } = useParams<{ id?: string }>()
  const isEdit = Boolean(id)

  const [tag, setTag] = useState('')
  const [name, setName] = useState('')
  const [sex, setSex] = useState<'M' | 'F'>('F')
  const [breed, setBreed] = useState('')
  const [birthDate, setBirthDate] = useState('')
  const [motherTag, setMotherTag] = useState('')
  const [fatherTag, setFatherTag] = useState('')
  const [status, setStatus] = useState<Animal['status']>('active')
  const [notes, setNotes] = useState('')
  const [mothers, setMothers] = useState<Pick<Animal, 'id' | 'tag' | 'name'>[]>([])
  const [motherId, setMotherId] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (farm) loadMothers()
    if (isEdit && id) loadAnimal(id)
  }, [farm, id])

  async function loadMothers() {
    const { data } = await supabase
      .from('animals')
      .select('id, tag, name')
      .eq('farm_id', farm!.id)
      .eq('sex', 'F')
      .eq('status', 'active')
      .order('tag')
    if (data) setMothers(data)
  }

  async function loadAnimal(animalId: string) {
    const { data } = await supabase
      .from('animals')
      .select('*')
      .eq('id', animalId)
      .single()
    if (data) {
      setTag(data.tag)
      setName(data.name ?? '')
      setSex(data.sex)
      setBreed(data.breed ?? '')
      setBirthDate(data.birth_date ?? '')
      setMotherId(data.mother_id ?? '')
      setFatherTag(data.father_tag ?? '')
      setStatus(data.status)
      setNotes(data.notes ?? '')
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!farm || !user) return
    setError('')
    setLoading(true)

    const payload = {
      farm_id: farm.id,
      tag: tag.trim(),
      name: name.trim() || null,
      sex,
      breed: breed.trim() || null,
      birth_date: birthDate || null,
      mother_id: motherId || null,
      father_tag: fatherTag.trim() || null,
      status,
      notes: notes.trim() || null,
    }

    const { error: err } = isEdit
      ? await supabase.from('animals').update(payload).eq('id', id!)
      : await supabase.from('animals').insert(payload)

    if (err) {
      setError(err.code === '23505' ? 'Brinco já cadastrado nesta fazenda.' : err.message)
      setLoading(false)
      return
    }

    navigate('/animais')
  }

  const inputClass = 'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500'
  const labelClass = 'block text-sm font-medium text-gray-700 mb-1'

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-lg">
          <ArrowLeft size={18} />
        </button>
        <h1 className="text-xl font-bold text-gray-800">
          {isEdit ? 'Editar animal' : 'Novo animal'}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Brinco / Identificação *</label>
            <input
              type="text"
              value={tag}
              onChange={e => setTag(e.target.value)}
              required
              className={inputClass}
              placeholder="Ex: 1234"
            />
          </div>
          <div>
            <label className={labelClass}>Nome (opcional)</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              className={inputClass}
              placeholder="Ex: Mimosa"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Sexo *</label>
            <select value={sex} onChange={e => setSex(e.target.value as 'M' | 'F')} className={inputClass}>
              <option value="F">Fêmea</option>
              <option value="M">Macho</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>Raça</label>
            <input
              type="text"
              value={breed}
              onChange={e => setBreed(e.target.value)}
              className={inputClass}
              placeholder="Ex: Nelore"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Data de nascimento</label>
            <input type="date" value={birthDate} onChange={e => setBirthDate(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Status</label>
            <select value={status} onChange={e => setStatus(e.target.value as Animal['status'])} className={inputClass}>
              <option value="active">Ativo</option>
              <option value="sold">Vendido</option>
              <option value="dead">Morto</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Mãe</label>
            <select value={motherId} onChange={e => setMotherId(e.target.value)} className={inputClass}>
              <option value="">— Selecionar —</option>
              {mothers.map(m => (
                <option key={m.id} value={m.id}>
                  {m.tag}{m.name ? ` (${m.name})` : ''}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>Touro / Sêmen (pai)</label>
            <input
              type="text"
              value={fatherTag}
              onChange={e => setFatherTag(e.target.value)}
              className={inputClass}
              placeholder="Ex: Boi 99 / Semex"
            />
          </div>
        </div>

        <div>
          <label className={labelClass}>Observações</label>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            rows={3}
            className={inputClass}
            placeholder="Informações adicionais..."
          />
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
            {loading ? 'Salvando...' : isEdit ? 'Salvar' : 'Cadastrar'}
          </button>
        </div>
      </form>
    </div>
  )
}
