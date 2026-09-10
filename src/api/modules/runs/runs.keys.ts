import type { TRunListParams } from '@/types/run.type';

export const runKeys = {
	all: (ws: string) => ['runs', ws] as const,
	lists: (ws: string) => ['runs', ws, 'list'] as const,
	list: (ws: string, params?: TRunListParams) => ['runs', ws, 'list', params ?? {}] as const,
	details: (ws: string) => ['runs', ws, 'detail'] as const,
	detail: (ws: string, id: string) => ['runs', ws, 'detail', id] as const,
	nodeRuns: (ws: string, runId: string) => ['runs', ws, runId, 'node-runs'] as const,
	nodeRun: (ws: string, runId: string, nodeRunId: string) =>
		['runs', ws, runId, 'node-runs', nodeRunId] as const,
};
