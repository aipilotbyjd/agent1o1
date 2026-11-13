import { useEffect } from 'react';
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

/**
 * Whether the app is read-only right now, for screens that should stop
 * offering to change things instead of letting the user hit a 503.
 *
 * The notice carries its own end time, so the list is refetched just after it
 * to unlock without waiting for the realtime nudge or the poll.
 */
export const useMaintenance = () => {
	const qc = useQueryClient();
	const { data } = useAnnouncements();

	const isReadOnly = data?.maintenance_blocking_writes ?? false;
	const window = data?.announcements.find((a) => a.blocks_writes && a.window_open);
	const endsAt = window?.ends_at ?? null;

	useEffect(() => {
		if (!isReadOnly || !endsAt) return;
		const wait = new Date(endsAt).getTime() - Date.now() + 1000;
		if (wait <= 0) return;
		// setTimeout cannot count past ~24.8 days; a write-blocking window is at most a day.
		const timer = setTimeout(
			() => qc.invalidateQueries({ queryKey: announcementKeys.all }),
			wait,
		);
		return () => clearTimeout(timer);
	}, [isReadOnly, endsAt, qc]);

	return {
		isReadOnly,
		endsAt,
		title: window?.title ?? null,
		message: window?.read_only_message ?? null,
	};
};
