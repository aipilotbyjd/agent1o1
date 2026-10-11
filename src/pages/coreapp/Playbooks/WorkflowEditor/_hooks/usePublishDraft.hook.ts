import { useLayoutEffect, useRef } from 'react';
import { ApiError, notify } from '@/api/core';
import { usePublishWorkflowVersion } from '@/api/modules/workflows';
import { usePersistWorkflowDraft } from './usePersistWorkflowDraft.hook';
import { useWorkflowEditor } from './useWorkflowEditor.hook';

/**
 * Pushes the canvas, then publishes it as the new live version. A refused
 * publish opens the issues checklist instead of a toast.
 */
export const usePublishDraft = () => {
	const { state, dispatch } = useWorkflowEditor();
	const persistWorkflowDraft = usePersistWorkflowDraft();
	const publishVersion = usePublishWorkflowVersion(
		state.workflow.workspaceId ?? '',
		state.workflow.apiId ?? '',
	);
	const stateRef = useRef(state);
	useLayoutEffect(() => {
		stateRef.current = state;
	});
	const publishingRef = useRef(false);

	const publish = async (notes?: string) => {
		if (publishingRef.current) return false;
		const { workspaceId, apiId } = state.workflow;
		if (!workspaceId || !apiId) {
			dispatch({ type: 'SET_SAVE_STATE', savingState: 'dirty' });
			return false;
		}

		publishingRef.current = true;
		const draft = state;
		dispatch({ type: 'SET_SAVE_STATE', savingState: 'saving' });
		// Publishing snapshots the server-side draft, so push the canvas first —
		// otherwise anything still inside the autosave debounce is left out.
		try {
			await persistWorkflowDraft({
				workspaceId,
				workflowId: apiId,
				name: state.workflow.name,
				description: state.workflow.description,
				nodes: state.nodes,
				edges: state.edges,
			});
		} catch (error) {
			if (ApiError.is(error) && error.issues.length > 0) {
				dispatch({ type: 'SET_ISSUES_PANEL', open: true, serverIssues: error.issues });
			} else {
				notify.error(ApiError.is(error) ? error.message : 'Could not save the workflow');
			}
			dispatch({ type: 'SET_SAVE_STATE', savingState: 'error' });
			publishingRef.current = false;
			return false;
		}

		const editedSince = () => {
			const current = stateRef.current;
			return (
				current.nodes !== draft.nodes ||
				current.edges !== draft.edges ||
				current.workflow.name !== draft.workflow.name ||
				current.workflow.description !== draft.workflow.description
			);
		};

		try {
			const data = await publishVersion.mutateAsync({ notes: notes?.trim() || null });
			dispatch({
				type: 'SET_WORKFLOW_META',
				patch: {
					currentVersionId: data.version.id,
					currentVersionNumber: data.version.version,
					savingState: editedSince() ? 'dirty' : 'saved',
				},
			});
			notify.success(`v${data.version.version} is live`);
			return true;
		} catch (error) {
			if (ApiError.is(error) && error.status === 422) {
				dispatch({ type: 'SET_ISSUES_PANEL', open: true, serverIssues: error.issues });
			}
			dispatch({ type: 'SET_SAVE_STATE', savingState: editedSince() ? 'dirty' : 'saved' });
			return false;
		} finally {
			publishingRef.current = false;
		}
	};

	return { publish, isPublishing: publishVersion.isPending };
};
