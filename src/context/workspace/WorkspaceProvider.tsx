import { ReactNode, useCallback, useMemo } from 'react';
import { Outlet } from 'react-router';
import { useCurrentUser, useSwitchWorkspace } from '@/api/modules/user';
import { useWorkspaces } from '@/api/modules/workspaces';
import { useAuth } from '@/context/auth';
import WorkspaceContext from './WorkspaceContext';
import type { IWorkspaceContextProps } from './workspace.types';

export const WorkspaceProvider = ({ children }: { children?: ReactNode }) => {
	const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
	const { data: user, isLoading: isUserLoading } = useCurrentUser(isAuthenticated);

	const { data: workspaces, isLoading: isListLoading } = useWorkspaces({
		enabled: isAuthenticated,
	});
	const switchMutation = useSwitchWorkspace();

	const activeWorkspaceId = user?.current_workspace_id ?? '';
	// The list entry first: it carries the viewer's role and permissions from their membership.
	const activeWorkspace =
		workspaces?.find((item) => String(item.id) === String(activeWorkspaceId)) ??
		user?.current_workspace ??
		null;

	const switchWorkspace = useCallback(
		async (id: string) => {
			if (!id || String(id) === String(activeWorkspaceId)) return;
			await switchMutation.mutateAsync({ workspace_id: id });
		},
		[switchMutation, activeWorkspaceId],
	);

	const value: IWorkspaceContextProps = useMemo(
		() => ({
			activeWorkspaceId,
			activeWorkspace,
			workspaces: workspaces ?? [],
			isLoading: isAuthLoading || (isAuthenticated && (isUserLoading || isListLoading)),
			isSwitching: switchMutation.isPending,
			hasWorkspace: !!activeWorkspaceId,
			switchWorkspace,
		}),
		[
			activeWorkspaceId,
			activeWorkspace,
			workspaces,
			isAuthenticated,
			isAuthLoading,
			isUserLoading,
			isListLoading,
			switchMutation.isPending,
			switchWorkspace,
		],
	);

	return (
		<WorkspaceContext.Provider value={value}>
			{children ?? <Outlet />}
		</WorkspaceContext.Provider>
	);
};
