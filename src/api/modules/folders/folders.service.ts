import { axiosClient } from '@/api/client';
import { unwrapKey } from '@/api/core';
import type { TApiResponse } from '@/api/core';
import type {
	TFolder,
	TCreateFolderDto,
	TUpdateFolderDto,
	TMoveWorkflowsDto,
	TMoveAgentsDto,
} from '@/types/folder.type';
import { FolderEndpoints as E } from './folders.endpoints';

export const FolderService = {
	// Root folders only, with one level of `children` eager-loaded — not a
	// flat list.
	list: (ws: string, signal?: AbortSignal) =>
		axiosClient
			.get<TApiResponse<{ folders: TFolder[] }>>(E.list(ws), { signal })
			.then(unwrapKey<TFolder[]>('folders')),

	create: (ws: string, payload: TCreateFolderDto) =>
		axiosClient
			.post<TApiResponse<{ folder: TFolder }>>(E.create(ws), payload)
			.then(unwrapKey<TFolder>('folder')),

	update: (ws: string, id: string, payload: TUpdateFolderDto) =>
		axiosClient
			.patch<TApiResponse<{ folder: TFolder }>>(E.update(ws, id), payload)
			.then(unwrapKey<TFolder>('folder')),

	remove: (ws: string, id: string) => axiosClient.delete(E.delete(ws, id)).then(() => undefined),

	moveWorkflows: (ws: string, payload: TMoveWorkflowsDto) =>
		axiosClient.post(E.moveWorkflows(ws), payload).then(() => undefined),

	moveAgents: (ws: string, payload: TMoveAgentsDto) =>
		axiosClient.post(E.moveAgents(ws), payload).then(() => undefined),
};
