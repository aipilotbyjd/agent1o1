import { axiosClient } from '@/api/client';
import { unwrapKey } from '@/api/core';
import type { TApiResponse, TMessageResponse } from '@/api/core';
import type {
	TNotificationChannel,
	TCreateNotificationChannelDto,
	TUpdateNotificationChannelDto,
} from '@/types/notification.type';
import { NotificationChannelEndpoints as E } from './notification-channels.endpoints';

export const NotificationChannelService = {
	list: (ws: string, signal?: AbortSignal) =>
		axiosClient
			.get<TApiResponse<{ channels: TNotificationChannel[] }>>(E.list(ws), { signal })
			.then(unwrapKey<TNotificationChannel[]>('channels')),

	create: (ws: string, payload: TCreateNotificationChannelDto) =>
		axiosClient
			.post<TApiResponse<{ channel: TNotificationChannel }>>(E.create(ws), payload)
			.then(unwrapKey<TNotificationChannel>('channel')),

	update: (ws: string, id: string, payload: TUpdateNotificationChannelDto) =>
		axiosClient
			.patch<TApiResponse<{ channel: TNotificationChannel }>>(E.update(ws, id), payload)
			.then(unwrapKey<TNotificationChannel>('channel')),

	remove: (ws: string, id: string) => axiosClient.delete(E.delete(ws, id)).then(() => undefined),

	test: (ws: string, id: string) =>
		axiosClient.post<TMessageResponse>(E.test(ws, id)).then((r) => r.data),
};
