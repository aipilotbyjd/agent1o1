const base = (ws: string) => `/workspaces/${ws}/knowledge-base`;

export const KnowledgeBaseEndpoints = {
	list: base,
	ingest: base,
	search: (ws: string) => `${base(ws)}/search`,
	document: (ws: string) => `${base(ws)}/document`,
	collections: (ws: string) => `${base(ws)}/collections`,
	deleteCollection: (ws: string, collection: string) => `${base(ws)}/collections/${collection}`,
	delete: (ws: string, id: string) => `${base(ws)}/${id}`,
} as const;
