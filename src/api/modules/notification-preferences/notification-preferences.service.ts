import { axiosClient } from '@/api/client';
import { unwrapKey } from '@/api/core';
import type { TApiResponse } from '@/api/core';
import type { TNotificationPreference, TUpsertNotificationPreferenceDto } from '@/types/notification.type';
import { NotificationPreferenceEndpoints as E } from './notification-preferences.endpoints';

export const NotificationPreferenceService = {
	// Only the caller's own preferences for this workspace — not every
	// member's.
	list: (ws: string, signal?: AbortSignal) =>
		axiosClient
			.get<TApiResponse<{ preferences: TNotificationPreference[] }>>(E.list(ws), { signal })
			.then(unwrapKey<TNotificationPreference[]>('preferences')),

	// Upserts by (workspace, user, event_key) — there's no separate
	// create/update split.
	upsert: (ws: string, payload: TUpsertNotificationPreferenceDto) =>
		axiosClient
			.put<TApiResponse<{ preference: TNotificationPreference }>>(E.upsert(ws), payload)
			.then(unwrapKey<TNotificationPreference>('preference')),
};
