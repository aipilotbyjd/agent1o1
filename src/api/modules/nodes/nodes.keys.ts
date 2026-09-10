export const nodeKeys = {
	globalCatalog: (params?: { category?: string; search?: string }) =>
		['nodes', 'global-catalog', params ?? {}] as const,
	all: (ws: string) => ['nodes', ws] as const,
	lists: (ws: string) => ['nodes', ws, 'list'] as const,
	list: (ws: string, params?: { category?: string; search?: string }) =>
		['nodes', ws, 'list', params ?? {}] as const,
	custom: (ws: string) => ['nodes', ws, 'custom'] as const,
	recentlyUsed: (ws: string) => ['nodes', ws, 'recently-used'] as const,
	details: (ws: string) => ['nodes', ws, 'detail'] as const,
	detail: (ws: string, id: string) => ['nodes', ws, 'detail', id] as const,
};
