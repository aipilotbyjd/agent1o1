export const folderKeys = {
	all: (ws: string) => ['folders', ws] as const,
	lists: (ws: string) => ['folders', ws, 'list'] as const,
	list: (ws: string) => ['folders', ws, 'list'] as const,
};
