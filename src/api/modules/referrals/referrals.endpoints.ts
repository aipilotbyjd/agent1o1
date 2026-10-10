const base = '/referrals';

export const ReferralEndpoints = {
	visit: `${base}/visit`,
	claim: `${base}/claim`,
	me: `${base}/me`,
	program: `${base}/program`,
	stats: `${base}/stats`,
	rewards: `${base}/rewards`,
	list: base,
} as const;
