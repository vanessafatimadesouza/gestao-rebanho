-- ============================================================
-- Corrigir políticas RLS — rode este script no SQL Editor
-- ============================================================

-- Função auxiliar (recriar para garantir)
create or replace function public.my_farm_ids()
returns setof uuid
language sql
security definer
stable
as $$
  select farm_id from public.farm_members where user_id = auth.uid()
$$;

-- ============================================================
-- FARMS
-- ============================================================
alter table public.farms enable row level security;

drop policy if exists "Ver fazendas que sou membro" on public.farms;
drop policy if exists "Criar fazenda" on public.farms;
drop policy if exists "Dono pode atualizar fazenda" on public.farms;

create policy "Ver fazendas que sou membro" on public.farms
  for select using (id in (select public.my_farm_ids()));

create policy "Criar fazenda" on public.farms
  for insert with check (auth.uid() is not null);

create policy "Dono pode atualizar fazenda" on public.farms
  for update using (
    id in (select farm_id from public.farm_members where user_id = auth.uid() and role = 'owner')
  );

-- ============================================================
-- FARM_MEMBERS
-- ============================================================
alter table public.farm_members enable row level security;

drop policy if exists "Ver membros da minha fazenda" on public.farm_members;
drop policy if exists "Entrar em fazenda" on public.farm_members;

create policy "Ver membros da minha fazenda" on public.farm_members
  for select using (farm_id in (select public.my_farm_ids()));

create policy "Entrar em fazenda" on public.farm_members
  for insert with check (user_id = auth.uid());

-- ============================================================
-- ANIMALS
-- ============================================================
alter table public.animals enable row level security;

drop policy if exists "Ver animais da fazenda" on public.animals;
drop policy if exists "Criar animal na fazenda" on public.animals;
drop policy if exists "Atualizar animal da fazenda" on public.animals;
drop policy if exists "Deletar animal da fazenda" on public.animals;

create policy "Ver animais da fazenda" on public.animals
  for select using (farm_id in (select public.my_farm_ids()));

create policy "Criar animal na fazenda" on public.animals
  for insert with check (farm_id in (select public.my_farm_ids()));

create policy "Atualizar animal da fazenda" on public.animals
  for update using (farm_id in (select public.my_farm_ids()));

create policy "Deletar animal da fazenda" on public.animals
  for delete using (farm_id in (select public.my_farm_ids()));

-- ============================================================
-- VACCINATIONS
-- ============================================================
alter table public.vaccinations enable row level security;

drop policy if exists "Ver vacinas da fazenda" on public.vaccinations;
drop policy if exists "Criar vacina na fazenda" on public.vaccinations;
drop policy if exists "Deletar vacina da fazenda" on public.vaccinations;

create policy "Ver vacinas da fazenda" on public.vaccinations
  for select using (farm_id in (select public.my_farm_ids()));

create policy "Criar vacina na fazenda" on public.vaccinations
  for insert with check (farm_id in (select public.my_farm_ids()));

create policy "Deletar vacina da fazenda" on public.vaccinations
  for delete using (farm_id in (select public.my_farm_ids()));

-- ============================================================
-- BIRTHS
-- ============================================================
alter table public.births enable row level security;

drop policy if exists "Ver partos da fazenda" on public.births;
drop policy if exists "Criar parto na fazenda" on public.births;
drop policy if exists "Deletar parto da fazenda" on public.births;

create policy "Ver partos da fazenda" on public.births
  for select using (farm_id in (select public.my_farm_ids()));

create policy "Criar parto na fazenda" on public.births
  for insert with check (farm_id in (select public.my_farm_ids()));

create policy "Deletar parto da fazenda" on public.births
  for delete using (farm_id in (select public.my_farm_ids()));

-- ============================================================
-- EVENTS
-- ============================================================
alter table public.events enable row level security;

drop policy if exists "Ver eventos da fazenda" on public.events;
drop policy if exists "Criar evento na fazenda" on public.events;
drop policy if exists "Deletar evento da fazenda" on public.events;

create policy "Ver eventos da fazenda" on public.events
  for select using (farm_id in (select public.my_farm_ids()));

create policy "Criar evento na fazenda" on public.events
  for insert with check (farm_id in (select public.my_farm_ids()));

create policy "Deletar evento da fazenda" on public.events
  for delete using (farm_id in (select public.my_farm_ids()));
