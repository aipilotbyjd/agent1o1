import { useEffect, useRef, useState } from 'react';
import { useWorkspaceContext } from '@/context/workspace';

/**
 * Makes the workspace in the URL the user's current one, so every page and the
 * sidebar agree. Only a change of the URL's workspace is reconciled: a switcher
 * that moves the current workspace and then navigates is not switched back.
 *
 * Pass `undefined` when there is nothing to sync (no id in the URL, or the user
 * is not a member). Returns `true` while the switch is still pending.
 */
export const useSyncActiveWorkspace = (workspaceId?: string): boolean => {
	const { activeWorkspaceId, isLoading, switchWorkspace } = useWorkspaceContext();
	const [syncedFor, setSyncedFor] = useState<string | null>(null);
	const switchingFor = useRef<string | null>(null);

	// Ids are typed `string` but Laravel sends numbers, so compare as strings.
	const isActive = String(activeWorkspaceId) === workspaceId;
	const isUnsynced = !isLoading && !!workspaceId && syncedFor !== workspaceId;

	// Already on it when the page opened: nothing to switch, and it stays that way.
	if (isUnsynced && isActive) setSyncedFor(workspaceId);

	const isPending = isUnsynced && !isActive;

	useEffect(() => {
		if (!isPending || !workspaceId || switchingFor.current === workspaceId) return;

		switchingFor.current = workspaceId;
		switchWorkspace(workspaceId)
			.catch(() => undefined)
			.finally(() => {
				switchingFor.current = null;
				setSyncedFor(workspaceId);
			});
	}, [workspaceId, isPending, switchWorkspace]);

	return isPending;
};

export default useSyncActiveWorkspace;
