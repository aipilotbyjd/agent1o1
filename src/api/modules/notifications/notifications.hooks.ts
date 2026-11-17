import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getNextPageNumber } from '@/api/core';
import { useRealtimePollInterval } from '@/context/realtime';
import type {
	TMarkNotificationsReadDto,
	TNotificationListParams,
	TUpdateNotificationPreferencesDto,
} from '@/types/notification.type';
import { NotificationService } from './notifications.service';
import { notificationKeys } from './notifications.keys';

/** The inbox, page by page, most recent occurrence first. */
export const useNotifications = (params: TNotificationListParams = {}) =>
	useInfiniteQuery({
		queryKey: notificationKeys.list(params),
		queryFn: ({ pageParam, signal }) =>
			NotificationService.list({ ...params, page: pageParam }, signal),
		initialPageParam: 1,
		getNextPageParam: getNextPageNumber,
	});

/** Unread counts for the bell badge and the filters. Polls only while realtime is down. */
export const useNotificationSummary = () => {
	const refetchInterval = useRealtimePollInterval(60_000);

	return useQuery({
		queryKey: notificationKeys.summary(),
		queryFn: ({ signal }) => NotificationService.summary(signal),
		refetchInterval,
	});
};

export const useNotificationEvents = () =>
	useQuery({
		queryKey: notificationKeys.events(),
		queryFn: ({ signal }) => NotificationService.events(signal),
		staleTime: 30 * 60_000,
	});

export const useNotificationCatalog = () =>
	useQuery({
		queryKey: notificationKeys.catalog(),
		queryFn: ({ signal }) => NotificationService.catalog(signal),
		staleTime: 30 * 60_000,
	});

const useInvalidateInbox = () => {
	const qc = useQueryClient();
	return () => qc.invalidateQueries({ queryKey: notificationKeys.all });
};

export const useMarkNotificationRead = () => {
	const invalidate = useInvalidateInbox();
	return useMutation({
		mutationFn: (id: string) => NotificationService.markRead(id),
		onSuccess: invalidate,
		meta: { silent: true },
	});
};

export const useMarkAllNotificationsRead = () => {
	const invalidate = useInvalidateInbox();
	return useMutation({
		mutationFn: () => NotificationService.markAllRead(),
		onSuccess: invalidate,
		meta: { errorMessage: 'Failed to mark all as read' },
	});
};

export const useMarkNotificationsRead = () => {
	const invalidate = useInvalidateInbox();
	return useMutation({
		mutationFn: (payload: TMarkNotificationsReadDto) =>
			NotificationService.markManyRead(payload),
		onSuccess: invalidate,
		meta: { errorMessage: 'Failed to mark notifications as read' },
	});
};

export const useArchiveNotifications = () => {
	const invalidate = useInvalidateInbox();
	return useMutation({
		mutationFn: (ids: string[]) => NotificationService.archive(ids),
		onSuccess: invalidate,
		meta: { errorMessage: 'Failed to archive notifications' },
	});
};

export const useUnarchiveNotifications = () => {
	const invalidate = useInvalidateInbox();
	return useMutation({
		mutationFn: (ids: string[]) => NotificationService.unarchive(ids),
		onSuccess: invalidate,
		meta: { errorMessage: 'Failed to restore notifications' },
	});
};

export const useDeleteNotification = () => {
	const invalidate = useInvalidateInbox();
	return useMutation({
		mutationFn: (id: string) => NotificationService.remove(id),
		onSuccess: invalidate,
		meta: { errorMessage: 'Failed to delete notification' },
	});
};

export const useAccountNotificationPreferences = () =>
	useQuery({
		queryKey: notificationKeys.accountPreferences(),
		queryFn: ({ signal }) => NotificationService.accountPreferences(signal),
	});

export const useUpdateAccountNotificationPreferences = () => {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (payload: TUpdateNotificationPreferencesDto) =>
			NotificationService.updateAccountPreferences(payload),
		onSuccess: (preferences) =>
			qc.setQueryData(notificationKeys.accountPreferences(), preferences),
		meta: { errorMessage: 'Failed to save notification preferences' },
	});
};
