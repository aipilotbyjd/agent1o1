import { createContext, useContext, useMemo, ReactNode } from 'react';
import { useAuth } from '@/context/authContext';
import { useWorkspaces, useCreateWorkspace, useSwitchWorkspace } from '@/api';
import type { TWorkspace, TCreateWorkspaceDto } from '@/types/workspace.type';

export interface IWorkspaceContextProps {
	workspaces: TWorkspace[];
	isLoading: boolean;
	activeWorkspaceId: string | null;
	activeWorkspace: TWorkspace | null;
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
			switchMutation.isPending,
			createMutation.isPending,
		],
	);

	return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
};

export const useWorkspaceContext = () => useContext(WorkspaceContext);
