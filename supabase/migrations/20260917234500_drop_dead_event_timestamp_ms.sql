-- Spec audit cleanup: drop dead duplicate timestamp column.
-- Canonical ordering column is latest_event_timestamp_ms (see coderabbit_backend_hardening).

alter table public.subscriptions
  drop column if exists event_timestamp_ms;

comment on column public.subscriptions.latest_event_timestamp_ms is
  'RevenueCat event_timestamp_ms of the last applied subscription mutation; ignores stale/out-of-order webhooks.';

comment on column public.subscriptions.expires_at is
  'Subscription expire timestamp. Spec field expire_date is exposed via view subscription_status.';

comment on column public.subscriptions.plan is
  'Client-facing plan (spec Subscription.plan); synced from entitlement_id.';
