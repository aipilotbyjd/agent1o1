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

const workspace: TPage = {
	id: 'workspace',
	to: '/:workspaceId',
	text: 'Workspace',
	icon: 'Home09',
	subPages: {
		dashboard: {
			id: 'dashboard',
			to: '/:workspaceId/dashboard',
			text: 'Dashboard',
			icon: 'Home09',
			subPages: {
				runStats: {
					id: 'runStats',
					to: '/:workspaceId/dashboard/run-stats',
					text: 'Run Stats',
					icon: 'DashboardSquareSetting',
				},
				creditUsage: {
					id: 'creditUsage',
					to: '/:workspaceId/dashboard/credit-usage',
					text: 'Credit Usage',
					icon: 'PieChart09',
				},
				pendingApprovals: {
					id: 'pendingApprovals',
					to: '/:workspaceId/dashboard/pending-approvals',
					text: 'Pending Approvals',
					icon: 'CheckmarkBadge01',
				},
			},
		},
		playbooks: {
			id: 'playbooks',
			to: '/:workspaceId/playbooks',
			text: 'Playbooks',
			icon: 'GitMerge',
		},
		agents: {
			id: 'agents',
			to: '/:workspaceId/agents',
			text: 'Agents',
			icon: 'Robot01',
		},
		activity: {
			id: 'activity',
			to: '/:workspaceId/activity',
			text: 'Activity',
			icon: 'Clock01',
		},
		skills: {
			id: 'skills',
			to: '/:workspaceId/skills',
			text: 'Skills',
			icon: 'Puzzle',
		},
		connections: {
			id: 'connections',
			to: '/:workspaceId/connections',
			text: 'Connections',
			icon: 'Plug01',
		},
		vault: {
			id: 'vault',
			to: '/:workspaceId/vault',
			text: 'Vault',
			icon: 'Lock',
		},
		artifacts: {
			id: 'artifacts',
			to: '/:workspaceId/artifacts',
			text: 'Artifacts',
			icon: 'FileDownload',
		},
		blueprints: {
			id: 'blueprints',
			to: '/:workspaceId/blueprints',
			text: 'Blueprints',
			icon: 'Layers01',
		},
	},
};

const playbookEditor: TPage = {
	id: 'playbookEditor',
	to: '/:workspaceId/playbooks/editor',
	text: 'Playbook Editor',
	icon: 'PencilEdit01',
	subPages: {
		add: {
			id: 'addPlaybook',
			to: '/:workspaceId/playbooks/new',
			text: 'New Playbook',
			icon: 'PencilEdit01',
		},
		edit: {
			id: 'editPlaybook',
			to: '/:workspaceId/playbooks/edit',
			text: 'Edit Playbook',
			icon: 'PencilEdit01',
		},
		view: {
			id: 'viewPlaybook',
			to: '/:workspaceId/playbooks/view',
			text: 'View Playbook',
			icon: 'PencilEdit01',
		},
	},
};

const agentEditor: TPage = {
	id: 'agentEditor',
	to: '/:workspaceId/agents/editor',
	text: 'Agent Editor',
	icon: 'Robot01',
	subPages: {
		add: {
			id: 'addAgent',
			to: '/:workspaceId/agents/new',
			text: 'Add Agent',
			icon: 'Robot01',
		},
		edit: {
			id: 'editAgent',
			to: '/:workspaceId/agents/edit',
			text: 'Edit Agent',
			icon: 'Robot01',
		},
	},
};

const workspaceSettings: TPage = {
	id: 'workspaceSettings',
	to: '/:workspaceId/settings',
	text: 'Settings',
	icon: 'Settings01',
	subPages: {
		workspace: {
			id: 'workspaceGeneralSettings',
			to: '/:workspaceId/settings/workspace',
			text: 'Workspace',
			icon: 'Settings01',
		},
		members: {
			id: 'membersSettings',
			to: '/:workspaceId/settings/members',
			text: 'Members',
			icon: 'UserGroup',
		},
		plan: {
			id: 'planSettings',
			to: '/:workspaceId/settings/plan',
			text: 'Plan',
			icon: 'Layers01',
			subPages: {
				upgrade: {
					id: 'planUpgrade',
					to: '/:workspaceId/settings/plan/upgrade',
					text: 'Upgrade',
					icon: 'Layers01',
				},
			},
		},
		billing: {
			id: 'billingSettings',
			to: '/:workspaceId/settings/billing',
			text: 'Billing',
			icon: 'CreditCard',
			subPages: {
				credits: {
					id: 'billingCredits',
					to: '/:workspaceId/settings/billing/credits',
					text: 'Buy Credits',
					icon: 'CreditCard',
				},
				history: {
					id: 'billingHistory',
					to: '/:workspaceId/settings/billing/history',
					text: 'History',
					icon: 'Clock01',
				},
			},
		},
		creditNotifications: {
			id: 'creditNotificationsSettings',
			to: '/:workspaceId/settings/credit-notifications',
			text: 'Credit Notifications',
			icon: 'Notification03',
		},
		environments: {
			id: 'environmentsSettings',
			to: '/:workspaceId/settings/environments',
			text: 'Environments',
			icon: 'ServerStack01',
		},
		apiKeys: {
			id: 'apiKeysSettings',
			to: '/:workspaceId/settings/api-keys',
			text: 'API Keys',
			icon: 'Lock',
		},
	},
};

const settings: TPage = {
	id: 'settings',
	to: '/settings',
	text: 'Settings',
	icon: 'Settings01',
	subPages: {
		profile: {
			id: 'profileSettings',
			to: '/settings/profile',
			text: 'Profile',
			icon: 'UserCircle',
		},
		notifications: {
			id: 'notificationsSettings',
			to: '/settings/notifications',
			text: 'Notifications',
			icon: 'Notification01',
		},
	},
};

const auth: TPages = {
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
};

const onboarding: TPage = {
	id: 'onboarding',
	to: '/onboarding',
	text: 'Onboarding',
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
		workspaceList: {
			id: 'workspaceList',
			to: '/workspaces',
			text: 'Workspaces',
			icon: 'DashboardSquare03',
		},
	},
};

const pages = {
	workspace,
	playbookEditor,
	agentEditor,
	workspaceSettings,
	settings,
	auth,
	onboarding,
};

export default pages;
