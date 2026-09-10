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
import type { TTag } from './tag.type';

export type TAgent = {
	id: string;
	workspace_id: string;
	folder_id: string | null;
	name: string;
	slug: string;
	description: string | null;
	instructions: string;
	provider: string | null;
	model: string | null;
	model_catalog_id: string | null;
	model_catalog_slug?: string | null;
	temperature: number | null;
	settings: Record<string, unknown> | null;
	tags?: TTag[];
	created_by: string;
	created_at: string;
	updated_at: string;
};

export type TCreateAgentDto = {
	name: string;
	slug?: string;
	description?: string | null;
	folder_id?: string | null;
	instructions: string;
	provider?: string | null;
	model?: string | null;
	model_catalog_id?: string | null;
	temperature?: number | null;
	settings?: Record<string, unknown> | null;
};

export type TUpdateAgentDto = Partial<TCreateAgentDto>;

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

export type TReflectionApplyBehavior = 'manual' | 'automatic';

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

export type TReflectionType = 'prompt_change' | 'new_skill' | 'insight';
export type TReflectionStatus = 'pending' | 'applied' | 'dismissed';

export type TReflection = {
	id: string;
	agent_id: string;
	reflection_run_id: string;
	type: TReflectionType;
	title: string;
	rationale: string;
	evidence: unknown;
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
