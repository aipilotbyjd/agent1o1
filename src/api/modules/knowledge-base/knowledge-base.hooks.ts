import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type {
	TIngestKnowledgeDto,
	TSearchKnowledgeDto,
	TReadKnowledgeDocumentParams,
	TCreateKnowledgeSourceDto,
	TKnowledgeSource,
	TUpdateKnowledgeSourceDto,
	TKnowledgeSourceType,
} from '@/types/knowledge-base.type';
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
		mutationFn: ({ collection, isPrivate }: { collection: string; isPrivate: boolean }) =>
			KnowledgeBaseService.removeCollection(ws, collection, isPrivate),
		onSuccess: () => qc.invalidateQueries({ queryKey: ['knowledge-base', ws] }),
		meta: { errorMessage: 'Failed to delete collection' },
	});
};

const SYNCING_POLL_MS = 4000;

export const useKnowledgeSources = (ws: string) =>
	useQuery({
		queryKey: knowledgeBaseKeys.sources(ws),
		queryFn: ({ signal }) => KnowledgeBaseService.sources(ws, signal),
		enabled: !!ws,
		// Keep polling while any source is still syncing.
		refetchInterval: (query) =>
			(query.state.data as TKnowledgeSource[] | undefined)?.some((source) =>
				['pending', 'syncing'].includes(source.status),
			)
				? SYNCING_POLL_MS
				: false,
	});

const useSourceMutation = <TArgs, TResult>(
	ws: string,
	fn: (args: TArgs) => Promise<TResult>,
	errorMessage: string,
) => {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: fn,
		onSuccess: () => qc.invalidateQueries({ queryKey: ['knowledge-base', ws] }),
		meta: { errorMessage },
	});
};

export const useCreateKnowledgeSource = (ws: string) =>
	useSourceMutation(
		ws,
		(payload: TCreateKnowledgeSourceDto) => KnowledgeBaseService.createSource(ws, payload),
		'Failed to add the source',
	);

export const useSyncKnowledgeSource = (ws: string) =>
	useSourceMutation(
		ws,
		(id: string) => KnowledgeBaseService.syncSource(ws, id),
		'Failed to start the sync',
	);

export const useDeleteKnowledgeSource = (ws: string) =>
	useSourceMutation(
		ws,
		(id: string) => KnowledgeBaseService.removeSource(ws, id),
		'Failed to remove the source',
	);

export const useUpdateKnowledgeSource = (ws: string) =>
	useSourceMutation(
		ws,
		({ id, payload }: { id: string; payload: TUpdateKnowledgeSourceDto }) =>
			KnowledgeBaseService.updateSource(ws, id, payload),
		'Failed to save the source',
	);

export const useKnowledgeSourceDocuments = (ws: string, id: string) =>
	useQuery({
		queryKey: knowledgeBaseKeys.sourceDocuments(ws, id),
		queryFn: ({ signal }) => KnowledgeBaseService.sourceDocuments(ws, id, signal),
		enabled: !!ws && !!id,
	});

export const useKnowledgeSourceApps = (ws: string, enabled = true) =>
	useQuery({
		queryKey: knowledgeBaseKeys.sourceApps(ws),
		queryFn: ({ signal }) => KnowledgeBaseService.sourceApps(ws, signal),
		enabled: !!ws && enabled,
	});

/** Folders, labels, repos or channels in the chosen account. */
export const useKnowledgeSourceOptions = (
	ws: string,
	type: TKnowledgeSourceType | null,
	credentialId: string | undefined,
	search: string,
) =>
	useQuery({
		queryKey: knowledgeBaseKeys.sourceOptions(ws, type ?? '', credentialId ?? '', search),
		queryFn: ({ signal }) =>
			KnowledgeBaseService.sourceOptions(
				ws,
				{ type: type!, credential_id: credentialId, search: search || undefined },
				signal,
			),
		enabled: !!ws && !!type && !!credentialId,
		staleTime: 60_000,
		retry: false,
		meta: { silent: true },
	});
