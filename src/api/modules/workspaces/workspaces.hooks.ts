import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { TCreateWorkspaceDto, TUpdateWorkspaceDto } from '@/types/workspace.type';
import { WorkspaceService } from './workspaces.service';
import { workspaceKeys } from './workspaces.keys';

// ============================================================
// Workspace Hooks
// ============================================================

export const useWorkspaces = (options?: { enabled?: boolean }) =>
	useQuery({
		queryKey: workspaceKeys.lists(),
		queryFn: ({ signal }) => WorkspaceService.list(signal),
		...options,
	});

export const useWorkspace = (id: string) =>
	useQuery({
		queryKey: workspaceKeys.detail(id),
		queryFn: ({ signal }) => WorkspaceService.detail(id, signal),
		enabled: !!id,
	});

export const useCreateWorkspace = () => {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (payload: TCreateWorkspaceDto) => WorkspaceService.create(payload),
		onSuccess: () => qc.invalidateQueries({ queryKey: workspaceKeys.lists() }),
		meta: { errorMessage: 'Failed to create workspace' },
	});
};

export const useUpdateWorkspace = () => {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: ({ id, body }: { id: string; body: TUpdateWorkspaceDto }) =>
			WorkspaceService.update(id, body),
		onSuccess: (_workspace, { id }) => {
			qc.invalidateQueries({ queryKey: workspaceKeys.lists() });
			qc.invalidateQueries({ queryKey: workspaceKeys.detail(id) });
		},
		meta: { errorMessage: 'Failed to update workspace' },
	});
};

export const useDeleteWorkspace = () => {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (id: string) => WorkspaceService.remove(id),
		onSuccess: () => qc.invalidateQueries({ queryKey: workspaceKeys.lists() }),
		meta: { errorMessage: 'Failed to delete workspace' },
	});
};

/** Leaves the given workspace's membership — the id still has to be passed
 *  even though it's "the caller's own membership", since every workspace
 *  route is addressed by {workspace} in the URL. */
export const useLeaveWorkspace = () => {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (id: string) => WorkspaceService.leave(id),
		onSuccess: () => qc.invalidateQueries({ queryKey: workspaceKeys.lists() }),
		meta: { errorMessage: 'Failed to leave workspace' },
	});
};
