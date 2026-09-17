-- Drop legacy column from earlier parallel hardening; RPC uses latest_event_timestamp_ms.
alter table public.subscriptions drop column if exists latest_event_at_ms;
