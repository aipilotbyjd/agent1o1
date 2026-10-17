export const referralKeys = {
	all: ['referrals'] as const,
	me: () => ['referrals', 'me'] as const,
	program: () => ['referrals', 'program'] as const,
	stats: () => ['referrals', 'stats'] as const,
	list: (params?: { page?: number; per_page?: number }) =>
		['referrals', 'list', params ?? {}] as const,
	rewards: (params?: { page?: number; per_page?: number }) =>
		['referrals', 'rewards', params ?? {}] as const,
};
