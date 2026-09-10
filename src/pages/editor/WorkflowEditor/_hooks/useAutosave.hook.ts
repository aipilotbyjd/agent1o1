import { useEffect, useRef } from 'react';
import { AUTOSAVE_DEBOUNCE_MS } from '../_helper/builder.constants';
import { exportWorkflow } from '../_helper/importExport.helper';
import { useWorkflowEditor } from '../_context/WorkflowEditorProvider.context';
import { WorkflowService } from '@/api/modules/workflows';

export const useAutosave = () => {
	const { state, dispatch } = useWorkflowEditor();
	const timer = useRef<number | null>(null);

	useEffect(() => {
		if (state.workflow.savingState !== 'dirty') return;
		if (timer.current) window.clearTimeout(timer.current);

		timer.current = window.setTimeout(async () => {
			dispatch({ type: 'SET_SAVE_STATE', savingState: 'saving' });
			const { workspaceId, apiId } = state.workflow;

			if (workspaceId && apiId) {
				try {
					await WorkflowService.update(workspaceId, apiId, {
						name: state.workflow.name,
						description: state.workflow.description || undefined,
						nodes: state.nodes.map((node) => ({
							id: node.id,
							type: node.data.defKey,
							position: node.position,
							data: node.data,
						})),
						edges: state.edges.map((edge) => ({
							id: edge.id,
							source: edge.source,
							target: edge.target,
							sourceHandle: edge.sourceHandle,
							targetHandle: edge.targetHandle,
						})),
					});
					dispatch({ type: 'SET_SAVE_STATE', savingState: 'saved' });
				} catch (err) {
					console.error('Failed to autosave workflow to API:', err);
					dispatch({ type: 'SET_SAVE_STATE', savingState: 'error' });
				}
			} else {
				try {
					localStorage.setItem(`workflow-editor:${state.workflow.id}`, exportWorkflow(state));
					dispatch({ type: 'SET_SAVE_STATE', savingState: 'saved' });
				} catch {
					dispatch({ type: 'SET_SAVE_STATE', savingState: 'error' });
				}
			}
		}, AUTOSAVE_DEBOUNCE_MS);

		return () => {
			if (timer.current) window.clearTimeout(timer.current);
		};
	}, [dispatch, state]);
};
