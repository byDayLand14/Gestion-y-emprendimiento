-- ELITECORE · Ejecutar en Supabase > SQL Editor con el rol propietario.
-- Es seguro volver a ejecutar este archivo. No elimina registros existentes.
begin;

-- Información privada: un espacio por cuenta autenticada.
create table if not exists public.athlete_data (
  user_id uuid primary key references auth.users(id) on delete cascade,
  payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  constraint payload_is_object check (jsonb_typeof(payload) = 'object')
);
alter table public.athlete_data enable row level security;
revoke all on public.athlete_data from anon;
grant select, insert, update, delete on public.athlete_data to authenticated;

drop policy if exists "Read own data" on public.athlete_data;
create policy "Read own data" on public.athlete_data for select to authenticated
  using ((select auth.uid()) = user_id);
drop policy if exists "Insert own data" on public.athlete_data;
create policy "Insert own data" on public.athlete_data for insert to authenticated
  with check ((select auth.uid()) = user_id);
drop policy if exists "Update own data" on public.athlete_data;
create policy "Update own data" on public.athlete_data for update to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
drop policy if exists "Delete own data" on public.athlete_data;
create policy "Delete own data" on public.athlete_data for delete to authenticated
  using ((select auth.uid()) = user_id);

create or replace function public.touch_athlete_data()
returns trigger language plpgsql set search_path = public as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
drop trigger if exists touch_athlete_data on public.athlete_data;
create trigger touch_athlete_data before update on public.athlete_data
  for each row execute function public.touch_athlete_data();

-- Contenido editorial público. payload conserva todos los campos del catálogo
-- (pasos, ingredientes, material, fuentes y demás metadatos) sin perder datos.
create table if not exists public.exercise_catalog (
  id text primary key check (length(trim(id)) > 0),
  name text not null check (length(trim(name)) > 0),
  payload jsonb not null check (jsonb_typeof(payload) = 'object'),
  updated_at timestamptz not null default now()
);
create table if not exists public.recipe_catalog (
  id text primary key check (length(trim(id)) > 0),
  name text not null check (length(trim(name)) > 0),
  payload jsonb not null check (jsonb_typeof(payload) = 'object'),
  updated_at timestamptz not null default now()
);
create table if not exists public.plan_catalog (
  id text primary key check (length(trim(id)) > 0),
  name text not null check (length(trim(name)) > 0),
  payload jsonb not null check (jsonb_typeof(payload) = 'object'),
  updated_at timestamptz not null default now()
);

alter table public.exercise_catalog enable row level security;
alter table public.recipe_catalog enable row level security;
alter table public.plan_catalog enable row level security;
revoke all on public.exercise_catalog, public.recipe_catalog, public.plan_catalog from anon, authenticated;
grant select on public.exercise_catalog, public.recipe_catalog, public.plan_catalog to anon, authenticated;

drop policy if exists "Read public exercises" on public.exercise_catalog;
create policy "Read public exercises" on public.exercise_catalog for select to anon, authenticated using (true);
drop policy if exists "Read public recipes" on public.recipe_catalog;
create policy "Read public recipes" on public.recipe_catalog for select to anon, authenticated using (true);
drop policy if exists "Read public plans" on public.plan_catalog;
create policy "Read public plans" on public.plan_catalog for select to anon, authenticated using (true);

comment on table public.athlete_data is 'Registros privados; cada cuenta solo accede a su fila mediante auth.uid().';
comment on table public.exercise_catalog is 'Ejercicios públicos; clientes web solo pueden leer.';
comment on table public.recipe_catalog is 'Recetas públicas; clientes web solo pueden leer.';
comment on table public.plan_catalog is 'Planes públicos; clientes web solo pueden leer.';
commit;
