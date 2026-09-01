import { axiosClient } from '@/api/client';
import { unwrap } from '@/api/core';
import type { TApiResponse } from '@/api/core';
import type { TWorkspace, TCreateWorkspaceDto } from '@/types/workspace.type';
import type { TUser, TUserEnvelope } from '@/types/auth.type';
import { normalizeUser } from '../auth/auth.service';
import { WorkspaceEndpoints } from './workspaces.endpoints';

export const WorkspaceService = {
	list: (signal?: AbortSignal) =>
		axiosClient
			.get<TApiResponse<{ workspaces: TWorkspace[] }>>(WorkspaceEndpoints.list, { signal })
			.then(unwrap<{ workspaces: TWorkspace[] }>)
			.then((r) => r.workspaces),

	create: (payload: TCreateWorkspaceDto) =>
		axiosClient
			.post<TApiResponse<{ workspace: TWorkspace }>>(WorkspaceEndpoints.create, payload)
			.then(unwrap<{ workspace: TWorkspace }>)
			.then((r) => r.workspace),

	switchWorkspace: (workspaceId: string) =>
		axiosClient
			.post<TUserEnvelope>(WorkspaceEndpoints.switch, { workspace_id: workspaceId })
			.then(unwrap<{ user: TUser }>)
			.then((r) => normalizeUser(r.user)),
};
