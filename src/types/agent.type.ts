// ============================================================
// Agent Types
// ------------------------------------------------------------
// Core agent record plus every sub-resource that hangs off one:
// sessions/messages (chat, plus streamed turns), versions, tool
// bindings, attached workflows/skills, knowledge + knowledge
// sources, eval suites, memories, reflections, and evaluation
// settings. `TAgentSessionStreamEvent` documents the SSE wire
// format for `POST .../sessions/{session}/messages/stream`.
// ============================================================
import type { TArtifact } from './artifact.type';
import type { TTag } from './tag.type';

export const AGENT_ICONS = [
	'bot',
	'brain',
	'sparkles',
	'search',
	'target',
	'shield',
	'rocket',
	'layers',
	'flame',
	'sliders-horizontal',
	'users',
	'database',
	'calendar-days',
	'file-text',
	'mail',
	'megaphone',
	'chart-line',
	'headphones',
	'code',
] as const;
export type TAgentIcon = (typeof AGENT_ICONS)[number];

export const AGENT_COLORS = ['purple', 'green', 'blue', 'teal', 'orange', 'red', 'rainbow'] as const;
export type TAgentColor = (typeof AGENT_COLORS)[number];

export type TAgent = {
	id: string;
	workspace_id: string;
	folder_id: string | null;
	name: string;
	slug: string;
	description: string | null;
	icon: TAgentIcon | null;
	color: TAgentColor | null;
	instructions: string | null;
	provider: string | null;
	model: string | null;
	model_catalog_id: string | null;
	model_catalog_slug?: string | null;
	temperature: number | null;
	settings: Record<string, unknown> | null;
	allow_self_updates: boolean;
	tags?: TTag[];
	sessions_count?: number;
	last_used_at?: string | null;
	created_by: string;
	created_at: string;
	updated_at: string;
};

export type TCreateAgentDto = {
	name: string;
	slug?: string;
	description?: string | null;
	folder_id?: string | null;
	icon?: TAgentIcon | null;
	color?: TAgentColor | null;
	instructions?: string | null;
	provider?: string | null;
	model?: string | null;
	model_catalog_id?: string | null;
	temperature?: number | null;
	settings?: Record<string, unknown> | null;
	allow_self_updates?: boolean;
};

export type TUpdateAgentDto = Partial<TCreateAgentDto>;

export type TDraftAgentDto = {
	prompt: string;
	model_catalog_id: string;
};

export type TImproveAgentInstructionsDto = {
	instructions?: string | null;
	request?: string | null;
};

export type TAgentDraft = {
	name: string;
	description: string;
	instructions: string;
	icon: TAgentIcon;
	color: TAgentColor;
};

export type TDuplicateAgentDto = {
	name?: string;
};

export type TSyncAgentTagsDto = {
	tag_ids: string[];
};

// ─── Sessions / messages ──────────────────────────────────────

export type TAgentSessionStatus = 'active' | 'archived';

export type TAgentMessageRole = 'user' | 'assistant' | 'tool' | 'system';

export type TAgentMessage = {
	id: string;
	agent_session_id: string;
	role: TAgentMessageRole;
	content: unknown;
	/** Files a member sent with this (user) message. Present whenever the
	 *  backend eager-loads them — session detail and the paged transcript. */
	attachments?: TArtifact[];
	usage: { prompt_tokens?: number; completion_tokens?: number } | null;
	created_at: string;
};

export type TAgentSession = {
	id: string;
	workspace_id: string;
	agent_id: string;
	user_id: string;
	title: string | null;
	status: TAgentSessionStatus;
	last_activity_at: string;
	messages_count?: number;
	messages?: TAgentMessage[];
	created_at: string;
};

export type TCreateAgentSessionDto = {
	title?: string | null;
};

export type TUpdateAgentSessionDto = {
	title?: string | null;
	status?: TAgentSessionStatus;
};

export type TSendAgentMessageDto = {
	message: string;
	/** Sent as multipart `attachments[]` — the service builds the `FormData`. */
	attachments?: File[];
};

/** SSE event names on `POST .../messages/stream`. `delta` chunks concatenate
 *  in order; `complete` carries the persisted message id to reconcile
 *  against the REST transcript; `done` always fires last. */
export type TAgentSessionStreamEvent =
	| { event: 'delta'; delta: string }
	| { event: 'tool-call'; id: string; name: string; arguments: unknown }
	| { event: 'tool-result'; id: string; name: string }
	| { event: 'complete'; run_id: string; status: string; message_id: string | null; text: string | null }
	| { event: 'error'; message: string }
	| { event: 'done' };

// ─── Versions ────────────────────────────────────────────────

export type TAgentVersion = {
	id: string;
	agent_id: string;
	version: number;
	snapshot: Record<string, unknown>;
	changed_by: string;
	created_at: string;
};

// ─── Tool bindings (built-in nodes exposed as agent tools) ────

export type TAgentToolBinding = {
	id: string;
	agent_id: string;
	node_type: string;
	config: Record<string, unknown> | null;
	exposed_fields: string[] | null;
	created_at: string;
};

export type TCreateAgentToolBindingDto = {
	node_type: string;
	config?: Record<string, unknown> | null;
	exposed_fields?: string[] | null;
};

// ─── Knowledge ───────────────────────────────────────────────

export type TAgentKnowledgeSourceType = 'text' | 'url' | 'file';

export type TAgentKnowledge = {
	id: string;
	agent_id: string;
	title: string;
	content: string;
	source_type: TAgentKnowledgeSourceType | null;
	source_url: string | null;
	tokens: number | null;
	is_active: boolean;
	sort_order: number;
	metadata: Record<string, unknown> | null;
	created_at: string;
	updated_at: string;
};

export type TCreateAgentKnowledgeDto = {
	title: string;
	content: string;
	source_type?: TAgentKnowledgeSourceType;
	source_url?: string | null;
	is_active?: boolean;
	sort_order?: number;
	metadata?: Record<string, unknown> | null;
};

export type TUpdateAgentKnowledgeDto = Partial<TCreateAgentKnowledgeDto>;

/** Which workspace knowledge-base `collection`s this agent may search. */
export type TAgentKnowledgeSources = {
	attached: string[];
	available: string[];
};

// ─── Memory ──────────────────────────────────────────────────

export type TAgentMemory = {
	id: string;
	agent_id: string;
	user_id: string | null;
	key: string;
	value: string;
	type: string | null;
	metadata: Record<string, unknown> | null;
	created_at: string;
	updated_at: string;
};

export type TCreateAgentMemoryDto = {
	key: string;
	value: string;
	type?: string | null;
	user_id?: string | null;
	metadata?: Record<string, unknown> | null;
};

export type TUpdateAgentMemoryDto = Partial<TCreateAgentMemoryDto>;

// ─── Eval suites ─────────────────────────────────────────────

export type TEvalAssertionType = 'contains' | 'not_contains' | 'regex' | 'equals' | 'llm_judge';

export type TEvalAssertion = { type: TEvalAssertionType; value: string };

export type TAgentEvalCase = {
	id: string;
	agent_eval_suite_id: string;
	name: string;
	input: string;
	assertions: TEvalAssertion[];
	sort_order: number;
	created_at: string;
	updated_at: string;
};

export type TCreateAgentEvalCaseDto = {
	name: string;
	input: string;
	assertions: TEvalAssertion[];
	sort_order?: number;
};

export type TUpdateAgentEvalCaseDto = Partial<TCreateAgentEvalCaseDto>;

export type TAgentEvalSuite = {
	id: string;
	workspace_id: string;
	agent_id: string;
	name: string;
	description: string | null;
	case_count?: number;
	cases?: TAgentEvalCase[];
	created_by: string;
	created_at: string;
	updated_at: string;
};

export type TCreateAgentEvalSuiteDto = {
	name: string;
	description?: string | null;
};

export type TUpdateAgentEvalSuiteDto = Partial<TCreateAgentEvalSuiteDto>;

export type TAgentEvalCaseResult = {
	id: string;
	agent_eval_case_id: string;
	case?: TAgentEvalCase;
	passed: boolean;
	output: unknown;
	assertions: unknown;
	usage: unknown;
	error: string | null;
};

export type TAgentEvalRunStatus = 'pending' | 'running' | 'completed' | 'failed';

export type TAgentEvalRun = {
	id: string;
	agent_eval_suite_id: string;
	agent_version_id: string;
	status: TAgentEvalRunStatus;
	passed: number;
	failed: number;
	error: string | null;
	results?: TAgentEvalCaseResult[];
	triggered_by: string;
	started_at: string | null;
	finished_at: string | null;
	created_at: string;
};

// ─── Evaluation settings (automatic QA grading of live sessions) ──

export type TEvaluationCriterionType = 'boolean' | 'score';
export type TEvaluationCriterionAction = 'flag' | 'fail' | 'info';
export type TEvaluationDataPointType = 'string' | 'number' | 'boolean';

export type TEvaluationCriterion = {
	id?: string;
	name: string;
	prompt: string;
	type: TEvaluationCriterionType;
	priority: TEvaluationCriterionAction;
};

export type TEvaluationTag = {
	name: string;
	description: string;
};

export type TEvaluationDataPoint = {
	id?: string;
	name: string;
	data_type: TEvaluationDataPointType;
	description: string;
};

export type TAgentEvaluationSettings = {
	id: string;
	agent_id: string;
	is_enabled: boolean;
	model: string | null;
	sentiment_enabled: boolean;
	sentiment_affects_grade: boolean;
	sentiment_guidance: string | null;
	suggest_tags_automatically: boolean;
	criteria: TEvaluationCriterion[];
	tags: TEvaluationTag[];
	data_points: TEvaluationDataPoint[];
	created_at: string;
	updated_at: string;
};

export type TUpdateAgentEvaluationSettingsDto = Partial<
	Omit<TAgentEvaluationSettings, 'id' | 'agent_id' | 'created_at' | 'updated_at'>
>;

export type TAgentSessionEvaluationStatus = 'pending' | 'completed' | 'failed';
export type TAgentSessionEvaluationGrade = 'pass' | 'fail' | 'flag';

export type TAgentSessionEvaluation = {
	id: string;
	agent_id: string;
	agent_session_id: string;
	status: TAgentSessionEvaluationStatus;
	grade: TAgentSessionEvaluationGrade | null;
	call_successful: boolean | null;
	sentiment: string | null;
	summary: string | null;
	criteria_results: unknown[];
	data_results: unknown[];
	applied_tags: string[];
	error: string | null;
	evaluated_at: string | null;
	created_at: string;
	updated_at: string;
};

// ─── Reflections (periodic self-review of past sessions) ──────

export type TReflectionApplyBehavior = 'review_queue' | 'auto_apply';

export type TReflectionSettings = {
	id: string;
	agent_id: string;
	is_enabled: boolean;
	apply_behavior: TReflectionApplyBehavior;
	schedule_cron: string;
	min_chats_threshold: number;
	extra_instructions: string | null;
	notify_on_skip: boolean;
	last_run_at: string | null;
	next_run_at: string | null;
	created_at: string;
	updated_at: string;
};

export type TUpdateReflectionSettingsDto = Partial<
	Pick<
		TReflectionSettings,
		| 'is_enabled'
		| 'apply_behavior'
		| 'schedule_cron'
		| 'min_chats_threshold'
		| 'extra_instructions'
		| 'notify_on_skip'
	>
>;

export type TReflectionRunStatus = 'pending' | 'running' | 'completed' | 'failed' | 'skipped';

export type TReflectionType = 'new_skill' | 'skill_fix' | 'instruction_update' | 'tool_access';
export type TReflectionStatus = 'pending' | 'applied' | 'dismissed' | 'superseded';

export type TReflection = {
	id: string;
	agent_id: string;
	reflection_run_id: string;
	type: TReflectionType;
	title: string;
	rationale: string;
	evidence: { session_ids: string[] } | null;
	confidence: number;
	support_count: number;
	proposed_prompt: string | null;
	target_skill_id: string | null;
	status: TReflectionStatus;
	applied_run_id: string | null;
	created_at: string;
	updated_at: string;
};

export type TReflectionRun = {
	id: string;
	agent_id: string;
	status: TReflectionRunStatus;
	sessions_analyzed_count: number;
	skip_reason: string | null;
	reflections_count?: number;
	reflections?: TReflection[];
	started_at: string | null;
	finished_at: string | null;
	created_at: string;
};

// ── Ported from the old frontend ──────────────────────────────────────────────
// Types the AgentBuilder still references. Copied verbatim from the old
// frontend; several describe API shapes the current backend no longer serves.

export type TAgentTrigger = {
	id: string;
	agent_id: string;
	type: TAgentTriggerType;
	config: Record<string, unknown> | null;
	initial_message?: string | null;
	is_active: boolean;
	webhook_url?: string;
	last_fired_at?: string | null;
	created_at: string;
	updated_at: string;
};

export type TAgentTriggerType = 'schedule' | 'webhook' | 'event';

export type TAgentRun = {
	id: string;
	agent_id: string;
	conversation_id: string | null;
	trigger_id: string | null;
	source: TAgentRunSource;
	status: TAgentRunStatus;
	input: unknown;
	output: unknown;
	error: string | null;
	provider: string | null;
	model: string | null;
	prompt_tokens: number | null;
	completion_tokens: number | null;
	total_tokens: number | null;
	duration_ms: number | null;
	metadata: Record<string, unknown> | null;
	started_at: string | null;
	finished_at: string | null;
	steps_count?: number;
	steps?: TAiAgentStep[];
	created_at: string;
};

export type TAgentRunsFilters = {
	status?: TAgentRunStatus;
	source?: TAgentRunSource;
	per_page?: number;
	page?: number;
};

// ─────────────────────────────────────────────────────────────
// Usage analytics — GET {agent}/analytics.
// See AgentAnalyticsController::show().
// ─────────────────────────────────────────────────────────────

export type TAgentAnalytics = {
	range: { from: string; to: string };
	totals: {
		total_runs: number;
		completed: number;
		failed: number;
		running: number;
		success_rate: number | null;
	};
	tokens: {
		total: number;
		prompt: number;
		completion: number;
		avg_per_run: number;
	};
	latency: {
		avg_duration_ms: number;
		max_duration_ms: number;
	};
	by_source: Record<string, number>;
	by_day: TAgentAnalyticsDay[];
};

export type TAgentAnalyticsFilters = {
	from?: string;
	to?: string;
};

// ─────────────────────────────────────────────────────────────
// Knowledge base (RAG grounding) — {agent}/knowledge CRUD.
// See AgentKnowledgeResource / Store|UpdateAgentKnowledgeRequest.
// ─────────────────────────────────────────────────────────────

export type TAgentMemoryScope = 'agent' | 'user';

export type TAgentMetaModelGroup = {
	provider: string;
	models: string[];
};

export type TAgentSkill = {
	id: string;
	name: string;
	slug: string;
	description: string | null;
	category?: TAgentSkillCategory | string | null;
	icon?: string | null;
	color?: string | null;
	tags?: string[] | null;
	instructions: string;
	is_shared: boolean;
	version: number;
	sort_order?: number;
	references?: TAgentSkillReference[];
	scripts?: TAgentSkillScript[];
	references_count?: number;
	scripts_count?: number;
	created_at: string;
	updated_at: string;
};

export type TSkillFilters = {
	search?: string;
	category?: string;
	is_shared?: boolean;
};

// The old backend broadcast a reply token by token (`text_delta`, `tool_call`,
// `tool_result`, `artifact`, and a terminal `agent.message.ready`). This one
// streams the same turn over server-sent events instead — see
// `TAgentSessionStreamEvent` above — so those event types are gone.

/**
 * One file an agent exported during a turn. Mirrors `ExportArtifactTool`'s
 * JSON return exactly; the SSE `tool-result` event does not carry the tool's
 * payload, so the chat resolves these from `artifacts.index` after the turn
 * completes.
 */
export type TAgentStreamArtifact = {
	id: string;
	group_id: string;
	filename: string;
	version: number;
	mime_type: string;
	size: number;
};

/**
 * Payload of `AgentMessageCreated::broadcastWith()`. Deliberately not derived
 * from `TAgentMessage`: the broadcast carries `tool_calls`, which the REST
 * resource omits, and omits `usage`, which the REST resource carries.
 */
export type TAgentMessageCreatedEvent = {
	id: string;
	agent_session_id: string;
	role: TAgentMessageRole;
	content: unknown;
	tool_calls: unknown;
	created_at: string | null;
};

export type TAiAgentStep = {
	id: string;
	step_number: number;
	action: string | null;
	tool_name: string | null;
	tool_input: Record<string, unknown> | null;
	tool_output: unknown;
	llm_reasoning: string | null;
	tokens_used: number | null;
	duration_ms: number | null;
	created_at: string;
};

export type TAgentRunSource = 'conversation' | 'trigger' | 'manual' | string;

export type TAgentRunStatus = 'pending' | 'running' | 'completed' | 'failed' | string;

export type TAgentAnalyticsDay = {
	day: string;
	runs: number;
	tokens: number;
	failed: number;
};

export type TAgentSkillScript = {
	id: string;
	name: string;
	description: string;
	language: 'php' | 'javascript';
	code: string;
	is_enabled: boolean;
	created_at: string;
	updated_at: string;
};

export type TAgentSkillReference = {
	id: string;
	title: string;
	content: string;
	sort_order: number;
};

export type TAgentSkillCategory =
	| 'General'
	| 'Research'
	| 'Data'
	| 'Communication'
	| 'Automation'
	| 'Development'
	| 'Content';

