// ============================================================
// Notification Types
// ------------------------------------------------------------
// Three resources: account-level notifications (Laravel's database
// notifications, not workspace-scoped), workspace notification
// channels (delivery targets), and per-user, per-workspace
// notification preferences keyed by a fixed event catalog.
// ============================================================

// ─── Account-level notifications ─────────────────────────────

export type TNotification = {
	id: string;
	type: string | null;
	title: string | null;
	body: string | null;
	data: Record<string, unknown>;
	workspace_id: string | null;
	read_at: string | null;
	created_at: string;
};

export type TUnreadCount = { unread: number };

// ─── Notification channels (workspace-scoped) ────────────────

export type TNotificationChannelType = 'discord' | 'slack' | 'webhook';

export type TNotificationChannel = {
	id: string;
	type: TNotificationChannelType;
	name: string;
	is_active: boolean;
	created_at: string;
	updated_at: string;
};

export type TNotificationChannelConfig = {
	url: string;
	headers?: Record<string, string>;
};

export type TCreateNotificationChannelDto = {
	type: TNotificationChannelType;
	name: string;
	config: TNotificationChannelConfig;
	is_active?: boolean;
};

export type TUpdateNotificationChannelDto = {
	name?: string;
	config?: TNotificationChannelConfig;
	is_active?: boolean;
};

// ─── Notification preferences (workspace-scoped, per user) ───

export type TNotificationEventKey =
	| 'workspace.member_invited'
	| 'workspace.member_joined'
	| 'workspace.member_removed'
	| 'workspace.member_role_changed'
	| 'run.approval_requested'
	| 'run.failed'
	| 'connector.credential_expired'
	| 'billing.payment_failed'
	| 'billing.payment_recovered'
	| 'billing.subscription_canceled'
	| 'billing.trial_ending'
	| 'billing.subscription_renewed'
	| 'billing.credits_low'
	| 'billing.credits_exhausted'
	| 'agent.reflection_run_completed'
	| 'agent.session_evaluation_notify';

/** The fixed catalog of toggleable events, from GET /notifications/events. */
export type TNotificationEventCatalogEntry = {
	key: TNotificationEventKey;
	label: string;
	description: string;
	defaults: { in_app: boolean; email: boolean };
};

/**
 * Returned as a raw Eloquent model (no API Resource on the backend), so
 * this shape is inferred from the columns the controller actually reads
 * and writes rather than from a documented resource contract.
 */
export type TNotificationPreference = {
	id: string;
	workspace_id: string;
	user_id: string;
	event_key: TNotificationEventKey;
	in_app: boolean;
	email: boolean;
	channel_ids: string[] | null;
	created_at: string;
	updated_at: string;
};

export type TUpsertNotificationPreferenceDto = {
	event_key: TNotificationEventKey;
	in_app?: boolean;
	email?: boolean;
	channel_ids?: string[] | null;
};
