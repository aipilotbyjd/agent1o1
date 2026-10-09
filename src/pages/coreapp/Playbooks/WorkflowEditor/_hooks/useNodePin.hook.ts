import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { notify } from '@/api/core';
import { WorkflowService, workflowKeys } from '@/api/modules/workflows';
import type { TWorkflow } from '@/types/workflow.type';
import { useWorkflowEditor } from '../_context/WorkflowEditorProvider.context';
import { toPinPayload } from '../_helper/workflowApiTransform.helper';
import { usePersistWorkflowDraft } from './usePersistWorkflowDraft.hook';

/**
 * Pin/unpin a node's output on the server as well as on the canvas.
 *
 * The pin routes address the node *row*, whose id changes on every graph save
 * (`replaceGraph` recreates the rows and carries pins over by key). The last
 * saved detail in the query cache maps key → row id; a node that isn't in it
 * yet has never been saved, so the canvas is saved first.
 */
export const useNodePin = () => {
	const { state, dispatch } = useWorkflowEditor();
	const queryClient = useQueryClient();
	const persistWorkflowDraft = usePersistWorkflowDraft();
	const { workspaceId, apiId } = state.workflow;

	const resolveRowId = useCallback(
		async (key: string): Promise<string | null> => {
			if (!workspaceId || !apiId) return null;
			const detailKey = workflowKeys.detail(workspaceId, apiId);
			const cached = queryClient.getQueryData<TWorkflow>(detailKey);
			const row = cached?.nodes?.find((node) => node.key === key);
			if (row) return String(row.id);

			const saved = await persistWorkflowDraft({
				workspaceId,
				workflowId: apiId,
				name: state.workflow.name,
				description: state.workflow.description,
				nodes: state.nodes,
				edges: state.edges,
			});
			const savedRow = saved.nodes?.find((node) => node.key === key);
			return savedRow ? String(savedRow.id) : null;
		},
		[
			apiId,
			persistWorkflowDraft,
			queryClient,
			state.edges,
			state.nodes,
			state.workflow.description,
			state.workflow.name,
			workspaceId,
		],
	);

	const storeRow = useCallback(
		(node: NonNullable<TWorkflow['nodes']>[number]) => {
			if (!workspaceId || !apiId) return;
			queryClient.setQueryData<TWorkflow>(
				workflowKeys.detail(workspaceId, apiId),
				(current) =>
					current
						? {
								...current,
								nodes: current.nodes?.map((row) =>
									row.key === node.key ? node : row,
								),
							}
						: current,
			);
		},
		[apiId, queryClient, workspaceId],
	);

	const pin = useCallback(
		async (nodeId: string) => {
			const node = state.nodes.find((n) => n.id === nodeId);
			if (!node) return;
			const output = node.data.outputPreview;
			dispatch({ type: 'PIN_NODE_OUTPUT', id: nodeId });
			// Unsaved (local-only) workflows keep the pin on the canvas only.
			if (!workspaceId || !apiId) return;

			try {
				const rowId = await resolveRowId(nodeId);
				if (!rowId) throw new Error('This node has not been saved yet.');
				const saved = await WorkflowService.pinNode(workspaceId, apiId, rowId, {
					data: toPinPayload(output),
				});
				storeRow(saved);
			} catch (error) {
				dispatch({ type: 'UNPIN_NODE', id: nodeId });
				notify.fromError('Could not pin this output')(error);
			}
		},
		[apiId, dispatch, resolveRowId, state.nodes, storeRow, workspaceId],
	);

	const unpin = useCallback(
		async (nodeId: string) => {
			const node = state.nodes.find((n) => n.id === nodeId);
			if (!node) return;
			const previous = node.data.pinnedOutput;
			dispatch({ type: 'UNPIN_NODE', id: nodeId });
			if (!workspaceId || !apiId) return;

			try {
				const rowId = await resolveRowId(nodeId);
				// Never saved means never pinned on the server — nothing to undo there.
				if (!rowId) return;
				const saved = await WorkflowService.unpinNode(workspaceId, apiId, rowId);
				storeRow(saved);
			} catch (error) {
				dispatch({ type: 'PIN_NODE_OUTPUT', id: nodeId, output: previous });
				notify.fromError('Could not unpin this output')(error);
			}
		},
		[apiId, dispatch, resolveRowId, state.nodes, storeRow, workspaceId],
	);

	return { pin, unpin };
};
