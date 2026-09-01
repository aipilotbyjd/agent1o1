import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notify } from '@/api/core';
import { authKeys } from '../auth/auth.keys';
import { WorkspaceService } from './workspaces.service';
import { workspaceKeys } from './workspaces.keys';
import type { TCreateWorkspaceDto } from '@/types/workspace.type';

export const useWorkspaces = (enabled = true) =>
	useQuery({
		queryKey: workspaceKeys.list(),
		queryFn: () => WorkspaceService.list(),
		enabled,
	});

export const useCreateWorkspace = () => {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (payload: TCreateWorkspaceDto) => WorkspaceService.create(payload),
		onSuccess: (workspace) => {
			qc.invalidateQueries({ queryKey: workspaceKeys.all() });
			notify.success(`Workspace "${workspace.name}" created`);
		},
		onError: notify.fromError('Failed to create workspace'),
	});
};

export const useSwitchWorkspace = () => {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (workspaceId: string) => WorkspaceService.switchWorkspace(workspaceId),
		onSuccess: (updatedUser) => {
			qc.setQueryData(authKeys.user(), updatedUser);
			notify.success('Workspace switched');
		},
		onError: notify.fromError('Failed to switch workspace'),
	});
};
