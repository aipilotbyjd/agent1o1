// Account-level, not workspace-scoped. A notification spans whichever
// workspace it's about, if any (see TNotification.workspace_id).
export const NotificationEndpoints = {
	list: '/notifications',
	summary: '/notifications/summary',
	events: '/notifications/events',
	catalog: '/notifications/catalog',
	unreadCount: '/notifications/unread-count',
	markAllRead: '/notifications/mark-all-read',
	markManyRead: '/notifications/read',
	archive: '/notifications/archive',
	unarchive: '/notifications/unarchive',
	accountPreferences: '/notifications/preferences',
	markRead: (id: string) => `/notifications/${id}/read`,
	delete: (id: string) => `/notifications/${id}`,
} as const;
