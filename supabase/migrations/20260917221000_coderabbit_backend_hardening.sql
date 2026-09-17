-- CodeRabbit PR #17 hardening:
-- 1) Prevent authenticated clients from writing profiles.email (auth.users sync only)
-- 2) Idempotent + ordered subscription upserts (duplicate rc_event_id + event_timestamp_ms)

-- ---------------------------------------------------------------------------
-- profiles.email: column privilege lock
-- ---------------------------------------------------------------------------
revoke update (email) on table public.profiles from authenticated, anon;

comment on column public.profiles.email is
  'Synced from auth.users only; clients cannot UPDATE this column.';

-- ---------------------------------------------------------------------------
-- subscriptions: event ordering version
-- ---------------------------------------------------------------------------
alter table public.subscriptions
  add column if not exists latest_event_timestamp_ms bigint;

comment on column public.subscriptions.latest_event_timestamp_ms is
  'RevenueCat event_timestamp_ms of the last applied subscription mutation; used to ignore stale/out-of-order webhooks.';

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
  v_event_ts bigint;
begin
  v_plan := coalesce(nullif(p_entitlement_id, ''), nullif(p_product_id, ''), 'pro');

  v_event_ts := null;
  if p_raw_event is not null and (p_raw_event ? 'event_timestamp_ms') then
    begin
      v_event_ts := nullif(p_raw_event ->> 'event_timestamp_ms', '')::bigint;
    exception
      when others then
        v_event_ts := null;
    end;
  end if;

  -- Always record purchase_events first (including events that later skip stale upserts).
  if p_rc_event_id is not null then
    insert into public.purchase_events (
      user_id, rc_event_id, event_type, product_id, store, environment, raw_event
    ) values (
      p_user_id, p_rc_event_id, p_event_type, p_product_id, p_store, p_environment, coalesce(p_raw_event, '{}'::jsonb)
    )
    on conflict (rc_event_id) do nothing;

    -- Duplicate delivery: do not re-apply subscription mutation.
    if not found then
      select *
      into v_row
      from public.subscriptions
      where user_id = p_user_id;

      return v_row;
    end if;
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
    latest_event_type,
    latest_event_timestamp_ms
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
    p_event_type,
    v_event_ts
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
    latest_event_timestamp_ms = coalesce(
      excluded.latest_event_timestamp_ms,
      s.latest_event_timestamp_ms
    ),
    updated_at = now()
  where
    excluded.latest_event_timestamp_ms is null
    or s.latest_event_timestamp_ms is null
    or excluded.latest_event_timestamp_ms >= s.latest_event_timestamp_ms
  returning * into v_row;

  -- Stale / out-of-order event: purchase_events kept; return current subscription.
  if v_row is null then
    select *
    into v_row
    from public.subscriptions
    where user_id = p_user_id;
  end if;

  return v_row;
end;
$$;

revoke all on function public.upsert_subscription_from_revenuecat(
  uuid, text, text, text, text, text, text, timestamptz, boolean, text, text, jsonb
) from public, anon, authenticated;
grant execute on function public.upsert_subscription_from_revenuecat(
  uuid, text, text, text, text, text, text, timestamptz, boolean, text, text, jsonb
) to service_role;
