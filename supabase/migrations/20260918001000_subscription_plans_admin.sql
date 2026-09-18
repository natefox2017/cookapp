-- Admin subscription plan catalog + revenue helpers (Issue #35)
-- Ops-managed SKUs per store (Apple App Store / Google Play). Service role only.

create table if not exists public.subscription_plans (
  id uuid primary key default gen_random_uuid(),
  plan_key text not null,
  display_name text not null,
  platform text not null check (platform in ('app_store', 'play_store')),
  product_id text not null,
  price numeric(12, 2) not null check (price >= 0),
  currency text not null default 'USD',
  billing_period text not null check (billing_period in ('monthly', 'yearly', 'lifetime')),
  active boolean not null default true,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint subscription_plans_platform_product_unique unique (platform, product_id),
  constraint subscription_plans_key_nonempty check (char_length(trim(plan_key)) > 0),
  constraint subscription_plans_name_nonempty check (char_length(trim(display_name)) > 0),
  constraint subscription_plans_product_nonempty check (char_length(trim(product_id)) > 0)
);

create index if not exists subscription_plans_platform_idx
  on public.subscription_plans (platform);
create index if not exists subscription_plans_plan_key_idx
  on public.subscription_plans (plan_key);

create or replace function public.touch_subscription_plans_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists subscription_plans_set_updated_at on public.subscription_plans;
create trigger subscription_plans_set_updated_at
  before update on public.subscription_plans
  for each row execute function public.touch_subscription_plans_updated_at();

alter table public.subscription_plans enable row level security;
-- No client policies: Edge Functions use service_role.

revoke all on table public.subscription_plans from public, anon, authenticated;
grant all on table public.subscription_plans to service_role;

-- Seed default Apple / Android catalog (idempotent).
insert into public.subscription_plans (
  plan_key, display_name, platform, product_id, price, currency, billing_period, active, description
) values
  ('pro_monthly', 'Pro Monthly', 'app_store', 'com.natefox.cookapp.pro.monthly', 4.99, 'USD', 'monthly', true, 'Apple App Store monthly Pro'),
  ('pro_monthly', 'Pro Monthly', 'play_store', 'cookapp_pro_monthly', 4.99, 'USD', 'monthly', true, 'Google Play monthly Pro'),
  ('pro_yearly', 'Pro Yearly', 'app_store', 'com.natefox.cookapp.pro.yearly', 39.99, 'USD', 'yearly', true, 'Apple App Store yearly Pro'),
  ('pro_yearly', 'Pro Yearly', 'play_store', 'cookapp_pro_yearly', 39.99, 'USD', 'yearly', true, 'Google Play yearly Pro'),
  ('lifetime', 'Lifetime', 'app_store', 'com.natefox.cookapp.lifetime', 79.99, 'USD', 'lifetime', true, 'Apple one-time unlock'),
  ('lifetime', 'Lifetime', 'play_store', 'cookapp_lifetime', 79.99, 'USD', 'lifetime', false, 'Google Play one-time unlock (paused)')
on conflict (platform, product_id) do nothing;

comment on table public.subscription_plans is
  'Admin Dashboard subscription catalog. One row per store product SKU. Not end-user Auth.';
