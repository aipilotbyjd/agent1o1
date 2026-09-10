import { TIcons } from '@/types/icons.type';

export type TPage = {
	id: string;
	to: string;
	text: string;
	icon: TIcons;
	subPages?: Record<string, TPage>;
	parentId?: string;
};
export type TPages = Record<string, TPage>;

const apps = {
	sales: {
		id: 'sales',
		to: '/sales',
		text: 'Sales',
		icon: 'Store04',
		subPages: {
			list: {
				id: 'list',
				to: '/sales/list',
				text: 'List',
				icon: 'ProductLoading',
			},
			view: {
				id: 'view',
				to: '/sales/view',
				text: 'View',
				icon: 'DeliveryView01',
			},
		},
	},
	customer: {
		id: 'customer',
		to: '/customer',
		text: 'Customer',
		icon: 'UserMultiple',
		subPages: {
			list: {
				id: 'list',
				to: '/customer/list',
				text: 'List',
				icon: 'UserList',
			},
			edit: {
				id: 'edit',
				to: '/customer/edit',
				text: 'Edit',
				icon: 'EditUser02',
			},
			view: {
				id: 'view',
				to: '/customer/view',
				text: 'View',
				icon: 'UserAccount',
			},
		},
	},
	products: {
		id: 'products',
		to: '/products',
		text: 'Products',
		icon: 'PackageOpen',
		subPages: {
			list: {
				id: 'list',
				to: '/products/list',
				text: 'List',
				icon: 'PackageSearch',
			},
			edit: {
				id: 'edit',
				to: '/products/edit',
				text: 'Edit',
				icon: 'Edit02',
			},
		},
	},
	projects: {
		id: 'projects',
		to: '/projects',
		text: 'Projects',
		icon: 'DashboardSquare03',
		subPages: {
			board: {
				id: 'board',
				to: '/projects/board',
				text: 'Board',
				icon: 'DashboardSquareSetting',
			},
			list: {
				id: 'list',
				to: '/projects/list',
				text: 'List',
				icon: 'ListView',
			},
			grid: {
				id: 'grid',
				to: '/projects/grid',
				text: 'Grid',
				icon: 'GridView',
			},
		},
	},
	invoices: {
		id: 'invoices',
		to: '/invoices',
		text: 'Invoices',
		icon: 'Invoice03',
		subPages: {
			list: {
				id: 'list',
				to: '/invoices/list',
				text: 'List',
				icon: 'Invoice02',
			},
			view: {
				id: 'view',
				to: '/invoices/view',
				text: 'View',
				icon: 'Invoice04',
			},
		},
	},
	mail: {
		id: 'mail',
		to: '/mail',
		text: 'Mail',
		icon: 'Mail01',
		subPages: {
			inbox: {
				id: 'inbox',
				to: '/mail/inbox',
				text: 'Inbox',
				icon: 'MailOpen01',
			},
			new: {
				id: 'new',
				to: '/mail/new',
				text: 'New',
				icon: 'MailEdit02',
			},
		},
	},
	chat: {
		id: 'chat',
		to: '/chat',
		text: 'Chat',
		icon: 'Message02',
	},
};
const pagesExamples: TPages = {
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
	notFound: {
		id: 'notFound',
		to: '/notFound',
		text: '404 Not Found',
		icon: 'HelpSquare',
	},
	underConstruction: {
		id: 'underConstruction',
		to: '/under-construction',
		text: 'Under Construction',
		icon: 'DashboardBrowsing',
	},
};

const auth = {
	login: pagesExamples.login,
	signup: pagesExamples.signup,
	forgotPassword: {
		id: 'forgotPassword',
		to: '/forgot-password',
		text: 'Forgot Password',
		icon: 'AiMail' as TIcons,
	},
	resetPassword: {
		id: 'resetPassword',
		to: '/reset-password',
		text: 'Reset Password',
		icon: 'AiLock' as TIcons,
	},
	verifyEmail: {
		id: 'verifyEmail',
		to: '/verify-email',
		text: 'Verify Email',
		icon: 'AiMail' as TIcons,
	},
	twoFactor: {
		id: 'twoFactor',
		to: '/two-factor',
		text: 'Two-Factor Auth',
		icon: 'AiSecurity01' as TIcons,
	},
	twoFactorSetup: {
		id: 'twoFactorSetup',
		to: '/two-factor-setup',
		text: '2FA Setup',
		icon: 'AiSecurity01' as TIcons,
	},
	magicLink: {
		id: 'magicLink',
		to: '/magic-link',
		text: 'Magic Link',
		icon: 'AiMail' as TIcons,
	},
	oauthCallback: {
		id: 'oauthCallback',
		to: '/oauth/callback',
		text: 'OAuth Callback',
		icon: 'Login03' as TIcons,
	},
	oauthComplete: {
		id: 'oauthComplete',
		to: '/oauth/complete',
		text: 'OAuth Complete',
		icon: 'Login03' as TIcons,
	},
	accountLocked: {
		id: 'accountLocked',
		to: '/account-locked',
		text: 'Account Locked',
		icon: 'AiLock' as TIcons,
	},
	sessionExpired: {
		id: 'sessionExpired',
		to: '/session-expired',
		text: 'Session Expired',
		icon: 'Clock01' as TIcons,
	},
};

const app = {
	id: 'app',
	to: '/app',
	text: 'App',
	icon: 'Home09' as TIcons,
	subPages: {
		dashboard: {
			id: 'dashboard',
			to: '/dashboard',
			text: 'Dashboard',
			icon: 'Home09' as TIcons,
		},
		workflows: {
			id: 'workflows',
			to: '/workflows',
			text: 'Workflows',
			icon: 'GitMerge' as TIcons,
		},
		agents: {
			id: 'agents',
			to: '/agents',
			text: 'Agents',
			icon: 'Robot01' as TIcons,
		},
		skills: {
			id: 'skills',
			to: '/skills',
			text: 'Skills',
			icon: 'Puzzle' as TIcons,
		},
		apps: {
			id: 'apps',
			to: '/integrations',
			text: 'Apps',
			icon: 'Plug01' as TIcons,
		},
		artifacts: {
			id: 'artifacts',
			to: '/artifacts',
			text: 'Artifacts',
			icon: 'FileDownload' as TIcons,
		},
		history: {
			id: 'history',
			to: '/history',
			text: 'History',
			icon: 'Clock01' as TIcons,
		},
		templates: {
			id: 'templates',
			to: '/templates',
			text: 'Templates',
			icon: 'Layers01' as TIcons,
		},
	},
};

const settings = {
	id: 'settings',
	to: '/settings',
	text: 'Settings',
	icon: 'Settings01' as TIcons,
	subPages: {
		profile: {
			id: 'profileSettings',
			to: '/settings/profile',
			text: 'Profile',
			icon: 'UserCircle' as TIcons,
		},
		workspace: {
			id: 'workspaceSettings',
			to: '/settings/workspace',
			text: 'Workspace Settings',
			icon: 'Settings01' as TIcons,
		},
		plan: {
			id: 'planSettings',
			to: '/settings/plan',
			text: 'Plan',
			icon: 'Layers01' as TIcons,
			subPages: {
				upgrade: {
					id: 'planUpgrade',
					to: '/settings/plan/upgrade',
					text: 'Upgrade',
					icon: 'Layers01' as TIcons,
				},
			},
		},
		usage: {
			id: 'usageSettings',
			to: '/settings/plan?tab=usage',
			text: 'Usage',
			icon: 'PieChart09' as TIcons,
		},
		billing: {
			id: 'billingSettings',
			to: '/settings/plan?tab=billing',
			text: 'Billing',
			icon: 'CreditCard' as TIcons,
			subPages: {
				credits: {
					id: 'billingCredits',
					to: '/settings/billing/credits',
					text: 'Buy Credits',
					icon: 'CreditCard' as TIcons,
				},
				history: {
					id: 'billingHistory',
					to: '/settings/billing/history',
					text: 'History',
					icon: 'BarChart3' as TIcons,
				},
			},
		},
		members: {
			id: 'membersSettings',
			to: '/settings/members',
			text: 'Members',
			icon: 'UserGroup' as TIcons,
		},
		secrets: {
			id: 'secretsSettings',
			to: '/settings/secrets',
			text: 'Secrets',
			icon: 'Lock' as TIcons,
		},
		notifications: {
			id: 'notificationsSettings',
			to: '/settings/notifications',
			text: 'Notifications',
			icon: 'Notification03' as TIcons,
		},
		notificationChannels: {
			id: 'notificationChannelsSettings',
			to: '/settings/notification-channels',
			text: 'Notification Channels',
			icon: 'Notification01' as TIcons,
		},
		environments: {
			id: 'environmentsSettings',
			to: '/settings/environments',
			text: 'Environments',
			icon: 'ServerStack01' as TIcons,
		},
	},
};

const editor = {
	id: 'editor',
	to: '/editor',
	text: 'Editor',
	icon: 'PencilEdit01' as TIcons,
	subPages: {
		addWorkflow: {
			id: 'addWorkflow',
			to: '/editor/add-workflow',
			text: 'Add Workflow',
			icon: 'PencilEdit01' as TIcons,
		},
		editWorkflow: {
			id: 'editWorkflow',
			to: '/editor/edit-workflow',
			text: 'Edit Workflow',
			icon: 'PencilEdit01' as TIcons,
		},
		viewWorkflow: {
			id: 'viewWorkflow',
			to: '/editor/view-workflow',
			text: 'View Workflow',
			icon: 'PencilEdit01' as TIcons,
		},
	},
};

const agent = {
	id: 'agent',
	to: '/agent',
	text: 'Agent',
	icon: 'Robot01' as TIcons,
	subPages: {
		addAgent: {
			id: 'addAgent',
			to: '/agent/add',
			text: 'Add Agent',
			icon: 'Robot01' as TIcons,
		},
		editAgent: {
			id: 'editAgent',
			to: '/agent/edit',
			text: 'Edit Agent',
			icon: 'Robot01' as TIcons,
		},
	},
};

const onboarding = {
	id: 'onboarding',
	to: '/onboarding',
	text: 'Onboarding',
	icon: 'Rocket01' as TIcons,
	subPages: {
		pricing: {
			id: 'pricing',
			to: '/pricing',
			text: 'Pricing',
			icon: 'CreditCard' as TIcons,
		},
		createWorkspace: {
			id: 'createWorkspace',
			to: '/onboarding/create-workspace',
			text: 'Create Workspace',
			icon: 'DashboardSquare03' as TIcons,
		},
		inviteTeam: {
			id: 'inviteTeam',
			to: '/onboarding/invite-team',
			text: 'Invite Team',
			icon: 'UserAdd01' as TIcons,
		},
		workspaceList: {
			id: 'workspaceList',
			to: '/workspaces',
			text: 'Workspaces',
			icon: 'DashboardSquare03' as TIcons,
		},
	},
};

const pages = {
	apps,
	app,
	auth,
	settings,
	editor,
	agent,
	onboarding,
	pagesExamples,
};

export default pages;
