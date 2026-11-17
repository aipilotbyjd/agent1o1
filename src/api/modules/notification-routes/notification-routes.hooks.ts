import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { TNotificationRouteDto } from '@/types/notification.type';
import { NotificationRouteService } from './notification-routes.service';
import { notificationRouteKeys } from './notification-routes.keys';

export const useNotificationRoutes = (ws: string) =>
	useQuery({
		queryKey: notificationRouteKeys.list(ws),
		queryFn: ({ signal }) => NotificationRouteService.list(ws, signal),
		enabled: !!ws,
	});

export const useCreateNotificationRoute = (ws: string) => {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (payload: TNotificationRouteDto) =>
			NotificationRouteService.create(ws, payload),
		onSuccess: () => qc.invalidateQueries({ queryKey: notificationRouteKeys.list(ws) }),
		meta: { errorMessage: 'Failed to add the route' },
	});
};

export const useUpdateNotificationRoute = (ws: string) => {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: ({ id, body }: { id: string; body: Partial<TNotificationRouteDto> }) =>
			NotificationRouteService.update(ws, id, body),
		onSuccess: () => qc.invalidateQueries({ queryKey: notificationRouteKeys.list(ws) }),
		meta: { errorMessage: 'Failed to update the route' },
	});
};

export const useDeleteNotificationRoute = (ws: string) => {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (id: string) => NotificationRouteService.remove(ws, id),
		onSuccess: () => qc.invalidateQueries({ queryKey: notificationRouteKeys.list(ws) }),
		meta: { errorMessage: 'Failed to remove the route' },
	});
};
