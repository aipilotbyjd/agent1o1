import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { workflowKeys } from '@/api/modules/workflows';
import { persistWorkflowDraft } from '../_helper/persistDraft.helper';

/**
 * Every graph save recreates the node rows with fresh ids, and node tests and
 * pins address those rows through the cached detail — so each save refreshes it.
 */
export const usePersistWorkflowDraft = () => {
	const queryClient = useQueryClient();

	return useCallback(
		async (draft: Parameters<typeof persistWorkflowDraft>[0]) => {
			const saved = await persistWorkflowDraft(draft);
			queryClient.setQueryData(
				workflowKeys.detail(draft.workspaceId, draft.workflowId),
				saved,
			);
			return saved;
		},
		[queryClient],
	);
};
