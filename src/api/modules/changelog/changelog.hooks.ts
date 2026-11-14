import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getAccessToken } from '@/api/core';
import type { TChangelogParams } from '@/types/changelog.type';
import { changelogKeys } from './changelog.keys';
import { ChangelogService, type TChangelogScope } from './changelog.service';

/** Signed-in readers get the member door (members-only entries, read state). */
export const useChangelogScope = (): TChangelogScope =>
	getAccessToken() ? 'member' : 'public';

/** The timeline, one page at a time, for a "load more" button. */
export const useChangelogList = (params: Omit<TChangelogParams, 'page'>) => {
	const scope = useChangelogScope();

	return useInfiniteQuery({
		queryKey: changelogKeys.list(scope, params),
		queryFn: ({ pageParam, signal }) =>
			ChangelogService.list(scope, { ...params, page: pageParam }, signal),
		initialPageParam: 1,
		getNextPageParam: (last) =>
			last.meta.current_page < last.meta.last_page ? last.meta.current_page + 1 : undefined,
		meta: { errorMessage: 'Could not load the changelog' },
	});
};

/** Pinned entries, shown above the timeline. */
export const usePinnedChangelog = () => {
	const scope = useChangelogScope();
	const params: TChangelogParams = { pinned: true, per_page: 5 };

	return useQuery({
		queryKey: changelogKeys.list(scope, params),
		queryFn: ({ signal }) => ChangelogService.list(scope, params, signal),
		select: (page) => page.items,
		meta: { silent: true },
	});
};

export const useChangelogEntry = (slug: string) => {
	const scope = useChangelogScope();

	return useQuery({
		queryKey: changelogKeys.detail(scope, slug),
		queryFn: ({ signal }) => ChangelogService.detail(scope, slug, signal),
		enabled: !!slug,
		meta: { silent: true },
	});
};

/** The number on the "What's new" dot. Only asked while signed in. */
export const useUnreadChangelogCount = () =>
	useQuery({
		queryKey: changelogKeys.unread(),
		queryFn: ({ signal }) => ChangelogService.unreadCount(signal),
		enabled: !!getAccessToken(),
		refetchInterval: 5 * 60_000,
		refetchOnWindowFocus: true,
		meta: { silent: true },
	});

/** The newest unread major entry, for the one-time popup. */
export const useLatestMajorChangelog = () =>
	useQuery({
		queryKey: changelogKeys.latestMajor(),
		queryFn: ({ signal }) => ChangelogService.latestMajor(signal),
		enabled: !!getAccessToken(),
		staleTime: 5 * 60_000,
		meta: { silent: true },
	});

export const useMarkChangelogRead = () => {
	const qc = useQueryClient();

	return useMutation({
		mutationFn: (slug: string) => ChangelogService.markRead(slug),
		onSettled: () => {
			qc.invalidateQueries({ queryKey: changelogKeys.unread() });
			qc.invalidateQueries({ queryKey: changelogKeys.latestMajor() });
			qc.invalidateQueries({ queryKey: changelogKeys.lists() });
		},
		meta: { silent: true },
	});
};

export const useMarkAllChangelogRead = () => {
	const qc = useQueryClient();

	return useMutation({
		mutationFn: () => ChangelogService.markAllRead(),
		onSettled: () => qc.invalidateQueries({ queryKey: changelogKeys.all }),
		meta: { errorMessage: 'Could not mark everything as read' },
	});
};
