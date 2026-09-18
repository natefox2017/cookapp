-- Admin Dashboard download analytics (Issue #47)
-- Ops-seeded / importer-fed monthly install counts per store.
-- No App Store Connect / Play Console API yet — service role writes only.

create table if not exists public.app_download_stats (
  id uuid primary key default gen_random_uuid(),
  platform text not null check (platform in ('ios', 'android')),
  year_month date not null,
  downloads integer not null check (downloads >= 0),
  source text not null default 'manual'
    check (source in ('manual', 'app_store_connect', 'play_console', 'seed')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint app_download_stats_platform_month_unique unique (platform, year_month),
  constraint app_download_stats_month_first_day check (extract(day from year_month) = 1)
);

create index if not exists app_download_stats_year_month_idx
  on public.app_download_stats (year_month desc);
create index if not exists app_download_stats_platform_idx
  on public.app_download_stats (platform);

create or replace function public.touch_app_download_stats_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists app_download_stats_set_updated_at on public.app_download_stats;
create trigger app_download_stats_set_updated_at
  before update on public.app_download_stats
  for each row execute function public.touch_app_download_stats_updated_at();

alter table public.app_download_stats enable row level security;
-- No client policies: Edge Functions use service_role.

revoke all on table public.app_download_stats from public, anon, authenticated;
grant all on table public.app_download_stats to service_role;

-- Seed six months of demo install counts (idempotent).
insert into public.app_download_stats (platform, year_month, downloads, source, notes)
values
  ('ios', '2025-10-01', 820, 'seed', 'Demo seed for Admin Dashboard'),
  ('android', '2025-10-01', 540, 'seed', 'Demo seed for Admin Dashboard'),
  ('ios', '2025-11-01', 1240, 'seed', 'Demo seed for Admin Dashboard'),
  ('android', '2025-11-01', 780, 'seed', 'Demo seed for Admin Dashboard'),
  ('ios', '2025-12-01', 1680, 'seed', 'Demo seed for Admin Dashboard'),
  ('android', '2025-12-01', 1020, 'seed', 'Demo seed for Admin Dashboard'),
  ('ios', '2026-01-01', 2100, 'seed', 'Demo seed for Admin Dashboard'),
  ('android', '2026-01-01', 1280, 'seed', 'Demo seed for Admin Dashboard'),
  ('ios', '2026-02-01', 2560, 'seed', 'Demo seed for Admin Dashboard'),
  ('android', '2026-02-01', 1640, 'seed', 'Demo seed for Admin Dashboard'),
  ('ios', '2026-03-01', 2840, 'seed', 'Demo seed for Admin Dashboard'),
  ('android', '2026-03-01', 1920, 'seed', 'Demo seed for Admin Dashboard')
on conflict (platform, year_month) do nothing;

comment on table public.app_download_stats is
  'Monthly app install counts by platform for Admin Dashboard. Service role only.';
