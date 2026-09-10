// ============================================================
// Workflow Builder Types
// ------------------------------------------------------------
// A conversational session that drafts a workflow graph, promoted
// to a real workflow when ready. Sending a message queues
// background processing — the assistant reply and any resulting
// draft-graph change arrive asynchronously, so the message list
// needs to be re-fetched after sending, not read off the POST
// response. `validate`/`dry-run`/`nodes/{node}/test` are pre-flight
// checks on an already-created `Workflow`, not on a builder session.
// ============================================================

export type TWorkflowBuilderSessionStatus = 'active' | 'promoted' | 'archived';

export type TWorkflowBuilderMessage = {
	id: string;
	session_id: string;
	draft_version_id: string | null;
	role: 'user' | 'assistant';
	content: string;
	actions: unknown;
	created_at: string;
};

export type TWorkflowBuilderSession = {
	id: string;
	workspace_id: string;
	user_id: string;
	workflow_id: string | null;
	title: string | null;
	draft_graph: { nodes: unknown[]; edges: unknown[] };
	draft_lock_version: number;
	status: TWorkflowBuilderSessionStatus;
	last_activity_at: string;
	messages?: TWorkflowBuilderMessage[];
	created_at: string;
};

export type TCreateBuilderSessionDto = {
	title?: string;
	workflow_id?: string | null;
};

export type TSendBuilderMessageDto = {
	message: string;
};

export type TPromoteBuilderSessionDto = {
	name?: string;
};

// ─── Builder-only workflow diagnostics ────────────────────────

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

/** `GraphValidator`'s issue shape isn't pinned down by a resource class. */
export type TWorkflowValidationResult = {
	valid: boolean;
	issues: unknown[];
};

/** `DryRunner`'s result shape isn't pinned down by a resource class either. */
export type TWorkflowDryRunResult = {
	dry_run: unknown;
};

export type TTestWorkflowNodeDto = {
	input?: Record<string, unknown>;
	nodes?: Record<string, unknown>;
	config?: Record<string, unknown> | null;
};
