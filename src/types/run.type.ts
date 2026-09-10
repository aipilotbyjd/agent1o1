// ============================================================
// Run Types
// ------------------------------------------------------------
// A run is one execution of a workflow (`runnable_type`/
// `runnable_id`). The list endpoint (`GET .../runs`) is the one
// place `TPaginationMeta` (api.type.ts) applies flat alongside
// `data` — see `RunController::index`.
// ============================================================

export type TRunStatus =
	| 'pending'
	| 'running'
	| 'awaiting_approval'
	| 'awaiting_callback'
	| 'completed'
	| 'failed'
	| 'cancelled';

export type TNodeRunStatus = TRunStatus | 'skipped';

export type TNodeRun = {
	id: string;
	key: string;
	type: string;
	status: TNodeRunStatus;
	output: unknown;
	error: string | null;
	attempt: number;
	started_at: string | null;
	finished_at: string | null;
	duration_ms: number | null;
	credits_used: number | null;
};

export type TNodeRunDetail = {
	id: string;
	run_id: string;
	key: string;
	type: string;
	status: TNodeRunStatus;
	input: unknown;
	output: unknown;
	usage: unknown;
	state: unknown;
	error: string | null;
	attempt: number;
	max_attempts: number;
	retry_delay_seconds: number | null;
	awaiting_callback_until: string | null;
	started_at: string | null;
	finished_at: string | null;
	duration_ms: number | null;
	credits_used: number | null;
	child_runs?: TRun[];
};

export type TRun = {
	id: string;
	workspace_id: string;
	runnable_type: string;
	runnable_id: string;
	workflow_id: string | null;
	workflow_version_id: string | null;
	retried_from_run_id: string | null;
	status: TRunStatus;
	trigger_type: string;
	input: unknown;
	output: unknown;
	error: string | null;
	node_runs?: TNodeRun[];
	triggered_by: string | null;
	loop_index: number | null;
	started_at: string | null;
	finished_at: string | null;
	duration_ms: number | null;
	total_credits_used: number;
	created_at: string;
};

export type TRunListParams = {
	status?: TRunStatus;
	workflow_id?: string;
	trigger_type?: string;
	exclude_trigger_type?: string;
	per_page?: number;
	page?: number;
};

// ─── Approvals ───────────────────────────────────────────────

export type TWorkflowApprovalDecision = 'approved' | 'rejected' | null;

export type TWorkflowApproval = {
	id: string;
	run_id: string;
	node_run_id: string;
	requested_at: string;
	decided_at: string | null;
	decided_by: string | null;
	decision: TWorkflowApprovalDecision;
	message: string | null;
};

export type TDecideApprovalDto = {
	decision: 'approve' | 'reject';
	message?: string | null;
};
