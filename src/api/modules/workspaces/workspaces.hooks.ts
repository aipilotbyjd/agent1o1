import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notify } from '@/api/core';
import { authKeys } from '../auth/auth.keys';
import { WorkspaceService } from './workspaces.service';
import { workspaceKeys } from './workspaces.keys';
import type {
	TCreateWorkspaceDto,
	TUpdateWorkspaceDto,
	TInviteMemberDto,
	TUpdateMemberRoleDto,
} from '@/types/workspace.type';

export const useWorkspaces = (enabled = true) =>
	useQuery({
		queryKey: workspaceKeys.list(),
		queryFn: () => WorkspaceService.list(),
		enabled,
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
		onSuccess: (workspace) => {
			qc.invalidateQueries({ queryKey: workspaceKeys.all() });
			notify.success(`Workspace "${workspace.name}" created`);
		},
		onError: notify.fromError('Failed to create workspace'),
	});
};

export const useUpdateWorkspace = () => {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: ({ id, payload }: { id: string; payload: TUpdateWorkspaceDto }) =>
			WorkspaceService.update(id, payload),
		onSuccess: (workspace) => {
			qc.invalidateQueries({ queryKey: workspaceKeys.all() });
			notify.success(`Workspace "${workspace.name}" updated`);
		},
		onError: notify.fromError('Failed to update workspace'),
	});
};

export const useDeleteWorkspace = () => {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (id: string) => WorkspaceService.delete(id),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: workspaceKeys.all() });
			notify.success('Workspace deleted');
		},
		onError: notify.fromError('Failed to delete workspace'),
	});
};

export const useLeaveWorkspace = () => {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (id: string) => WorkspaceService.leave(id),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: workspaceKeys.all() });
			notify.success('Left workspace');
		},
		onError: notify.fromError('Failed to leave workspace'),
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

export const useWorkspaceMembers = (id: string) =>
	useQuery({
		queryKey: workspaceKeys.members(id),
		queryFn: ({ signal }) => WorkspaceService.members(id, signal),
		enabled: !!id,
	});

export const useUpdateMemberRole = (workspaceId: string) => {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: ({ userId, payload }: { userId: string; payload: TUpdateMemberRoleDto }) =>
			WorkspaceService.updateMemberRole(workspaceId, userId, payload),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: workspaceKeys.members(workspaceId) });
			notify.success('Member role updated');
		},
		onError: notify.fromError('Failed to update member role'),
	});
};

export const useRemoveMember = (workspaceId: string) => {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (userId: string) => WorkspaceService.removeMember(workspaceId, userId),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: workspaceKeys.members(workspaceId) });
			notify.success('Member removed');
		},
		onError: notify.fromError('Failed to remove member'),
	});
};

export const useWorkspaceInvitations = (id: string) =>
	useQuery({
		queryKey: workspaceKeys.invitations(id),
		queryFn: ({ signal }) => WorkspaceService.invitations(id, signal),
		enabled: !!id,
	});

export const useCreateInvitation = (workspaceId: string) => {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (payload: TInviteMemberDto) =>
			WorkspaceService.createInvitation(workspaceId, payload),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: workspaceKeys.invitations(workspaceId) });
			notify.success('Invitation sent');
		},
		onError: notify.fromError('Failed to send invitation'),
	});
};

export const useDeleteInvitation = (workspaceId: string) => {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (invitationId: string) =>
			WorkspaceService.deleteInvitation(workspaceId, invitationId),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: workspaceKeys.invitations(workspaceId) });
			notify.success('Invitation revoked');
		},
		onError: notify.fromError('Failed to revoke invitation'),
	});
};

export const useAcceptInvitation = () => {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: ({
			invitationId,
			query,
		}: {
			invitationId: string;
			query?: Record<string, string>;
		}) => WorkspaceService.acceptInvitation(invitationId, query),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: workspaceKeys.all() });
			notify.success('Invitation accepted');
		},
		onError: notify.fromError('Failed to accept invitation'),
	});
};
