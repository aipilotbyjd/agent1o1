// Dashboard Types

export type TExecutionStatus =
	| 'queued'
	| 'running'
	| 'completed'
	| 'failed'
	| 'cancelled'
	| 'paused';

export type TTriggerType = 'manual' | 'schedule' | 'webhook';

export type TWorkflowStatus = 'active' | 'inactive' | 'draft';

export type TDashboardPeriod = '7d' | '30d' | '90d';

export interface IDashboardSummary {
	total_workflows: number;
	active_workflows: number;
	inactive_workflows: number;
	draft_workflows: number;
	total_executions_today: number;
	total_executions_week: number;
	total_executions_month: number;
	success_rate: number;
	avg_duration_ms: number;
	total_credentials: number;
	total_schedules: number;
	active_schedules: number;
	running_executions: number;
	queued_executions: number;
}

export interface IExecutionSummary {
	id: string;
	workflow_id: string;
	workflow_name: string;
	status: TExecutionStatus;
	trigger_type: TTriggerType;
	duration_ms?: number;
	started_at?: number;
	completed_at?: number;
	created_at: number;
}

export interface IWorkflowStats {
	id: string;
	name: string;
	status: TWorkflowStatus;
	execution_count: number;
	success_count: number;
	failed_count: number;
	success_rate: number;
	avg_duration_ms: number;
	last_executed_at?: number;
}

export interface IFailureSummary {
	id: string;
	workflow_id: string;
	workflow_name: string;
	error_message: string;
	error_node_id?: string;
	failed_at: number;
}

export interface IDailyExecutions {
	date: string; // YYYY-MM-DD
	total: number;
	success: number;
	failed: number;
}

export interface IHourlyExecutions {
	hour: number; // 0-23
	count: number;
}

export interface IScheduleSummary {
	id: string;
	workflow_id: string;
	workflow_name: string;
	cron_expression: string;
	timezone: string;
	next_run_at?: number;
	is_active: boolean;
}

export interface IStatusCount {
	status: TExecutionStatus;
	count: number;
}

export interface ITriggerTypeCount {
	trigger_type: TTriggerType;
	count: number;
}

export interface IDashboardData {
	summary: IDashboardSummary;
	recent_executions: IExecutionSummary[];
	top_workflows: IWorkflowStats[];
	recent_failures: IFailureSummary[];
	executions_by_day: IDailyExecutions[];
	executions_by_hour: IHourlyExecutions[];
	upcoming_schedules: IScheduleSummary[];
	executions_by_status: IStatusCount[];
	trigger_type_stats: ITriggerTypeCount[];
}

export interface IQuickStats {
	workflows: {
		total: number;
		active: number;
	};
	executions: {
		running: number;
		queued: number;
		today: number;
	};
	credentials: {
		total: number;
		expiring_soon: number;
	};
	schedules: {
		total: number;
		active: number;
	};
}

export const DASHBOARD_COLORS = {
	completed: '#10B981',
	failed: '#EF4444',
	running: '#3B82F6',
	queued: '#F59E0B',
	cancelled: '#6B7280',
	paused: '#8B5CF6',
	success: '#10B981',
	error: '#EF4444',
	total: '#6366F1',
	schedule: '#8B5CF6',
	webhook: '#F59E0B',
	manual: '#6366F1',
} as const;

export const STATUS_BADGE_COLORS: Record<TExecutionStatus, { bg: string; text: string }> = {
	completed: {
		bg: 'bg-emerald-100 dark:bg-emerald-900/30',
		text: 'text-emerald-600 dark:text-emerald-400',
	},
	failed: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-600 dark:text-red-400' },
	running: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-600 dark:text-blue-400' },
	queued: { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-600 dark:text-amber-400' },
	cancelled: { bg: 'bg-zinc-100 dark:bg-zinc-800', text: 'text-zinc-600 dark:text-zinc-400' },
	paused: {
		bg: 'bg-primary-100 dark:bg-primary-900/30',
		text: 'text-primary-600 dark:text-primary-400',
	},
};

export const TRIGGER_ICONS: Record<TTriggerType, string> = {
	schedule: 'Clock01',
	webhook: 'Link01',
	manual: 'PlayCircle',
};
