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
};
