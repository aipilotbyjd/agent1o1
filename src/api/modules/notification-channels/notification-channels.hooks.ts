import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type {
	TCreateNotificationChannelDto,
	TUpdateNotificationChannelDto,
} from '@/types/notification.type';
import { NotificationChannelService } from './notification-channels.service';
import { notificationChannelKeys } from './notification-channels.keys';

export const useNotificationChannels = (ws: string) =>
	useQuery({
		queryKey: notificationChannelKeys.list(ws),
		queryFn: ({ signal }) => NotificationChannelService.list(ws, signal),
		enabled: !!ws,
	});

export const useCreateNotificationChannel = (ws: string) => {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (payload: TCreateNotificationChannelDto) =>
			NotificationChannelService.create(ws, payload),
		onSuccess: () => qc.invalidateQueries({ queryKey: notificationChannelKeys.lists(ws) }),
		meta: { errorMessage: 'Failed to create notification channel' },
	});
};

export const useUpdateNotificationChannel = (ws: string) => {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: ({ id, body }: { id: string; body: TUpdateNotificationChannelDto }) =>
			NotificationChannelService.update(ws, id, body),
		onSuccess: () => qc.invalidateQueries({ queryKey: notificationChannelKeys.lists(ws) }),
		meta: { errorMessage: 'Failed to update notification channel' },
	});
};

export const useDeleteNotificationChannel = (ws: string) => {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (id: string) => NotificationChannelService.remove(ws, id),
		onSuccess: () => qc.invalidateQueries({ queryKey: notificationChannelKeys.lists(ws) }),
		meta: { errorMessage: 'Failed to delete notification channel' },
	});
};

export const useTestNotificationChannel = (ws: string) =>
	useMutation({
		mutationFn: (id: string) => NotificationChannelService.test(ws, id),
		meta: { errorMessage: 'Test delivery failed' },
	});

export const useRotateNotificationChannelSecret = (ws: string) => {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (id: string) => NotificationChannelService.rotateSecret(ws, id),
		onSuccess: () => qc.invalidateQueries({ queryKey: notificationChannelKeys.lists(ws) }),
		meta: { errorMessage: 'Failed to rotate the signing secret' },
	});
};

/** The latest deliveries to one channel, while its panel is open. */
export const useNotificationChannelDeliveries = (ws: string, id: string | null) =>
	useQuery({
		queryKey: notificationChannelKeys.deliveries(ws, id ?? ''),
		queryFn: ({ signal }) => NotificationChannelService.deliveries(ws, id as string, signal),
		enabled: !!ws && !!id,
	});
