// ============================================================
// Runs helper
// ------------------------------------------------------------
// The History page speaks "executions"; the API speaks "runs"
// (GET /workspaces/{ws}/runs) and "node runs". Everything below is
// a view over @/api/modules/runs.
//
// Two things the run list does NOT support, and are therefore
// applied client-side after fetching:
//   * free-text search
//   * filtering by workflow vs agent (runnable_type)
// A run also carries only ids, not the workflow/agent name, so the
// names are resolved against the workflow and agent lists.
// ============================================================
import { useMemo } from 'react';
import { useRuns, useNodeRuns } from '@/api/modules/runs';
import { useWorkflows } from '@/api/modules/workflows';
import { useAgents } from '@/api/modules/agents';
import type { TRun, TRunStatus } from '@/types/run.type';
import type { TExecution, TExecutionLog, TExecutionStatus } from '../_types/execution.type';

/** `runs.runnable_type` stores the morph alias, not a class name. */
const AGENT_RUNNABLE_TYPES = ['agent', 'agent_session', 'agent_eval_run', 'reflection_run'];

const STATUS_MAP: Record<TRunStatus, TExecutionStatus> = {
	pending: 'queued',
	running: 'running',
	awaiting_approval: 'running',
	awaiting_callback: 'running',
	completed: 'completed',
	failed: 'failed',
	cancelled: 'cancelled',
};

export type TExecutionTypeFilter = 'workflow' | 'agent' | undefined;

export type TExecutionListParams = {
	page?: number;
	per_page?: number;
	search?: string;
	type?: TExecutionTypeFilter;
};

const isAgentRun = (run: TRun) => AGENT_RUNNABLE_TYPES.includes(run.runnable_type);

/**
 * Runs the History list against GET /runs, then resolves names and applies
 * the filters the endpoint doesn't implement.
 */
export const useExecutions = (ws: string, params?: TExecutionListParams) => {
	const query = useRuns(ws, { page: params?.page, per_page: params?.per_page });
	const { data: workflows } = useWorkflows(ws);
	const { data: agents } = useAgents(ws);

	const workflowNames = useMemo(
		() => new Map((workflows ?? []).map((w) => [w.id, w.name])),
		[workflows],
	);
	const agentNames = useMemo(() => new Map((agents ?? []).map((a) => [a.id, a.name])), [agents]);

	const data = useMemo(() => {
		if (!query.data) return undefined;

		const search = params?.search?.trim().toLowerCase();
		const mapped: TExecution[] = query.data.runs.map((run) => {
			const agentRun = isAgentRun(run);
			return {
				id: run.id,
				workflow_id: run.workflow_id,
				workspace_id: run.workspace_id,
				workflow_name: run.workflow_id
					? (workflowNames.get(run.workflow_id) ?? 'Workflow run')
					: undefined,
				status: STATUS_MAP[run.status] ?? 'queued',
				started_at: run.started_at,
				finished_at: run.finished_at,
				duration_ms: run.duration_ms,
				trigger: run.trigger_type,
				mode: run.trigger_type,
				error: run.error,
				type: agentRun ? 'agent' : 'workflow',
				agent_id: agentRun ? run.runnable_id : null,
				agent_name: agentRun
					? (agentNames.get(run.runnable_id) ?? 'Agent run')
					: undefined,
				credits_consumed: run.total_credits_used,
			};
		});

		const filtered = mapped.filter((item) => {
			if (params?.type && item.type !== params.type) return false;
			if (!search) return true;
			const haystack = `${item.workflow_name ?? ''} ${item.agent_name ?? ''} ${item.trigger ?? ''}`;
			return haystack.toLowerCase().includes(search);
		});

		return { data: filtered, meta: query.data.meta };
	}, [query.data, workflowNames, agentNames, params?.search, params?.type]);

	return { ...query, data };
};

/**
 * The API has no per-run log stream; node runs are the closest record of what
 * happened, so each node run becomes one log line.
 */
export const useExecutionLogs = (ws: string, runId: string) => {
	const query = useNodeRuns(ws, runId);

	const data = useMemo<TExecutionLog[] | undefined>(
		() =>
			query.data?.map((nodeRun) => ({
				timestamp: nodeRun.finished_at ?? nodeRun.started_at ?? '',
				level: nodeRun.status === 'failed' ? 'error' : 'info',
				message: nodeRun.error
					? `${nodeRun.key} (${nodeRun.type}): ${nodeRun.error}`
					: `${nodeRun.key} (${nodeRun.type}) — ${nodeRun.status}`,
				node_id: nodeRun.id,
			})),
		[query.data],
	);

	return { ...query, data };
};
