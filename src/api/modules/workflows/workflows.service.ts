import { axiosClient } from '@/api/client';
import { fetchAllPages, unwrapCursorPage, unwrapKey } from '@/api/core';
import type { TApiResponse, TCursorPaginationMeta, TCursorParams, TListParams } from '@/api/core';
import type {
	TWorkflow,
	TWorkflowNode,
	TCreateWorkflowDto,
	TUpdateWorkflowDto,
	TSyncWorkflowTagsDto,
	TPinWorkflowNodeDto,
} from '@/types/workflow.type';
import { WorkflowEndpoints as E } from './workflows.endpoints';

export const WorkflowService = {
	// List omits `nodes`/`edges`, only detail and duplicate load them. `tags`
	// is the reverse: the list eager-loads it, `show` doesn't.
	// The API pages by cursor, so this walks every page. Use `listPage` for a
	// list that loads more on demand.
	list: (ws: string, params?: TListParams, signal?: AbortSignal) =>
		fetchAllPages((page) => WorkflowService.listPage(ws, { ...params, ...page }, signal)),

	listPage: (ws: string, params?: TListParams & TCursorParams, signal?: AbortSignal) =>
		axiosClient
			.get<TApiResponse<TWorkflow[]> & { meta: TCursorPaginationMeta }>(E.list(ws), {
				params,
				signal,
			})
			.then(unwrapCursorPage<TWorkflow>),

	detail: (ws: string, id: string, signal?: AbortSignal) =>
		axiosClient
			.get<TApiResponse<{ workflow: TWorkflow }>>(E.detail(ws, id), { signal })
			.then(unwrapKey<TWorkflow>('workflow')),

	create: (ws: string, payload: TCreateWorkflowDto) =>
		axiosClient
			.post<TApiResponse<{ workflow: TWorkflow }>>(E.create(ws), payload)
			.then(unwrapKey<TWorkflow>('workflow')),

	update: (ws: string, id: string, payload: TUpdateWorkflowDto) =>
		axiosClient
			.patch<TApiResponse<{ workflow: TWorkflow }>>(E.update(ws, id), payload)
			.then(unwrapKey<TWorkflow>('workflow')),

	// Soft delete: the workflow moves to the trash, where it can be restored.
	remove: (ws: string, id: string) => axiosClient.delete(E.delete(ws, id)).then(() => undefined),

	trash: (ws: string, signal?: AbortSignal) =>
		fetchAllPages((page) =>
			axiosClient
				.get<TApiResponse<TWorkflow[]> & { meta: TCursorPaginationMeta }>(E.trash(ws), {
					params: page,
					signal,
				})
				.then(unwrapCursorPage<TWorkflow>),
		),

	restore: (ws: string, id: string) =>
		axiosClient
			.post<TApiResponse<{ workflow: TWorkflow }>>(E.restore(ws, id))
			.then(unwrapKey<TWorkflow>('workflow')),

	// Only accepted for a workflow already in the trash.
	forceDelete: (ws: string, id: string) =>
		axiosClient.delete(E.forceDelete(ws, id)).then(() => undefined),

	duplicate: (ws: string, id: string) =>
		axiosClient
			.post<TApiResponse<{ workflow: TWorkflow }>>(E.duplicate(ws, id))
			.then(unwrapKey<TWorkflow>('workflow')),

	// Full replace of the tag set every call.
	syncTags: (ws: string, id: string, payload: TSyncWorkflowTagsDto) =>
		axiosClient
			.put<TApiResponse<{ workflow: TWorkflow }>>(E.syncTags(ws, id), payload)
			.then(unwrapKey<TWorkflow>('workflow')),

	pinNode: (ws: string, id: string, nodeId: string, payload: TPinWorkflowNodeDto) =>
		axiosClient
			.post<TApiResponse<{ node: TWorkflowNode }>>(E.pinNode(ws, id, nodeId), payload)
			.then(unwrapKey<TWorkflowNode>('node')),

	unpinNode: (ws: string, id: string, nodeId: string) =>
		axiosClient
			.delete<TApiResponse<{ node: TWorkflowNode }>>(E.unpinNode(ws, id, nodeId))
			.then(unwrapKey<TWorkflowNode>('node')),

	setFavorite: (ws: string, id: string, is_favorite: boolean) =>
		axiosClient.patch(E.favorite(ws, id), { is_favorite }).then(() => undefined),
};
