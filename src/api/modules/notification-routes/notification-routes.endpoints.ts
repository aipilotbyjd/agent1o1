const base = (ws: string) => `/workspaces/${ws}/notification-routes`;

export const NotificationRouteEndpoints = {
	list: base,
	create: base,
	update: (ws: string, id: string) => `${base(ws)}/${id}`,
	delete: (ws: string, id: string) => `${base(ws)}/${id}`,
} as const;
