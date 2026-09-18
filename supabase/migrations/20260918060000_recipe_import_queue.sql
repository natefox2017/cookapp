-- Import Queue / Worker (Issue #56)
-- Supabase Queues = pgmq (Apache-2.0). Job state remains on recipe_import_jobs;
-- pgmq carries async work messages only. Do not invent a second queue framework.

-- ---------------------------------------------------------------------------
-- Extension + queue
-- ---------------------------------------------------------------------------
create extension if not exists pgmq;

do $$
begin
  if not exists (
    select 1 from pgmq.list_queues() where queue_name = 'recipe_import'
  ) then
    perform pgmq.create('recipe_import');
  end if;
end;
$$;

comment on extension pgmq is
  'Supabase Queues backend for recipe import worker (Issue #56).';

-- ---------------------------------------------------------------------------
-- Runtime config (safe public knobs — never secrets)
-- ---------------------------------------------------------------------------
create table if not exists public.runtime_config (
  key text primary key,
  value jsonb not null,
  description text,
  updated_at timestamptz not null default now(),
  constraint runtime_config_value_object_or_scalar check (
    jsonb_typeof(value) in ('number', 'string', 'boolean', 'object', 'array')
  )
);

comment on table public.runtime_config is
  'Non-secret runtime knobs (import concurrency, thresholds). Secrets stay in Edge env.';

create or replace function public.touch_runtime_config_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists runtime_config_set_updated_at on public.runtime_config;
create trigger runtime_config_set_updated_at
  before update on public.runtime_config
  for each row execute function public.touch_runtime_config_updated_at();

insert into public.runtime_config (key, value, description) values
  (
    'import_queue_concurrency',
    '3'::jsonb,
    'Max import jobs processed per recipe-import-worker tick'
  ),
  (
    'import_queue_visibility_timeout_sec',
    '300'::jsonb,
    'pgmq visibility timeout (seconds) while a job is in flight'
  ),
  (
    'import_queue_max_attempts',
    '5'::jsonb,
    'Max pgmq read_ct before poison: mark job failed and archive message'
  ),
  (
    'import_confidence_threshold',
    '0.7'::jsonb,
    'Auto-import confidence threshold for shared pipeline'
  )
on conflict (key) do nothing;

alter table public.runtime_config enable row level security;
revoke all on table public.runtime_config from public, anon, authenticated;
grant select, insert, update, delete on table public.runtime_config to service_role;

create or replace function public.get_runtime_config_number(
  p_key text,
  p_default numeric
)
returns numeric
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v jsonb;
begin
  select value into v from public.runtime_config where key = p_key;
  if v is null then
    return p_default;
  end if;
  if jsonb_typeof(v) = 'number' then
    return (v #>> '{}')::numeric;
  end if;
  if jsonb_typeof(v) = 'string' then
    begin
      return trim(both '"' from v::text)::numeric;
    exception when others then
      return p_default;
    end;
  end if;
  return p_default;
end;
$$;

revoke all on function public.get_runtime_config_number(text, numeric) from public;
grant execute on function public.get_runtime_config_number(text, numeric) to service_role;

-- ---------------------------------------------------------------------------
-- Queue RPCs (service_role only — no client pgmq_public exposure required)
-- ---------------------------------------------------------------------------
create or replace function public.recipe_import_enqueue(
  p_job_id uuid,
  p_from_stage text default 'resolve',
  p_correlation_id text default null
)
returns bigint
language plpgsql
security definer
set search_path = public, pgmq
as $$
declare
  v_status text;
  v_msg_id bigint;
begin
  if p_job_id is null then
    raise exception 'job_id required';
  end if;

  if p_from_stage is null
     or p_from_stage not in (
       'resolve', 'extract', 'normalize', 'parse', 'validate',
       'quality', 'duplicate', 'import', 'done'
     )
  then
    raise exception 'invalid from_stage: %', p_from_stage;
  end if;

  select status into v_status
  from public.recipe_import_jobs
  where id = p_job_id
  for update;

  if v_status is null then
    raise exception 'import job not found: %', p_job_id;
  end if;

  -- Idempotent: terminal success / reject / exact duplicate are not re-queued.
  if v_status in ('imported', 'rejected', 'duplicate') then
    return null;
  end if;

  -- Do not pile onto an in-flight run; caller should wait or use recover.
  if v_status = 'running' then
    return null;
  end if;

  update public.recipe_import_jobs
  set
    status = 'pending',
    error_code = null,
    error_message = null,
    completed_at = null,
    stage = case
      when p_from_stage = 'done' then stage
      else p_from_stage
    end
  where id = p_job_id;

  select s.send into v_msg_id
  from pgmq.send(
    'recipe_import',
    jsonb_build_object(
      'job_id', p_job_id,
      'from_stage', p_from_stage,
      'correlation_id', p_correlation_id
    )
  ) as s(send);

  return v_msg_id;
end;
$$;

revoke all on function public.recipe_import_enqueue(uuid, text, text) from public;
grant execute on function public.recipe_import_enqueue(uuid, text, text) to service_role;

create or replace function public.recipe_import_enqueue_many(
  p_job_ids uuid[],
  p_from_stage text default 'resolve',
  p_correlation_id text default null
)
returns bigint[]
language plpgsql
security definer
set search_path = public, pgmq
as $$
declare
  v_id uuid;
  v_msg_id bigint;
  v_out bigint[] := array[]::bigint[];
begin
  if p_job_ids is null or cardinality(p_job_ids) = 0 then
    return v_out;
  end if;

  foreach v_id in array p_job_ids
  loop
    v_msg_id := public.recipe_import_enqueue(v_id, p_from_stage, p_correlation_id);
    if v_msg_id is not null then
      v_out := array_append(v_out, v_msg_id);
    end if;
  end loop;

  return v_out;
end;
$$;

revoke all on function public.recipe_import_enqueue_many(uuid[], text, text) from public;
grant execute on function public.recipe_import_enqueue_many(uuid[], text, text) to service_role;

create or replace function public.recipe_import_queue_read(
  p_vt integer,
  p_qty integer
)
returns table (
  msg_id bigint,
  read_ct bigint,
  enqueued_at timestamptz,
  vt timestamptz,
  message jsonb
)
language plpgsql
security definer
set search_path = public, pgmq
as $$
begin
  if p_vt is null or p_vt < 1 then
    raise exception 'vt must be >= 1';
  end if;
  if p_qty is null or p_qty < 1 then
    raise exception 'qty must be >= 1';
  end if;

  return query
  select r.msg_id, r.read_ct, r.enqueued_at, r.vt, r.message
  from pgmq.read('recipe_import', p_vt, p_qty) as r;
end;
$$;

revoke all on function public.recipe_import_queue_read(integer, integer) from public;
grant execute on function public.recipe_import_queue_read(integer, integer) to service_role;

create or replace function public.recipe_import_queue_archive(p_msg_id bigint)
returns boolean
language plpgsql
security definer
set search_path = public, pgmq
as $$
begin
  return pgmq.archive('recipe_import', p_msg_id);
end;
$$;

revoke all on function public.recipe_import_queue_archive(bigint) from public;
grant execute on function public.recipe_import_queue_archive(bigint) to service_role;

create or replace function public.recipe_import_queue_delete(p_msg_id bigint)
returns boolean
language plpgsql
security definer
set search_path = public, pgmq
as $$
begin
  return pgmq.delete('recipe_import', p_msg_id);
end;
$$;

revoke all on function public.recipe_import_queue_delete(bigint) from public;
grant execute on function public.recipe_import_queue_delete(bigint) to service_role;

-- Re-enqueue orphaned pending jobs (recovery when a send failed or VT starved).
create or replace function public.recipe_import_requeue_stale_pending(
  p_limit integer default 50,
  p_older_than_seconds integer default 60,
  p_correlation_id text default null
)
returns bigint[]
language plpgsql
security definer
set search_path = public, pgmq
as $$
declare
  v_ids uuid[];
begin
  select coalesce(array_agg(id), array[]::uuid[])
  into v_ids
  from (
    select j.id
    from public.recipe_import_jobs j
    where j.status = 'pending'
      and j.updated_at < now() - make_interval(secs => greatest(p_older_than_seconds, 0))
    order by j.created_at asc
    limit greatest(coalesce(p_limit, 50), 1)
  ) s;

  return public.recipe_import_enqueue_many(v_ids, 'resolve', p_correlation_id);
end;
$$;

revoke all on function public.recipe_import_requeue_stale_pending(integer, integer, text) from public;
grant execute on function public.recipe_import_requeue_stale_pending(integer, integer, text) to service_role;
