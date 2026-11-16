// ============================================================
// Dashboard Types
// ------------------------------------------------------------
// `days` window shared by overview/run-stats/credit-usage: see
// `DashboardWindow` on the backend. `in_flight` and
// `pending_approvals` are current-state, never window-scoped: a
// run stuck since last week is exactly what a dashboard exists to
// surface, and a window would hide the oldest, worst cases.
// ============================================================
import type { TPaginationMeta } from './api.type';
import type { TRun } from './run.type';

export type TDashboardWindow = {
	days: number;
	starts_at: string;
	ends_at: string;
};

export type TDashboardWindowParams = {
	days?: number;
};

export type TRunTotals = {
	total: number;
	completed: number;
	failed: number;
	cancelled: number;
	in_flight: number;
	success_rate: number | null;
	avg_duration_ms: number | null;
	by_status: Record<string, number>;
};

export type TRunSeriesPoint = { date: string; total: number; completed: number; failed: number };

export type TTopWorkflowByRuns = {
	workflow_id: string;
	name: string | null;
	runs: number;
	failed: number;
};

export type TDashboardCredits = {
	available: number | null;
	used_this_period: number;
	limit_this_period: number | null;
	period_starts_at: string;
	period_ends_at: string;
	window_credits: number;
} | null;

export type TDashboardCounts = {
	workflows: number;
	agents: number;
	active_triggers: number;
	members: number;
};

export type TGettingStartedMilestoneKey =
	| 'run_workflow'
	| 'connect_app'
	| 'activate_trigger'
	| 'create_agent'
	| 'invite_teammate';

export type TGettingStartedMilestone = {
	key: TGettingStartedMilestoneKey;
	label: string;
	description: string;
	completed: boolean;
};

export type TRecommendedTemplate = {
	id: string;
	name: string;
	description: string | null;
	category: string | null;
	icon: string | null;
	color: string | null;
};

/**
 * The dashboard checklist. Milestones are read off what the workspace has
 * done (so they are shared by its members); `dismissed` is the viewer's own.
 * `recommended_templates` is empty once the workspace has a workflow.
 */
export type TGettingStarted = {
	dismissed: boolean;
	completed: boolean;
	milestones: TGettingStartedMilestone[];
	recommended_templates: TRecommendedTemplate[];
};

export type TDashboardOverview = {
	window: TDashboardWindow;
	runs: TRunTotals;
	in_flight: Record<string, number>;
	pending_approvals: number;
	/** Agent actions waiting on a person: the approvals inbox. */
	pending_agent_actions?: number;
	credits: TDashboardCredits;
	counts: TDashboardCounts;
	getting_started?: TGettingStarted;
	recent_runs: TRun[];
};

export type TRunStatsParams = TDashboardWindowParams & {
	workflow_id?: string;
};

export type TRunStats = {
	window: TDashboardWindow;
	workflow_id: string | null;
	totals: TRunTotals;
	in_flight: Record<string, number>;
	series: TRunSeriesPoint[];
	top_workflows: TTopWorkflowByRuns[];
};

export type TCreditSeriesPoint = { date: string; credits: number; topup_credits: number };

export type TTopWorkflowByCredits = { workflow_id: string; name: string | null; credits: number };

export type TTopAgentByCredits = { agent_id: string; name: string | null; credits: number };

export type TCreditUsage = {
	window: TDashboardWindow;
	total_credits: number;
	topup_credits: number;
	by_source_type: Record<string, number>;
	series: TCreditSeriesPoint[];
	top_workflows: TTopWorkflowByCredits[];
	top_agents: TTopAgentByCredits[];
};

export type TPendingApproval = {
	id: string;
	run_id: string;
	node_run_id: string;
	requested_at: string | null;
	waiting_seconds: number | null;
	node?: { key: string; type: string };
	run?: {
		id: string;
		status: string;
		trigger_type: string;
		started_at: string | null;
		workflow: { id: string; name: string } | null;
	};
};

export type TPendingApprovalsResult = { approvals: TPendingApproval[]; meta: TPaginationMeta };
