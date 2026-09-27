// AI Workflow Builder — /workspaces/{workspace}/workflow-builder-sessions
//
// Mirrors the backend's `WorkflowBuilderSession*` resources. A session owns a
// `draft_graph` in the same shape `PUT /workflows/{id}/graph` takes — nodes
// keyed by `key`, edges as `{ from, to, condition }` — so the canvas converts
// it with the same helpers it uses for a saved workflow.

// ─── Draft graph ─────────────────────────────────────────────

export type TBuilderGraphNode = {
	key: string;
	type: string;
	config: Record<string, unknown>;
	position?: { x: number; y: number } | null;
};

/** `condition`: `null` = always taken, `"error"` = taken when `from` fails,
 *  anything else = the router/filter `result` value that selects the branch. */
export type TBuilderGraphEdge = {
	from: string;
	to: string;
	condition: string | null;
};

export type TBuilderGraph = {
	nodes: TBuilderGraphNode[];
	edges: TBuilderGraphEdge[];
};

// ─── Sessions & messages ─────────────────────────────────────

export type TBuilderSessionStatus = 'active' | 'promoted' | 'archived';

export type TBuilderMessageStatus = 'pending' | 'processing' | 'completed' | 'failed';

/** What one assistant reply changed in the draft — `DraftDiff::between()`. */
export type TBuilderMessageAction =
	| { type: 'node_added' | 'node_updated' | 'node_removed'; key: string; node_type: string }
	| { type: 'edge_added' | 'edge_removed'; from: string; to: string; condition: string | null };

export type TBuilderMessage = {
	id: string;
	session_id: string;
	draft_version_id: string | null;
	role: 'user' | 'assistant';
	content: string;
	actions: TBuilderMessageAction[] | null;
	processing_status: TBuilderMessageStatus;
	error_message: string | null;
	created_at: string;
};

export type TBuilderSession = {
	id: string;
	workspace_id: string;
	user_id: string;
	workflow_id: string | null;
	title: string;
	draft_graph: TBuilderGraph;
	draft_lock_version: number;
	status: TBuilderSessionStatus;
	last_activity_at: string | null;
	messages?: TBuilderMessage[];
	messages_count?: number;
	created_at: string;
	updated_at?: string;
};

export type TBuilderDraftVersion = {
	id: string;
	session_id: string;
	label: string | null;
	triggered_by: string | null;
	node_count: number;
	edge_count: number;
	graph_snapshot?: TBuilderGraph;
	created_at: string;
};

// ─── Request DTOs ────────────────────────────────────────────

export type TCreateBuilderSessionDto = {
	title?: string;
	workflow_id?: string | null;
	/** Sent as the session's first message straight away. */
	prompt?: string;
};

export type TUpdateBuilderSessionDto = {
	title?: string;
	/** `promoted` is set by promoting, never directly. */
	status?: 'active' | 'archived';
};

/** The canvas's copy of the draft, plus the lock version it was built on —
 *  the server answers 409 if the assistant changed the draft since. */
export type TSyncBuilderDraftDto = TBuilderGraph & { draft_lock_version: number };

export type TSendBuilderMessageDto = { message: string };

export type TPromoteBuilderSessionDto = { name?: string };

export type TListBuilderSessionsParams = { status?: TBuilderSessionStatus };

// ─── Assist (one-shot helpers; none change the draft) ────────

export type TBuilderNodeSuggestion = {
	type: string;
	name: string;
	reason: string;
	connect_from: string | null;
};

export type TConfigureBuilderNodeDto = {
	instruction: string;
	/** A node about to be added… */
	type?: string;
	/** …or one already in the draft. */
	key?: string;
};

export type TBuilderNodeConfigProposal = {
	type: string;
	config: Record<string, unknown>;
	explanation: string;
	needs_from_user: string[];
	/** Where the proposal breaks the node's config schema. */
	errors: string[];
};

export type TBuilderWorkflowExplanation = {
	summary: string;
	steps: { key: string; description: string }[];
};

export type TBuilderImprovement = {
	title: string;
	description: string;
	priority: 'high' | 'medium' | 'low';
	node_keys: string[];
	suggested_type: string | null;
};

// ─── Realtime — `WorkflowBuilderActivity` (`builder.<type>`) ─

type TBuilderEventBase = { session_id: string; message_id: string };

export type TBuilderStatusEvent = TBuilderEventBase & {
	status: 'processing' | 'completed' | 'failed';
	title?: string;
	draft_lock_version?: number;
	error_message?: string;
};

export type TBuilderDeltaEvent = TBuilderEventBase & { delta: string };

export type TBuilderToolCallEvent = TBuilderEventBase & {
	id: string;
	name: string;
	/** Capped server-side; may arrive as a truncated JSON string. */
	arguments: Record<string, unknown> | string;
};

export type TBuilderToolResultEvent = TBuilderEventBase & {
	id: string;
	name: string;
	output: string;
	successful: boolean;
};

export type TBuilderDraftEvent = TBuilderEventBase & {
	draft_lock_version: number;
	label: string | null;
};

// ─── Diagnostics on a saved workflow ─────────────────────────

export type TWorkflowGraphNodeInput = {
	key: string;
	type: string;
	config?: Record<string, unknown> | null;
};

export type TWorkflowGraphEdgeInput = {
	from: string;
	to: string;
	condition?: string | null;
};

export type TValidateWorkflowDto = {
	graph?: { nodes: TWorkflowGraphNodeInput[]; edges: TWorkflowGraphEdgeInput[] };
};

export type TDryRunWorkflowDto = TValidateWorkflowDto & {
	input?: Record<string, unknown>;
};

export type TWorkflowValidationResult = {
	valid: boolean;
	issues: unknown[];
};

/** `DryRunner::run()`. */
export type TWorkflowDryRun = {
	ok: boolean;
	issues: string[];
	/** Template references that can't resolve. */
	warnings: string[];
	/** References into a node whose output shape isn't known yet (never run or
	 *  pinned) — not errors, just unchecked. */
	unverified: string[];
	steps: {
		key: string;
		type: string;
		resolved_config: Record<string, unknown>;
		sample_output: unknown;
	}[];
};

export type TWorkflowDryRunResult = {
	dry_run: TWorkflowDryRun;
};

export type TTestWorkflowNodeDto = {
	input?: Record<string, unknown>;
	nodes?: Record<string, unknown>;
	config?: Record<string, unknown> | null;
};
