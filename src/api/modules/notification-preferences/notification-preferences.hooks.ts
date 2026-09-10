import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { TUpsertNotificationPreferenceDto } from '@/types/notification.type';
import { NotificationPreferenceService } from './notification-preferences.service';
import { notificationPreferenceKeys } from './notification-preferences.keys';

export const useNotificationPreferences = (ws: string) =>
	useQuery({
		queryKey: notificationPreferenceKeys.list(ws),
		queryFn: ({ signal }) => NotificationPreferenceService.list(ws, signal),
		enabled: !!ws,
	});

export const useUpsertNotificationPreference = (ws: string) => {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (payload: TUpsertNotificationPreferenceDto) =>
			NotificationPreferenceService.upsert(ws, payload),
		onSuccess: () => qc.invalidateQueries({ queryKey: notificationPreferenceKeys.list(ws) }),
		meta: { errorMessage: 'Failed to save notification preference' },
	});
};
