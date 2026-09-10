// No detail route — channels are only ever listed, created, updated,
// deleted, or test-delivered.
const base = (ws: string) => `/workspaces/${ws}/notification-channels`;

export const NotificationChannelEndpoints = {
	list: base,
	create: base,
	update: (ws: string, id: string) => `${base(ws)}/${id}`,
	delete: (ws: string, id: string) => `${base(ws)}/${id}`,
	test: (ws: string, id: string) => `${base(ws)}/${id}/test`,
} as const;
