import { RunService } from '@/api/modules/runs';

/**
 * Ported-frontend adapter.
 *
 * The old frontend called workflow runs "executions" and reached them through
 * `ExecutionService`. This backend calls the same resource a *run* and serves it
 * from `@/api/modules/runs`, so this maps the old names and call signatures onto
 * it and the ported editor hooks needed no changes — same approach as the
 * agent-builder adapters in `agents.hooks.ts`.
 *
 * Only the four methods the ported editor actually calls are adapted. `logs` has
 * no counterpart: this backend exposes per-node runs instead of a run-level log
 * stream, so it fails loudly rather than returning something it cannot produce.
 */
export const ExecutionService = {
	detail: (ws: string, id: string, signal?: AbortSignal) => RunService.detail(ws, id, signal),

	nodes: (ws: string, id: string, signal?: AbortSignal) => RunService.nodeRuns(ws, id, signal),

	cancel: (ws: string, id: string) => RunService.cancel(ws, id).then(() => undefined),

	/** No run-level log endpoint on this backend — logs live on each node run. */
	logs: (_ws: string, _id: string, _signal?: AbortSignal): Promise<never> =>
		Promise.reject(new Error('Run logs are not exposed by this backend yet')),
};
