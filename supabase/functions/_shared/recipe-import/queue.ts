/**
 * ImportQueue abstraction (Issue #56).
 * Production backend: Supabase Queues (pgmq) via security-definer RPCs.
 * Tests: MemoryImportQueue.
 *
 * Does NOT reimplement the import pipeline — callers/workers invoke
 * runImportPipeline from ./pipeline.ts.
 */

import type { SupabaseClient } from "jsr:@supabase/supabase-js@2";
import type { PipelineStage } from "./types.ts";
import { STAGE_ORDER } from "./types.ts";

export const RECIPE_IMPORT_QUEUE_NAME = "recipe_import";

export const DEFAULT_IMPORT_QUEUE_CONCURRENCY = 3;
export const DEFAULT_IMPORT_QUEUE_VT_SEC = 300;
export const DEFAULT_IMPORT_QUEUE_MAX_ATTEMPTS = 5;

export type ImportQueueMessage = {
  job_id: string;
  from_stage: PipelineStage;
  correlation_id?: string | null;
};

export type ClaimedImportMessage = {
  msg_id: number;
  read_ct: number;
  enqueued_at: string | null;
  vt: string | null;
  message: ImportQueueMessage;
};

export type ImportQueueRuntimeConfig = {
  concurrency: number;
  visibilityTimeoutSec: number;
  maxAttempts: number;
  confidenceThreshold: number;
};

export interface ImportQueue {
  enqueue(message: ImportQueueMessage): Promise<number | null>;
  enqueueMany(messages: ImportQueueMessage[]): Promise<number[]>;
  read(opts: { vt: number; qty: number }): Promise<ClaimedImportMessage[]>;
  archive(msgId: number): Promise<boolean>;
  delete(msgId: number): Promise<boolean>;
}

export function parseFromStage(value: unknown): PipelineStage {
  const s = String(value ?? "resolve");
  if ((STAGE_ORDER as string[]).includes(s)) return s as PipelineStage;
  return "resolve";
}

export function clampConcurrency(n: number): number {
  if (!Number.isFinite(n) || n < 1) return DEFAULT_IMPORT_QUEUE_CONCURRENCY;
  return Math.min(Math.floor(n), 20);
}

export function clampMaxAttempts(n: number): number {
  if (!Number.isFinite(n) || n < 1) return DEFAULT_IMPORT_QUEUE_MAX_ATTEMPTS;
  return Math.min(Math.floor(n), 50);
}

export function clampVtSec(n: number): number {
  if (!Number.isFinite(n) || n < 1) return DEFAULT_IMPORT_QUEUE_VT_SEC;
  return Math.min(Math.floor(n), 3600);
}

function asNumber(value: unknown, fallback: number): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const n = Number(value);
    if (Number.isFinite(n)) return n;
  }
  // jsonb number may arrive decoded already; object form from PostgREST rare
  return fallback;
}

export async function loadImportQueueRuntimeConfig(
  admin: SupabaseClient,
): Promise<ImportQueueRuntimeConfig> {
  const keys = [
    "import_queue_concurrency",
    "import_queue_visibility_timeout_sec",
    "import_queue_max_attempts",
    "import_confidence_threshold",
  ];
  const { data, error } = await admin
    .from("runtime_config")
    .select("key, value")
    .in("key", keys);
  if (error) {
    // Fail open to defaults so worker still runs if table missing in unit tests.
    return {
      concurrency: DEFAULT_IMPORT_QUEUE_CONCURRENCY,
      visibilityTimeoutSec: DEFAULT_IMPORT_QUEUE_VT_SEC,
      maxAttempts: DEFAULT_IMPORT_QUEUE_MAX_ATTEMPTS,
      confidenceThreshold: 0.7,
    };
  }
  const map = new Map<string, unknown>();
  for (const row of data ?? []) {
    map.set(String((row as { key: string }).key), (row as { value: unknown }).value);
  }
  return {
    concurrency: clampConcurrency(
      asNumber(map.get("import_queue_concurrency"), DEFAULT_IMPORT_QUEUE_CONCURRENCY),
    ),
    visibilityTimeoutSec: clampVtSec(
      asNumber(
        map.get("import_queue_visibility_timeout_sec"),
        DEFAULT_IMPORT_QUEUE_VT_SEC,
      ),
    ),
    maxAttempts: clampMaxAttempts(
      asNumber(map.get("import_queue_max_attempts"), DEFAULT_IMPORT_QUEUE_MAX_ATTEMPTS),
    ),
    confidenceThreshold: asNumber(map.get("import_confidence_threshold"), 0.7),
  };
}

function parseQueueMessage(raw: unknown): ImportQueueMessage | null {
  if (!raw || typeof raw !== "object") return null;
  const obj = raw as Record<string, unknown>;
  const jobId = obj.job_id ?? obj.jobId;
  if (jobId == null || String(jobId).trim() === "") return null;
  return {
    job_id: String(jobId),
    from_stage: parseFromStage(obj.from_stage ?? obj.fromStage),
    correlation_id: obj.correlation_id != null
      ? String(obj.correlation_id)
      : obj.correlationId != null
      ? String(obj.correlationId)
      : null,
  };
}

/** Production ImportQueue over public.* RPCs wrapping pgmq. */
export class PgmqImportQueue implements ImportQueue {
  constructor(private readonly admin: SupabaseClient) {}

  async enqueue(message: ImportQueueMessage): Promise<number | null> {
    const { data, error } = await this.admin.rpc("recipe_import_enqueue", {
      p_job_id: message.job_id,
      p_from_stage: message.from_stage,
      p_correlation_id: message.correlation_id ?? null,
    });
    if (error) throw new Error(`recipe_import_enqueue failed: ${error.message}`);
    if (data == null) return null;
    return Number(data);
  }

  async enqueueMany(messages: ImportQueueMessage[]): Promise<number[]> {
    if (!messages.length) return [];
    // Prefer batch RPC when all share the same from_stage + correlation.
    const stages = new Set(messages.map((m) => m.from_stage));
    const corrs = new Set(messages.map((m) => m.correlation_id ?? ""));
    if (stages.size === 1 && corrs.size === 1) {
      const { data, error } = await this.admin.rpc("recipe_import_enqueue_many", {
        p_job_ids: messages.map((m) => m.job_id),
        p_from_stage: messages[0].from_stage,
        p_correlation_id: messages[0].correlation_id ?? null,
      });
      if (error) {
        throw new Error(`recipe_import_enqueue_many failed: ${error.message}`);
      }
      return (data as number[] | null ?? []).map(Number);
    }
    const out: number[] = [];
    for (const m of messages) {
      const id = await this.enqueue(m);
      if (id != null) out.push(id);
    }
    return out;
  }

  async read(opts: { vt: number; qty: number }): Promise<ClaimedImportMessage[]> {
    const { data, error } = await this.admin.rpc("recipe_import_queue_read", {
      p_vt: opts.vt,
      p_qty: opts.qty,
    });
    if (error) throw new Error(`recipe_import_queue_read failed: ${error.message}`);
    const rows = (data ?? []) as Array<Record<string, unknown>>;
    const claimed: ClaimedImportMessage[] = [];
    for (const row of rows) {
      const message = parseQueueMessage(row.message);
      if (!message) continue;
      claimed.push({
        msg_id: Number(row.msg_id),
        read_ct: Number(row.read_ct ?? 0),
        enqueued_at: row.enqueued_at != null ? String(row.enqueued_at) : null,
        vt: row.vt != null ? String(row.vt) : null,
        message,
      });
    }
    return claimed;
  }

  async archive(msgId: number): Promise<boolean> {
    const { data, error } = await this.admin.rpc("recipe_import_queue_archive", {
      p_msg_id: msgId,
    });
    if (error) throw new Error(`recipe_import_queue_archive failed: ${error.message}`);
    return Boolean(data);
  }

  async delete(msgId: number): Promise<boolean> {
    const { data, error } = await this.admin.rpc("recipe_import_queue_delete", {
      p_msg_id: msgId,
    });
    if (error) throw new Error(`recipe_import_queue_delete failed: ${error.message}`);
    return Boolean(data);
  }
}

/** In-memory queue for unit tests (failure / partial / retry). */
export class MemoryImportQueue implements ImportQueue {
  private nextId = 1;
  private messages: Array<{
    msg_id: number;
    read_ct: number;
    visible_at: number;
    message: ImportQueueMessage;
    archived?: boolean;
  }> = [];

  async enqueue(message: ImportQueueMessage): Promise<number | null> {
    const msg_id = this.nextId++;
    this.messages.push({
      msg_id,
      read_ct: 0,
      visible_at: Date.now(),
      message: { ...message },
    });
    return msg_id;
  }

  async enqueueMany(messages: ImportQueueMessage[]): Promise<number[]> {
    const ids: number[] = [];
    for (const m of messages) {
      const id = await this.enqueue(m);
      if (id != null) ids.push(id);
    }
    return ids;
  }

  async read(opts: { vt: number; qty: number }): Promise<ClaimedImportMessage[]> {
    const now = Date.now();
    const out: ClaimedImportMessage[] = [];
    for (const row of this.messages) {
      if (row.archived) continue;
      if (row.visible_at > now) continue;
      row.read_ct += 1;
      row.visible_at = now + opts.vt * 1000;
      out.push({
        msg_id: row.msg_id,
        read_ct: row.read_ct,
        enqueued_at: new Date(now).toISOString(),
        vt: new Date(row.visible_at).toISOString(),
        message: { ...row.message },
      });
      if (out.length >= opts.qty) break;
    }
    return out;
  }

  async archive(msgId: number): Promise<boolean> {
    const row = this.messages.find((m) => m.msg_id === msgId);
    if (!row) return false;
    row.archived = true;
    return true;
  }

  async delete(msgId: number): Promise<boolean> {
    const before = this.messages.length;
    this.messages = this.messages.filter((m) => m.msg_id !== msgId);
    return this.messages.length < before;
  }

  /** Test helper: make a message visible again immediately. */
  release(msgId: number): void {
    const row = this.messages.find((m) => m.msg_id === msgId);
    if (row) row.visible_at = 0;
  }

  pendingCount(): number {
    return this.messages.filter((m) => !m.archived).length;
  }
}

export function createImportQueue(admin: SupabaseClient): ImportQueue {
  return new PgmqImportQueue(admin);
}
