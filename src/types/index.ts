export interface Farm {
  id: string
  name: string
  created_at: string
  created_by: string
}

export interface FarmMember {
  id: string
  farm_id: string
  user_id: string
  role: 'owner' | 'member'
  created_at: string
  farm?: Farm
}

export interface Animal {
  id: string
  farm_id: string
  tag: string | null
  name: string | null
  sex: 'M' | 'F'
  breed: string | null
  birth_date: string | null
  mother_id: string | null
  mother_name: string | null
  father_id: string | null
  father_tag: string | null
  image_url: string | null
  status: 'active' | 'sold' | 'dead'
  notes: string | null
  created_at: string
  mother?: Pick<Animal, 'id' | 'tag' | 'name'>
}

export interface Vaccination {
  id: string
  animal_id: string
  farm_id: string
  vaccine_name: string
  date: string
  next_due_date: string | null
  dose: string | null
  notes: string | null
  created_by: string
  created_at: string
  animal?: Pick<Animal, 'id' | 'tag' | 'name'>
}

export interface Birth {
  id: string
  mother_id: string
  farm_id: string
  birth_date: string
  calf_id: string | null
  birth_type: 'natural' | 'assisted' | 'cesarean'
  notes: string | null
  created_by: string
  created_at: string
  mother?: Pick<Animal, 'id' | 'tag' | 'name'>
  calf?: Pick<Animal, 'id' | 'tag' | 'name'>
}

export interface AnimalEvent {
  id: string
  animal_id: string
  farm_id: string
  event_type: 'weight' | 'treatment' | 'sale' | 'purchase' | 'other'
  date: string
  value: number | null
  description: string | null
  created_by: string
  created_at: string
}

export interface Pregnancy {
  id: string
  farm_id: string
  mother_id: string
  breeding_date: string
  expected_birth_date: string
  status: 'pregnant' | 'gave_birth' | 'not_pregnant'
  notes: string | null
  created_by: string | null
  created_at: string
}

export type AnimalStatus = Animal['status']
export type EventType = AnimalEvent['event_type']
export type BirthType = Birth['birth_type']
