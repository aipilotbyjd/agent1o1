import { axiosClient } from '@/api/client';
import { unwrapKey } from '@/api/core';
import type { TApiResponse } from '@/api/core';
import type { TWorkspace, TCreateWorkspaceDto, TUpdateWorkspaceDto } from '@/types/workspace.type';
import { WorkspaceEndpoints as E } from './workspaces.endpoints';

// ============================================================
// Workspace Service
// ------------------------------------------------------------
// Workspaces are the top-level scope — there's no parent workspace
// to nest under — so this doesn't fit createResource(); it's
// hand-written rather than forced through a factory built for
// ws-scoped resources. Every endpoint here returns its resource
// nested under a singular/plural key, not the envelope's `data`
// directly.
// ============================================================
export const WorkspaceService = {
	list: (signal?: AbortSignal) =>
		axiosClient
			.get<TApiResponse<{ workspaces: TWorkspace[] }>>(E.list, { signal })
			.then(unwrapKey<TWorkspace[]>('workspaces')),

	detail: (id: string, signal?: AbortSignal) =>
		axiosClient
			.get<TApiResponse<{ workspace: TWorkspace }>>(E.detail(id), { signal })
			.then(unwrapKey<TWorkspace>('workspace')),

	create: (payload: TCreateWorkspaceDto) =>
		axiosClient
			.post<TApiResponse<{ workspace: TWorkspace }>>(E.create, payload)
			.then(unwrapKey<TWorkspace>('workspace')),

	update: (id: string, payload: TUpdateWorkspaceDto) =>
		axiosClient
			.patch<TApiResponse<{ workspace: TWorkspace }>>(E.update(id), payload)
			.then(unwrapKey<TWorkspace>('workspace')),

	remove: (id: string) => axiosClient.delete(E.delete(id)).then(() => undefined),

	leave: (id: string) => axiosClient.post(E.leave(id)).then(() => undefined),
};
