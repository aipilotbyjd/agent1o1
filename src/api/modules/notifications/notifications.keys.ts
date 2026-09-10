export const notificationKeys = {
	list: (params?: { unread?: boolean; per_page?: number }) => ['notifications', params ?? {}] as const,
	unreadCount: () => ['notifications', 'unread-count'] as const,
	events: () => ['notifications', 'events'] as const,
};
