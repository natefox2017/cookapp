-- Subscription Service alignment: expose plan / expire_date aliases for clients.
-- RevenueCat webhook remains the only writer (service_role RPC).

alter table public.subscriptions
  add column if not exists plan text;

comment on column public.subscriptions.plan is
  'Client-facing plan label; synced from entitlement_id (e.g. pro).';
comment on column public.subscriptions.expires_at is
  'Subscription expire date (spec: expire_date).';

-- Backfill plan from entitlement_id when missing.
update public.subscriptions
set plan = coalesce(plan, entitlement_id, product_id)
where plan is null;

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
  v_plan text;
begin
  v_plan := coalesce(nullif(p_entitlement_id, ''), nullif(p_product_id, ''), 'pro');

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
    plan,
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
    v_plan,
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
    plan = excluded.plan,
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

-- Convenient read view matching the Subscription Service contract.
create or replace view public.subscription_status
with (security_invoker = true)
as
select
  user_id,
  coalesce(plan, entitlement_id, product_id) as plan,
  status,
  expires_at as expire_date,
  updated_at
from public.subscriptions;

grant select on public.subscription_status to authenticated;
