export const builderSessionKeys = {
	all: (ws: string) => ['workflow-builder-sessions', ws] as const,
	lists: (ws: string) => ['workflow-builder-sessions', ws, 'list'] as const,
	list: (ws: string) => ['workflow-builder-sessions', ws, 'list'] as const,
	detail: (ws: string, id: string) => ['workflow-builder-sessions', ws, 'detail', id] as const,
};
