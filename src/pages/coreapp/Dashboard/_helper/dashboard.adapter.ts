import { useMemo } from 'react';
import { useDashboardOverview, useRunStats } from '@/api/modules/dashboard';
import type {
	IDashboardData,
	IExecutionSummary,
	IFailureSummary,
	IWorkflowStats,
	TDashboardPeriod,
	TExecutionStatus,
	TTriggerType,
} from '../_types/dashboard.type';

/**
 * Ported-frontend adapter.
 *
 * The old dashboard called a single `useDashboard(ws, period)` that returned one
 * `IDashboardData` blob. This backend splits the same ground across
 * `dashboard/overview` and `dashboard/run-stats`, under different field names, so
 * this composes both and reshapes them into the old contract — keeping the ported
 * page itself unchanged, the same way the agent-builder adapters in
 * `agents.hooks.ts` do.
 *
 * Fields this backend exposes no source for are left empty and flagged inline;
 * they are the backend-adaptation pass's input.
 */
const PERIOD_DAYS: Record<TDashboardPeriod, number> = { '7d': 7, '30d': 30, '90d': 90 };

const toMs = (iso: string | null) => (iso ? Date.parse(iso) : undefined);

export const useDashboard = (ws: string, period: TDashboardPeriod = '7d') => {
	const days = PERIOD_DAYS[period];
	const overview = useDashboardOverview(ws, { days });
	const stats = useRunStats(ws, { days });

	const data = useMemo<IDashboardData | undefined>(() => {
		if (!overview.data) return undefined;

		const { runs, counts, in_flight, recent_runs } = overview.data;
		const series = stats.data?.series ?? [];
		// The series is ascending by date, so the last bucket is today.
		const today = series[series.length - 1];

		const recentExecutions: IExecutionSummary[] = recent_runs.map((run) => ({
			id: run.id,
			workflow_id: run.workflow_id ?? '',
			// `recent_runs` carries no workflow name — only the id.
			workflow_name: '',
			status: run.status as TExecutionStatus,
			trigger_type: run.trigger_type as TTriggerType,
			duration_ms: run.duration_ms ?? undefined,
			started_at: toMs(run.started_at),
			completed_at: toMs(run.finished_at),
			created_at: Date.parse(run.created_at),
		}));

		// No dedicated failures endpoint here; the failed runs already in
		// `recent_runs` are the closest honest source.
		const recentFailures: IFailureSummary[] = recent_runs
			.filter((run) => run.status === 'failed')
			.map((run) => ({
				id: run.id,
				workflow_id: run.workflow_id ?? '',
				workflow_name: '',
				error_message: run.error ?? 'Run failed',
				failed_at: Date.parse(run.finished_at ?? run.created_at),
			}));

		const topWorkflows: IWorkflowStats[] = (stats.data?.top_workflows ?? []).map((w) => ({
			id: w.workflow_id,
			name: w.name ?? '',
			// Per-workflow status, timing and success counts are not part of this
			// endpoint; only run and failure totals are.
			status: 'active',
			execution_count: w.runs,
			success_count: Math.max(w.runs - w.failed, 0),
			failed_count: w.failed,
			success_rate: w.runs > 0 ? ((w.runs - w.failed) / w.runs) * 100 : 0,
			avg_duration_ms: 0,
		}));

		return {
			summary: {
				total_workflows: counts.workflows,
				// This backend reports one workflow count, not a per-status split.
				active_workflows: 0,
				inactive_workflows: 0,
				draft_workflows: 0,
				total_executions_today: today?.total ?? 0,
				total_executions_week: runs.total,
				// Nothing month-scoped is exposed.
				total_executions_month: 0,
				success_rate: runs.success_rate ?? 0,
				avg_duration_ms: runs.avg_duration_ms ?? 0,
				// Credentials live under connectors, not the dashboard.
				total_credentials: 0,
				total_schedules: counts.active_triggers,
				active_schedules: counts.active_triggers,
				running_executions: runs.in_flight,
				queued_executions: in_flight.pending ?? 0,
			},
			recent_executions: recentExecutions,
			top_workflows: topWorkflows,
			recent_failures: recentFailures,
			executions_by_day: series.map((point) => ({
				date: point.date,
				total: point.total,
				success: point.completed,
				failed: point.failed,
			})),
			// No hourly breakdown, schedule list or trigger-type split on this backend.
			executions_by_hour: [],
			upcoming_schedules: [],
			executions_by_status: Object.entries(runs.by_status).map(([status, count]) => ({
				status: status as TExecutionStatus,
				count,
			})),
			trigger_type_stats: [],
		};
	}, [overview.data, stats.data]);

	return {
		...overview,
		data,
		isLoading: overview.isLoading || stats.isLoading,
	};
};
