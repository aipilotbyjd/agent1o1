import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { TInviteMemberDto, TUpdateMemberRoleDto } from '@/types/workspace-extras.type';
import { WorkspaceMemberService } from './workspace-members.service';
import { workspaceMemberKeys } from './workspace-members.keys';

export const useWorkspaceMembers = (ws: string) =>
	useQuery({
		queryKey: workspaceMemberKeys.list(ws),
		queryFn: ({ signal }) => WorkspaceMemberService.list(ws, signal),
		enabled: !!ws,
	});

export const useUpdateWorkspaceMemberRole = (ws: string) => {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: ({ userId, body }: { userId: string; body: TUpdateMemberRoleDto }) =>
			WorkspaceMemberService.updateRole(ws, userId, body),
		onSuccess: () => qc.invalidateQueries({ queryKey: workspaceMemberKeys.list(ws) }),
		meta: { errorMessage: 'Failed to update member role' },
	});
};

export const useRemoveWorkspaceMember = (ws: string) => {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (userId: string) => WorkspaceMemberService.remove(ws, userId),
		onSuccess: () => qc.invalidateQueries({ queryKey: workspaceMemberKeys.list(ws) }),
		meta: { errorMessage: 'Failed to remove member' },
	});
};

export const useWorkspaceInvitations = (ws: string) =>
	useQuery({
		queryKey: workspaceMemberKeys.invitations(ws),
		queryFn: ({ signal }) => WorkspaceMemberService.invitations(ws, signal),
		enabled: !!ws,
	});

export const useInviteWorkspaceMember = (ws: string) => {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (payload: TInviteMemberDto) => WorkspaceMemberService.invite(ws, payload),
		onSuccess: () => qc.invalidateQueries({ queryKey: workspaceMemberKeys.invitations(ws) }),
		meta: { errorMessage: 'Failed to send invitation' },
	});
};

export const useRevokeWorkspaceInvitation = (ws: string) => {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (invitationId: string) => WorkspaceMemberService.revokeInvitation(ws, invitationId),
		onSuccess: () => qc.invalidateQueries({ queryKey: workspaceMemberKeys.invitations(ws) }),
		meta: { errorMessage: 'Failed to revoke invitation' },
	});
};

export const useAcceptWorkspaceInvitation = () =>
	useMutation({
		mutationFn: ({ invitationId, query }: { invitationId: string; query?: string }) =>
			WorkspaceMemberService.acceptInvitation(invitationId, query),
		meta: { errorMessage: 'Failed to accept invitation' },
	});
