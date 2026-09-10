// Account-level — not workspace-scoped. A notification spans whichever
// workspace it's about, if any (see TNotification.workspace_id).
export const NotificationEndpoints = {
	list: '/notifications',
	events: '/notifications/events',
	unreadCount: '/notifications/unread-count',
	markAllRead: '/notifications/mark-all-read',
	markRead: (id: string) => `/notifications/${id}/read`,
	delete: (id: string) => `/notifications/${id}`,
} as const;
