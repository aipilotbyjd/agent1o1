import { axiosClient } from '@/api/client';
import { unwrap } from '@/api/core';
import type { TApiResponse } from '@/api/core';
import type {
	TWorkspace,
	TWorkspaceMember,
	TWorkspaceInvitation,
	TCreateWorkspaceDto,
	TUpdateWorkspaceDto,
	TInviteMemberDto,
	TUpdateMemberRoleDto,
} from '@/types/workspace.type';
import type { TUser, TUserEnvelope } from '@/types/auth.type';
import { normalizeUser } from '../auth/auth.service';
import { WorkspaceEndpoints } from './workspaces.endpoints';

export const WorkspaceService = {
	list: (signal?: AbortSignal) =>
		axiosClient
			.get<TApiResponse<{ workspaces: TWorkspace[] }>>(WorkspaceEndpoints.list, { signal })
			.then(unwrap<{ workspaces: TWorkspace[] }>)
			.then((r) => r.workspaces),

	detail: (id: string, signal?: AbortSignal) =>
		axiosClient
			.get<TApiResponse<{ workspace: TWorkspace }>>(WorkspaceEndpoints.detail(id), { signal })
			.then(unwrap<{ workspace: TWorkspace }>)
			.then((r) => r.workspace),

	create: (payload: TCreateWorkspaceDto) =>
		axiosClient
			.post<TApiResponse<{ workspace: TWorkspace }>>(WorkspaceEndpoints.create, payload)
			.then(unwrap<{ workspace: TWorkspace }>)
			.then((r) => r.workspace),

	update: (id: string, payload: TUpdateWorkspaceDto) =>
		axiosClient
			.patch<TApiResponse<{ workspace: TWorkspace }>>(WorkspaceEndpoints.update(id), payload)
			.then(unwrap<{ workspace: TWorkspace }>)
			.then((r) => r.workspace),

	delete: (id: string) => axiosClient.delete(WorkspaceEndpoints.delete(id)).then(() => undefined),

	leave: (id: string) => axiosClient.post(WorkspaceEndpoints.leave(id)).then(() => undefined),

	switchWorkspace: (workspaceId: string) =>
		axiosClient
			.post<TUserEnvelope>(WorkspaceEndpoints.switch, { workspace_id: workspaceId })
			.then(unwrap<{ user: TUser }>)
			.then((r) => normalizeUser(r.user)),

	members: (id: string, signal?: AbortSignal) =>
		axiosClient
			.get<TApiResponse<{ members: TWorkspaceMember[] }>>(WorkspaceEndpoints.members(id), {
				signal,
			})
			.then(unwrap<{ members: TWorkspaceMember[] }>)
			.then((r) => r.members),

	updateMemberRole: (id: string, userId: string, payload: TUpdateMemberRoleDto) =>
		axiosClient
			.patch(WorkspaceEndpoints.updateMemberRole(id, userId), payload)
			.then(() => undefined),

	removeMember: (id: string, userId: string) =>
		axiosClient.delete(WorkspaceEndpoints.removeMember(id, userId)).then(() => undefined),

	invitations: (id: string, signal?: AbortSignal) =>
		axiosClient
			.get<TApiResponse<{ invitations: TWorkspaceInvitation[] }>>(
				WorkspaceEndpoints.invitations(id),
				{ signal },
			)
			.then(unwrap<{ invitations: TWorkspaceInvitation[] }>)
			.then((r) => r.invitations),

	createInvitation: (id: string, payload: TInviteMemberDto) =>
		axiosClient
			.post<TApiResponse<{ invitation: TWorkspaceInvitation }>>(
				WorkspaceEndpoints.createInvitation(id),
				payload,
			)
			.then(unwrap<{ invitation: TWorkspaceInvitation }>)
			.then((r) => r.invitation),

	deleteInvitation: (id: string, invitationId: string) =>
		axiosClient.delete(WorkspaceEndpoints.deleteInvitation(id, invitationId)).then(() => undefined),

	acceptInvitation: (invitationId: string, query?: Record<string, string>) =>
		axiosClient
			.get(WorkspaceEndpoints.acceptInvitation(invitationId), { params: query })
			.then(() => undefined),
};
