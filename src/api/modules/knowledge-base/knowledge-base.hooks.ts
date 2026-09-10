import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { TIngestKnowledgeDto, TSearchKnowledgeDto, TReadKnowledgeDocumentParams } from '@/types/knowledge-base.type';
import { KnowledgeBaseService } from './knowledge-base.service';
import { knowledgeBaseKeys } from './knowledge-base.keys';

export const useKnowledgeChunks = (
	ws: string,
	params?: { collection?: string; source?: string; page?: number; per_page?: number },
) =>
	useQuery({
		queryKey: knowledgeBaseKeys.list(ws, params),
		queryFn: ({ signal }) => KnowledgeBaseService.list(ws, params, signal),
		enabled: !!ws,
	});

export const useKnowledgeCollections = (ws: string) =>
	useQuery({
		queryKey: knowledgeBaseKeys.collections(ws),
		queryFn: ({ signal }) => KnowledgeBaseService.collections(ws, signal),
		enabled: !!ws,
	});

export const useIngestKnowledge = (ws: string) => {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (payload: TIngestKnowledgeDto) => KnowledgeBaseService.ingest(ws, payload),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: ['knowledge-base', ws] });
		},
		meta: { errorMessage: 'Failed to ingest document' },
	});
};

export const useSearchKnowledge = (ws: string) =>
	useMutation({
		mutationFn: (payload: TSearchKnowledgeDto) => KnowledgeBaseService.search(ws, payload),
		meta: { errorMessage: 'Search failed' },
	});

export const useKnowledgeDocument = (ws: string, params: TReadKnowledgeDocumentParams) =>
	useQuery({
		queryKey: knowledgeBaseKeys.document(ws, params.source, params.collection),
		queryFn: ({ signal }) => KnowledgeBaseService.document(ws, params, signal),
		enabled: !!ws && !!params.source,
	});

export const useDeleteKnowledgeChunk = (ws: string) => {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (id: string) => KnowledgeBaseService.remove(ws, id),
		onSuccess: () => qc.invalidateQueries({ queryKey: ['knowledge-base', ws] }),
		meta: { errorMessage: 'Failed to delete chunk' },
	});
};

export const useDeleteKnowledgeCollection = (ws: string) => {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (collection: string) => KnowledgeBaseService.removeCollection(ws, collection),
		onSuccess: () => qc.invalidateQueries({ queryKey: ['knowledge-base', ws] }),
		meta: { errorMessage: 'Failed to delete collection' },
	});
};
