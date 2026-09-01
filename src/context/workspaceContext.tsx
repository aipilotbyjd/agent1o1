import { createContext, useContext, useMemo, useCallback, ReactNode } from 'react';
import { useAuth } from '@/context/authContext';
import { useWorkspaces, useCreateWorkspace, useSwitchWorkspace } from '@/api';
import type { TWorkspace, TWorkspaceRole, TCreateWorkspaceDto } from '@/types/workspace.type';
import { hasWorkspacePermission, type TWorkspacePermission } from '@/utils/workspacePermission.util';

export interface IWorkspaceContextProps {
	workspaces: TWorkspace[];
	isLoading: boolean;
	activeWorkspaceId: string | null;
	activeWorkspace: TWorkspace | null;
	myRole: TWorkspaceRole | null;
	can: (permission: TWorkspacePermission) => boolean;
	switchWorkspace: (id: string) => Promise<void>;
	createWorkspace: (data: TCreateWorkspaceDto) => Promise<TWorkspace>;
	isSwitching: boolean;
	isCreating: boolean;
}

const WorkspaceContext = createContext<IWorkspaceContextProps>({} as IWorkspaceContextProps);

export const WorkspaceProvider = ({ children }: { children: ReactNode }) => {
	const { userData, tokenStorage } = useAuth();
	const { data: workspaces = [], isLoading } = useWorkspaces(!!tokenStorage);
	const switchMutation = useSwitchWorkspace();
	const createMutation = useCreateWorkspace();

	const activeWorkspaceId = userData?.current_workspace_id ?? null;

	const activeWorkspace = useMemo(
		() => workspaces.find((w) => w.id === activeWorkspaceId) ?? null,
		[workspaces, activeWorkspaceId],
	);

	const myRole = activeWorkspace?.role ?? null;

	const can = useCallback(
		(permission: TWorkspacePermission) => hasWorkspacePermission(myRole, permission),
		[myRole],
	);

	const switchWorkspace = async (id: string) => {
		await switchMutation.mutateAsync(id);
	};

	const createWorkspace = async (data: TCreateWorkspaceDto) => {
		return createMutation.mutateAsync(data);
	};

	const value: IWorkspaceContextProps = useMemo(
		() => ({
			workspaces,
			isLoading,
			activeWorkspaceId,
			activeWorkspace,
			myRole,
			can,
			switchWorkspace,
			createWorkspace,
			isSwitching: switchMutation.isPending,
			isCreating: createMutation.isPending,
		}),
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[
			workspaces,
			isLoading,
			activeWorkspaceId,
			activeWorkspace,
			myRole,
			can,
			switchMutation.isPending,
			createMutation.isPending,
		],
	);

	return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
};

export const useWorkspaceContext = () => useContext(WorkspaceContext);
