export const connectorKeys = {
	lists: () => ['connectors', 'list'] as const,
	details: () => ['connectors', 'detail'] as const,
	detail: (id: string) => ['connectors', 'detail', id] as const,
};

export const connectorCredentialKeys = {
	all: (ws: string) => ['connector-credentials', ws] as const,
	lists: (ws: string) => ['connector-credentials', ws, 'list'] as const,
	list: (ws: string) => ['connector-credentials', ws, 'list'] as const,
	details: (ws: string) => ['connector-credentials', ws, 'detail'] as const,
	detail: (ws: string, id: string) => ['connector-credentials', ws, 'detail', id] as const,
};
