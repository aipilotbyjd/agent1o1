import type { TWorkspaceRole } from '@/types/workspace.type';
import type { IRoleData, IPlan } from '../_types/onboarding.type';

export const ROLES: IRoleData[] = [
	{
		name: 'Sales',
		description: 'Personalize agents with CRM and messaging platforms.',
		apps: ['salesforce', 'slack', 'gmail', 'hubspot', 'apollo'],
	},
	{
		name: 'Marketing',
		description: 'Automate content workflows and marketing metrics.',
		apps: ['tiktok', 'youtube', 'instagram', 'x (twitter)', 'google analytics'],
	},
	{
		name: 'Operations',
		description: 'Connect search and spreadsheets for productivity.',
		apps: ['airtable', 'google sheets', 'slack', 'google drive', 'notion'],
	},
	{
		name: 'Support',
		description: 'Integrate tools for fast tickets response.',
		apps: ['zendesk', 'gmail', 'slack', 'notion', 'stripe'],
	},
	{
		name: 'Engineering',
		description: 'Power up dev workflows, code runner and git systems.',
		apps: ['github', 'slack', 'vercel', 'jira', 'google drive'],
	},
	{
		name: 'Product',
		description: 'Manage task-boards and documents smoothly.',
		apps: ['notion', 'figma', 'slack', 'jira', 'google sheets'],
	},
	{
		name: 'Security',
		description: 'Handle logins, logs and notifications.',
		apps: ['github', 'slack', 'google drive', 'notion', 'airtable'],
	},
	{
		name: 'HR',
		description: 'Onboard team members and schedule calendars.',
		apps: ['notion', 'slack', 'gmail', 'google sheets', 'google drive'],
	},
	{
		name: 'Legal',
		description: 'Streamline contracts and files databases.',
		apps: ['google drive', 'notion', 'gmail', 'slack', 'github'],
	},
	{
		name: 'Finance',
		description: 'Sync invoice systems with data sheets.',
		apps: ['stripe', 'google sheets', 'slack', 'gmail', 'airtable'],
	},
];

export const SURVEY_OPTIONS: { value: string; label: string }[] = [
	{ value: 'google_search', label: 'Google search' },
	{ value: 'ai_search', label: 'ChatGPT / Claude / Perplexity' },
	{ value: 'youtube', label: 'YouTube' },
	{ value: 'x_twitter', label: 'X / Twitter' },
	{ value: 'linkedin', label: 'LinkedIn' },
	{ value: 'tiktok_instagram', label: 'TikTok / Instagram' },
	{ value: 'community', label: 'Reddit / Hacker News / Slack community' },
	{ value: 'referral', label: 'Friend or colleague' },
	{ value: 'newsletter', label: 'Newsletter or blog post' },
	{ value: 'podcast', label: 'Podcast' },
	{ value: 'other', label: 'Other' },
];

export const ROLE_OPTIONS: { value: TWorkspaceRole; label: string; description: string }[] = [
	{ value: 'admin', label: 'Admin', description: 'Manage workspace and teammates' },
	{ value: 'editor', label: 'Editor', description: 'Build and publish workflows' },
	{ value: 'member', label: 'Member', description: 'Run workflows and collaborate' },
	{ value: 'viewer', label: 'Viewer', description: 'View workflows and activity' },
];

export const PLANS: IPlan[] = [
	{
		id: 'free',
		name: 'Free',
		price: '$0',
		period: 'forever',
		features: ['3 active workflows', '1 workspace', '500 runs / month', '2 connected apps'],
	},
	{
		id: 'pro',
		name: 'Pro',
		price: '$29',
		period: '/ month',
		features: [
			'Unlimited workflows',
			'10,000 runs / month',
			'Unlimited apps',
			'Priority support',
		],
		badge: 'Most Popular',
		highlighted: true,
	},
	{
		id: 'business',
		name: 'Business',
		price: '$79',
		period: '/ month',
		features: [
			'Everything in Pro',
			'100,000 runs / month',
			'Team roles & SSO',
			'Dedicated support',
		],
	},
];

export const STEP_LABELS = [
	'Profile Picture',
	'Create Workspace',
	'Invite Team',
	'Role Selection',
	'Choose Plan',
	'Connect Apps',
	'Discovery Survey',
];

export const TOTAL_STEPS = STEP_LABELS.length;
