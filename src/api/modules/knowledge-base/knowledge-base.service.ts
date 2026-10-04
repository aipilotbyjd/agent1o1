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
	TKnowledgeSource,
	TCreateKnowledgeSourceDto,
	TUpdateKnowledgeSourceDto,
	TKnowledgeSourceDocument,
	TKnowledgeSourceApp,
	TKnowledgeSourceOption,
	TKnowledgeSourceType,
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
			.get<
				TApiResponse<{ collections: TKnowledgeCollection[] }>
			>(E.collections(ws), { signal })
			.then(unwrapKey<TKnowledgeCollection[]>('collections')),

	ingest: (ws: string, payload: TIngestKnowledgeDto) => {
		const form = new FormData();
		if (payload.text !== undefined) form.append('text', payload.text);
		if (payload.file) form.append('file', payload.file);
		if (payload.source) form.append('source', payload.source);
		if (payload.collection) form.append('collection', payload.collection);
		if (payload.metadata) form.append('metadata', JSON.stringify(payload.metadata));
		if (payload.private) form.append('private', '1');
		return axiosClient
			.post<TApiResponse<TIngestKnowledgeResult>>(E.ingest(ws), form, {
				headers: { 'Content-Type': undefined },
			})
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

	removeCollection: (ws: string, collection: string, isPrivate = false) =>
		axiosClient
			.delete(E.deleteCollection(ws, collection), {
				params: isPrivate ? { private: 1 } : undefined,
			})
			.then(() => undefined),

	sources: (ws: string, signal?: AbortSignal) =>
		axiosClient
			.get<TApiResponse<{ sources: TKnowledgeSource[] }>>(E.sources(ws), { signal })
			.then(unwrapKey<TKnowledgeSource[]>('sources')),

	sourceApps: (ws: string, signal?: AbortSignal) =>
		axiosClient
			.get<TApiResponse<{ apps: TKnowledgeSourceApp[] }>>(E.sourceApps(ws), { signal })
			.then(unwrapKey<TKnowledgeSourceApp[]>('apps')),

	sourceOptions: (
		ws: string,
		params: { type: TKnowledgeSourceType; credential_id?: string; search?: string },
		signal?: AbortSignal,
	) =>
		axiosClient
			.get<
				TApiResponse<{ options: TKnowledgeSourceOption[] }>
			>(E.sourceOptions(ws), { params, signal })
			.then(unwrapKey<TKnowledgeSourceOption[]>('options')),

	createSource: (ws: string, payload: TCreateKnowledgeSourceDto) =>
		axiosClient
			.post<TApiResponse<{ source: TKnowledgeSource }>>(E.sources(ws), payload)
			.then(unwrapKey<TKnowledgeSource>('source')),

	updateSource: (ws: string, id: string, payload: TUpdateKnowledgeSourceDto) =>
		axiosClient
			.patch<TApiResponse<{ source: TKnowledgeSource }>>(E.source(ws, id), payload)
			.then(unwrapKey<TKnowledgeSource>('source')),

	sourceDocuments: (ws: string, id: string, signal?: AbortSignal) =>
		axiosClient
			.get<
				TApiResponse<{ documents: TKnowledgeSourceDocument[] }>
			>(E.sourceDocuments(ws, id), { signal })
			.then(unwrapKey<TKnowledgeSourceDocument[]>('documents')),

	syncSource: (ws: string, id: string) =>
		axiosClient
			.post<TApiResponse<{ source: TKnowledgeSource }>>(E.syncSource(ws, id))
			.then(unwrapKey<TKnowledgeSource>('source')),

	removeSource: (ws: string, id: string) =>
		axiosClient.delete(E.source(ws, id)).then(() => undefined),
};
