import { useConfirm } from '@/context/confirm';
import { ApiError, notify } from '@/api/core';
import { useRestoreWorkflowVersion } from '@/api/modules/workflows';
import { placeUnpositioned } from '../_helper/layout.helper';
import { queueDraftWrite } from '../_helper/persistDraft.helper';
import { workflowDraftToCanvas } from '../_helper/workflowApiTransform.helper';
import { useWorkflowEditor } from './useWorkflowEditor.hook';

type TRestoreOptions = {
	/** The draft has edits the live version doesn't, so restoring loses them. */
	draftHasChanges: boolean;
	/** Restoring the live version — i.e. throwing the draft's edits away. */
	isDiscard?: boolean;
};

/**
 * Copies a published version into the draft. Nothing goes live: the person
 * reviews it and publishes. The replaced draft stays one undo away.
 */
export const useVersionRestore = () => {
	const { state, dispatch } = useWorkflowEditor();
	const { confirm } = useConfirm();
	const workspaceId = state.workflow.workspaceId ?? '';
	const workflowId = state.workflow.apiId ?? '';
	const restoreMutation = useRestoreWorkflowVersion(workspaceId, workflowId);

	const restore = async (
		version: { id: string; version: number },
		{ draftHasChanges, isDiscard = false }: TRestoreOptions,
	) => {
		if (!workspaceId || !workflowId) return false;

		if (isDiscard) {
			const confirmed = await confirm({
				title: 'Discard unpublished changes?',
				message: `Your draft goes back to v${version.version}, the version that's live now. You can undo this with ⌘Z.`,
				confirmText: 'Discard changes',
			});
			if (!confirmed) return false;
		} else if (draftHasChanges) {
			const confirmed = await confirm({
				title: `Restore v${version.version}?`,
				message:
					'Your unpublished changes will be replaced by this version. You can undo this with ⌘Z. Nothing goes live until you publish.',
				confirmText: 'Restore',
				tone: 'primary',
			});
			if (!confirmed) return false;
		}

		try {
			// Behind any autosave still in flight, so it can't land afterwards.
			const workflow = await queueDraftWrite(workspaceId, workflowId, () =>
				restoreMutation.mutateAsync(version.id),
			);
			const restored = workflowDraftToCanvas(workflow);
			const unpositioned = new Set(
				(workflow.nodes ?? []).filter((node) => !node.position).map((node) => node.key),
			);
			const isUnplaced = unpositioned.size > 0;
			dispatch({
				type: 'RESTORE_DRAFT',
				edges: restored.edges,
				nodes: placeUnpositioned(
					restored.nodes,
					restored.edges,
					(node) => !unpositioned.has(node.id),
					new Map(state.nodes.map((node) => [node.id, node.position])),
				),
			});
			// Positions placed here exist only on the canvas until autosave stores them.
			if (isUnplaced) dispatch({ type: 'SET_SAVE_STATE', savingState: 'dirty' });
			notify.success(
				isDiscard
					? 'Changes discarded'
					: `Restored v${version.version} to your draft. Publish it to make it live.`,
			);
			return true;
		} catch (error) {
			if (ApiError.is(error) && error.status === 422) {
				notify.error(
					`v${version.version} can't be restored as it is: ${error.issues[0]?.message ?? error.message}`,
				);
			}
			return false;
		}
	};

	return { restore, isRestoring: restoreMutation.isPending };
};
