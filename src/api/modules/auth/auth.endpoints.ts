// ============================================================
// Auth Endpoints
// ------------------------------------------------------------
// Session lifecycle, two-factor, and social login. The profile
// resource (`/user`) lives in the `user` module, not here.
// ============================================================
export const AuthEndpoints = {
	register: '/auth/register',
	login: '/auth/login',
	verifyTwoFactor: '/auth/2fa/verify',
	refresh: '/auth/refresh',
	forgotPassword: '/auth/forgot-password',
	resetPassword: '/auth/reset-password',
	verifyEmail: (id: string, hash: string) => `/auth/verify-email/${id}/${hash}`,
	socialRedirect: (provider: 'google' | 'github') => `/auth/social/${provider}/redirect`,
	exchangeSocialCode: '/auth/social/exchange',

	logout: '/auth/logout',
	logoutAll: '/auth/logout-all',
	changePassword: '/auth/change-password',
	resendVerification: '/auth/resend-verification',
	sessions: '/auth/sessions',
	revokeSession: (tokenId: string) => `/auth/sessions/${tokenId}`,

	twoFactorEnable: '/auth/2fa/enable',
	twoFactorConfirm: '/auth/2fa/confirm',
	twoFactorDisable: '/auth/2fa/disable',
	twoFactorRecoveryCodes: '/auth/2fa/recovery-codes',
	twoFactorRegenerateRecoveryCodes: '/auth/2fa/recovery-codes/regenerate',
} as const;
