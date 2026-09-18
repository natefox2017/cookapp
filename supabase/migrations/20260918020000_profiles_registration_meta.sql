-- Admin user registration meta (Issue #44)
-- Captures IP / registration provider / device for ops analytics.
-- Payment history continues to live in purchase_events.

alter table public.profiles
  add column if not exists registration_type text
    check (registration_type in ('apple', 'google', 'email', 'unknown')),
  add column if not exists device_type text
    check (device_type in ('iphone', 'ipad', 'android', 'web', 'unknown')),
  add column if not exists registration_ip inet,
  add column if not exists account_status text not null default 'active'
    check (account_status in ('active', 'suspended', 'deleted'));

update public.profiles
set registration_type = coalesce(registration_type, 'unknown'),
    device_type = coalesce(device_type, 'unknown')
where registration_type is null or device_type is null;

alter table public.profiles
  alter column registration_type set default 'unknown',
  alter column device_type set default 'unknown';

create index if not exists profiles_registration_type_idx on public.profiles (registration_type);
create index if not exists profiles_device_type_idx on public.profiles (device_type);
create index if not exists profiles_account_status_idx on public.profiles (account_status);

comment on column public.profiles.registration_type is
  'Signup provider: apple | google | email | unknown. Set by client/admin-users.';
comment on column public.profiles.device_type is
  'Device class at registration: iphone | ipad | android | web | unknown.';
comment on column public.profiles.registration_ip is
  'Client IP observed at first registration / profile bootstrap.';
comment on column public.profiles.account_status is
  'Admin-facing account status (separate from Auth banned flag).';
