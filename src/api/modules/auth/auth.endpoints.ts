export const AuthEndpoints = {
	login: '/auth/login',
	register: '/auth/register',
	logout: '/auth/logout',
	logoutAll: '/auth/logout-all',
	refresh: '/auth/refresh',
	forgotPassword: '/auth/forgot-password',
	resetPassword: '/auth/reset-password',
	changePassword: '/auth/change-password',
	resendVerification: '/auth/resend-verification',
	verifyEmail: (id: string, hash: string) => `/auth/verify-email/${id}/${hash}`,
	socialRedirect: (provider: TSocialProvider) => `/auth/social/${provider}/redirect`,
	socialExchange: '/auth/social/exchange',
} as const;

export type TSocialProvider = 'google' | 'github';

export const UserEndpoints = {
	me: '/user',
	update: '/user',
	destroy: '/user',
	uploadAvatar: '/user/avatar',
	deleteAvatar: '/user/avatar',
} as const;
