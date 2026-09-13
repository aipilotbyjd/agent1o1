import { createContext, ReactNode, useCallback, useContext, useMemo } from 'react';
import { Outlet } from 'react-router';
import { useCurrentUser, useSwitchWorkspace } from '@/api/modules/user';
import { useWorkspaces } from '@/api/modules/workspaces';
import { useAuth } from '@/context/authContext';
import type { TWorkspace } from '@/types/workspace.type';

// ============================================================
// Workspace Context
// ------------------------------------------------------------
// Every workspace-scoped hook in `api/modules` takes the workspace
// id as its first argument, so without a single owner for "which
// workspace am I in" each screen would re-derive it off the user
// payload and they would drift apart the moment one is switched.
//
// Like `authContext`, this owns no state of its own: the active
// workspace is `user.current_workspace`, which the backend persists
// and `useSwitchWorkspace` writes straight back into the user cache.
// Switching therefore re-renders every consumer with a new id, and
// because query keys are `[resource, ws, ...]` the old workspace's
// data stays cached rather than leaking into the new one.
// ============================================================

export interface IWorkspaceContextProps {
	/** The active workspace id, or `''` when there isn't one yet —
	 *  every list/detail hook is `enabled: !!ws`, so an empty string
	 *  parks them instead of firing a request that would 404. */
	workspaceId: string;
	workspace: TWorkspace | null;
	/** Every workspace the user belongs to — the switcher's list. */
	workspaces: TWorkspace[];
	isLoading: boolean;
	isSwitching: boolean;
	/** False for a signed-in user who has not finished onboarding. */
	hasWorkspace: boolean;
	switchWorkspace: (id: string) => Promise<void>;
}

const WorkspaceContext = createContext<IWorkspaceContextProps>({} as IWorkspaceContextProps);

export const WorkspaceProvider = ({ children }: { children?: ReactNode }) => {
	const { isAuthenticated } = useAuth();
	const { data: user, isLoading: isUserLoading } = useCurrentUser(isAuthenticated);

	// Only the switcher needs the full list, and an unauthenticated
	// render must not fire it at all.
	const { data: workspaces, isLoading: isListLoading } = useWorkspaces({ enabled: isAuthenticated });
	const switchMutation = useSwitchWorkspace();

	// `current_workspace` is only present when the backend eager-loaded it;
	// the id is always there, so it is the reliable half.
	const workspaceId = user?.current_workspace_id ?? '';
	const workspace =
		user?.current_workspace ?? workspaces?.find((item) => item.id === workspaceId) ?? null;

	const switchWorkspace = useCallback(
		async (id: string) => {
			if (!id || id === workspaceId) return;
			await switchMutation.mutateAsync({ workspace_id: id });
		},
		[switchMutation, workspaceId],
	);

	const value: IWorkspaceContextProps = useMemo(
		() => ({
			workspaceId,
			workspace,
			workspaces: workspaces ?? [],
			isLoading: isAuthenticated && (isUserLoading || isListLoading),
			isSwitching: switchMutation.isPending,
			hasWorkspace: !!workspaceId,
			switchWorkspace,
		}),
		[
			workspaceId,
			workspace,
			workspaces,
			isAuthenticated,
			isUserLoading,
			isListLoading,
			switchMutation.isPending,
			switchWorkspace,
		],
	);

	return (
		<WorkspaceContext.Provider value={value}>{children ?? <Outlet />}</WorkspaceContext.Provider>
	);
};

// eslint-disable-next-line react-refresh/only-export-components
export const useCurrentWorkspace = () => useContext(WorkspaceContext);

/** Shorthand for the common case — a screen that only needs the id to
 *  feed its hooks. */
// eslint-disable-next-line react-refresh/only-export-components
export const useWorkspaceId = () => useContext(WorkspaceContext).workspaceId;
