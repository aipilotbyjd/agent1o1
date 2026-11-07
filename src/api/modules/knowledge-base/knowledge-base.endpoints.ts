const base = (ws: string) => `/workspaces/${ws}/knowledge-base`;

export const KnowledgeBaseEndpoints = {
	list: base,
	ingest: base,
	search: (ws: string) => `${base(ws)}/search`,
	document: (ws: string) => `${base(ws)}/document`,
	collections: (ws: string) => `${base(ws)}/collections`,
	deleteCollection: (ws: string, collection: string) => `${base(ws)}/collections/${collection}`,
	delete: (ws: string, id: string) => `${base(ws)}/${id}`,
	sources: (ws: string) => `${base(ws)}/sources`,
	sourceApps: (ws: string) => `${base(ws)}/sources/apps`,
	sourceOptions: (ws: string) => `${base(ws)}/sources/options`,
	source: (ws: string, id: string) => `${base(ws)}/sources/${id}`,
	syncSource: (ws: string, id: string) => `${base(ws)}/sources/${id}/sync`,
	sourceDocuments: (ws: string, id: string) => `${base(ws)}/sources/${id}/documents`,
} as const;
