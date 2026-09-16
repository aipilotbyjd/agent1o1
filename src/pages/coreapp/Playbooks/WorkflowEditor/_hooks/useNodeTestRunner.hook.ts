import { useMemo } from 'react';
import { useTestNode } from '@/api/modules/workflows/editor.hooks';
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
	const testNode = useTestNode(ws ?? '');
	const testStatus = node?.data.testStatus ?? 'idle';

	// Sample input for the test: the last output of each directly upstream node
	// (from a prior run or pinned data), keyed by that node's id so the backend
	// can resolve the node's real {{ id.output.* }} tokens.
	const upstreamInput = useMemo<Record<string, unknown>>(() => {
		const input: Record<string, unknown> = {};
		state.edges
			.filter((edge) => edge.target === nodeId)
			.forEach((edge) => {
				const source = state.nodes.find((n) => n.id === edge.source);
				if (!source) return;
				const output = source.data.pinned ? source.data.pinnedOutput : source.data.outputPreview;
				if (output !== undefined) input[source.id] = output;
			});
		return input;
	}, [state.edges, state.nodes, nodeId]);

	const runTest = async () => {
		if (!ws || testStatus === 'running') return;

		dispatch({ type: 'SET_NODE_TEST_STATUS', id: nodeId, status: 'running' });

		try {
			const result = await testNode.mutateAsync({
				node_type: defKey,
				parameters: (node?.data.values ?? {}) as Record<string, unknown>,
				input: upstreamInput,
			});

			dispatch({
				type: 'SET_NODE_TEST_STATUS',
				id: nodeId,
				status: result.success ? 'success' : 'error',
				output: result.output,
				input: result.input,
				error: result.error,
				durationMs: result.duration,
			});
		} catch (err) {
			dispatch({
				type: 'SET_NODE_TEST_STATUS',
				id: nodeId,
				status: 'error',
				error:
					err instanceof Error ? err.message : 'Test request failed — check the connection.',
			});
		}
	};

	return { runTest, testStatus, canRun: Boolean(ws) };
};
