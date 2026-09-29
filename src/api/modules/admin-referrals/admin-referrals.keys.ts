type TParams = Record<string, unknown>;

export const adminReferralKeys = {
	all: ['admin-referrals'] as const,
	stats: (days: number) => ['admin-referrals', 'stats', days] as const,
	programs: () => ['admin-referrals', 'programs'] as const,
	program: (id: string) => ['admin-referrals', 'programs', id] as const,
	codes: (params?: TParams) => ['admin-referrals', 'codes', params ?? {}] as const,
	referrals: (params?: TParams) => ['admin-referrals', 'referrals', params ?? {}] as const,
	rewards: (params?: TParams) => ['admin-referrals', 'rewards', params ?? {}] as const,
	blockedDomains: () => ['admin-referrals', 'blocked-domains'] as const,
	auditLog: (params?: TParams) => ['admin-referrals', 'audit-log', params ?? {}] as const,
};
