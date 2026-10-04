const base = (ws: string) => `/workspaces/${ws}/library`;

export const LibraryEndpoints = {
	list: base,
	download: (ws: string, id: string) => `${base(ws)}/${id}/download`,
} as const;
