import { axiosClient } from '@/api/client';
import { unwrap } from '@/api/core';
import type { TApiResponse, TPaginationMeta } from '@/types/api.type';
import type { TChangelogEntry, TChangelogParams } from '@/types/changelog.type';
import { ChangelogEndpoints as E } from './changelog.endpoints';

export type TChangelogScope = 'public' | 'member';

export type TChangelogPage = {
	items: TChangelogEntry[];
	meta: TPaginationMeta;
};

/** Empty filters are left out so they never reach the query string. */
const cleanParams = (params: TChangelogParams) =>
	Object.fromEntries(
		Object.entries(params).filter(([, value]) => value !== '' && value !== undefined && value !== false),
	);

export const ChangelogService = {
	list: (scope: TChangelogScope, params: TChangelogParams, signal?: AbortSignal) =>
		axiosClient
			.get<TApiResponse<TChangelogEntry[]> & { meta: TPaginationMeta }>(E[scope].list, {
				params: cleanParams(params),
				signal,
			})
			.then((res): TChangelogPage => ({ items: res.data.data, meta: res.data.meta })),

	detail: (scope: TChangelogScope, slug: string, signal?: AbortSignal) =>
		axiosClient
			.get<TApiResponse<TChangelogEntry>>(E[scope].detail(slug), { signal })
			.then(unwrap<TChangelogEntry>),

	unreadCount: (signal?: AbortSignal) =>
		axiosClient
			.get<TApiResponse<{ unread: number }>>(E.member.unreadCount, { signal })
			.then((res) => res.data.data.unread),

	latestMajor: (signal?: AbortSignal) =>
		axiosClient
			.get<TApiResponse<{ entry: TChangelogEntry | null }>>(E.member.latestMajor, { signal })
			.then((res) => res.data.data.entry),

	markRead: (slug: string) => axiosClient.post(E.member.read(slug)).then(() => undefined),

	markAllRead: () => axiosClient.post(E.member.readAll).then(() => undefined),
};
