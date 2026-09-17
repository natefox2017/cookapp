-- IAP / subscription persistence (RevenueCat is receipt authority; Supabase stores entitlements).
create table if not exists public.subscriptions (
  user_id uuid primary key references auth.users (id) on delete cascade,
  entitlement_id text,
  product_id text,
  status text not null default 'none'
    check (status in ('active', 'trialing', 'cancelled', 'expired', 'billing_issue', 'none')),
  store text,
  environment text check (environment in ('sandbox', 'production', null)),
  expires_at timestamptz,
  will_renew boolean,
  revenuecat_app_user_id text,
  latest_event_type text,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.purchase_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete set null,
  rc_event_id text,
  event_type text not null,
  product_id text,
  store text,
  environment text,
  raw_event jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint purchase_events_rc_event_id_unique unique (rc_event_id)
);

create index if not exists purchase_events_user_id_idx on public.purchase_events (user_id);
create index if not exists purchase_events_created_at_idx on public.purchase_events (created_at desc);

alter table public.subscriptions enable row level security;
alter table public.purchase_events enable row level security;

create policy "subscriptions_select_own"
  on public.subscriptions
  for select
  to authenticated
  using (auth.uid() = user_id);

create policy "purchase_events_select_own"
  on public.purchase_events
  for select
  to authenticated
  using (auth.uid() = user_id);

-- Service role (webhooks) bypasses RLS; no insert/update policies for authenticated clients.

create or replace function public.touch_subscription_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists subscriptions_set_updated_at on public.subscriptions;
create trigger subscriptions_set_updated_at
  before update on public.subscriptions
  for each row execute function public.touch_subscription_updated_at();

create or replace function public.upsert_subscription_from_revenuecat(
  p_user_id uuid,
  p_event_type text,
  p_product_id text,
  p_entitlement_id text,
  p_status text,
  p_store text,
  p_environment text,
  p_expires_at timestamptz,
  p_will_renew boolean,
  p_revenuecat_app_user_id text,
  p_rc_event_id text,
  p_raw_event jsonb
)
returns public.subscriptions
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.subscriptions;
begin
  if p_rc_event_id is not null then
    insert into public.purchase_events (
      user_id, rc_event_id, event_type, product_id, store, environment, raw_event
    ) values (
      p_user_id, p_rc_event_id, p_event_type, p_product_id, p_store, p_environment, coalesce(p_raw_event, '{}'::jsonb)
    )
    on conflict (rc_event_id) do nothing;
  else
    insert into public.purchase_events (
      user_id, event_type, product_id, store, environment, raw_event
    ) values (
      p_user_id, p_event_type, p_product_id, p_store, p_environment, coalesce(p_raw_event, '{}'::jsonb)
    );
  end if;

  insert into public.subscriptions as s (
    user_id,
    entitlement_id,
    product_id,
    status,
    store,
    environment,
    expires_at,
    will_renew,
    revenuecat_app_user_id,
    latest_event_type
  ) values (
    p_user_id,
    p_entitlement_id,
    p_product_id,
    p_status,
    p_store,
    p_environment,
    p_expires_at,
    p_will_renew,
    p_revenuecat_app_user_id,
    p_event_type
  )
  on conflict (user_id) do update set
    entitlement_id = excluded.entitlement_id,
    product_id = excluded.product_id,
    status = excluded.status,
    store = excluded.store,
    environment = excluded.environment,
    expires_at = excluded.expires_at,
    will_renew = coalesce(excluded.will_renew, s.will_renew),
    revenuecat_app_user_id = excluded.revenuecat_app_user_id,
    latest_event_type = excluded.latest_event_type,
    updated_at = now()
  returning * into v_row;

  return v_row;
end;
$$;

revoke all on function public.upsert_subscription_from_revenuecat from public;
grant execute on function public.upsert_subscription_from_revenuecat to service_role;
