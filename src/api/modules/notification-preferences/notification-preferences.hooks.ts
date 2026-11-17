import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { TUpdateNotificationPreferencesDto } from '@/types/notification.type';
import { NotificationPreferenceService } from './notification-preferences.service';
import { notificationPreferenceKeys } from './notification-preferences.keys';

export const useNotificationPreferences = (ws: string) =>
	useQuery({
		queryKey: notificationPreferenceKeys.list(ws),
		queryFn: ({ signal }) => NotificationPreferenceService.list(ws, signal),
		enabled: !!ws,
	});

export const useUpdateNotificationPreferences = (ws: string) => {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (payload: TUpdateNotificationPreferencesDto) =>
			NotificationPreferenceService.update(ws, payload),
		onSuccess: (preferences) =>
			qc.setQueryData(notificationPreferenceKeys.list(ws), preferences),
		meta: { errorMessage: 'Failed to save notification preferences' },
	});
};
