-- Execute este arquivo no SQL Editor do Supabase uma única vez.
-- Permite cadastro por nome, parentes opcionais e foto do animal.

alter table public.animals alter column tag drop not null;
alter table public.animals add column if not exists father_id uuid references public.animals(id) on delete set null;
alter table public.animals add column if not exists mother_name text;
alter table public.animals add column if not exists image_url text;

create index if not exists idx_animals_father on public.animals(father_id);

create table if not exists public.pregnancies (
  id uuid primary key default uuid_generate_v4(),
  farm_id uuid references public.farms(id) on delete cascade not null,
  mother_id uuid references public.animals(id) on delete cascade not null,
  breeding_date date not null,
  expected_birth_date date not null,
  status text check (status in ('pregnant', 'gave_birth', 'not_pregnant')) default 'pregnant',
  notes text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz default now()
);

alter table public.pregnancies enable row level security;
create index if not exists idx_pregnancies_mother on public.pregnancies(mother_id);

drop policy if exists "Ver gestações da fazenda" on public.pregnancies;
create policy "Ver gestações da fazenda" on public.pregnancies for select using (farm_id in (select public.my_farm_ids()));
drop policy if exists "Criar gestação na fazenda" on public.pregnancies;
create policy "Criar gestação na fazenda" on public.pregnancies for insert with check (farm_id in (select public.my_farm_ids()));
drop policy if exists "Atualizar gestação na fazenda" on public.pregnancies;
create policy "Atualizar gestação na fazenda" on public.pregnancies for update using (farm_id in (select public.my_farm_ids()));

insert into storage.buckets (id, name, public)
values ('animal-images', 'animal-images', true)
on conflict (id) do update set public = true;

drop policy if exists "Fotos de animais são públicas" on storage.objects;
create policy "Fotos de animais são públicas" on storage.objects
  for select using (bucket_id = 'animal-images');

drop policy if exists "Membros enviam fotos dos animais" on storage.objects;
create policy "Membros enviam fotos dos animais" on storage.objects
  for insert with check (
    bucket_id = 'animal-images'
    and (storage.foldername(name))[1] in (select id::text from public.my_farm_ids() as id)
  );

drop policy if exists "Membros alteram fotos dos animais" on storage.objects;
create policy "Membros alteram fotos dos animais" on storage.objects
  for update using (
    bucket_id = 'animal-images'
    and (storage.foldername(name))[1] in (select id::text from public.my_farm_ids() as id)
  );

drop policy if exists "Membros removem fotos dos animais" on storage.objects;
create policy "Membros removem fotos dos animais" on storage.objects
  for delete using (
    bucket_id = 'animal-images'
    and (storage.foldername(name))[1] in (select id::text from public.my_farm_ids() as id)
  );
