-- Audit trail for explicit third-party AI data-sharing consent (App Store 5.1.1/5.1.2).
alter table public.consent_logs
  add column if not exists ai_sharing_consent boolean not null default false;
