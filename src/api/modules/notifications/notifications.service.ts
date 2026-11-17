import { axiosClient } from '@/api/client';
import { unwrap, unwrapKey, unwrapNumberedPage } from '@/api/core';
import type { TApiResponse, TNumberedPage } from '@/api/core';
import type { TPaginationMeta } from '@/types/api.type';
import type {
	TAccountNotificationPreference,
	TMarkNotificationsReadDto,
	TNotification,
	TNotificationCatalog,
	TNotificationEventCatalogEntry,
	TNotificationListParams,
	TNotificationSummary,
	TUnreadCount,
	TUpdateNotificationPreferencesDto,
} from '@/types/notification.type';
import { NotificationEndpoints as E } from './notifications.endpoints';

export const NotificationService = {
	list: (
		params?: TNotificationListParams,
		signal?: AbortSignal,
	): Promise<TNumberedPage<TNotification>> =>
		axiosClient
			.get<TApiResponse<TNotification[]> & { meta: TPaginationMeta }>(E.list, {
				params: { ...params, needs_action: params?.needs_action ? 1 : undefined },
				signal,
			})
			.then(unwrapNumberedPage<TNotification>),

	summary: (signal?: AbortSignal) =>
		axiosClient
			.get<TApiResponse<TNotificationSummary>>(E.summary, { signal })
			.then(unwrap<TNotificationSummary>),

	events: (signal?: AbortSignal) =>
		axiosClient
			.get<TApiResponse<TNotificationEventCatalogEntry[]>>(E.events, { signal })
			.then(unwrap<TNotificationEventCatalogEntry[]>),

	catalog: (signal?: AbortSignal) =>
		axiosClient
			.get<TApiResponse<TNotificationCatalog>>(E.catalog, { signal })
			.then(unwrap<TNotificationCatalog>),

	unreadCount: (signal?: AbortSignal) =>
		axiosClient
			.get<TApiResponse<TUnreadCount>>(E.unreadCount, { signal })
			.then(unwrap<TUnreadCount>),

	markRead: (id: string) =>
		axiosClient
			.post<TApiResponse<{ notification: TNotification }>>(E.markRead(id))
			.then(unwrapKey<TNotification>('notification')),

	markAllRead: () => axiosClient.post(E.markAllRead).then(() => undefined),

	markManyRead: (payload: TMarkNotificationsReadDto) =>
		axiosClient.post(E.markManyRead, payload).then(() => undefined),

	archive: (ids: string[]) => axiosClient.post(E.archive, { ids }).then(() => undefined),

	unarchive: (ids: string[]) => axiosClient.post(E.unarchive, { ids }).then(() => undefined),

	remove: (id: string) => axiosClient.delete(E.delete(id)).then(() => undefined),

	accountPreferences: (signal?: AbortSignal) =>
		axiosClient
			.get<
				TApiResponse<{ preferences: TAccountNotificationPreference[] }>
			>(E.accountPreferences, { signal })
			.then(unwrapKey<TAccountNotificationPreference[]>('preferences')),

	updateAccountPreferences: (payload: TUpdateNotificationPreferencesDto) =>
		axiosClient
			.put<
				TApiResponse<{ preferences: TAccountNotificationPreference[] }>
			>(E.accountPreferences, payload)
			.then(unwrapKey<TAccountNotificationPreference[]>('preferences')),
};
