// Index + upsert only — a preference is identified by (workspace, user,
// event_key), not its own id, so there's no per-id update/delete route.
export const NotificationPreferenceEndpoints = {
	list: (ws: string) => `/workspaces/${ws}/notification-preferences`,
	upsert: (ws: string) => `/workspaces/${ws}/notification-preferences`,
} as const;
