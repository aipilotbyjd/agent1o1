// ============================================================
// Trigger Types
// ------------------------------------------------------------
// A trigger attaches to either a workflow or an agent (the
// `target_type`/`target_id` pair) through one shared resource.
// `token` is present only when `type` is a token-bearing mechanism
// (webhook): see `TriggerType::usesToken()`.
// ============================================================
import type { TPaginationMeta } from './api.type';
import type { TTriggerMechanism } from './catalog.type';

export type TTriggerTargetType = 'workflow' | 'agent';

/** How a trigger gets its events: `instant` is push, `polling` is a timer. */
export type TTriggerDeliveryMode = 'instant' | 'polling' | 'webhook' | 'schedule' | 'manual';

/** What the trigger is doing right now; each state comes with at most one action. */
export type TTriggerState =
	| 'listening'
	| 'checking'
	| 'connecting'
	| 'degraded'
	| 'reconnect_needed'
	| 'scheduled'
	| 'manual'
	| 'paused'
	| 'off_failures'
	| 'off_skips'
	| 'suspended';

export type TTriggerStatusAction = 'resume' | 'reconnect' | 'retry' | null;

/** Computed by the backend (`TriggerStatus`) so every screen says the same thing. */
export type TTriggerStatus = {
	delivery: { mode: TTriggerDeliveryMode; label: string };
	state: TTriggerState;
	label: string;
	hint: string | null;
	action: TTriggerStatusAction;
	last_event_at: string | null;
	/** When the next check or scheduled run happens (UTC). */
	next_check_at: string | null;
};

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
	/** The connected account a polling trigger reads with. */
	credential_id: string | null;
	is_active: boolean;
	consecutive_failure_count: number;
	last_run_at: string | null;
	/** Schedules only: when it next fires (UTC). */
	next_run_at?: string | null;
	/** Polling only: when it next checks (UTC). */
	next_poll_at?: string | null;
	/** How events arrive and whether it is working. */
	status?: TTriggerStatus;
	consecutive_skip_count?: number;
	/** Failures in a row before it switches itself off. */
	max_failures?: number;
	/** Counts over the last 24 hours, from the list endpoint. */
	stats_24h?: { fired: number; failed: number; skipped: number; rejected: number };
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
	/** Polling only: switch the connected account it reads with. */
	credential_id?: string | null;
	/** An empty string or null clears it. */
	signing_secret?: string | null;
};

/** Narrows `GET /triggers` to one target's triggers. */
export type TTriggerListFilter = {
	target_type: TTriggerTargetType;
	target_id: string;
};

/** `GET .../triggers/{trigger}/events`: newest first, one page. */
export type TTriggerEventPage = { events: TTriggerEvent[]; meta: TPaginationMeta };

export type TTriggerEventParams = {
	page?: number;
	per_page?: number;
	status?: TTriggerEventStatus[];
};

/** One item a trigger sees right now, as a run would receive it. */
export type TTriggerSampleItem = { id: string; payload: Record<string, unknown> };

/** Result of `POST .../triggers/{trigger}/run`. */
export type TTriggerRunResult = { event: TTriggerEvent };
