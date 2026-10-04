import { TPages } from './types';

export const identity: TPages = {
	login: {
		id: 'login',
		to: '/login',
		text: 'Login',
		icon: 'Login03',
	},
	signup: {
		id: 'signup',
		to: '/signup',
		text: 'Signup',
		icon: 'AddTeam',
	},
	forgotPassword: {
		id: 'forgotPassword',
		to: '/forgot-password',
		text: 'Forgot Password',
		icon: 'LockPassword',
	},
	resetPassword: {
		id: 'resetPassword',
		to: '/reset-password',
		text: 'Reset Password',
		icon: 'LockPassword',
	},
	verifyEmail: {
		id: 'verifyEmail',
		to: '/verify-email',
		text: 'Verify Email',
		icon: 'CheckmarkCircle02',
	},
	twoFactorSetup: {
		id: 'twoFactorSetup',
		to: '/two-factor-setup',
		text: 'Two-Factor Setup',
		icon: 'Shield01',
	},
	accountLocked: {
		id: 'accountLocked',
		to: '/account-locked',
		text: 'Account Locked',
		icon: 'AiLock',
	},
	sessionExpired: {
		id: 'sessionExpired',
		to: '/session-expired',
		text: 'Session Expired',
		icon: 'Clock01',
	},
	oauthCallback: {
		id: 'oauthCallback',
		to: '/oauth/callback',
		text: 'Signing in',
		icon: 'Login03',
	},
	connectorOAuthComplete: {
		id: 'connectorOAuthComplete',
		to: '/oauth/connector-complete',
		text: 'Completing connection',
		icon: 'Plug01',
	},
	// The emailed invitation link. The backend signs its own accept URL; this
	// page carries that signature (`expires` + `signature`) through unchanged.
	acceptInvitation: {
		id: 'acceptInvitation',
		to: '/invitations/:invitationId/accept',
		text: 'Accept invitation',
		icon: 'AddTeam',
	},
};
