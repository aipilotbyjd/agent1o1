import { axiosClient } from '@/api/client';
import { unwrapKey } from '@/api/core';
import type { TApiResponse, TListParams } from '@/api/core';
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
	// List omits `nodes`/`edges`/`tags` — only detail and duplicate load them.
	list: (ws: string, _params?: TListParams, signal?: AbortSignal) =>
		axiosClient
			.get<TApiResponse<{ workflows: TWorkflow[] }>>(E.list(ws), { signal })
			.then(unwrapKey<TWorkflow[]>('workflows')),

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

	remove: (ws: string, id: string) => axiosClient.delete(E.delete(ws, id)).then(() => undefined),

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
};
