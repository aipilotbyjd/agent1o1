import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { TRunListParams } from '@/types/run.type';
import type { TDecideApprovalDto } from '@/types/run.type';
import type { TStartRunDto } from '@/types/workflow.type';
import { RunService } from './runs.service';
import { runKeys } from './runs.keys';

export const useStartRun = (ws: string) => {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: ({ workflowId, body }: { workflowId: string; body?: TStartRunDto }) =>
			RunService.start(ws, workflowId, body),
		onSuccess: () => qc.invalidateQueries({ queryKey: runKeys.lists(ws) }),
		meta: { errorMessage: 'Failed to start run' },
	});
};

export const useRuns = (ws: string, params?: TRunListParams) =>
	useQuery({
		queryKey: runKeys.list(ws, params),
		queryFn: ({ signal }) => RunService.list(ws, params, signal),
		enabled: !!ws,
	});

export const useRun = (ws: string, id: string) =>
	useQuery({
		queryKey: runKeys.detail(ws, id),
		queryFn: ({ signal }) => RunService.detail(ws, id, signal),
		enabled: !!ws && !!id,
	});

export const useCancelRun = (ws: string) => {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (id: string) => RunService.cancel(ws, id),
		onSuccess: (_run, id) => {
			qc.invalidateQueries({ queryKey: runKeys.lists(ws) });
			qc.invalidateQueries({ queryKey: runKeys.detail(ws, id) });
		},
		meta: { errorMessage: 'Failed to cancel run' },
	});
};

export const useRetryRun = (ws: string) => {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (id: string) => RunService.retry(ws, id),
		onSuccess: () => qc.invalidateQueries({ queryKey: runKeys.lists(ws) }),
		meta: { errorMessage: 'Failed to retry run' },
	});
};

export const useNodeRuns = (ws: string, runId: string) =>
	useQuery({
		queryKey: runKeys.nodeRuns(ws, runId),
		queryFn: ({ signal }) => RunService.nodeRuns(ws, runId, signal),
		enabled: !!ws && !!runId,
	});

export const useNodeRun = (ws: string, runId: string, nodeRunId: string) =>
	useQuery({
		queryKey: runKeys.nodeRun(ws, runId, nodeRunId),
		queryFn: ({ signal }) => RunService.nodeRun(ws, runId, nodeRunId, signal),
		enabled: !!ws && !!runId && !!nodeRunId,
	});

export const useDecideRunApproval = (ws: string, runId: string) => {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: ({ approvalId, body }: { approvalId: string; body: TDecideApprovalDto }) =>
			RunService.decideApproval(ws, runId, approvalId, body),
		onSuccess: () => qc.invalidateQueries({ queryKey: runKeys.detail(ws, runId) }),
		meta: { errorMessage: 'Failed to record approval decision' },
	});
};
