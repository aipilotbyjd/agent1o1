// ============================================================
// Notification Types
// ------------------------------------------------------------
// The API owns what every notification is (`GET /notifications/catalog`):
// its category, severity, defaults and link. The app renders whatever it
// is told and never hard-codes an event, so a new event needs no change
// here beyond, at most, an icon for a new category.
//
// - Inbox: account-level (spans workspaces), filterable, archivable.
// - Preferences: per workspace for workspace events, per account for the
//   rest. A key is an event key or a category key (`category:<name>`).
// - Channels and routes: workspace chat/webhook destinations, and which
//   events reach them.
// ============================================================

export type TNotificationSeverity = 'critical' | 'warning' | 'info' | 'success';

export type TNotificationCategoryKey =
	| 'workspace'
	| 'runs'
	| 'triggers'
	| 'connections'
	| 'agents'
	| 'billing'
	| 'assistant'
	| 'referrals'
	| 'security'
	| 'product_updates';

export type TNotificationScope = 'workspace' | 'account';

// ─── Inbox ───────────────────────────────────────────────────

export type TNotificationAction = {
	label: string | null;
	/** A path inside the app, or (platform messages only) an https address. */
	url: string;
};

export type TNotification = {
	id: string;
	type: string | null;
	category: TNotificationCategoryKey | null;
	severity: TNotificationSeverity;
	title: string | null;
	body: string | null;
	data: Record<string, unknown>;
	workspace_id: string | null;
	action: TNotificationAction | null;
	needs_action: boolean;
	/** How many occurrences this notification stands for (grouped repeats). */
	group_count: number;
	read_at: string | null;
	archived_at: string | null;
	occurred_at: string;
	created_at: string;
};

/**
 * `data` of an `admin.message` notification: a message the platform team sent
 * from the admin panel. It has no workspace (`workspace_id` is null). The
 * button link is a path in the app, where `:workspace` stands for the member's
 * current workspace, or an https address.
 */
export type TAdminMessageData = {
	campaign_id: string;
	category: 'marketing' | 'service';
	action_label: string | null;
	action_url: string | null;
};

export type TNotificationStatusFilter = 'inbox' | 'unread' | 'archived' | 'all';

export type TNotificationListParams = {
	status?: TNotificationStatusFilter;
	category?: TNotificationCategoryKey;
	/** A workspace id, or `none` for account-level notifications. */
	workspace_id?: string;
	needs_action?: boolean;
	per_page?: number;
	page?: number;
};

export type TNotificationSummary = {
	unread: number;
	needs_action: number;
	by_category: Partial<Record<TNotificationCategoryKey, number>>;
	/** Keyed by workspace id; `none` for account-level notifications. */
	by_workspace: Record<string, number>;
};

export type TUnreadCount = { unread: number };

export type TMarkNotificationsReadDto =
	| { ids: string[] }
	| { all: true; category?: TNotificationCategoryKey; workspace_id?: string };

/** Pushed on the member's private channel as `.inbox.notification`. */
export type TInboxNotificationEvent = {
	notification: TNotification;
	/** A repeat folded into an existing notification rather than a new one. */
	grouped: boolean;
	emitted_at: number;
};

// ─── Catalog ─────────────────────────────────────────────────

export type TNotificationEventKey = string;

export type TNotificationEventCatalogEntry = {
	key: TNotificationEventKey;
	label: string;
	description: string;
	category: TNotificationCategoryKey;
	severity: TNotificationSeverity;
	scope: TNotificationScope;
	/** Always sent; shown locked. */
	mandatory: boolean;
	/** Shown on the settings page with switches. */
	configurable: boolean;
	needs_action: boolean;
	grouped: boolean;
	defaults: { in_app: boolean; email: boolean };
};

export type TNotificationCategory = {
	key: TNotificationCategoryKey;
	label: string;
	description: string;
	/** Icon key the app maps to its own icon set. */
	icon: string;
	scope: TNotificationScope;
	/** The key a whole-category preference is saved under. */
	preference_key: string;
	events: TNotificationEventCatalogEntry[];
};

export type TNotificationCatalog = { categories: TNotificationCategory[] };

// ─── Preferences ─────────────────────────────────────────────

/** A workspace preference row, as the API stores it. */
export type TNotificationPreference = {
	id: string;
	workspace_id: string;
	user_id: string;
	/** An event key, or a category key (`category:<name>`). */
	event_key: string;
	in_app: boolean;
	email: boolean;
	email_digest: boolean;
	created_at: string;
	updated_at: string;
};

/** An account preference. `category:product_updates` is the marketing opt-out. */
export type TAccountNotificationPreference = {
	key: string;
	in_app: boolean;
	email: boolean;
	email_digest: boolean;
};

export type TNotificationPreferenceChange = {
	key: string;
	in_app?: boolean;
	email?: boolean;
	email_digest?: boolean;
};

export type TUpdateNotificationPreferencesDto = {
	preferences: TNotificationPreferenceChange[];
};

/** The channels one setting resolves to, after every layer applies. */
export type TResolvedNotificationSetting = {
	in_app: boolean;
	email: boolean;
	email_digest: boolean;
	/** Where the value comes from: the event's own row, its category's, or the defaults. */
	source: 'event' | 'category' | 'default';
};

// ─── Notification channels (workspace-scoped) ────────────────

export type TNotificationChannelType = 'discord' | 'slack' | 'webhook';

export type TNotificationChannel = {
	id: string;
	type: TNotificationChannelType;
	name: string;
	is_active: boolean;
	consecutive_failures: number;
	last_delivered_at: string | null;
	last_failed_at: string | null;
	last_error: string | null;
	/** Set when the channel was switched off after repeated failures. */
	disabled_at: string | null;
	/** Webhooks only, and only right after creating or rotating it. */
	signing_secret?: string;
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

// ─── Routes and deliveries ───────────────────────────────────

/** Which events reach a channel: one event, one category, or (neither) all. */
export type TNotificationRoute = {
	id: string;
	notification_channel_id: string;
	channel?: Pick<TNotificationChannel, 'id' | 'type' | 'name' | 'is_active'> | null;
	event_key: string | null;
	category: TNotificationCategoryKey | null;
	min_severity: TNotificationSeverity | null;
	created_at: string;
	updated_at: string;
};

export type TNotificationRouteDto = {
	notification_channel_id: string;
	event_key?: string | null;
	category?: TNotificationCategoryKey | null;
	min_severity?: TNotificationSeverity | null;
};

export type TNotificationDeliveryStatus = 'pending' | 'sent' | 'failed' | 'skipped';

export type TNotificationDelivery = {
	id: string;
	event_key: string | null;
	channel: string;
	status: TNotificationDeliveryStatus;
	attempts: number;
	error: string | null;
	sent_at: string | null;
	created_at: string;
};
