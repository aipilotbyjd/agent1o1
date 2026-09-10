import { axiosClient } from '@/api/client';
import { unwrapKey } from '@/api/core';
import type { TApiResponse, TMessageResponse } from '@/api/core';
import type {
	TWorkspaceMember,
	TWorkspaceInvitation,
	TInviteMemberDto,
	TUpdateMemberRoleDto,
} from '@/types/workspace-extras.type';
import { WorkspaceMemberEndpoints as E } from './workspace-members.endpoints';

export const WorkspaceMemberService = {
	list: (ws: string, signal?: AbortSignal) =>
		axiosClient
			.get<TApiResponse<{ members: TWorkspaceMember[] }>>(E.list(ws), { signal })
			.then(unwrapKey<TWorkspaceMember[]>('members')),

	updateRole: (ws: string, userId: string, payload: TUpdateMemberRoleDto) =>
		axiosClient.patch(E.updateRole(ws, userId), payload).then(() => undefined),

	remove: (ws: string, userId: string) => axiosClient.delete(E.remove(ws, userId)).then(() => undefined),

	invitations: (ws: string, signal?: AbortSignal) =>
		axiosClient
			.get<TApiResponse<{ invitations: TWorkspaceInvitation[] }>>(E.invitations(ws), { signal })
			.then(unwrapKey<TWorkspaceInvitation[]>('invitations')),

	invite: (ws: string, payload: TInviteMemberDto) =>
		axiosClient
			.post<TApiResponse<{ invitation: TWorkspaceInvitation }>>(E.invite(ws), payload)
			.then(unwrapKey<TWorkspaceInvitation>('invitation')),

	revokeInvitation: (ws: string, invitationId: string) =>
		axiosClient.delete(E.revokeInvitation(ws, invitationId)).then(() => undefined),

	/** Public, signed link — `query` carries the signature/expiry params
	 *  from the emailed invitation URL. */
	acceptInvitation: (invitationId: string, query?: string) =>
		axiosClient
			.get<TMessageResponse>(E.acceptInvitation(invitationId, query))
			.then((r) => r.data),
};
