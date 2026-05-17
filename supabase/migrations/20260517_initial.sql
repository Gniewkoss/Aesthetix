-- ── profiles ──────────────────────────────────────────────────────────────────
-- Extends auth.users with app-specific data. Created automatically via trigger.
create table if not exists public.profiles (
  id                   uuid primary key references auth.users on delete cascade,
  full_name            text,
  is_premium           boolean      not null default false,
  scans_today          integer      not null default 0,
  last_scan_reset_date date,
  last_scan_date       timestamptz,
  xp                   integer      not null default 0,
  streak               integer      not null default 0,
  created_at           timestamptz  not null default now()
);

-- ── scans ──────────────────────────────────────────────────────────────────────
-- Stores the full PhysiqueAnalysis JSON per user. analysis is null while pending.
create table if not exists public.scans (
  id         uuid        primary key default gen_random_uuid(),
  user_id    uuid        not null references auth.users on delete cascade,
  analysis   jsonb,
  created_at timestamptz not null default now()
);

-- ── Row-Level Security ────────────────────────────────────────────────────────
alter table public.profiles enable row level security;
alter table public.scans     enable row level security;

create policy "users can manage own profile"
  on public.profiles for all using (auth.uid() = id);

create policy "users can manage own scans"
  on public.scans for all using (auth.uid() = user_id);

-- ── Auto-create profile on signup ─────────────────────────────────────────────
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data ->> 'name')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ── Indexes ───────────────────────────────────────────────────────────────────
create index if not exists scans_user_created on public.scans (user_id, created_at desc);
