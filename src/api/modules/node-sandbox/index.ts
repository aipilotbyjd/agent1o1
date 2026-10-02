import { useMutation } from '@tanstack/react-query';

/** Old's standalone code-sandbox request. */
export interface INodeSandboxRequest {
	code: string;
	input_data?: Record<string, unknown>;
}

export interface INodeSandboxResult {
	output: Record<string, unknown>;
	logs: string[];
	duration_ms: number;
	error?: string;
}

/**
 * Ported-frontend adapter.
 *
 * Old ran arbitrary node code in a server-side sandbox via its own endpoint.
 * This backend exposes nothing equivalent — the closest thing, testing a node,
 * requires that node to already exist inside a saved workflow. Kept so the
 * ported sandbox panel compiles, and failing loudly so the gap is visible at the
 * point of use.
 */
export const useNodeSandbox = (_ws: string) =>
	useMutation<INodeSandboxResult, Error, INodeSandboxRequest>({
		mutationFn: () =>
			Promise.reject(new Error('The node sandbox is not supported by this backend yet')),
		meta: { errorMessage: 'Node sandbox is not supported yet' },
	});
