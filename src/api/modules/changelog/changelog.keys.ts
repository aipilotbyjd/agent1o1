import type { TChangelogParams } from '@/types/changelog.type';

export const changelogKeys = {
	all: ['changelog'] as const,
	lists: () => ['changelog', 'list'] as const,
	list: (scope: 'public' | 'member', params: TChangelogParams) =>
		['changelog', 'list', scope, params] as const,
	detail: (scope: 'public' | 'member', slug: string) =>
		['changelog', 'detail', scope, slug] as const,
	unread: () => ['changelog', 'unread'] as const,
	latestMajor: () => ['changelog', 'latest-major'] as const,
};
