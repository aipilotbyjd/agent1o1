import { axiosClient } from '@/api/client';
import { unwrap } from '@/api/core';
import type { TApiResponse } from '@/api/core';
import type { TNotification, TUnreadCount, TNotificationEventCatalogEntry } from '@/types/notification.type';
import { NotificationEndpoints as E } from './notifications.endpoints';

export const NotificationService = {
	// Backend paginates internally but returns the page as a flat array —
	// no `meta`/`links` reach the client from this endpoint.
	list: (params?: { unread?: boolean; per_page?: number }, signal?: AbortSignal) =>
		axiosClient
			.get<TApiResponse<TNotification[]>>(E.list, { params, signal })
			.then(unwrap<TNotification[]>),

	events: (signal?: AbortSignal) =>
		axiosClient
			.get<TApiResponse<TNotificationEventCatalogEntry[]>>(E.events, { signal })
			.then(unwrap<TNotificationEventCatalogEntry[]>),

	unreadCount: (signal?: AbortSignal) =>
		axiosClient
			.get<TApiResponse<TUnreadCount>>(E.unreadCount, { signal })
			.then(unwrap<TUnreadCount>),

	markRead: (id: string) =>
		axiosClient
			.post<TApiResponse<TNotification>>(E.markRead(id))
			.then(unwrap<TNotification>),

	markAllRead: () => axiosClient.post(E.markAllRead).then(() => undefined),

	remove: (id: string) => axiosClient.delete(E.delete(id)).then(() => undefined),
};
