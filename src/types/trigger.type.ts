// ============================================================
// Trigger Types
// ------------------------------------------------------------
// A trigger attaches to either a workflow or an agent (the
// `target_type`/`target_id` pair) through one shared resource.
// `token` is present only when `type` is a token-bearing mechanism
// (webhook) — see `TriggerType::usesToken()`.
// ============================================================
import type { TTriggerMechanism } from './catalog.type';

export type TTriggerTargetType = 'workflow' | 'agent';

export type TTrigger = {
	id: string;
	workspace_id: string;
	target_type: TTriggerTargetType;
	target_id: string;
	type: TTriggerMechanism;
	preset_id: string | null;
	config: Record<string, unknown> | null;
	token: string | null;
	is_active: boolean;
	consecutive_failure_count: number;
	last_run_at: string | null;
	created_by: string;
	created_at: string;
	updated_at: string;
};

export type TTriggerEventSource = 'webhook' | 'schedule' | 'manual' | 'poll';
export type TTriggerEventStatus = 'skipped' | 'accepted' | 'processed' | 'failed';

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
};

/** Result of `POST .../triggers/{trigger}/run`. */
export type TTriggerRunResult = { event: TTriggerEvent };
