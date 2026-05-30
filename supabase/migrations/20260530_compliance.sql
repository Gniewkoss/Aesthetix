-- Compliance: GDPR consent audit trail, deletion audit trail, and a hardened
-- account-deletion RPC. Apply with: supabase db push (or supabase migration up).

-- ── consent_logs ────────────────────────────────────────────────────────────────
-- Immutable, timestamped proof of consent (GDPR Art. 7(1): the controller must be
-- able to demonstrate that consent was given). One row per acceptance event.
create table if not exists public.consent_logs (
  id                uuid        primary key default gen_random_uuid(),
  user_id           uuid        not null references auth.users on delete cascade,
  policy_version    text        not null,
  analytics_consent boolean     not null default false,
  accepted_at       timestamptz,
  created_at        timestamptz not null default now()
);

alter table public.consent_logs enable row level security;

-- Users may insert and read their OWN consent rows. No update/delete — the log is
-- append-only (tampering with a consent audit trail defeats its purpose).
create policy "users can insert own consent" on public.consent_logs
  for insert with check (auth.uid() = user_id);
create policy "users can read own consent" on public.consent_logs
  for select using (auth.uid() = user_id);

create index if not exists consent_logs_user on public.consent_logs (user_id, created_at desc);

-- ── account_deletion_log ────────────────────────────────────────────────────────
-- Records that an erasure happened (GDPR Art. 17). Intentionally NOT FK-linked to
-- auth.users (the user row is gone) and stores no PII beyond the now-orphaned id.
create table if not exists public.account_deletion_log (
  id         uuid        primary key default gen_random_uuid(),
  user_id    uuid        not null,
  reason     text        not null default 'user_initiated',
  deleted_at timestamptz not null default now()
);

alter table public.account_deletion_log enable row level security;
-- No policies → only SECURITY DEFINER functions (below) can write; clients cannot read.

-- ── delete_own_account() ────────────────────────────────────────────────────────
-- Hardened: writes an audit row before erasing. profiles, scans, and consent_logs
-- cascade from auth.users (on delete cascade), so deleting the auth row removes all
-- personal data in one transaction.
create or replace function public.delete_own_account()
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then
    raise exception 'Not authenticated';
  end if;

  -- Audit trail first (survives the cascade because it has no FK to auth.users).
  insert into public.account_deletion_log (user_id, reason)
  values (uid, 'user_initiated');

  -- Cascades to profiles, scans, consent_logs.
  delete from auth.users where id = uid;
end;
$$;

revoke all on function public.delete_own_account() from public;
grant execute on function public.delete_own_account() to authenticated;
