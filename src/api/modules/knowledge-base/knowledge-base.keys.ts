export const knowledgeBaseKeys = {
	list: (
		ws: string,
		params?: { collection?: string; source?: string; page?: number; per_page?: number },
	) => ['knowledge-base', ws, 'list', params ?? {}] as const,
	collections: (ws: string) => ['knowledge-base', ws, 'collections'] as const,
	sources: (ws: string) => ['knowledge-base', ws, 'sources'] as const,
	sourceApps: (ws: string) => ['knowledge-base', ws, 'source-apps'] as const,
	sourceOptions: (ws: string, type: string, credentialId: string, search: string) =>
		['knowledge-base', ws, 'source-options', type, credentialId, search] as const,
	sourceDocuments: (ws: string, id: string) =>
		['knowledge-base', ws, 'sources', id, 'documents'] as const,
	search: (ws: string, query: string, collection?: string) =>
		['knowledge-base', ws, 'search', query, collection ?? null] as const,
	document: (ws: string, source: string, collection?: string) =>
		['knowledge-base', ws, 'document', source, collection ?? null] as const,
};
