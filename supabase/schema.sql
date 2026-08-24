-- ============================================================
-- Gestão de Rebanho Bovino — Schema Supabase (IF NOT EXISTS)
-- Seguro para rodar mesmo que as tabelas já existam
-- ============================================================

create extension if not exists "uuid-ossp";

-- ============================================================
-- TABELAS
-- ============================================================

create table if not exists public.farms (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz default now()
);

create table if not exists public.farm_members (
  id uuid primary key default uuid_generate_v4(),
  farm_id uuid references public.farms(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  role text check (role in ('owner', 'member')) default 'member',
  created_at timestamptz default now(),
  unique(farm_id, user_id)
);

create table if not exists public.animals (
  id uuid primary key default uuid_generate_v4(),
  farm_id uuid references public.farms(id) on delete cascade not null,
  tag text,
  name text,
  sex text check (sex in ('M', 'F')) not null,
  breed text,
  birth_date date,
  mother_id uuid references public.animals(id) on delete set null,
  mother_name text,
  father_id uuid references public.animals(id) on delete set null,
  father_tag text,
  image_url text,
  status text check (status in ('active', 'sold', 'dead')) default 'active',
  notes text,
  created_at timestamptz default now(),
  unique(farm_id, tag)
);

create table if not exists public.vaccinations (
  id uuid primary key default uuid_generate_v4(),
  animal_id uuid references public.animals(id) on delete cascade not null,
  farm_id uuid references public.farms(id) on delete cascade not null,
  vaccine_name text not null,
  date date not null,
  next_due_date date,
  dose text,
  notes text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz default now()
);

create table if not exists public.births (
  id uuid primary key default uuid_generate_v4(),
  mother_id uuid references public.animals(id) on delete set null,
  farm_id uuid references public.farms(id) on delete cascade not null,
  birth_date date not null,
  calf_id uuid references public.animals(id) on delete set null,
  birth_type text check (birth_type in ('natural', 'assisted', 'cesarean')) default 'natural',
  notes text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz default now()
);

create table if not exists public.events (
  id uuid primary key default uuid_generate_v4(),
  animal_id uuid references public.animals(id) on delete cascade not null,
  farm_id uuid references public.farms(id) on delete cascade not null,
  event_type text check (event_type in ('weight', 'treatment', 'sale', 'purchase', 'other')) not null,
  date date not null,
  value numeric,
  description text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz default now()
);

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

-- ============================================================
-- RLS (Row Level Security)
-- ============================================================

alter table public.farms enable row level security;
alter table public.farm_members enable row level security;
alter table public.animals enable row level security;
alter table public.vaccinations enable row level security;
alter table public.births enable row level security;
alter table public.events enable row level security;
alter table public.pregnancies enable row level security;

-- Função auxiliar
create or replace function public.my_farm_ids()
returns setof uuid
language sql
security definer
stable
as $$
  select farm_id from public.farm_members where user_id = auth.uid()
$$;

-- Farms
do $$ begin
  create policy "Ver fazendas que sou membro" on public.farms
    for select using (id in (select public.my_farm_ids()));
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "Criar fazenda" on public.farms
    for insert with check (auth.uid() is not null);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "Dono pode atualizar fazenda" on public.farms
    for update using (
      id in (select farm_id from public.farm_members where user_id = auth.uid() and role = 'owner')
    );
exception when duplicate_object then null; end $$;

-- Farm members
do $$ begin
  create policy "Ver membros da minha fazenda" on public.farm_members
    for select using (farm_id in (select public.my_farm_ids()));
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "Entrar em fazenda" on public.farm_members
    for insert with check (user_id = auth.uid());
exception when duplicate_object then null; end $$;

-- Animals
do $$ begin
  create policy "Ver animais da fazenda" on public.animals
    for select using (farm_id in (select public.my_farm_ids()));
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "Criar animal na fazenda" on public.animals
    for insert with check (farm_id in (select public.my_farm_ids()));
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "Atualizar animal da fazenda" on public.animals
    for update using (farm_id in (select public.my_farm_ids()));
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "Deletar animal da fazenda" on public.animals
    for delete using (farm_id in (select public.my_farm_ids()));
exception when duplicate_object then null; end $$;

-- Vaccinations
do $$ begin
  create policy "Ver vacinas da fazenda" on public.vaccinations
    for select using (farm_id in (select public.my_farm_ids()));
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "Criar vacina na fazenda" on public.vaccinations
    for insert with check (farm_id in (select public.my_farm_ids()));
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "Deletar vacina da fazenda" on public.vaccinations
    for delete using (farm_id in (select public.my_farm_ids()));
exception when duplicate_object then null; end $$;

-- Births
do $$ begin
  create policy "Ver partos da fazenda" on public.births
    for select using (farm_id in (select public.my_farm_ids()));
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "Criar parto na fazenda" on public.births
    for insert with check (farm_id in (select public.my_farm_ids()));
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "Deletar parto da fazenda" on public.births
    for delete using (farm_id in (select public.my_farm_ids()));
exception when duplicate_object then null; end $$;

-- Events
do $$ begin
  create policy "Ver eventos da fazenda" on public.events
    for select using (farm_id in (select public.my_farm_ids()));
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "Criar evento na fazenda" on public.events
    for insert with check (farm_id in (select public.my_farm_ids()));
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "Deletar evento da fazenda" on public.events
    for delete using (farm_id in (select public.my_farm_ids()));
exception when duplicate_object then null; end $$;

-- Reprodução
do $$ begin
  create policy "Ver gestações da fazenda" on public.pregnancies
    for select using (farm_id in (select public.my_farm_ids()));
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "Criar gestação na fazenda" on public.pregnancies
    for insert with check (farm_id in (select public.my_farm_ids()));
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "Atualizar gestação na fazenda" on public.pregnancies
    for update using (farm_id in (select public.my_farm_ids()));
exception when duplicate_object then null; end $$;

-- ============================================================
-- ÍNDICES
-- ============================================================

create index if not exists idx_animals_farm on public.animals(farm_id);
create index if not exists idx_animals_status on public.animals(status);
create index if not exists idx_vaccinations_farm on public.vaccinations(farm_id);
create index if not exists idx_vaccinations_due on public.vaccinations(next_due_date);
create index if not exists idx_births_farm on public.births(farm_id);
create index if not exists idx_events_animal on public.events(animal_id);
create index if not exists idx_pregnancies_mother on public.pregnancies(mother_id);
create index if not exists idx_farm_members_user on public.farm_members(user_id);
