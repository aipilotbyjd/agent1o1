import { axiosClient } from '@/api/client';
import { unwrapKey } from '@/api/core';
import type { TApiResponse } from '@/api/core';
import type { TNotificationRoute, TNotificationRouteDto } from '@/types/notification.type';
import { NotificationRouteEndpoints as E } from './notification-routes.endpoints';

// Which of a workspace's notifications reach which of its chat and webhook
// channels. Evaluated once per event on the server, so a channel gets each
// message once however many members were notified.
export const NotificationRouteService = {
	list: (ws: string, signal?: AbortSignal) =>
		axiosClient
			.get<TApiResponse<{ routes: TNotificationRoute[] }>>(E.list(ws), { signal })
			.then(unwrapKey<TNotificationRoute[]>('routes')),

	create: (ws: string, payload: TNotificationRouteDto) =>
		axiosClient
			.post<TApiResponse<{ route: TNotificationRoute }>>(E.create(ws), payload)
			.then(unwrapKey<TNotificationRoute>('route')),

	update: (ws: string, id: string, payload: Partial<TNotificationRouteDto>) =>
		axiosClient
			.patch<TApiResponse<{ route: TNotificationRoute }>>(E.update(ws, id), payload)
			.then(unwrapKey<TNotificationRoute>('route')),

	remove: (ws: string, id: string) => axiosClient.delete(E.delete(ws, id)).then(() => undefined),
};
