// ============================================================
// Trigger Types
// ------------------------------------------------------------
// A trigger attaches to either a workflow or an agent (the
// `target_type`/`target_id` pair) through one shared resource.
// `token` is present only when `type` is a token-bearing mechanism
// (webhook): see `TriggerType::usesToken()`.
// ============================================================
import type { TTriggerMechanism } from './catalog.type';

export type TTriggerTargetType = 'workflow' | 'agent';

export type TTrigger = {
	id: string;
	workspace_id: string;
	target_type: TTriggerTargetType;
	target_id: string;
	/** The canvas node that owns this trigger; null for one made outside the canvas. */
	trigger_node_key: string | null;
	type: TTriggerMechanism;
	preset_id: string | null;
	config: Record<string, unknown> | null;
	token: string | null;
	has_signing_secret?: boolean;
	is_active: boolean;
	consecutive_failure_count: number;
	last_run_at: string | null;
	/** Schedules only: when it next fires (UTC). */
	next_run_at?: string | null;
	consecutive_skip_count?: number;
	/** Failures in a row before it switches itself off. */
	max_failures?: number;
	/** Counts over the last 24 hours, from the list endpoint. */
	stats_24h?: { fired: number; failed: number; skipped: number };
	target_name?: string | null;
	created_by: string;
	created_at: string;
	updated_at: string;
};

/** An event's `source` is the backend's `TriggerType` value. */
export type TTriggerEventSource = 'webhook' | 'schedule' | 'manual' | 'polling';
/** `TriggerEventStatus` - `queued`/`running` are in flight, the rest are terminal. */
export type TTriggerEventStatus =
	| 'queued'
	| 'running'
	| 'fired'
	| 'ignored'
	| 'skipped'
	| 'rejected'
	| 'failed'
	| 'duplicate';

export type TTriggerEvent = {
	id: string;
	trigger_id: string;
	source: TTriggerEventSource;
	status: TTriggerEventStatus;
	run_id: string | null;
	payload: unknown;
	error: string | null;
	delivery_id: string | null;
	attempts: number;
	duplicate_count: number;
	processed_at: string | null;
	created_at: string;
};

// ─── Request DTOs ────────────────────────────────────────────

export type TCreateTriggerDto = {
	target_type: TTriggerTargetType;
	target_id: string;
	type: TTriggerMechanism;
	preset_id?: string | null;
	config?: Record<string, unknown> | null;
	is_active?: boolean;
	credential_id?: string | null;
	signing_secret?: string | null;
};

export type TUpdateTriggerDto = {
	config?: Record<string, unknown> | null;
	is_active?: boolean;
	/** An empty string or null clears it. */
	signing_secret?: string | null;
};

/** Narrows `GET /triggers` to one target's triggers. */
export type TTriggerListFilter = {
	target_type: TTriggerTargetType;
	target_id: string;
};

/** Result of `POST .../triggers/{trigger}/run`. */
export type TTriggerRunResult = { event: TTriggerEvent };
