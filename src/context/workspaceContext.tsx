import { ReactNode, createContext, useCallback, useContext, useEffect, useMemo } from 'react';
import { Outlet } from 'react-router';
import { useCurrentUser, useSwitchWorkspace } from '@/api/modules/user';
import { useWorkspace, useWorkspaces } from '@/api/modules/workspaces';
import { useWorkspaceMembers } from '@/api/modules/workspace-members';
import { useAuth } from '@/context/authContext';
import { useWorkflowShellStore } from '@/store/workflowShell.store';
import type { TWorkspace, TWorkspaceRole } from '@/types/workspace.type';
import type { TWorkspaceMember } from '@/types/workspace-extras.type';

// ============================================================
// Workspace Context Types
// ------------------------------------------------------------
// Mirrors the surface the app pages were written against: the
// workspace list, the resolved active workspace, the viewer's role
// on it, and its members — all backed by the new internal API.
// ============================================================

export interface IWorkspaceContextProps {
	// List of all accessible workspaces
	workspaces: TWorkspace[];
	isWorkspacesLoading: boolean;

	// Active workspace info
	activeWorkspaceId: string;
	activeWorkspace: TWorkspace | null;
	isActiveWorkspaceLoading: boolean;
	isActiveWorkspaceError: boolean;
	activeWorkspaceError: Error | null;

	// Active workspace settings, roles, members
	role: TWorkspaceRole | null;
	members: TWorkspaceMember[];
	isMembersLoading: boolean;

	// Utilities
	hasWorkspace: boolean;
	isSwitching: boolean;
	switchWorkspace: (idOrSlug: string) => void;
	refetchActiveWorkspace: () => void;
}

const WorkspaceContext = createContext<IWorkspaceContextProps>({} as IWorkspaceContextProps);

export const WorkspaceProvider = ({ children }: { children?: ReactNode }) => {
	const { isAuthenticated } = useAuth();
	const { data: user } = useCurrentUser(isAuthenticated);

	// The shell store holds the workspace the user last picked (id or slug), so
	// a switch survives navigation without waiting on /me to come back.
	const activeWorkspaceKey = useWorkflowShellStore((store) => store.activeWorkspaceId);
	const setActiveWorkspaceId = useWorkflowShellStore((store) => store.setActiveWorkspaceId);

	const { data: workspacesResponse, isLoading: isWorkspacesLoading } = useWorkspaces({
		enabled: isAuthenticated,
	});

	const workspaces = useMemo(() => workspacesResponse ?? [], [workspacesResponse]);

	// Workspace matching the key held in the shell store, falling back to the
	// one the backend considers current, then to the first accessible one.
	const selectedWorkspace = useMemo(() => {
		if (workspaces.length === 0) return null;

		const matched = workspaces.find(
			(workspace) =>
				workspace.id === activeWorkspaceKey || workspace.slug === activeWorkspaceKey,
		);
		if (matched) return matched;

		const currentId = user?.current_workspace_id ?? user?.current_workspace?.id;
		if (currentId) {
			const currentMatched = workspaces.find(
				(workspace) => workspace.id === currentId || workspace.slug === currentId,
			);
			if (currentMatched) return currentMatched;
		}

		return workspaces[0];
	}, [activeWorkspaceKey, workspaces, user]);

	const workspaceId = useMemo(() => {
		if (!isAuthenticated || isWorkspacesLoading) return '';
		return (
			selectedWorkspace?.id ??
			user?.current_workspace_id ??
			user?.current_workspace?.id ??
			''
		);
	}, [isAuthenticated, isWorkspacesLoading, selectedWorkspace, user]);

	// Keep the shell store in sync with whatever we resolved.
	useEffect(() => {
		if (workspaceId && activeWorkspaceKey !== workspaceId) {
			setActiveWorkspaceId(workspaceId);
		}
	}, [workspaceId, activeWorkspaceKey, setActiveWorkspaceId]);

	const {
		data: activeWorkspaceDetails,
		isLoading: isActiveWorkspaceLoading,
		isError: isActiveWorkspaceError,
		error: activeWorkspaceError,
		refetch: refetchActiveWorkspaceQuery,
	} = useWorkspace(workspaceId);

	const { data: membersResponse, isLoading: isMembersLoading } = useWorkspaceMembers(workspaceId);

	const activeWorkspace = useMemo(
		() => activeWorkspaceDetails ?? selectedWorkspace ?? null,
		[activeWorkspaceDetails, selectedWorkspace],
	);

	const role = useMemo<TWorkspaceRole | null>(() => {
		if (activeWorkspaceDetails?.role) return activeWorkspaceDetails.role;
		if (selectedWorkspace) {
			if (selectedWorkspace.role) return selectedWorkspace.role;
			return selectedWorkspace.owner_id === user?.id ? 'owner' : 'member';
		}
		if (user?.current_workspace?.role) return user.current_workspace.role as TWorkspaceRole;
		return null;
	}, [activeWorkspaceDetails, selectedWorkspace, user]);

	const members = useMemo<TWorkspaceMember[]>(() => membersResponse ?? [], [membersResponse]);

	const switchWorkspaceMutation = useSwitchWorkspace();

	const switchWorkspace = useCallback(
		(idOrSlug: string) => {
			const workspace = workspaces.find((w) => w.id === idOrSlug || w.slug === idOrSlug);
			const targetId = workspace?.id ?? idOrSlug;
			if (!targetId || targetId === workspaceId) return;

			switchWorkspaceMutation.mutate(
				{ workspace_id: targetId },
				{ onSuccess: () => setActiveWorkspaceId(targetId) },
			);
		},
		[workspaces, workspaceId, switchWorkspaceMutation, setActiveWorkspaceId],
	);

	const refetchActiveWorkspace = useCallback(() => {
		void refetchActiveWorkspaceQuery();
	}, [refetchActiveWorkspaceQuery]);

	const value: IWorkspaceContextProps = useMemo(
		() => ({
			workspaces,
			isWorkspacesLoading,
			activeWorkspaceId: workspaceId,
			activeWorkspace,
			isActiveWorkspaceLoading: isWorkspacesLoading || isActiveWorkspaceLoading,
			isActiveWorkspaceError,
			activeWorkspaceError: (activeWorkspaceError as Error | null) ?? null,
			role,
			members,
			isMembersLoading,
			hasWorkspace: !!workspaceId,
			isSwitching: switchWorkspaceMutation.isPending,
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
			switchWorkspaceMutation.isPending,
			switchWorkspace,
			refetchActiveWorkspace,
		],
	);

	return (
		<WorkspaceContext.Provider value={value}>{children ?? <Outlet />}</WorkspaceContext.Provider>
	);
};

export const useWorkspaceContext = () => {
	const context = useContext(WorkspaceContext);
	if (context === undefined) {
		throw new Error('useWorkspaceContext must be used within a WorkspaceProvider');
	}
	return context;
};

export default WorkspaceContext;
