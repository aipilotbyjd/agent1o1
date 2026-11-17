import type { TNotificationListParams } from '@/types/notification.type';

// Everything under ['notifications'] is invalidated together when the inbox
// changes, so list, summary and count never disagree.
export const notificationKeys = {
	all: ['notifications'] as const,
	lists: () => ['notifications', 'list'] as const,
	list: (params?: TNotificationListParams) => ['notifications', 'list', params ?? {}] as const,
	summary: () => ['notifications', 'summary'] as const,
	unreadCount: () => ['notifications', 'unread-count'] as const,
	events: () => ['notification-catalog', 'events'] as const,
	catalog: () => ['notification-catalog', 'categories'] as const,
	accountPreferences: () => ['notification-preferences', 'account'] as const,
};
