import { getNodeOutput } from '../_helper/outputPorts.helper';
import { useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { WorkflowService, workflowKeys } from '@/api/modules/workflows';
import { useTestWorkflowNode } from '@/api/modules/workflow-builder';
import type { TWorkflow } from '@/types/workflow.type';
import { useWorkflowEditor } from '../_context/WorkflowEditorProvider.context';

/**
 * Runs a single node against the real backend test endpoint (resolves config +
 * invokes the handler) and writes the result into node state. Shared by every
 * "Test" entry point (inline card, floating toolbar, expanded view) so there is
 * exactly one test path — never the `nodeTest.helper` mock.
 */
export const useNodeTestRunner = (nodeId: string, defKey: string) => {
	const { state, dispatch } = useWorkflowEditor();
	const node = state.nodes.find((n) => n.id === nodeId);
	const ws = state.workflow.workspaceId;
	const workflowId = state.workflow.apiId;
	const queryClient = useQueryClient();
	const testNode = useTestWorkflowNode(ws ?? '', workflowId ?? '');
	const testStatus = node?.data.testStatus ?? 'idle';

	// Sample input for the test: the last output of every upstream node
	// (from a prior run or pinned data), keyed by that node's id so the backend
	// can resolve the node's real {{nodes.<id>.*}} tokens.
	const upstreamInput = useMemo<Record<string, unknown>>(() => {
		const input: Record<string, unknown> = {};
		const visited = new Set<string>([nodeId]);
		const visit = (id: string) => {
			state.edges
				.filter((edge) => edge.target === id)
				.forEach((edge) => {
					if (visited.has(edge.source)) return;
					visited.add(edge.source);
					const source = state.nodes.find((item) => item.id === edge.source);
					if (source) {
						const output = getNodeOutput(source.data);
						if (output !== undefined) input[source.id] = output;
					}
					visit(edge.source);
				});
		};
		visit(nodeId);
		return input;
	}, [state.edges, state.nodes, nodeId]);

	const runTest = async () => {
		if (!ws || !workflowId || testStatus === 'running') return;

		dispatch({ type: 'SET_NODE_TEST_STATUS', id: nodeId, status: 'running' });

		try {
			const detailKey = workflowKeys.detail(ws, workflowId);
			const saved =
				queryClient.getQueryData<TWorkflow>(detailKey) ??
				(await WorkflowService.detail(ws, workflowId));
			const savedNode = saved.nodes?.find((item) => item.key === nodeId);
			if (!savedNode) throw new Error('Save this node before testing it.');
			const result = await testNode.mutateAsync({
				nodeId: String(savedNode.id),
				body: {
					config: node?.data.values ?? {},
					nodes: Object.fromEntries(
						Object.entries(upstreamInput).map(([key, output]) => [key, { output }]),
					),
				},
			});

			dispatch({
				type: 'SET_NODE_TEST_STATUS',
				id: nodeId,
				status: result.status === 'completed' ? 'success' : 'error',
				output: result.output,
				input: result.input,
				error: result.error ?? undefined,
				durationMs: result.duration_ms ?? undefined,
			});
		} catch (err) {
			dispatch({
				type: 'SET_NODE_TEST_STATUS',
				id: nodeId,
				status: 'error',
				error:
					err instanceof Error
						? err.message
						: 'Test request failed - check the connection.',
			});
		}
	};

	return { runTest, testStatus, canRun: Boolean(ws && workflowId && defKey) };
};
