-- Ejecutar en Supabase > SQL Editor. No requiere datos de ejemplo.
create table if not exists public.athlete_data (
  user_id uuid primary key references auth.users(id) on delete cascade,
  payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  constraint payload_is_object check (jsonb_typeof(payload) = 'object')
);
alter table public.athlete_data enable row level security;
revoke all on public.athlete_data from anon;
grant select, insert, update, delete on public.athlete_data to authenticated;
create policy "Read own data" on public.athlete_data for select to authenticated using ((select auth.uid()) = user_id);
create policy "Insert own data" on public.athlete_data for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Update own data" on public.athlete_data for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Delete own data" on public.athlete_data for delete to authenticated using ((select auth.uid()) = user_id);
create or replace function public.touch_athlete_data() returns trigger language plpgsql set search_path = public as $$ begin new.updated_at = now(); return new; end; $$;
create trigger touch_athlete_data before update on public.athlete_data for each row execute function public.touch_athlete_data();
