const base = (ws: string) => `/workspaces/${ws}/artifacts`;
const artifact = (ws: string, id: string) => `${base(ws)}/${id}`;

export const ArtifactEndpoints = {
	list: base,
	create: base,
	detail: artifact,
	delete: artifact,
	download: (ws: string, id: string) => `${artifact(ws, id)}/download`,
	updateAccess: (ws: string, id: string) => `${artifact(ws, id)}/access`,
	addShare: (ws: string, id: string) => `${artifact(ws, id)}/shares`,
	removeShare: (ws: string, id: string, userId: string) => `${artifact(ws, id)}/shares/${userId}`,
} as const;
