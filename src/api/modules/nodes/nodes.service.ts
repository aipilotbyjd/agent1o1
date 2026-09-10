import { axiosClient } from '@/api/client';
import { unwrapKey } from '@/api/core';
import type { TApiResponse } from '@/api/core';
import type { TNode, TCustomNode, TCreateCustomNodeDto, TUpdateCustomNodeDto } from '@/types/node.type';
import { NodeEndpoints as E } from './nodes.endpoints';

type TNodeListParams = { category?: string; search?: string };
type TRecentlyUsedResult = { nodes: TNode[]; is_default: boolean };

export const NodeService = {
	/** The global built-in catalog only — no workspace, no custom nodes. */
	globalCatalog: (params?: TNodeListParams, signal?: AbortSignal) =>
		axiosClient
			.get<TApiResponse<{ nodes: TNode[] }>>(E.globalCatalog, { params, signal })
			.then(unwrapKey<TNode[]>('nodes')),

	/** Built-in catalog plus this workspace's custom nodes, merged. */
	list: (ws: string, params?: TNodeListParams, signal?: AbortSignal) =>
		axiosClient
			.get<TApiResponse<{ nodes: TNode[] }>>(E.list(ws), { params, signal })
			.then(unwrapKey<TNode[]>('nodes')),

	custom: (ws: string, signal?: AbortSignal) =>
		axiosClient
			.get<TApiResponse<{ nodes: TCustomNode[] }>>(E.custom(ws), { signal })
			.then(unwrapKey<TCustomNode[]>('nodes')),

	recentlyUsed: (ws: string, signal?: AbortSignal) =>
		axiosClient
			.get<TApiResponse<TRecentlyUsedResult>>(E.recentlyUsed(ws), { signal })
			.then((r) => r.data.data),

	detail: (ws: string, id: string, signal?: AbortSignal) =>
		axiosClient
			.get<TApiResponse<{ node: TCustomNode }>>(E.detail(ws, id), { signal })
			.then(unwrapKey<TCustomNode>('node')),

	create: (ws: string, payload: TCreateCustomNodeDto) =>
		axiosClient
			.post<TApiResponse<{ node: TCustomNode }>>(E.create(ws), payload)
			.then(unwrapKey<TCustomNode>('node')),

	// Builtin (non-custom) nodes reject this with a 403 server-side.
	update: (ws: string, id: string, payload: TUpdateCustomNodeDto) =>
		axiosClient
			.patch<TApiResponse<{ node: TCustomNode }>>(E.update(ws, id), payload)
			.then(unwrapKey<TCustomNode>('node')),

	// Builtin (non-custom) nodes reject this with a 403 server-side.
	remove: (ws: string, id: string) => axiosClient.delete(E.delete(ws, id)).then(() => undefined),
};
