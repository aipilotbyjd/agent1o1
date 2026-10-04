export const builderSessionKeys = {
	all: (ws: string) => ['workflow-builder-sessions', ws] as const,
	lists: (ws: string) => ['workflow-builder-sessions', ws, 'list'] as const,
	list: (ws: string, status?: string) => ['workflow-builder-sessions', ws, 'list', status ?? 'current'] as const,
	detail: (ws: string, id: string) => ['workflow-builder-sessions', ws, 'detail', id] as const,
	versions: (ws: string, id: string) => ['workflow-builder-sessions', ws, 'detail', id, 'versions'] as const,
};
