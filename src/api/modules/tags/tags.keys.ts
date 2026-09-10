export const tagKeys = {
	all: (ws: string) => ['tags', ws] as const,
	lists: (ws: string) => ['tags', ws, 'list'] as const,
	list: (ws: string) => ['tags', ws, 'list'] as const,
};
