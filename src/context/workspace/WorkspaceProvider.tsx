import { ReactNode, useCallback, useMemo } from 'react';
import { Outlet } from 'react-router';
import { useCurrentUser, useSwitchWorkspace } from '@/api/modules/user';
import { useWorkspaces } from '@/api/modules/workspaces';
import { useAuth } from '@/context/auth';
import WorkspaceContext from './WorkspaceContext';
import type { IWorkspaceContextProps } from './workspace.types';

export const WorkspaceProvider = ({ children }: { children?: ReactNode }) => {
	const { isAuthenticated } = useAuth();
	const { data: user, isLoading: isUserLoading } = useCurrentUser(isAuthenticated);

	const { data: workspaces, isLoading: isListLoading } = useWorkspaces({
		enabled: isAuthenticated,
	});
	const switchMutation = useSwitchWorkspace();

	const activeWorkspaceId = user?.current_workspace_id ?? '';
	const activeWorkspace =
		user?.current_workspace ?? workspaces?.find((item) => item.id === activeWorkspaceId) ?? null;

	const switchWorkspace = useCallback(
		async (id: string) => {
			if (!id || id === activeWorkspaceId) return;
			await switchMutation.mutateAsync({ workspace_id: id });
		},
		[switchMutation, activeWorkspaceId],
	);

	const value: IWorkspaceContextProps = useMemo(
		() => ({
			activeWorkspaceId,
			activeWorkspace,
			workspaces: workspaces ?? [],
			isLoading: isAuthenticated && (isUserLoading || isListLoading),
			isSwitching: switchMutation.isPending,
			hasWorkspace: !!activeWorkspaceId,
			switchWorkspace,
		}),
		[
			activeWorkspaceId,
			activeWorkspace,
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
