import { TPage, ws } from './types';

export const settings: TPage = {
	id: 'settings',
	to: ws('settings'),
	text: 'Settings',
	icon: 'Settings01',
	subPages: {
		profile: {
			id: 'profileSettings',
			to: ws('settings/profile'),
			text: 'Profile',
			icon: 'UserCircle',
		},
		security: {
			id: 'securitySettings',
			to: ws('settings/security'),
			text: 'Security',
			icon: 'Shield01',
		},
		notifications: {
			id: 'notificationsSettings',
			to: ws('settings/notifications'),
			text: 'Notifications',
			icon: 'Notification01',
		},
		referrals: {
			id: 'referralsSettings',
			to: ws('settings/referrals'),
			text: 'Refer & earn',
			icon: 'Gift',
		},
		workspace: {
			id: 'workspaceGeneralSettings',
			to: ws('settings/workspace'),
			text: 'General',
			icon: 'Settings01',
		},
		members: {
			id: 'membersSettings',
			to: ws('settings/members'),
			text: 'Members',
			icon: 'UserGroup',
		},
		apiKeys: {
			id: 'apiKeysSettings',
			to: ws('settings/api-keys'),
			text: 'API Keys',
			icon: 'Lock',
		},
		aiProviders: {
			id: 'aiProvidersSettings',
			to: ws('settings/ai-providers'),
			text: 'AI Providers',
			icon: 'AiChip',
		},
		notificationChannels: {
			id: 'notificationChannelsSettings',
			to: ws('settings/notification-channels'),
			text: 'Notification Channels',
			icon: 'Notification02',
		},
		tags: {
			id: 'tagsSettings',
			to: ws('settings/tags'),
			text: 'Tags',
			icon: 'Tag01',
		},
		agentPolicy: {
			id: 'agentPolicySettings',
			to: ws('settings/agent-policy'),
			text: 'Agent Policy',
			icon: 'Shield01',
		},
		billing: {
			id: 'billingSettings',
			to: ws('settings/billing'),
			text: 'Billing',
			icon: 'CreditCard',
			subPages: {
				overview: {
					id: 'billingOverview',
					to: ws('settings/billing'),
					text: 'Overview',
					icon: 'CreditCard',
				},
				plans: {
					id: 'billingPlans',
					to: ws('settings/billing/plans'),
					text: 'Plans',
					icon: 'Layers01',
				},
				credits: {
					id: 'billingCredits',
					to: ws('settings/billing/credits'),
					text: 'Buy Credits',
					icon: 'CreditCard',
				},
				usage: {
					id: 'billingUsage',
					to: ws('settings/billing/usage'),
					text: 'Usage',
					icon: 'Clock01',
				},
				invoices: {
					id: 'billingInvoices',
					to: ws('settings/billing/invoices'),
					text: 'Invoices',
					icon: 'Invoice01',
				},
			},
		},
	},
};

/**
 * The backend's email-change confirmation link ends here. It predates
 * workspace-scoped settings, so it carries no workspace id; the page
 * resolves one and forwards to Profile.
 */
export const accountCallbacks = {
	emailChange: '/settings/account',
};

/**
 * Paths that shipped before the settings reshuffle. They are registered as
 * redirects so existing bookmarks and emailed links keep resolving; nothing in
 * the app should link to them.
 */
export const settingsRedirects: { from: string; to: string }[] = [
	{ from: ws('settings/plan'), to: ws('settings/billing/plans') },
	{ from: ws('settings/plan/upgrade'), to: ws('settings/billing/plans') },
];
