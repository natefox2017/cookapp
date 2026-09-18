# Import Queue / Worker (Issue #56)

Async processing for `recipe_import_jobs` created by the shared AI Recipe Import pipeline ([#55](https://github.com/natefox2017/cookapp/issues/55)).

## Open Source First — evaluation

| Option | License | Maintenance | Supabase / Deno fit | Deploy burden | Notes |
|--------|---------|-------------|---------------------|---------------|-------|
| **Supabase Queues (pgmq)** | Apache-2.0 ([tembo-io/pgmq](https://github.com/tembo-io/pgmq)) | Active; first-party on Supabase | Native Postgres + Edge `rpc` / SQL wrappers | Low — enable extension, Edge worker + Cron | Official Queues product; VT retries; archive |
| Graphile Worker | MIT | Mature | Needs **Node** worker process | Medium — separate runtime | Excellent Postgres jobs; poor Deno Edge fit |
| pg-boss | MIT | Mature | Needs **Node** + `pg` | Medium — separate runtime | Same Node deploy cost |
| Inngest / Trigger.dev | Mixed / commercial | Active SaaS | External HTTP callbacks | Higher — vendor + secrets + egress | Extra dependency vs in-DB queue |
| Invented SKIP LOCKED-only “framework” | — | Us | Works | Low | Rejected as inventing queue infra |

### Choice: **Supabase Queues (pgmq)** + Edge worker

**Rationale**

1. Available on project `cookapp` (`pgmq` 1.5.1) and documented for Edge Function consumers.
2. Matches in-repo pattern: Edge Function + bearer secret + Cron (same shape as `storage-cleanup-import-artifacts`).
3. No Node sidecar (Graphile / pg-boss) and no third-party SaaS (Inngest / Trigger.dev).
4. Job **state** stays on `recipe_import_jobs`; pgmq only carries work messages (`job_id`, `from_stage`, `correlation_id`).
5. Pipeline work is **not** reimplemented — worker calls `runImportPipeline` from `#55`.

### Non-goals

- Client-side `pgmq_public` exposure (service_role / security definer wrappers only).
- Replacing MediaStorage / AIRouter — worker uses existing shared deps / stubs.

## Architecture

```
Admin API (batch / retry / reparse / approve)
  → insert/update recipe_import_jobs (pending)
  → public.recipe_import_enqueue*(…) → pgmq.send('recipe_import', …)
  → HTTP returns immediately

Cron / manual POST recipe-import-worker
  → read runtime_config concurrency / VT / max_attempts
  → public.recipe_import_queue_read → process up to N messages
  → runImportPipeline(job, { admin }, { fromStage })
  → archive on success or poison; VT expiry retries transient failures
```

## Runtime config (not secrets)

| Key | Default | Meaning |
|-----|---------|---------|
| `import_queue_concurrency` | `3` | Max messages processed per worker tick |
| `import_queue_visibility_timeout_sec` | `300` | pgmq VT while a job runs |
| `import_queue_max_attempts` | `5` | `read_ct` ceiling → mark failed + archive |
| `import_confidence_threshold` | `0.7` | Passed through to pipeline when set |

Table: `public.runtime_config` (service_role). Secrets stay in Edge Function env (`RECIPE_IMPORT_WORKER_SECRET`).

## Worker auth

`Authorization: Bearer <RECIPE_IMPORT_WORKER_SECRET>` — same model as storage cleanup. Never expose `SUPABASE_SERVICE_ROLE_KEY` to Admin.

Schedule via Supabase Cron (or equivalent) invoking:

`POST /functions/v1/recipe-import-worker`

## Observability

Worker logs include `request_id` / `correlation_id` / `job_id` (Issue #57). Failures emit `monitor.import_failure` / `monitor.job_failure`.

## Tests

```bash
deno test --allow-env supabase/functions/_shared/recipe-import/
```

Covers enqueue helpers (memory queue), retry/poison transitions, concurrency clamp, and partial batch failure isolation.
