import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { TAnnouncementsPayload } from '@/types/announcement.type';
import { AnnouncementService } from './announcements.service';
import { announcementKeys } from './announcements.keys';

/**
 * Banners and maintenance notices for this member. Realtime refetches it the
 * moment the operator publishes or ends one; the interval is the fallback for
 * when the socket is down or not configured.
 */
export const useAnnouncements = () =>
	useQuery({
		queryKey: announcementKeys.list(),
		queryFn: ({ signal }) => AnnouncementService.list(signal),
		refetchInterval: 5 * 60_000,
		meta: { silent: true },
	});

export const useDismissAnnouncement = () => {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (id: string) => AnnouncementService.dismiss(id),
		// Hide it at once; the refetch below settles the truth.
		onMutate: async (id) => {
			await qc.cancelQueries({ queryKey: announcementKeys.list() });
			const previous = qc.getQueryData<TAnnouncementsPayload>(announcementKeys.list());
			if (previous) {
				qc.setQueryData<TAnnouncementsPayload>(announcementKeys.list(), {
					...previous,
					announcements: previous.announcements.filter((a) => a.id !== id),
				});
			}
			return { previous };
		},
		onError: (_error, _id, context) => {
			if (context?.previous) qc.setQueryData(announcementKeys.list(), context.previous);
		},
		onSettled: () => qc.invalidateQueries({ queryKey: announcementKeys.all }),
		meta: { errorMessage: 'Could not dismiss this announcement' },
	});
};
