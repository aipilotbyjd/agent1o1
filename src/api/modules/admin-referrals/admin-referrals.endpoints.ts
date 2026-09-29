const base = '/admin/referrals';

export const AdminReferralEndpoints = {
	stats: `${base}/stats`,

	programs: `${base}/programs`,
	program: (id: string) => `${base}/programs/${id}`,
	makeDefault: (id: string) => `${base}/programs/${id}/make-default`,
	duplicate: (id: string) => `${base}/programs/${id}/duplicate`,
	simulate: (id: string) => `${base}/programs/${id}/simulate`,

	rules: (programId: string) => `${base}/programs/${programId}/rules`,
	reorderRules: (programId: string) => `${base}/programs/${programId}/rules/reorder`,
	rule: (id: string) => `${base}/rules/${id}`,
	toggleRule: (id: string) => `${base}/rules/${id}/toggle`,

	codes: `${base}/codes`,
	code: (id: string) => `${base}/codes/${id}`,

	referrals: `${base}/referrals`,
	referral: (id: string) => `${base}/referrals/${id}`,
	rejectReferral: (id: string) => `${base}/referrals/${id}/reject`,
	restoreReferral: (id: string) => `${base}/referrals/${id}/restore`,

	rewards: `${base}/rewards`,
	manualReward: `${base}/rewards/manual`,
	approveReward: (id: string) => `${base}/rewards/${id}/approve`,
	grantRewardNow: (id: string) => `${base}/rewards/${id}/grant-now`,
	revokeReward: (id: string) => `${base}/rewards/${id}/revoke`,

	blockedDomains: `${base}/blocked-domains`,
	blockedDomain: (id: string) => `${base}/blocked-domains/${id}`,

	auditLog: '/admin/audit-log',
} as const;
