// ============================================================
// Agent Approval Types
// ------------------------------------------------------------
// Autonomy modes, the action log / approval queue (`AgentAction`),
// Plan mode's plans, per-tool approval rules and the workspace's
// guardrails. Mirrors `App\Services\Agents\Approvals` on the
// backend — see `ActionGate` there for the order rules apply in.
// ============================================================

/** Strictest first — same order as `App\Enums\Agents\AutonomyMode`. */
export const AUTONOMY_MODES = ['read_only', 'ask', 'plan', 'smart', 'autopilot'] as const;
export type TAutonomyMode = (typeof AUTONOMY_MODES)[number];

export const AUTONOMY_MODE_META: Record<TAutonomyMode, { label: string; description: string }> = {
	read_only: {
		label: 'Read-only',
		description: 'Looks things up, never changes anything.',
	},
	ask: {
		label: 'Ask',
		description: 'Every action that changes something waits for approval.',
	},
	plan: {
		label: 'Plan',
		description: 'Proposes a plan first; approved steps then run on their own.',
	},
	smart: {
		label: 'Smart',
		description: 'A reviewer judges each action: low risk runs, the rest asks.',
	},
	autopilot: {
		label: 'Autopilot',
		description: 'Runs actions without asking, except destructive ones.',
	},
};

export type TActionEffect = 'read' | 'write' | 'external' | 'destructive';
export type TActionToolKind = 'node' | 'workflow' | 'builtin';
export type TActionVerdict = 'allow' | 'simulate' | 'ask' | 'deny';
export type TActionRisk = 'low' | 'medium' | 'high';

export type TAgentActionStatus =
	| 'pending'
	| 'approved'
	| 'rejected'
	| 'expired'
	| 'cancelled'
	| 'denied'
	| 'simulated'
	| 'running'
	| 'executed'
	| 'failed';

export type TAgentAction = {
	id: string;
	workspace_id: string;
	agent_id: string;
	agent_session_id: string | null;
	run_id: string | null;
	node_run_id: string | null;
	agent_message_id: string | null;
	plan_id: string | null;
	tool_call_id: string | null;
	tool_name: string;
	tool_kind: TActionToolKind;
	effect: TActionEffect;
	arguments: Record<string, unknown> | null;
	/** A reviewer's edit — what the call runs with instead of `arguments`. */
	edited_arguments: Record<string, unknown> | null;
	outcome: TActionVerdict;
	status: TAgentActionStatus;
	/** Why the gate decided as it did — `source` is `mode`, `tool_rule`, `guardrail`, … */
	reason: { source: string; detail: string; step_id?: string } | null;
	risk: TActionRisk | null;
	/** Smart mode's reviewer, in its own words. */
	review_reason: string | null;
	result: string | null;
	approvers: string[] | null;
	requested_at: string | null;
	expires_at: string | null;
	decided_by: string | null;
	decided_at: string | null;
	decision_note: string | null;
	decision_channel: string | null;
	stops_turn: boolean;
	executed_at: string | null;
	agent?: { id: string; name: string; icon: string | null; color: string | null };
	session?: {
		id: string;
		title: string | null;
		user_id: string;
		parent_session_id: string | null;
	} | null;
	created_at: string;
};

export type TAgentActionDecisionKind = 'approve' | 'edit' | 'reject';

/** One decision on a waiting action — see `ResolveAgentActionsAction`. */
export type TAgentActionDecision = {
	action_id: string;
	decision: TAgentActionDecisionKind;
	/** Required for `edit`: what the call runs with instead. */
	arguments?: Record<string, unknown> | null;
	note?: string | null;
	/** On a reject: end the agent's turn there instead of letting it carry on. */
	stop?: boolean;
	/** On an approve: run this tool without asking from now on. */
	remember?: boolean;
};

export type TDecideAgentActionsDto = { decisions: TAgentActionDecision[] };

export type TAgentActionListParams = {
	status?: TAgentActionStatus;
	agent_id?: string;
	effect?: TActionEffect;
	risk?: TActionRisk;
	tool_name?: string;
	page?: number;
};

// ─── Plans (Plan mode) ────────────────────────────────────────

export type TAgentPlanStatus = 'proposed' | 'approved' | 'rejected' | 'superseded' | 'completed';

export type TAgentPlanStep = {
	id: string;
	tool: string;
	summary: string;
	arguments: Record<string, unknown>;
	status: 'pending' | 'done' | 'skipped';
	action_id?: string;
};

export type TAgentPlan = {
	id: string;
	agent_id: string;
	agent_session_id: string;
	run_id: string | null;
	title: string;
	summary: string | null;
	steps: TAgentPlanStep[];
	status: TAgentPlanStatus;
	decided_by: string | null;
	decided_at: string | null;
	decision_note: string | null;
	created_at: string;
};

export type TApproveAgentPlanDto = {
	skip_step_ids?: string[];
	note?: string | null;
	/** Start carrying the plan out right away, as a new turn. */
	execute?: boolean;
};

export type TRejectAgentPlanDto = { note?: string | null };

// ─── Tool rules & workspace guardrails ────────────────────────

export const CONDITION_OPERATORS = [
	'eq',
	'neq',
	'in',
	'not_in',
	'contains',
	'not_contains',
	'gt',
	'gte',
	'lt',
	'lte',
	'domain_in',
	'domain_not_in',
	'matches',
	'count_gt',
	'exists',
	'missing',
] as const;
export type TConditionOperator = (typeof CONDITION_OPERATORS)[number];

export type TRuleVerdict = 'allow' | 'ask' | 'deny';

export type TApprovalCondition = {
	field: string;
	op: TConditionOperator;
	value?: unknown;
	label?: string | null;
	then: TRuleVerdict;
};

/** A tool's own rule — `approval_policy` on a tool binding or attached workflow. */
export type TApprovalPolicy = {
	/** `inherit` (or unset) follows the agent's mode. */
	mode?: TRuleVerdict | 'inherit' | null;
	conditions?: TApprovalCondition[] | null;
	rate_limit?: { max: number; per?: 'minute' | 'hour' | 'day'; then?: 'ask' | 'deny' } | null;
	/** `user:<id>` or `role:<role>` — only they (and owners/admins) may decide. */
	approvers?: string[] | null;
};

export type TGuardrail = {
	name?: string | null;
	/** Tool name patterns (`gmail_*`); empty applies to every tool. */
	tools?: string[] | null;
	effects?: TActionEffect[] | null;
	conditions?: Omit<TApprovalCondition, 'then'>[] | null;
	then: TRuleVerdict;
};

export type TWorkspaceAgentPolicy = {
	workspace_id: string;
	max_autonomy_mode: TAutonomyMode | null;
	allow_destructive_in_autopilot: boolean;
	guardrails: TGuardrail[];
	approval_ttl_minutes: number;
	allow_chat_approvals: boolean;
	updated_at: string | null;
};

export type TUpdateWorkspaceAgentPolicyDto = Partial<
	Omit<TWorkspaceAgentPolicy, 'workspace_id' | 'updated_at'>
>;

/** A tool people keep approving unchanged — see `TrustRules` on the backend. */
export type TAgentTrustSuggestion = {
	tool_name: string;
	tool_kind: TActionToolKind;
	approvals: number;
};
