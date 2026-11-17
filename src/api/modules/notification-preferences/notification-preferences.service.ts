import { axiosClient } from '@/api/client';
import { unwrapKey } from '@/api/core';
import type { TApiResponse } from '@/api/core';
import type {
	TNotificationPreference,
	TUpdateNotificationPreferencesDto,
} from '@/types/notification.type';
import { NotificationPreferenceEndpoints as E } from './notification-preferences.endpoints';

export const NotificationPreferenceService = {
	// Only the caller's own preferences for this workspace, not every
	// member's.
	list: (ws: string, signal?: AbortSignal) =>
		axiosClient
			.get<TApiResponse<{ preferences: TNotificationPreference[] }>>(E.list(ws), { signal })
			.then(unwrapKey<TNotificationPreference[]>('preferences')),

	// Upserts by (workspace, user, key), where a key is an event or a whole
	// category (`category:<name>`). Saving a category clears that
	// category's per-event rows on the server.
	update: (ws: string, payload: TUpdateNotificationPreferencesDto) =>
		axiosClient
			.put<TApiResponse<{ preferences: TNotificationPreference[] }>>(E.bulk(ws), payload)
			.then(unwrapKey<TNotificationPreference[]>('preferences')),
};
