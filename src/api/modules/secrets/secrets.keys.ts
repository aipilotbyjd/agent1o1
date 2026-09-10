export const secretKeys = {
	all: (ws: string) => ['secrets', ws] as const,
	lists: (ws: string) => ['secrets', ws, 'list'] as const,
	list: (ws: string) => ['secrets', ws, 'list'] as const,
	details: (ws: string) => ['secrets', ws, 'detail'] as const,
	detail: (ws: string, id: string) => ['secrets', ws, 'detail', id] as const,
};
