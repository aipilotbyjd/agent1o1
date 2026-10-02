import { TPage } from './types';

export const welcome: TPage = {
	id: 'welcome',
	to: '/onboarding',
	text: 'Welcome',
	icon: 'Rocket01',
	subPages: {
		pricing: {
			id: 'pricing',
			to: '/pricing',
			text: 'Pricing',
			icon: 'CreditCard',
		},
		createWorkspace: {
			id: 'createWorkspace',
			to: '/onboarding/create-workspace',
			text: 'Create Workspace',
			icon: 'DashboardSquare03',
		},
		inviteTeam: {
			id: 'inviteTeam',
			to: '/onboarding/invite-team',
			text: 'Invite Team',
			icon: 'UserAdd01',
		},
	},
};

export const choose: TPage = {
	id: 'workspaceList',
	to: '/workspaces',
	text: 'Workspaces',
	icon: 'DashboardSquare03',
};

/** Stripe sends the customer back here after a checkout or portal session. */
export const billingCallbacks = {
	stripeReturn: '/workspaces/:workspaceSlug/billing',
	success: '/billing/success',
	cancel: '/billing/cancel',
};
