import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { NotificationService } from './notifications.service';
import { notificationKeys } from './notifications.keys';

export const useNotifications = (params?: { unread?: boolean; per_page?: number }) =>
	useQuery({
		queryKey: notificationKeys.list(params),
		queryFn: ({ signal }) => NotificationService.list(params, signal),
	});

export const useNotificationEvents = () =>
	useQuery({
		queryKey: notificationKeys.events(),
		queryFn: ({ signal }) => NotificationService.events(signal),
		staleTime: 30 * 60_000,
	});

export const useUnreadNotificationCount = () =>
	useQuery({
		queryKey: notificationKeys.unreadCount(),
		queryFn: ({ signal }) => NotificationService.unreadCount(signal),
		refetchInterval: 60_000,
	});

export const useMarkNotificationRead = () => {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (id: string) => NotificationService.markRead(id),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: ['notifications'] });
			qc.invalidateQueries({ queryKey: notificationKeys.unreadCount() });
		},
		meta: { silent: true },
	});
};

export const useMarkAllNotificationsRead = () => {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: () => NotificationService.markAllRead(),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: ['notifications'] });
			qc.invalidateQueries({ queryKey: notificationKeys.unreadCount() });
		},
		meta: { errorMessage: 'Failed to mark all as read' },
	});
};

export const useDeleteNotification = () => {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (id: string) => NotificationService.remove(id),
		onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
		meta: { errorMessage: 'Failed to delete notification' },
	});
};
