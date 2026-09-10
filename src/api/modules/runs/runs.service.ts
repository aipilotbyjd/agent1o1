import { axiosClient } from '@/api/client';
import { unwrapKey } from '@/api/core';
import type { TApiResponse, TPaginationMeta } from '@/api/core';
import type {
	TRun,
	TRunListParams,
	TNodeRunDetail,
	TWorkflowApproval,
	TDecideApprovalDto,
} from '@/types/run.type';
import type { TStartRunDto } from '@/types/workflow.type';
import { RunEndpoints as E } from './runs.endpoints';

export const RunService = {
	start: (ws: string, workflowId: string, payload?: TStartRunDto) =>
		axiosClient
			.post<TApiResponse<{ run: TRun }>>(E.start(ws, workflowId), payload)
			.then(unwrapKey<TRun>('run')),

	// The one list endpoint that paginates — `data` sits flat in the
	// envelope, `meta` alongside it.
	list: (ws: string, params?: TRunListParams, signal?: AbortSignal) =>
		axiosClient
			.get<TApiResponse<TRun[]> & { meta: TPaginationMeta }>(E.list(ws), { params, signal })
			.then((r) => ({ runs: r.data.data, meta: r.data.meta })),

	detail: (ws: string, id: string, signal?: AbortSignal) =>
		axiosClient
			.get<TApiResponse<{ run: TRun }>>(E.detail(ws, id), { signal })
			.then(unwrapKey<TRun>('run')),

	cancel: (ws: string, id: string) =>
		axiosClient
			.post<TApiResponse<{ run: TRun }>>(E.cancel(ws, id))
			.then(unwrapKey<TRun>('run')),

	retry: (ws: string, id: string) =>
		axiosClient
			.post<TApiResponse<{ run: TRun }>>(E.retry(ws, id))
			.then(unwrapKey<TRun>('run')),

	nodeRuns: (ws: string, runId: string, signal?: AbortSignal) =>
		axiosClient
			.get<TApiResponse<{ node_runs: TNodeRunDetail[] }>>(E.nodeRuns(ws, runId), { signal })
			.then(unwrapKey<TNodeRunDetail[]>('node_runs')),

	nodeRun: (ws: string, runId: string, nodeRunId: string, signal?: AbortSignal) =>
		axiosClient
			.get<TApiResponse<{ node_run: TNodeRunDetail }>>(E.nodeRun(ws, runId, nodeRunId), { signal })
			.then(unwrapKey<TNodeRunDetail>('node_run')),

	decideApproval: (ws: string, runId: string, approvalId: string, payload: TDecideApprovalDto) =>
		axiosClient
			.post<TApiResponse<{ approval: TWorkflowApproval }>>(
				E.decideApproval(ws, runId, approvalId),
				payload,
			)
			.then(unwrapKey<TWorkflowApproval>('approval')),
};
