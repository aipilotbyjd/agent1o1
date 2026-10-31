import { useLayoutEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { ApiError, notify } from '@/api/core';
import {
	publishRequestKeys,
	useCreatePublishRequest,
	usePublishWorkflowVersion,
} from '@/api/modules/workflows';
import { triggerKeys } from '@/api/modules/triggers/triggers.keys';
import { usePersistWorkflowDraft } from './usePersistWorkflowDraft.hook';
import { useWorkflowEditor } from './useWorkflowEditor.hook';

/**
 * Pushes the canvas, then either publishes it as the new live version or,
 * where the workspace reviews changes first, sends it for review. A refused
 * draft opens the issues checklist instead of a toast.
 */
export const usePublishDraft = () => {
	const { state, dispatch } = useWorkflowEditor();
	const queryClient = useQueryClient();
	const workspaceId = state.workflow.workspaceId ?? '';
	const workflowId = state.workflow.apiId ?? '';
	const persistWorkflowDraft = usePersistWorkflowDraft();
	const publishVersion = usePublishWorkflowVersion(workspaceId, workflowId);
	const createRequest = useCreatePublishRequest(workspaceId, workflowId);
	const stateRef = useRef(state);
	useLayoutEffect(() => {
		stateRef.current = state;
	});
	const submittingRef = useRef(false);

	/** Saves the canvas, then hands the saved draft to `send`. */
	const submitDraft = async (send: (editedSince: () => boolean) => Promise<void>) => {
		if (submittingRef.current) return false;
		if (!workspaceId || !workflowId) {
			dispatch({ type: 'SET_SAVE_STATE', savingState: 'dirty' });
			return false;
		}

		submittingRef.current = true;
		const draft = state;
		dispatch({ type: 'SET_SAVE_STATE', savingState: 'saving' });
		// Publishing and review both copy the server-side draft, so push the
		// canvas first, otherwise anything still inside the autosave debounce
		// is left out.
		try {
			await persistWorkflowDraft({
				workspaceId,
				workflowId,
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
			submittingRef.current = false;
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
			await send(editedSince);
			return true;
		} catch (error) {
			if (ApiError.is(error) && error.status === 422) {
				dispatch({ type: 'SET_ISSUES_PANEL', open: true, serverIssues: error.issues });
			}
			// The review rule may have changed since the editor loaded it.
			if (ApiError.is(error) && error.status === 409) {
				queryClient.invalidateQueries({ queryKey: publishRequestKeys.policy(workspaceId) });
			}
			dispatch({ type: 'SET_SAVE_STATE', savingState: editedSince() ? 'dirty' : 'saved' });
			return false;
		} finally {
			submittingRef.current = false;
		}
	};

	const publish = (notes?: string) =>
		submitDraft(async (editedSince) => {
			const data = await publishVersion.mutateAsync({ notes: notes?.trim() || null });
			// Publishing creates, updates or deletes the workflow's trigger rows
			// (TriggerNodeSync on the backend): refetch them so trigger nodes show
			// their new webhook URL and on/off state straight away.
			queryClient.invalidateQueries({ queryKey: triggerKeys.lists(workspaceId) });
			dispatch({
				type: 'SET_WORKFLOW_META',
				patch: {
					currentVersionId: data.version.id,
					currentVersionNumber: data.version.version,
					savingState: editedSince() ? 'dirty' : 'saved',
				},
			});
			notify.success(`v${data.version.version} is live`);
		});

	const requestReview = (notes?: string) =>
		submitDraft(async (editedSince) => {
			await createRequest.mutateAsync(notes?.trim() || null);
			dispatch({ type: 'SET_SAVE_STATE', savingState: editedSince() ? 'dirty' : 'saved' });
			notify.success('Sent for review. Nothing goes live until an admin approves it.');
		});

	return {
		publish,
		requestReview,
		isPublishing: publishVersion.isPending,
		isRequesting: createRequest.isPending,
	};
};
