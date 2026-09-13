// ============================================================
// Dashboard Types
// ------------------------------------------------------------
// The home screen's read models. Unlike the resource modules,
// these endpoints answer with the payload sitting flat in
// `data` (`ApiResponse::success([...])`), so the service unwraps
// with `unwrap`, not `unwrapKey`.
//
// What counts as a run here is narrower than the `runs` table:
// `DashboardMetrics` excludes loop children and builder node
// tests, so these totals and `GET /runs` agree with each other
// but not with a raw row count.
// ============================================================
import type { TRun, TRunStatus } from './run.type';

/** The rolling window every dashboard endpoint reports over — whole UTC
 *  days ending now, so the leading day is deliberately partial. */
export type TDashboardWindow = {
	days: number;
	starts_at: string;
	ends_at: string;
};

/** Non-terminal statuses. `in_flight` is never window-scoped: a run stuck
 *  since last week is exactly the one the dashboard exists to surface. */
export type TInFlightStatus = 'pending' | 'running' | 'awaiting_approval' | 'awaiting_callback';

export type TInFlightCounts = Record<TInFlightStatus, number>;

export type TRunTotals = {
	total: number;
	completed: number;
	failed: number;
	cancelled: number;
	in_flight: number;
	/** A 0–1 ratio over *finished* runs only, or null when none finished —
	 *  counting in-flight runs as failures would report noise as failure. */
	success_rate: number | null;
	/** Null when nothing finished in the window. */
	avg_duration_ms: number | null;
	by_status: Record<TRunStatus, number>;
};

/** What each credit charge was for — mirrors `CreditTransactionType`. */
export type TCreditSourceType = 'node_run' | 'agent_step' | 'eval_case' | 'session_evaluation';

/** Null for a viewer without `BillingView`; the tile is dropped rather
 *  than the whole request failing. */
export type TDashboardCredits = {
	available: number;
	used_this_period: number;
	limit_this_period: number | null;
	period_starts_at: string | null;
	period_ends_at: string | null;
	/** Ledger spend over the dashboard's own window — only equal to
	 *  `used_this_period` when the window is the current billing month. */
	window_credits: number;
};

export type TDashboardCounts = {
	workflows: number;
	agents: number;
	active_triggers: number;
	members: number;
};

export type TDashboardOverview = {
	window: TDashboardWindow;
	runs: TRunTotals;
	in_flight: TInFlightCounts;
	pending_approvals: number;
	credits: TDashboardCredits | null;
	counts: TDashboardCounts;
	/** Last five top-level runs — the full history is `GET /runs`. */
	recent_runs: TRun[];
};

// ─── Run stats ───────────────────────────────────────────────

/** One point per UTC day, zero-filled, so a quiet day renders as a gap
 *  in the line instead of closing it. */
export type TRunSeriesPoint = {
	date: string;
	total: number;
	completed: number;
	failed: number;
};

export type TTopWorkflowByRuns = {
	workflow_id: string;
	name: string | null;
	runs: number;
	failed: number;
};

export type TRunStats = {
	window: TDashboardWindow;
	workflow_id: string | null;
	totals: TRunTotals;
	in_flight: TInFlightCounts;
	series: TRunSeriesPoint[];
	/** Always workspace-wide, even when `workflow_id` narrows the rest. */
	top_workflows: TTopWorkflowByRuns[];
};

// ─── Credit usage ────────────────────────────────────────────

export type TCreditSeriesPoint = {
	date: string;
	credits: number;
	/** The slice that came out of the non-expiring credit-pack pool. */
	topup_credits: number;
};

export type TTopWorkflowByCredits = {
	workflow_id: string;
	name: string | null;
	credits: number;
};

export type TTopAgentByCredits = {
	agent_id: string;
	name: string | null;
	credits: number;
};

export type TCreditUsage = {
	window: TDashboardWindow;
	total_credits: number;
	topup_credits: number;
	by_source_type: Record<TCreditSourceType, number>;
	series: TCreditSeriesPoint[];
	top_workflows: TTopWorkflowByCredits[];
	top_agents: TTopAgentByCredits[];
};

// ─── Pending approvals ───────────────────────────────────────

/** A `HumanApproval` node waiting on someone, carrying enough context to
 *  be actioned straight from the dashboard. Decision fields are absent by
 *  definition — every row in this queue is undecided. */
export type TPendingApproval = {
	id: string;
	run_id: string;
	node_run_id: string;
	requested_at: string | null;
	waiting_seconds: number | null;
	node?: { key: string; type: string };
	run?: {
		id: string;
		status: TRunStatus;
		trigger_type: string;
		started_at: string | null;
		workflow: { id: string; name: string } | null;
	};
};

// ─── Request params ──────────────────────────────────────────

/** Defaults to 30 days server-side; capped at 365. */
export type TDashboardWindowParams = {
	days?: number;
};

export type TRunStatsParams = TDashboardWindowParams & {
	workflow_id?: string;
};

export type TPendingApprovalParams = {
	page?: number;
	per_page?: number;
};
