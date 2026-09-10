import { axiosClient } from '@/api/client';
import { unwrapKey } from '@/api/core';
import type { TApiResponse, TPaginationMeta } from '@/api/core';
import type {
	TDocumentEmbedding,
	TKnowledgeCollection,
	TIngestKnowledgeDto,
	TIngestKnowledgeResult,
	TSearchKnowledgeDto,
	TKnowledgeSearchHit,
	TReadKnowledgeDocumentParams,
	TKnowledgeDocument,
} from '@/types/knowledge-base.type';
import { KnowledgeBaseEndpoints as E } from './knowledge-base.endpoints';

export const KnowledgeBaseService = {
	list: (
		ws: string,
		params?: { collection?: string; source?: string; page?: number; per_page?: number },
		signal?: AbortSignal,
	) =>
		axiosClient
			.get<TApiResponse<TDocumentEmbedding[]> & { meta: TPaginationMeta }>(E.list(ws), {
				params,
				signal,
			})
			.then((r) => ({ chunks: r.data.data, meta: r.data.meta })),

	collections: (ws: string, signal?: AbortSignal) =>
		axiosClient
			.get<TApiResponse<{ collections: TKnowledgeCollection[] }>>(E.collections(ws), { signal })
			.then(unwrapKey<TKnowledgeCollection[]>('collections')),

	ingest: (ws: string, payload: TIngestKnowledgeDto) => {
		const form = new FormData();
		if (payload.text !== undefined) form.append('text', payload.text);
		if (payload.file) form.append('file', payload.file);
		if (payload.source) form.append('source', payload.source);
		if (payload.collection) form.append('collection', payload.collection);
		if (payload.metadata) form.append('metadata', JSON.stringify(payload.metadata));
		return axiosClient
			.post<TApiResponse<TIngestKnowledgeResult>>(E.ingest(ws), form)
			.then((r) => r.data.data);
	},

	search: (ws: string, payload: TSearchKnowledgeDto) =>
		axiosClient
			.post<TApiResponse<{ results: TKnowledgeSearchHit[] }>>(E.search(ws), payload)
			.then(unwrapKey<TKnowledgeSearchHit[]>('results')),

	document: (ws: string, params: TReadKnowledgeDocumentParams, signal?: AbortSignal) =>
		axiosClient
			.get<TApiResponse<TKnowledgeDocument>>(E.document(ws), { params, signal })
			.then((r) => r.data.data),

	remove: (ws: string, id: string) => axiosClient.delete(E.delete(ws, id)).then(() => undefined),

	removeCollection: (ws: string, collection: string) =>
		axiosClient.delete(E.deleteCollection(ws, collection)).then(() => undefined),
};
