import { useEffect, useState, FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, ImagePlus, X } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { Animal } from '../types'

type ParentOption = Pick<Animal, 'id' | 'name' | 'tag'>

const displayName = (animal: ParentOption) => animal.name ?? animal.tag ?? 'Sem nome'

export function AnimalForm() {
  const { farm, user } = useAuth()
  const navigate = useNavigate()
  const { id } = useParams<{ id?: string }>()
  const isEdit = Boolean(id)
  const [name, setName] = useState('')
  const [sex, setSex] = useState<'M' | 'F'>('F')
  const [breed, setBreed] = useState('')
  const [birthDate, setBirthDate] = useState('')
  const [mothers, setMothers] = useState<ParentOption[]>([])
  const [fathers, setFathers] = useState<ParentOption[]>([])
  const [motherName, setMotherName] = useState('')
  const [fatherName, setFatherName] = useState('')
  const [motherId, setMotherId] = useState('')
  const [fatherId, setFatherId] = useState('')
  const [status, setStatus] = useState<Animal['status']>('active')
  const [imageUrl, setImageUrl] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (farm) loadParents()
    if (isEdit && id) loadAnimal(id)
  }, [farm, id])

  async function loadParents() {
    const { data } = await supabase.from('animals').select('id, name, tag, sex').eq('farm_id', farm!.id).eq('status', 'active').order('name')
    if (!data) return
    setMothers(data.filter(a => a.sex === 'F') as ParentOption[])
    setFathers(data.filter(a => a.sex === 'M') as ParentOption[])
  }

  async function loadAnimal(animalId: string) {
    const { data } = await supabase.from('animals').select('*').eq('id', animalId).single()
    if (!data) return
    setName(data.name ?? '')
    setSex(data.sex)
    setBreed(data.breed ?? '')
    setBirthDate(data.birth_date ? data.birth_date.split('-').reverse().join('/') : '')
    setMotherId(data.mother_id ?? '')
    setFatherId(data.father_id ?? '')
    setMotherName(data.mother_name ?? '')
    setFatherName(data.father_tag ?? '')
    setStatus(data.status)
    setImageUrl(data.image_url ?? '')
  }

  function chooseParent(value: string, parents: ParentOption[], setId: (id: string) => void) {
    const match = parents.find(parent => displayName(parent).toLocaleLowerCase() === value.trim().toLocaleLowerCase())
    setId(match?.id ?? '')
  }

  function selectImage(file?: File) {
    if (!file) return
    if (!file.type.startsWith('image/')) { setError('Escolha um arquivo de imagem válido.'); return }
    if (file.size > 5 * 1024 * 1024) { setError('A imagem deve ter no máximo 5 MB.'); return }
    setError('')
    setImageFile(file)
    setImageUrl(URL.createObjectURL(file))
  }

  function formatBirthDate(value: string) {
    const digits = value.replace(/\D/g, '').slice(0, 8)
    if (digits.length <= 2) return digits
    if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`
    return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`
  }

  async function uploadImage() {
    if (!imageFile || !farm) return imageUrl || null
    const extension = imageFile.name.split('.').pop()?.toLowerCase() || 'jpg'
    const path = `${farm.id}/${crypto.randomUUID()}.${extension}`
    const { error: uploadError } = await supabase.storage.from('animal-images').upload(path, imageFile, { contentType: imageFile.type, upsert: false })
    if (uploadError) throw uploadError
    return supabase.storage.from('animal-images').getPublicUrl(path).data.publicUrl
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!farm || !user) return
    setError('')
    setLoading(true)
    try {
      let formattedBirthDate: string | null = null
      if (birthDate) {
        const match = birthDate.match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
        if (!match) throw new Error('Informe a data de nascimento no formato dia/mês/ano.')
        const [, day, month, year] = match
        const parsed = new Date(`${year}-${month}-${day}T12:00:00`)
        if (parsed.getFullYear() !== Number(year) || parsed.getMonth() + 1 !== Number(month) || parsed.getDate() !== Number(day)) throw new Error('Informe uma data de nascimento válida.')
        formattedBirthDate = `${year}-${month}-${day}`
      }
      const uploadedImageUrl = await uploadImage()
      const payload = {
        farm_id: farm.id,
        tag: null,
        name: name.trim(),
        sex,
        breed: breed.trim() || null,
        birth_date: formattedBirthDate,
        mother_id: motherId || null,
        mother_name: motherName.trim() || null,
        father_id: fatherId || null,
        father_tag: fatherName.trim() || null,
        image_url: uploadedImageUrl,
        status,
      }
      const { error: saveError } = isEdit ? await supabase.from('animals').update(payload).eq('id', id!) : await supabase.from('animals').insert(payload)
      if (saveError) throw saveError
      navigate('/animais')
    } catch (saveError) {
      const message = saveError instanceof Error ? saveError.message : 'Não foi possível salvar o animal.'
      setError(message.includes('Bucket not found') ? 'O armazenamento de fotos ainda não foi configurado. Execute a migração do Supabase para criar o bucket "animal-images" e tente novamente.' : message)
      setLoading(false)
    }
  }

  const inputClass = 'w-full rounded-xl border border-[#dce7df] bg-[#fbfdfb] px-3 py-2.5 text-sm outline-none'
  const labelClass = 'mb-1.5 block text-sm font-semibold text-[#415148]'

  return <div className="mx-auto max-w-2xl space-y-5">
    <div className="flex items-center gap-3"><button onClick={() => navigate(-1)} className="rounded-xl p-2 text-[#516058] transition-colors hover:bg-white"><ArrowLeft size={18} /></button><div><p className="page-kicker">Rebanho</p><h1 className="mt-1 text-2xl font-bold tracking-tight text-[#17231b]">{isEdit ? 'Editar animal' : 'Cadastrar animal'}</h1></div></div>
    <form onSubmit={handleSubmit} className="app-surface space-y-6 p-5 sm:p-7">
      <div className="flex flex-col gap-4 border-b border-[#e7eee9] pb-6 sm:flex-row sm:items-center">
        <label className="group relative flex h-28 w-28 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-[#cbdacf] bg-[#f4f8f5] text-brand-700 transition-colors hover:border-brand-400 hover:bg-brand-50">
          {imageUrl ? <img src={imageUrl} alt="Prévia do animal" className="h-full w-full object-cover" /> : <span className="flex flex-col items-center gap-1 text-center text-xs font-semibold"><ImagePlus size={22} /><span>Adicionar foto</span></span>}
          <input type="file" accept="image/*" className="sr-only" onChange={event => selectImage(event.target.files?.[0])} />
        </label>
        <div className="flex-1"><p className="text-sm font-bold text-[#24362b]">Foto do animal</p><p className="mt-1 text-xs leading-5 text-[#718078]">Envie uma foto para facilitar a identificação no rebanho. PNG, JPG ou WEBP, até 5 MB.</p>{imageUrl && <button type="button" onClick={() => { setImageFile(null); setImageUrl('') }} className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-red-600 hover:text-red-700"><X size={13} /> Remover foto</button>}</div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2"><div className="sm:col-span-2"><label className={labelClass}>Nome do animal *</label><input type="text" value={name} onChange={e => setName(e.target.value)} required className={inputClass} placeholder="Ex.: Mimosa" autoFocus /></div><div><label className={labelClass}>Sexo *</label><select value={sex} onChange={e => setSex(e.target.value as 'M' | 'F')} className={inputClass}><option value="F">Fêmea</option><option value="M">Macho</option></select></div><div><label className={labelClass}>Raça</label><input type="text" value={breed} onChange={e => setBreed(e.target.value)} className={inputClass} placeholder="Ex.: Nelore" /></div><div className="sm:col-span-2"><label className={labelClass}>Data de nascimento</label><input type="text" inputMode="numeric" value={birthDate} onChange={e => setBirthDate(formatBirthDate(e.target.value))} className={inputClass} placeholder="dd/mm/aaaa" maxLength={10} aria-label="Data de nascimento, dia mês e ano" /></div></div>

      <div className="rounded-2xl bg-[#f6f9f7] p-4"><div className="mb-4"><p className="text-sm font-bold text-[#24362b]">Filiação</p><p className="text-xs text-[#718078]">Digite um nome ou escolha um animal já cadastrado.</p></div><div className="grid gap-4 sm:grid-cols-2"><div><label className={labelClass}>Mãe</label><input list="mother-options" value={motherName} onChange={e => { setMotherName(e.target.value); chooseParent(e.target.value, mothers, setMotherId) }} className={inputClass} placeholder="Digite ou selecione" /><datalist id="mother-options">{mothers.map(mother => <option key={mother.id} value={displayName(mother)} />)}</datalist></div><div><label className={labelClass}>Pai</label><input list="father-options" value={fatherName} onChange={e => { setFatherName(e.target.value); chooseParent(e.target.value, fathers, setFatherId) }} className={inputClass} placeholder="Digite ou selecione" /><datalist id="father-options">{fathers.map(father => <option key={father.id} value={displayName(father)} />)}</datalist></div></div></div>

      {error && <p className="rounded-xl border border-red-100 bg-red-50 px-3 py-2.5 text-sm text-red-700">{error}</p>}
      <div className="flex flex-col-reverse gap-3 border-t border-[#e7eee9] pt-5 sm:flex-row sm:justify-end"><button type="button" onClick={() => navigate(-1)} className="rounded-xl px-5 py-2.5 text-sm font-semibold text-[#526158] hover:bg-[#f1f5f2]">Cancelar</button><button type="submit" disabled={loading} className="rounded-xl bg-brand-700 px-5 py-2.5 text-sm font-semibold text-white shadow-[0_8px_18px_rgba(31,73,51,.18)] transition-colors hover:bg-brand-800 disabled:opacity-60">{loading ? 'Salvando...' : isEdit ? 'Salvar alterações' : 'Cadastrar animal'}</button></div>
    </form>
  </div>
}
