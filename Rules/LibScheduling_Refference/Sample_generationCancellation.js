// lib/scheduling/generationCancellation.js
// ============================================================
// IN-MEMORY GENERATION CANCELLATION REGISTRY
// Tracks active generation runs and cancellation requests.
// ============================================================

import { supabaseAdmin } from '@/lib/supabaseAdmin';

const REGISTRY_KEY = '__schedyGenerationCancellationRegistry';
const ENTRY_TTL_MS = 60 * 60 * 1000; // 1 hour
const MAX_ENTRIES = 1000;
const PERSISTENCE_STATE_KEY = '__schedyGenerationRunPersistenceState';
const DB_TABLE = 'schedule_generation_runs';
const DB_CANCEL_POLL_INTERVAL_MS = 800;
const DB_UNAVAILABLE_RETRY_MS = 60 * 1000;

function getPersistenceState() {
  if (!globalThis[PERSISTENCE_STATE_KEY]) {
    globalThis[PERSISTENCE_STATE_KEY] = {
      status: 'unknown', // unknown | available | unavailable
      unavailableSince: 0,
      warned: false,
    };
  }

  return globalThis[PERSISTENCE_STATE_KEY];
}

function getRegistry() {
  if (!globalThis[REGISTRY_KEY]) {
    globalThis[REGISTRY_KEY] = new Map();
  }

  return globalThis[REGISTRY_KEY];
}

function now() {
  return Date.now();
}

function toIso(timestamp) {
  if (!Number.isFinite(Number(timestamp))) return null;
  return new Date(Number(timestamp)).toISOString();
}

function parseTimestamp(value) {
  if (value == null) return null;

  const parsed = Date.parse(String(value));
  if (!Number.isFinite(parsed)) return null;

  return parsed;
}

function cloneEntry(entry) {
  if (!entry) return null;

  return {
    runId: entry.runId,
    status: entry.status,
    cancelRequested: Boolean(entry.cancelRequested),
    startedAt: entry.startedAt || null,
    finishedAt: entry.finishedAt || null,
    cancelRequestedAt: entry.cancelRequestedAt || null,
    cancelAcknowledgedAt: entry.cancelAcknowledgedAt || null,
    cancelLatencyMs: Number.isFinite(Number(entry.cancelLatencyMs))
      ? Number(entry.cancelLatencyMs)
      : null,
    createdAt: entry.createdAt || null,
    updatedAt: entry.updatedAt || null,
    metadata: { ...(entry.metadata || {}) },
  };
}

function isMissingRelationError(error) {
  const code = String(error?.code || '').toLowerCase();
  const message = String(error?.message || '').toLowerCase();
  const details = String(error?.details || '').toLowerCase();
  const hint = String(error?.hint || '').toLowerCase();
  const fullText = `${message} ${details} ${hint}`;

  return (
    code === '42p01' ||
    fullText.includes('relation') && fullText.includes('does not exist') ||
    fullText.includes(DB_TABLE)
  );
}

function shouldMarkPersistenceUnavailable(error) {
  if (!error) return false;

  if (isMissingRelationError(error)) return true;

  const code = String(error?.code || '').toLowerCase();
  const message = String(error?.message || '').toLowerCase();
  const details = String(error?.details || '').toLowerCase();
  const fullText = `${message} ${details}`;

  // Invalid column / schema mismatch should disable persistence quickly.
  if (code === '42703' || fullText.includes('column') && fullText.includes('does not exist')) {
    return true;
  }

  return false;
}

function markPersistenceUnavailable(error) {
  const state = getPersistenceState();
  state.status = 'unavailable';
  state.unavailableSince = now();

  if (!state.warned) {
    state.warned = true;
    console.warn(
      '[generationCancellation] Persistent cancellation store unavailable; using in-memory fallback only.',
      error
    );
  }
}

async function isPersistenceAvailable() {
  const state = getPersistenceState();
  const timestamp = now();

  if (state.status === 'available') return true;

  if (
    state.status === 'unavailable' &&
    timestamp - Number(state.unavailableSince || 0) < DB_UNAVAILABLE_RETRY_MS
  ) {
    return false;
  }

  const { error } = await supabaseAdmin
    .from(DB_TABLE)
    .select('run_id', { head: true, count: 'exact' })
    .limit(1);

  if (error) {
    if (shouldMarkPersistenceUnavailable(error)) {
      markPersistenceUnavailable(error);
      return false;
    }

    // Transient failures should not disable persistence permanently.
    throw error;
  }

  state.status = 'available';
  state.unavailableSince = 0;
  return true;
}

function mapEntryToDbRow(entry) {
  return {
    run_id: entry.runId,
    status: entry.status || 'pending',
    cancel_requested: Boolean(entry.cancelRequested),
    started_at: toIso(entry.startedAt),
    finished_at: toIso(entry.finishedAt),
    cancel_requested_at: toIso(entry.cancelRequestedAt),
    cancel_acknowledged_at: toIso(entry.cancelAcknowledgedAt),
    cancel_latency_ms: Number.isFinite(Number(entry.cancelLatencyMs))
      ? Number(entry.cancelLatencyMs)
      : null,
    metadata: entry.metadata || {},
  };
}

function mergePersistentRowIntoEntry(entry, row = {}) {
  if (!entry || !row) return entry;

  entry.status = String(row.status || entry.status || 'pending');
  entry.cancelRequested = Boolean(row.cancel_requested ?? entry.cancelRequested);
  entry.startedAt = parseTimestamp(row.started_at) || entry.startedAt || null;
  entry.finishedAt = parseTimestamp(row.finished_at) || entry.finishedAt || null;
  entry.cancelRequestedAt =
    parseTimestamp(row.cancel_requested_at) || entry.cancelRequestedAt || null;
  entry.cancelAcknowledgedAt =
    parseTimestamp(row.cancel_acknowledged_at) || entry.cancelAcknowledgedAt || null;

  if (Number.isFinite(Number(row.cancel_latency_ms))) {
    entry.cancelLatencyMs = Number(row.cancel_latency_ms);
  }

  entry.createdAt = parseTimestamp(row.created_at) || entry.createdAt || now();
  entry.updatedAt = parseTimestamp(row.updated_at) || entry.updatedAt || now();
  entry.metadata = {
    ...(entry.metadata || {}),
    ...(row.metadata || {}),
  };

  return entry;
}

async function upsertPersistentEntry(entry) {
  try {
    const canPersist = await isPersistenceAvailable();
    if (!canPersist) return false;

    const row = mapEntryToDbRow(entry);
    const { error } = await supabaseAdmin
      .from(DB_TABLE)
      .upsert(row, { onConflict: 'run_id' });

    if (error) {
      if (shouldMarkPersistenceUnavailable(error)) {
        markPersistenceUnavailable(error);
        return false;
      }

      throw error;
    }

    return true;
  } catch (error) {
    console.warn('[generationCancellation] Persistent upsert failed:', error);
    return false;
  }
}

async function fetchPersistentEntry(runId) {
  try {
    const canPersist = await isPersistenceAvailable();
    if (!canPersist) return null;

    const { data, error } = await supabaseAdmin
      .from(DB_TABLE)
      .select(
        'run_id, status, cancel_requested, started_at, finished_at, ' +
        'cancel_requested_at, cancel_acknowledged_at, cancel_latency_ms, ' +
        'created_at, updated_at, metadata'
      )
      .eq('run_id', runId)
      .maybeSingle();

    if (error) {
      if (shouldMarkPersistenceUnavailable(error)) {
        markPersistenceUnavailable(error);
        return null;
      }

      throw error;
    }

    return data || null;
  } catch (error) {
    console.warn('[generationCancellation] Persistent fetch failed:', error);
    return null;
  }
}

function cleanupRegistry() {
  const registry = getRegistry();
  const cutoff = now() - ENTRY_TTL_MS;

  for (const [runId, entry] of registry.entries()) {
    if ((entry?.updatedAt || 0) < cutoff) {
      registry.delete(runId);
    }
  }

  if (registry.size <= MAX_ENTRIES) return;

  const sorted = [...registry.entries()].sort(
    (left, right) => (left[1]?.updatedAt || 0) - (right[1]?.updatedAt || 0)
  );

  const removeCount = registry.size - MAX_ENTRIES;
  for (let index = 0; index < removeCount; index += 1) {
    const runId = sorted[index]?.[0];
    if (runId) {
      registry.delete(runId);
    }
  }
}

function normalizeRunId(runId) {
  if (typeof runId !== 'string') return '';
  return runId.trim();
}

function getOrCreateEntry(runId) {
  const registry = getRegistry();
  const normalizedRunId = normalizeRunId(runId);
  if (!normalizedRunId) return null;

  const existing = registry.get(normalizedRunId);
  if (existing) return existing;

  const timestamp = now();
  const created = {
    runId: normalizedRunId,
    status: 'pending',
    cancelRequested: false,
    startedAt: null,
    finishedAt: null,
    cancelRequestedAt: null,
    cancelAcknowledgedAt: null,
    cancelLatencyMs: null,
    createdAt: timestamp,
    updatedAt: timestamp,
    metadata: {},
    lastPersistentCancelCheckAt: 0,
  };

  registry.set(normalizedRunId, created);
  return created;
}

async function refreshCancelFlag(entry, force = false) {
  if (!entry || entry.cancelRequested) return entry;

  const timestamp = now();
  if (
    !force &&
    timestamp - Number(entry.lastPersistentCancelCheckAt || 0) < DB_CANCEL_POLL_INTERVAL_MS
  ) {
    return entry;
  }

  entry.lastPersistentCancelCheckAt = timestamp;

  const persistentRow = await fetchPersistentEntry(entry.runId);
  if (!persistentRow) return entry;

  mergePersistentRowIntoEntry(entry, persistentRow);
  return entry;
}

export async function registerGenerationRun(runId, metadata = {}) {
  cleanupRegistry();

  const entry = getOrCreateEntry(runId);
  if (!entry) return null;

  await refreshCancelFlag(entry, true);

  const timestamp = now();
  entry.status = entry.cancelRequested ? 'cancel_requested' : 'running';
  entry.startedAt = entry.startedAt || timestamp;
  entry.finishedAt = null;
  entry.updatedAt = timestamp;
  entry.cancelLatencyMs = null;
  entry.cancelAcknowledgedAt = null;
  entry.metadata = {
    ...(entry.metadata || {}),
    ...(metadata || {}),
  };

  await upsertPersistentEntry(entry);
  return cloneEntry(entry);
}

export async function requestGenerationRunCancel(runId) {
  cleanupRegistry();

  const entry = getOrCreateEntry(runId);
  if (!entry) return null;

  const timestamp = now();

  await refreshCancelFlag(entry, true);

  entry.cancelRequested = true;
  entry.cancelRequestedAt = entry.cancelRequestedAt || timestamp;
  entry.cancelLatencyMs = null;

  if (!entry.status || ['pending', 'running'].includes(entry.status)) {
    entry.status = 'cancel_requested';
  }

  entry.updatedAt = timestamp;
  entry.metadata = {
    ...(entry.metadata || {}),
    cancel_requested_at: toIso(entry.cancelRequestedAt),
  };

  await upsertPersistentEntry(entry);
  return cloneEntry(entry);
}

export async function isGenerationRunCancelRequested(runId) {
  cleanupRegistry();

  const normalizedRunId = normalizeRunId(runId);
  if (!normalizedRunId) return false;

  const entry = getOrCreateEntry(normalizedRunId);
  await refreshCancelFlag(entry, false);
  return Boolean(entry?.cancelRequested);
}

export async function completeGenerationRun(runId, status = 'completed', metadata = {}) {
  cleanupRegistry();

  const entry = getOrCreateEntry(runId);
  if (!entry) return null;

  await refreshCancelFlag(entry, true);

  const timestamp = now();
  entry.status = status;
  entry.finishedAt = timestamp;
  entry.updatedAt = timestamp;

  if (status === 'cancelled') {
    entry.cancelRequested = true;
    entry.cancelRequestedAt = entry.cancelRequestedAt || timestamp;
    entry.cancelAcknowledgedAt = timestamp;
    entry.cancelLatencyMs = Math.max(0, timestamp - Number(entry.cancelRequestedAt || timestamp));
  } else {
    entry.cancelAcknowledgedAt = null;
    entry.cancelLatencyMs = null;
  }

  const finalMetadata = {
    ...(metadata || {}),
  };

  if (status === 'cancelled') {
    finalMetadata.cancel_requested_at = toIso(entry.cancelRequestedAt);
    finalMetadata.cancel_acknowledged_at = toIso(entry.cancelAcknowledgedAt);
    finalMetadata.cancel_latency_ms = entry.cancelLatencyMs;
  }

  entry.metadata = {
    ...(entry.metadata || {}),
    ...finalMetadata,
  };

  await upsertPersistentEntry(entry);
  return cloneEntry(entry);
}

export async function getGenerationRun(runId) {
  cleanupRegistry();

  const normalizedRunId = normalizeRunId(runId);
  if (!normalizedRunId) return null;

  const registry = getRegistry();
  let entry = registry.get(normalizedRunId);

  if (!entry) {
    const persistentRow = await fetchPersistentEntry(normalizedRunId);
    if (!persistentRow) return null;

    entry = getOrCreateEntry(normalizedRunId);
    mergePersistentRowIntoEntry(entry, persistentRow);
  } else {
    await refreshCancelFlag(entry, true);
  }

  return cloneEntry(entry);
}
