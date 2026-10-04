/**
 * Execution Types
 * Matches Laravel backend from docs/frontend/modules/05-execution-dashboard.md
 */

export type TExecutionStatus =
	| 'queued'
	| 'running'
	| 'completed'
	| 'failed'
	| 'cancelled'
	| 'timeout';
export type TExecutionTrigger = 'manual' | 'webhook' | 'schedule' | 'test';

export type TExecution = {
	id: string;
	workflow_id: string | null;
	workspace_id?: string;
	workflow_name?: string;
	status: TExecutionStatus;
	mode?: TExecutionTrigger | string;
	started_at: string | null;
	finished_at?: string | null;
	completed_at?: string | null;
	duration_ms: number | null;
	trigger?: TExecutionTrigger | string;
	error?: unknown;
	attempt?: number;
	max_attempts?: number;
	type?: 'workflow' | 'agent';
	agent_id?: string | null;
	agent_name?: string;
	credits_consumed?: number;
};

// Execution detail — as returned by GET /workspaces/{id}/executions/{id}
export type TExecutionDetail = {
	id: string;
	status: TExecutionStatus;
	nodes: Record<string, TExecutionNode>;
};

export type TExecutionNode = {
	status: TExecutionStatus;
	output: unknown;
	duration_ms: number;
};

// Execution log entry — as returned by GET /workspaces/{id}/executions/{id}/logs
export type TExecutionLog = {
	timestamp: string;
	level: 'info' | 'warning' | 'error' | 'debug';
	message: string;
	node_id: string;
};
