import { axiosClient } from '@/api/client';
import { unwrapKey, unwrapNumberedPage } from '@/api/core';
import type { TApiResponse, TMessageResponse, TNumberedPage } from '@/api/core';
import type { TPaginationMeta } from '@/types/api.type';
import type {
	TNotificationChannel,
	TNotificationDelivery,
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

	/** Returns the channel with its new signing secret, shown only this once. */
	rotateSecret: (ws: string, id: string) =>
		axiosClient
			.post<TApiResponse<{ channel: TNotificationChannel }>>(E.rotateSecret(ws, id))
			.then(unwrapKey<TNotificationChannel>('channel')),

	deliveries: (
		ws: string,
		id: string,
		signal?: AbortSignal,
	): Promise<TNumberedPage<TNotificationDelivery>> =>
		axiosClient
			.get<TApiResponse<TNotificationDelivery[]> & { meta: TPaginationMeta }>(
				E.deliveries(ws, id),
				{
					params: { per_page: 20 },
					signal,
				},
			)
			.then(unwrapNumberedPage<TNotificationDelivery>),
};
