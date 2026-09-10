export const artifactKeys = {
	all: (ws: string) => ['artifacts', ws] as const,
	lists: (ws: string) => ['artifacts', ws, 'list'] as const,
	list: (ws: string, params?: { page?: number; per_page?: number }) =>
		['artifacts', ws, 'list', params ?? {}] as const,
	details: (ws: string) => ['artifacts', ws, 'detail'] as const,
	detail: (ws: string, id: string) => ['artifacts', ws, 'detail', id] as const,
};
