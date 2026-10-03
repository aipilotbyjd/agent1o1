import type { TBrand } from '@/types/brand.type';

export type TAssistant = {
	id: string;
	workspace_id: string;
	user_id: string;
	model_catalog_id: string | null;
	instructions: string | null;
	settings: Record<string, unknown>;
	created_at: string;
	updated_at: string;
};

export type TAssistantHome = {
	assistant: TAssistant;
	brand: TBrand;
	features: { voice: boolean };
};

export type TUpdateAssistantDto = {
	instructions?: string | null;
	model_catalog_id?: string | null;
};

export type TAssistantSessionStatus = 'active' | 'archived';

export type TAssistantSessionOrigin = 'web' | 'slack' | 'email' | 'sms' | 'task' | 'trigger';

export type TAssistantSession = {
	id: string;
	assistant_id: string;
	title: string | null;
	status: TAssistantSessionStatus;
	origin: TAssistantSessionOrigin;
	incognito: boolean;
	expires_at: string | null;
	last_activity_at: string | null;
	messages_count?: number;
	created_at: string;
	updated_at: string;
};

export type TCreateAssistantSessionDto = {
	title?: string | null;
	incognito?: boolean;
};

export type TUpdateAssistantSessionDto = {
	title?: string | null;
	status?: TAssistantSessionStatus;
};

export type TAssistantMessageRole = 'user' | 'assistant' | 'tool_result' | 'recap';

export type TAssistantToolCallSummary = {
	id: string | null;
	name: string | null;
};

export type TAssistantMessage = {
	id: string;
	assistant_session_id: string;
	role: TAssistantMessageRole;
	content: string | null;
	tool_calls: TAssistantToolCallSummary[];
	tool_call_id: string | null;
	attachments: unknown[];
	compacted: boolean;
	feedback?: TAssistantFeedback | null;
	created_at: string;
};

export type TAssistantTurnStatus =
	| 'queued'
	| 'running'
	| 'awaiting_approval'
	| 'completed'
	| 'failed'
	| 'cancelled';

export type TAssistantToolEffect = 'read' | 'internal' | 'write' | 'external' | 'destructive';

export type TAssistantActionStatus =
	| 'pending'
	| 'approved'
	| 'rejected'
	| 'executed'
	| 'failed'
	| 'expired';

export type TAssistantAction = {
	id: string;
	tool_call_id: string;
	tool: string;
	arguments: Record<string, unknown>;
	effect: TAssistantToolEffect;
	reason: string | null;
	status: TAssistantActionStatus;
	decision_note: string | null;
	expires_at: string | null;
};

export type TAssistantTurn = {
	id: string;
	assistant_session_id: string;
	status: TAssistantTurnStatus;
	user_message_id: string | null;
	assistant_message_id: string | null;
	error: string | null;
	actions?: TAssistantAction[];
	started_at: string | null;
	finished_at: string | null;
	created_at: string;
};

export type TAssistantSessionDetail = {
	session: TAssistantSession;
	active_turn: TAssistantTurn | null;
	queued_count: number;
};

export type TSendAssistantMessageResult = {
	turn: TAssistantTurn | null;
	queued: boolean;
};

export type TAssistantDecision = {
	tool_call_id: string;
	approve: boolean;
	note?: string | null;
};

export type TAssistantMemory = {
	id: string;
	key: string;
	value: string;
	updated_at: string;
};

/** Broadcast payloads — mirror `App\Events\Assistant\*::broadcastWith()`. */
export type TAssistantTurnChangedEvent = {
	turn: Pick<
		TAssistantTurn,
		| 'id'
		| 'assistant_session_id'
		| 'status'
		| 'user_message_id'
		| 'assistant_message_id'
		| 'error'
	>;
};

export type TAssistantTurnDeltaEvent = { turn_id: string; text: string };

export type TAssistantToolActivityEvent = {
	turn_id: string;
	tool_call_id: string;
	tool: string;
	phase: 'started' | 'finished';
};

export type TAssistantToolRule = 'allow' | 'ask' | 'deny';

export type TAssistantToolDescription = {
	name: string;
	effect: TAssistantToolEffect;
	default_rule: TAssistantToolRule;
	rule: TAssistantToolRule | null;
	can_auto_allow: boolean;
};

export type TAssistantToolRuleUpdate = { tool: string; rule: TAssistantToolRule | null };

export type TAssistantApp = {
	key: string;
	name: string;
	icon: string | null;
	color: string | null;
	connected: boolean;
	account: string | null;
	shared: boolean;
};

export type TAssistantContext = {
	window_tokens: number;
	used_tokens: number;
	percent: number;
	compacted_messages: number;
	parts: { instructions: number; tools: number; summary: number; conversation: number };
};

export type TAssistantFeedbackRating = 'up' | 'down';

export type TAssistantFeedback = {
	rating: TAssistantFeedbackRating;
	comment: string | null;
	status: 'pending' | 'applied' | 'ignored';
};

export type TAssistantStyleKind = 'tone' | 'design';

export type TAssistantStyleRevision = {
	id: string;
	version: number;
	notes: string | null;
	source: 'owner' | 'assistant' | 'feedback' | 'restore';
	reason: string | null;
	created_at: string;
};

export type TAssistantStyle = {
	kind: TAssistantStyleKind;
	notes: string | null;
	version: number;
	revisions: TAssistantStyleRevision[];
};

export type TBriefingSchedule = { time: string; days: number[]; timezone: string };

export type TBriefingConfig = {
	enabled: boolean;
	paused: boolean;
	schedule: TBriefingSchedule;
	connector_scope: 'all' | 'selected';
	connector_keys: string[];
	instructions: string | null;
	delivery: { email: boolean };
};

export type TBriefingSourceResult = {
	source: string;
	name: string;
	ok: boolean;
	items?: number;
	error?: string;
};

export type TBriefingRun = {
	id: string;
	status: 'queued' | 'collecting' | 'writing' | 'completed' | 'failed';
	trigger: 'schedule' | 'manual';
	summary: string | null;
	document: string | null;
	sources: TBriefingSourceResult[];
	error: string | null;
	situations_count: number;
	created_at: string;
	delivered_at: string | null;
};

export type TDailyReport = {
	config: TBriefingConfig;
	readable_sources: string[];
	runs: TBriefingRun[];
};

export type TUpdateBriefingConfigDto = Partial<Omit<TBriefingConfig, 'paused'>> & {
	settings?: Partial<TMeetingPrepSettings>;
};

export type TSituationStep = { id: string; body: string; status: 'todo' | 'done' | 'skipped' };

export type TSituation = {
	id: string;
	title: string;
	summary: string | null;
	next_step: string | null;
	sources: string[];
	status: 'open' | 'sent' | 'done' | 'dismissed';
	session_id: string | null;
	steps: TSituationStep[];
	created_at: string;
};

export type TMeetingPrepSettings = {
	auto: boolean;
	minutes_before: number;
	scope: 'external_only' | 'all';
};

export type TMeetingPrepReport = Omit<TDailyReport, 'config'> & {
	config: TBriefingConfig & { settings: TMeetingPrepSettings };
};

export type TMeetingBrief = {
	run_id: string;
	status: TBriefingRun['status'];
	summary: string | null;
	document: string | null;
	error: string | null;
	sources: TBriefingSourceResult[];
};

export type TMeeting = {
	id: string;
	title: string;
	starts_at: string;
	ends_at: string | null;
	attendees: { email: string; name: string | null }[];
	is_external: boolean;
	html_link: string | null;
	prep_status: 'none' | 'preparing' | 'prepared' | 'failed';
	brief: TMeetingBrief | null;
};

export type TMeetingsList = { calendar_connected: boolean; meetings: TMeeting[] };

export type TInboxLabel = {
	id: string;
	name: string;
	definition: string;
	color: string | null;
	group: 'keep' | 'move_out';
	enabled: boolean;
	builtin: boolean;
};

export type TInboxMessage = {
	id: string;
	from: string | null;
	subject: string | null;
	snippet: string | null;
	received_at: string | null;
	status: 'classified' | 'skipped' | 'failed';
	labels: string[];
	archived: boolean;
	skipped_reason: string | null;
	suggestion: string | null;
	draft_status: 'created' | 'updated' | 'suggested' | 'kept_your_edits' | null;
};

export type TInboxSettings = {
	draft_mode: 'confident' | 'off';
	drafting_instructions: string | null;
	known_senders_only: boolean;
	skip_existing_labels: boolean;
};

export type TInbox = {
	available: { plan: boolean; gmail_connected: boolean };
	config: TInboxSettings & {
		enabled: boolean;
		provider: string;
		account: string | null;
		last_checked_at: string | null;
		last_error: string | null;
	};
	labels: TInboxLabel[];
	messages: TInboxMessage[];
};

export type TSaveInboxLabelDto = Partial<
	Pick<TInboxLabel, 'name' | 'definition' | 'color' | 'group' | 'enabled'>
>;
