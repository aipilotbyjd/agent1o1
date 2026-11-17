// No detail route: channels are only ever listed, created, updated,
// deleted, test-delivered, re-keyed, or asked what they were sent.
const base = (ws: string) => `/workspaces/${ws}/notification-channels`;

export const NotificationChannelEndpoints = {
	list: base,
	create: base,
	update: (ws: string, id: string) => `${base(ws)}/${id}`,
	delete: (ws: string, id: string) => `${base(ws)}/${id}`,
	test: (ws: string, id: string) => `${base(ws)}/${id}/test`,
	rotateSecret: (ws: string, id: string) => `${base(ws)}/${id}/rotate-secret`,
	deliveries: (ws: string, id: string) => `${base(ws)}/${id}/deliveries`,
} as const;
