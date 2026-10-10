import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useRealtime } from '@/context/realtime/useRealtime';
import { assistantKeys, subscribeToAssistant } from '@/api/modules/assistant';
import type { IEchoLike } from '@/api/modules/workflow-builder/workflow-builder.realtime';

/** Refreshes the Daily and Situations tabs the moment a report finishes. */
export const useAssistantRealtime = (workspaceId: string, assistantId: string | undefined) => {
	const qc = useQueryClient();
	const { echo } = useRealtime();

	useEffect(() => {
		if (!echo || !workspaceId || !assistantId) return undefined;

		return subscribeToAssistant(echo as unknown as IEchoLike, workspaceId, assistantId, () => {
			qc.invalidateQueries({ queryKey: assistantKeys.daily(workspaceId) });
			qc.invalidateQueries({ queryKey: ['assistant', workspaceId, 'situations'] });
			qc.invalidateQueries({ queryKey: assistantKeys.meetings(workspaceId) });
		});
	}, [echo, qc, workspaceId, assistantId]);
};
