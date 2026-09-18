-- Issue #58: Normalized payment_transactions + derived user_commerce_summary.
-- Keeps purchase_events / subscriptions as operational sources.
-- RevenueCat webhook amounts are estimated only — final_proceeds stays null until financial reports (#59).
-- Google Play: schema/enum compatibility only (no live sync / no fake Android rows).

-- ---------------------------------------------------------------------------
-- payment_transactions (unified commerce fact table)
-- ---------------------------------------------------------------------------
create table if not exists public.payment_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete set null,
  platform text check (platform is null or platform in ('ios', 'android')),
  store text check (
    store is null
    or store in ('app_store', 'google_play', 'stripe', 'promotional', 'rc_billing', 'unknown')
  ),
  environment text check (environment is null or environment in ('sandbox', 'production')),
  product_id text,
  entitlement_id text,
  transaction_id text,
  original_transaction_id text,
  -- Google Play reserved (populated only when a Play provider syncs — not in #58).
  order_id text,
  purchase_token text,
  event_type text not null,
  status text not null default 'unknown'
    check (
      status in (
        'active',
        'trialing',
        'cancelled',
        'expired',
        'billing_issue',
        'refunded',
        'unknown'
      )
    ),
  purchase_at timestamptz,
  renewal_at timestamptz,
  expires_at timestamptz,
  cancel_at timestamptz,
  refund_at timestamptz,
  currency text,
  -- Original store currency amount (never overwritten by FX conversion).
  gross_amount numeric(14, 4),
  refund_amount numeric(14, 4),
  -- RC / provider estimate only; not Apple Financial / Play settlement truth.
  estimated_proceeds numeric(14, 4),
  -- Set only after financial report confirmation (#59). Always null from RevenueCat.
  final_proceeds numeric(14, 4),
  -- Analytic USD from RC `price` when present; does not replace gross_amount.
  estimated_gross_usd numeric(14, 4),
  territory text,
  provider_source text not null default 'revenuecat'
    check (
      provider_source in (
        'revenuecat',
        'app_store',
        'google_play',
        'apple_financial',
        'manual'
      )
    ),
  provider_event_id text,
  purchase_event_id uuid references public.purchase_events (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint payment_transactions_provider_event_unique
    unique (provider_source, provider_event_id)
);

create index if not exists payment_transactions_user_id_idx
  on public.payment_transactions (user_id);
create index if not exists payment_transactions_purchase_at_idx
  on public.payment_transactions (purchase_at desc nulls last);
create index if not exists payment_transactions_store_idx
  on public.payment_transactions (store);
create index if not exists payment_transactions_event_type_idx
  on public.payment_transactions (event_type);
create index if not exists payment_transactions_status_idx
  on public.payment_transactions (status);
create index if not exists payment_transactions_transaction_id_idx
  on public.payment_transactions (transaction_id)
  where transaction_id is not null;
create index if not exists payment_transactions_order_id_idx
  on public.payment_transactions (order_id)
  where order_id is not null;

comment on table public.payment_transactions is
  'Normalized commerce transactions (#58). Idempotent on (provider_source, provider_event_id). RC amounts are estimated; final_proceeds only from financial reports.';
comment on column public.payment_transactions.gross_amount is
  'Amount in original currency (price_in_purchased_currency). Not final developer proceeds.';
comment on column public.payment_transactions.estimated_proceeds is
  'Provider estimate only. Never treat as Apple/Google settled proceeds.';
comment on column public.payment_transactions.final_proceeds is
  'Settled proceeds after financial report confirmation. Null for RevenueCat-sourced rows.';
comment on column public.payment_transactions.purchase_token is
  'Google Play purchase token (sensitive). Never expose full value to Admin UI.';
comment on column public.payment_transactions.order_id is
  'Google Play order id (reserved). Null until Play provider sync exists.';
comment on column public.payment_transactions.store is
  'Canonical store: app_store | google_play (+ RC non-store sources). play_store legacy maps to google_play.';

create or replace function public.touch_payment_transactions_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists payment_transactions_set_updated_at on public.payment_transactions;
create trigger payment_transactions_set_updated_at
  before update on public.payment_transactions
  for each row execute function public.touch_payment_transactions_updated_at();

alter table public.payment_transactions enable row level security;

create policy "payment_transactions_select_own"
  on public.payment_transactions
  for select
  to authenticated
  using (auth.uid() = user_id);

-- No insert/update/delete for authenticated — service_role / SECURITY DEFINER only.
revoke insert, update, delete on table public.payment_transactions from anon, authenticated;
grant select on table public.payment_transactions to authenticated;
grant all on table public.payment_transactions to service_role;

-- ---------------------------------------------------------------------------
-- Map legacy RC / webhook store labels → canonical payment_transactions.store
-- ---------------------------------------------------------------------------
create or replace function public.map_commerce_store(p_store text)
returns text
language sql
immutable
as $$
  select case lower(coalesce(p_store, ''))
    when 'app_store' then 'app_store'
    when 'mac_app_store' then 'app_store'
    when 'play_store' then 'google_play'
    when 'google_play' then 'google_play'
    when 'stripe' then 'stripe'
    when 'promotional' then 'promotional'
    when 'rc_billing' then 'rc_billing'
    when 'unknown' then 'unknown'
    else nullif(lower(coalesce(p_store, '')), '')
  end;
$$;

create or replace function public.map_commerce_platform(p_store text)
returns text
language sql
immutable
as $$
  select case public.map_commerce_store(p_store)
    when 'app_store' then 'ios'
    when 'google_play' then 'android'
    else null
  end;
$$;

-- ---------------------------------------------------------------------------
-- Idempotent upsert helper used by RevenueCat RPC (+ future providers)
-- ---------------------------------------------------------------------------
create or replace function public.upsert_payment_transaction(
  p_user_id uuid,
  p_platform text,
  p_store text,
  p_environment text,
  p_product_id text,
  p_entitlement_id text,
  p_transaction_id text,
  p_original_transaction_id text,
  p_order_id text,
  p_purchase_token text,
  p_event_type text,
  p_status text,
  p_purchase_at timestamptz,
  p_renewal_at timestamptz,
  p_expires_at timestamptz,
  p_cancel_at timestamptz,
  p_refund_at timestamptz,
  p_currency text,
  p_gross_amount numeric,
  p_refund_amount numeric,
  p_estimated_proceeds numeric,
  p_final_proceeds numeric,
  p_estimated_gross_usd numeric,
  p_territory text,
  p_provider_source text,
  p_provider_event_id text,
  p_purchase_event_id uuid default null
)
returns public.payment_transactions
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.payment_transactions;
  v_store text;
  v_platform text;
  v_status text;
begin
  if p_event_type is null or length(trim(p_event_type)) = 0 then
    raise exception 'event_type required';
  end if;

  v_store := public.map_commerce_store(p_store);
  v_platform := coalesce(p_platform, public.map_commerce_platform(p_store));
  v_status := coalesce(nullif(p_status, ''), 'unknown');

  if p_provider_event_id is not null and length(trim(p_provider_event_id)) > 0 then
    insert into public.payment_transactions as t (
      user_id,
      platform,
      store,
      environment,
      product_id,
      entitlement_id,
      transaction_id,
      original_transaction_id,
      order_id,
      purchase_token,
      event_type,
      status,
      purchase_at,
      renewal_at,
      expires_at,
      cancel_at,
      refund_at,
      currency,
      gross_amount,
      refund_amount,
      estimated_proceeds,
      final_proceeds,
      estimated_gross_usd,
      territory,
      provider_source,
      provider_event_id,
      purchase_event_id
    ) values (
      p_user_id,
      v_platform,
      v_store,
      p_environment,
      p_product_id,
      p_entitlement_id,
      p_transaction_id,
      p_original_transaction_id,
      p_order_id,
      p_purchase_token,
      p_event_type,
      v_status,
      p_purchase_at,
      p_renewal_at,
      p_expires_at,
      p_cancel_at,
      p_refund_at,
      p_currency,
      p_gross_amount,
      p_refund_amount,
      p_estimated_proceeds,
      p_final_proceeds,
      p_estimated_gross_usd,
      p_territory,
      coalesce(nullif(p_provider_source, ''), 'revenuecat'),
      p_provider_event_id,
      p_purchase_event_id
    )
    on conflict (provider_source, provider_event_id) do update set
      user_id = coalesce(excluded.user_id, t.user_id),
      platform = coalesce(excluded.platform, t.platform),
      store = coalesce(excluded.store, t.store),
      environment = coalesce(excluded.environment, t.environment),
      product_id = coalesce(excluded.product_id, t.product_id),
      entitlement_id = coalesce(excluded.entitlement_id, t.entitlement_id),
      transaction_id = coalesce(excluded.transaction_id, t.transaction_id),
      original_transaction_id = coalesce(excluded.original_transaction_id, t.original_transaction_id),
      order_id = coalesce(excluded.order_id, t.order_id),
      purchase_token = coalesce(excluded.purchase_token, t.purchase_token),
      event_type = excluded.event_type,
      status = excluded.status,
      purchase_at = coalesce(excluded.purchase_at, t.purchase_at),
      renewal_at = coalesce(excluded.renewal_at, t.renewal_at),
      expires_at = coalesce(excluded.expires_at, t.expires_at),
      cancel_at = coalesce(excluded.cancel_at, t.cancel_at),
      refund_at = coalesce(excluded.refund_at, t.refund_at),
      currency = coalesce(excluded.currency, t.currency),
      gross_amount = coalesce(excluded.gross_amount, t.gross_amount),
      refund_amount = coalesce(excluded.refund_amount, t.refund_amount),
      estimated_proceeds = coalesce(excluded.estimated_proceeds, t.estimated_proceeds),
      -- Never let RC overwrite a settled final_proceeds with null.
      final_proceeds = coalesce(t.final_proceeds, excluded.final_proceeds),
      estimated_gross_usd = coalesce(excluded.estimated_gross_usd, t.estimated_gross_usd),
      territory = coalesce(excluded.territory, t.territory),
      purchase_event_id = coalesce(excluded.purchase_event_id, t.purchase_event_id),
      updated_at = now()
    returning * into v_row;
  else
    insert into public.payment_transactions (
      user_id,
      platform,
      store,
      environment,
      product_id,
      entitlement_id,
      transaction_id,
      original_transaction_id,
      order_id,
      purchase_token,
      event_type,
      status,
      purchase_at,
      renewal_at,
      expires_at,
      cancel_at,
      refund_at,
      currency,
      gross_amount,
      refund_amount,
      estimated_proceeds,
      final_proceeds,
      estimated_gross_usd,
      territory,
      provider_source,
      provider_event_id,
      purchase_event_id
    ) values (
      p_user_id,
      v_platform,
      v_store,
      p_environment,
      p_product_id,
      p_entitlement_id,
      p_transaction_id,
      p_original_transaction_id,
      p_order_id,
      p_purchase_token,
      p_event_type,
      v_status,
      p_purchase_at,
      p_renewal_at,
      p_expires_at,
      p_cancel_at,
      p_refund_at,
      p_currency,
      p_gross_amount,
      p_refund_amount,
      p_estimated_proceeds,
      p_final_proceeds,
      p_estimated_gross_usd,
      p_territory,
      coalesce(nullif(p_provider_source, ''), 'revenuecat'),
      null,
      p_purchase_event_id
    )
    returning * into v_row;
  end if;

  return v_row;
end;
$$;

revoke all on function public.upsert_payment_transaction(
  uuid, text, text, text, text, text, text, text, text, text, text, text,
  timestamptz, timestamptz, timestamptz, timestamptz, timestamptz,
  text, numeric, numeric, numeric, numeric, numeric, text, text, text, uuid
) from public, anon, authenticated;
grant execute on function public.upsert_payment_transaction(
  uuid, text, text, text, text, text, text, text, text, text, text, text,
  timestamptz, timestamptz, timestamptz, timestamptz, timestamptz,
  text, numeric, numeric, numeric, numeric, numeric, text, text, text, uuid
) to service_role;

-- ---------------------------------------------------------------------------
-- Extend RevenueCat subscription upsert to also write payment_transactions
-- ---------------------------------------------------------------------------
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
  v_purchase_event_id uuid;
  v_is_duplicate boolean := false;
  v_purchase_at timestamptz;
  v_renewal_at timestamptz;
  v_cancel_at timestamptz;
  v_refund_at timestamptz;
  v_currency text;
  v_gross numeric;
  v_refund numeric;
  v_usd numeric;
  v_territory text;
  v_txn_id text;
  v_orig_txn_id text;
  v_tx_status text;
  v_type_upper text;
begin
  v_plan := coalesce(nullif(p_entitlement_id, ''), nullif(p_product_id, ''), 'pro');
  v_type_upper := upper(coalesce(p_event_type, ''));

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
    on conflict (rc_event_id) do nothing
    returning id into v_purchase_event_id;

    if v_purchase_event_id is null then
      v_is_duplicate := true;
      select id into v_purchase_event_id
      from public.purchase_events
      where rc_event_id = p_rc_event_id
      limit 1;
    end if;
  else
    insert into public.purchase_events (
      user_id, event_type, product_id, store, environment, raw_event
    ) values (
      p_user_id, p_event_type, p_product_id, p_store, p_environment, coalesce(p_raw_event, '{}'::jsonb)
    )
    returning id into v_purchase_event_id;
  end if;

  -- Normalized payment_transactions (idempotent on provider_source + provider_event_id).
  begin
    v_purchase_at := null;
    if p_raw_event is not null and (p_raw_event ? 'purchased_at_ms') then
      begin
        v_purchase_at := to_timestamp((nullif(p_raw_event ->> 'purchased_at_ms', '')::bigint) / 1000.0);
      exception when others then
        v_purchase_at := null;
      end;
    end if;

    v_renewal_at := case when v_type_upper = 'RENEWAL' then v_purchase_at else null end;
    v_cancel_at := case when v_type_upper = 'CANCELLATION' then coalesce(
      case
        when p_raw_event ? 'event_timestamp_ms' then
          to_timestamp((nullif(p_raw_event ->> 'event_timestamp_ms', '')::bigint) / 1000.0)
        else null
      end,
      now()
    ) else null end;

    v_refund_at := null;
    v_refund := null;
    if v_type_upper = 'CANCELLATION'
       and lower(coalesce(p_raw_event ->> 'cancellation_reason', '')) in ('customer_support', 'refund') then
      v_refund_at := v_cancel_at;
      begin
        v_refund := nullif(p_raw_event ->> 'price_in_purchased_currency', '')::numeric;
      exception when others then
        v_refund := null;
      end;
    end if;

    begin
      v_gross := nullif(p_raw_event ->> 'price_in_purchased_currency', '')::numeric;
    exception when others then
      v_gross := null;
    end;
    begin
      v_usd := nullif(p_raw_event ->> 'price', '')::numeric;
    exception when others then
      v_usd := null;
    end;

    v_currency := nullif(p_raw_event ->> 'currency', '');
    v_territory := nullif(p_raw_event ->> 'country_code', '');
    v_txn_id := nullif(p_raw_event ->> 'transaction_id', '');
    v_orig_txn_id := nullif(p_raw_event ->> 'original_transaction_id', '');

    v_tx_status := case
      when v_refund_at is not null then 'refunded'
      when p_status in ('active', 'trialing', 'cancelled', 'expired', 'billing_issue') then p_status
      else 'unknown'
    end;

    perform public.upsert_payment_transaction(
      p_user_id,
      public.map_commerce_platform(p_store),
      public.map_commerce_store(p_store),
      p_environment,
      p_product_id,
      p_entitlement_id,
      v_txn_id,
      v_orig_txn_id,
      null, -- order_id (Google reserved)
      null, -- purchase_token (Google reserved)
      p_event_type,
      v_tx_status,
      v_purchase_at,
      v_renewal_at,
      p_expires_at,
      v_cancel_at,
      v_refund_at,
      v_currency,
      v_gross,
      v_refund,
      null, -- estimated_proceeds unknown from RC alone
      null, -- final_proceeds never from RC
      v_usd,
      v_territory,
      'revenuecat',
      p_rc_event_id,
      v_purchase_event_id
    );
  exception
    when others then
      -- Do not fail entitlement sync if transaction normalize fails.
      raise warning 'payment_transactions upsert failed: %', sqlerrm;
  end;

  if v_is_duplicate then
    select *
    into v_row
    from public.subscriptions
    where user_id = p_user_id;
    return v_row;
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

-- ---------------------------------------------------------------------------
-- Backfill payment_transactions from existing purchase_events (idempotent)
-- ---------------------------------------------------------------------------
insert into public.payment_transactions (
  user_id,
  platform,
  store,
  environment,
  product_id,
  entitlement_id,
  transaction_id,
  original_transaction_id,
  event_type,
  status,
  purchase_at,
  renewal_at,
  expires_at,
  cancel_at,
  refund_at,
  currency,
  gross_amount,
  refund_amount,
  estimated_gross_usd,
  territory,
  provider_source,
  provider_event_id,
  purchase_event_id
)
select
  pe.user_id,
  public.map_commerce_platform(pe.store),
  public.map_commerce_store(pe.store),
  pe.environment,
  pe.product_id,
  case
    when jsonb_typeof(pe.raw_event -> 'entitlement_ids') = 'array'
      then pe.raw_event -> 'entitlement_ids' ->> 0
    else nullif(pe.raw_event ->> 'entitlement_id', '')
  end,
  nullif(pe.raw_event ->> 'transaction_id', ''),
  nullif(pe.raw_event ->> 'original_transaction_id', ''),
  pe.event_type,
  case
    when upper(pe.event_type) = 'CANCELLATION'
      and lower(coalesce(pe.raw_event ->> 'cancellation_reason', '')) in ('customer_support', 'refund')
      then 'refunded'
    when upper(pe.event_type) in ('INITIAL_PURCHASE', 'RENEWAL', 'PRODUCT_CHANGE', 'UNCANCELLATION', 'NON_RENEWING_PURCHASE', 'SUBSCRIPTION_EXTENDED', 'TEMPORARY_ENTITLEMENT_GRANT')
      then 'active'
    when upper(pe.event_type) = 'CANCELLATION' then 'cancelled'
    when upper(pe.event_type) = 'EXPIRATION' then 'expired'
    when upper(pe.event_type) = 'BILLING_ISSUE' then 'billing_issue'
    else 'unknown'
  end,
  case
    when pe.raw_event ? 'purchased_at_ms'
      and nullif(pe.raw_event ->> 'purchased_at_ms', '') is not null
      then to_timestamp((pe.raw_event ->> 'purchased_at_ms')::bigint / 1000.0)
    else pe.created_at
  end,
  case when upper(pe.event_type) = 'RENEWAL'
    then case
      when pe.raw_event ? 'purchased_at_ms'
        and nullif(pe.raw_event ->> 'purchased_at_ms', '') is not null
        then to_timestamp((pe.raw_event ->> 'purchased_at_ms')::bigint / 1000.0)
      else pe.created_at
    end
    else null
  end,
  case
    when pe.raw_event ? 'expiration_at_ms'
      and nullif(pe.raw_event ->> 'expiration_at_ms', '') is not null
      then to_timestamp((pe.raw_event ->> 'expiration_at_ms')::bigint / 1000.0)
    else null
  end,
  case when upper(pe.event_type) = 'CANCELLATION' then pe.created_at else null end,
  case
    when upper(pe.event_type) = 'CANCELLATION'
      and lower(coalesce(pe.raw_event ->> 'cancellation_reason', '')) in ('customer_support', 'refund')
      then pe.created_at
    else null
  end,
  nullif(pe.raw_event ->> 'currency', ''),
  nullif(pe.raw_event ->> 'price_in_purchased_currency', '')::numeric,
  case
    when upper(pe.event_type) = 'CANCELLATION'
      and lower(coalesce(pe.raw_event ->> 'cancellation_reason', '')) in ('customer_support', 'refund')
      then nullif(pe.raw_event ->> 'price_in_purchased_currency', '')::numeric
    else null
  end,
  nullif(pe.raw_event ->> 'price', '')::numeric,
  nullif(pe.raw_event ->> 'country_code', ''),
  'revenuecat',
  pe.rc_event_id,
  pe.id
from public.purchase_events pe
where pe.rc_event_id is not null
on conflict (provider_source, provider_event_id) do nothing;

-- ---------------------------------------------------------------------------
-- user_commerce_summary — derived only (not a writeable fact source)
-- ---------------------------------------------------------------------------
create or replace view public.user_commerce_summary
with (security_invoker = true)
as
select
  p.id as user_id,
  s.plan as subscription_plan,
  s.status as subscription_status,
  s.expires_at as subscription_expires_at,
  s.product_id as subscription_product_id,
  s.entitlement_id,
  s.store as subscription_store,
  agg.first_purchase_at,
  agg.last_purchase_at,
  coalesce(agg.purchase_count, 0)::integer as purchase_count,
  coalesce(agg.refund_count, 0)::integer as refund_count,
  coalesce(agg.gross_spend, 0)::numeric(14, 4) as gross_spend,
  coalesce(agg.refunded_amount, 0)::numeric(14, 4) as refunded_amount,
  (coalesce(agg.gross_spend, 0) - coalesce(agg.refunded_amount, 0))::numeric(14, 4) as net_spend,
  coalesce(agg.estimated_gross_usd, 0)::numeric(14, 4) as estimated_ltv_usd,
  agg.primary_currency,
  agg.store_territory,
  now() as computed_at
from public.profiles p
left join public.subscriptions s on s.user_id = p.id
left join lateral (
  select
    min(pt.purchase_at) filter (
      where upper(pt.event_type) in (
        'INITIAL_PURCHASE',
        'RENEWAL',
        'NON_RENEWING_PURCHASE',
        'PRODUCT_CHANGE',
        'UNCANCELLATION'
      )
    ) as first_purchase_at,
    max(pt.purchase_at) as last_purchase_at,
    count(*) filter (
      where upper(pt.event_type) in (
        'INITIAL_PURCHASE',
        'RENEWAL',
        'NON_RENEWING_PURCHASE',
        'PRODUCT_CHANGE'
      )
    ) as purchase_count,
    count(*) filter (
      where pt.refund_at is not null or pt.status = 'refunded'
    ) as refund_count,
    sum(pt.gross_amount) filter (
      where upper(pt.event_type) in (
        'INITIAL_PURCHASE',
        'RENEWAL',
        'NON_RENEWING_PURCHASE',
        'PRODUCT_CHANGE'
      )
      and pt.gross_amount is not null
    ) as gross_spend,
    sum(pt.refund_amount) filter (
      where pt.refund_amount is not null
    ) as refunded_amount,
    sum(pt.estimated_gross_usd) filter (
      where upper(pt.event_type) in (
        'INITIAL_PURCHASE',
        'RENEWAL',
        'NON_RENEWING_PURCHASE',
        'PRODUCT_CHANGE'
      )
      and pt.estimated_gross_usd is not null
    ) as estimated_gross_usd,
    (
      array_agg(pt.currency order by pt.purchase_at desc nulls last)
      filter (where pt.currency is not null)
    )[1] as primary_currency,
    (
      array_agg(pt.territory order by pt.purchase_at desc nulls last)
      filter (where pt.territory is not null)
    )[1] as store_territory
  from public.payment_transactions pt
  where pt.user_id = p.id
) agg on true;

comment on view public.user_commerce_summary is
  'Derived user commerce aggregates from payment_transactions + subscriptions (#58). Not a writeable fact source.';

grant select on public.user_commerce_summary to authenticated, service_role;
