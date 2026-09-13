import { useMemo, useCallback, useEffect } from 'react';
import { useAuth } from '@/context/auth';
import { useWorkspaces, useWorkspace, useSwitchWorkspace } from '@/api/modules/workspaces';
import { useFetchMembers } from '@/api/modules/workspace-members/workspace-members.hooks';
import { useWorkflowShellStore } from '@/store/workflowShell.store';
import type { TWorkspaceMember, TWorkspaceRole } from '@/types/workspace.type';
import WorkspaceContext from './WorkspaceContext';
import type { IWorkspaceContextProps } from './workspace.types';

export const WorkspaceProvider = ({ children }: { children: React.ReactNode }) => {
	const { isAuthenticated, userData } = useAuth();
	const activeWorkspaceKey = useWorkflowShellStore((store) => store.activeWorkspaceId);
	const setActiveWorkspaceId = useWorkflowShellStore((store) => store.setActiveWorkspaceId);

	// Get all workspaces (only enabled when authenticated)
	const { data: workspacesResponse, isLoading: isWorkspacesLoading } = useWorkspaces({
		enabled: isAuthenticated,
	});

	const workspaces = useMemo(() => {
		return workspacesResponse?.data ?? [];
	}, [workspacesResponse?.data]);

	// Find workspace matched by active key in Zustand store
	const selectedWorkspace = useMemo(() => {
		if (workspaces.length === 0) return null;
		const matched = workspaces.find(
			(workspace) =>
				workspace.id === activeWorkspaceKey || workspace.slug === activeWorkspaceKey,
		);
		if (matched) return matched;

		// Fallback to current_workspace_id
		const currentId = userData?.current_workspace_id ?? userData?.current_workspace?.id;
		if (currentId) {
			const currentMatched = workspaces.find(
				(w) => w.id === currentId || w.slug === currentId,
			);
			if (currentMatched) return currentMatched;
		}

		return workspaces[0];
	}, [activeWorkspaceKey, workspaces, userData]);

	// Determine active workspace ID
	const workspaceId = useMemo(() => {
		if (!isAuthenticated || isWorkspacesLoading) return '';
		if (
			activeWorkspaceKey &&
			workspaces.some((w) => w.id === activeWorkspaceKey || w.slug === activeWorkspaceKey)
		) {
			const matched = workspaces.find(
				(w) => w.id === activeWorkspaceKey || w.slug === activeWorkspaceKey,
			);
			return matched?.id ?? '';
		}
		return (
			userData?.current_workspace_id ??
			userData?.current_workspace?.id ??
			selectedWorkspace?.id ??
			''
		);
	}, [
		isAuthenticated,
		isWorkspacesLoading,
		userData,
		selectedWorkspace,
		activeWorkspaceKey,
		workspaces,
	]);

	// Synchronize computed workspaceId back to Zustand store
	useEffect(() => {
		if (workspaceId && activeWorkspaceKey !== workspaceId) {
			setActiveWorkspaceId(workspaceId);
		}
	}, [workspaceId, activeWorkspaceKey, setActiveWorkspaceId]);

	// Fetch detailed active workspace details
	const {
		data: activeWorkspaceDetails,
		isLoading: isActiveWorkspaceLoading,
		isError: isActiveWorkspaceError,
		error: activeWorkspaceError,
		refetch: refetchActiveWorkspace,
	} = useWorkspace(workspaceId);

	// Fetch active workspace members
	const { data: membersResponse = [], isLoading: isMembersLoading } =
		useFetchMembers(workspaceId);

	const activeWorkspace = useMemo(() => {
		return activeWorkspaceDetails || null;
	}, [activeWorkspaceDetails]);

	// Determine user's role in active workspace
	const role = useMemo<TWorkspaceRole | null>(() => {
		if (activeWorkspace?.role) {
			return activeWorkspace.role;
		}
		if (selectedWorkspace) {
			if (selectedWorkspace.role) return selectedWorkspace.role;
			return selectedWorkspace.owner?.id === userData?.id ? 'owner' : 'member';
		}
		if (userData?.current_workspace?.role) {
			return userData.current_workspace.role as TWorkspaceRole;
		}
		return null;
	}, [activeWorkspace, selectedWorkspace, userData]);

	const members = useMemo<TWorkspaceMember[]>(() => {
		return membersResponse;
	}, [membersResponse]);

	const switchWorkspaceMutation = useSwitchWorkspace();

	// Callback to switch workspaces
	const switchWorkspace = useCallback(
		(idOrSlug: string) => {
			const workspace = workspaces.find((w) => w.id === idOrSlug || w.slug === idOrSlug);
			const targetId = workspace?.id ?? idOrSlug;

			switchWorkspaceMutation.mutate(targetId, {
				onSuccess: () => {
					setActiveWorkspaceId(targetId);
				},
			});
		},
		[workspaces, switchWorkspaceMutation, setActiveWorkspaceId],
	);

	const value: IWorkspaceContextProps = useMemo(
		() => ({
			workspaces,
			isWorkspacesLoading,
			activeWorkspaceId: workspaceId,
			activeWorkspace,
			isActiveWorkspaceLoading: isWorkspacesLoading || isActiveWorkspaceLoading,
			isActiveWorkspaceError,
			activeWorkspaceError: activeWorkspaceError as Error | null,
			role,
			members,
			isMembersLoading,
			switchWorkspace,
			refetchActiveWorkspace,
		}),
		[
			workspaces,
			isWorkspacesLoading,
			workspaceId,
			activeWorkspace,
			isActiveWorkspaceLoading,
			isActiveWorkspaceError,
			activeWorkspaceError,
			role,
			members,
			isMembersLoading,
			switchWorkspace,
			refetchActiveWorkspace,
		],
	);

	return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
};
