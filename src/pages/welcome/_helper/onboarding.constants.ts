import type { TWorkspaceRole } from '@/types/workspace.type';
import type { TOnboardingStepKey } from '@/types/onboarding.type';
import type { IRoleData } from '../_types/onboarding.type';
import { WORKSPACE_ROLE_LABELS } from '@/constants/workspaceRole.constant';

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
	{
		value: 'admin',
		label: WORKSPACE_ROLE_LABELS.admin,
		description: 'Manage workspace and teammates',
	},
	{
		value: 'editor',
		label: WORKSPACE_ROLE_LABELS.editor,
		description: 'Build and publish workflows',
	},
	{
		value: 'member',
		label: WORKSPACE_ROLE_LABELS.member,
		description: 'Run workflows and collaborate',
	},
	{
		value: 'viewer',
		label: WORKSPACE_ROLE_LABELS.viewer,
		description: 'View workflows and activity',
	},
];

/**
 * Screen order, which is also the backend's (`OnboardingStep`): the two steps
 * that set the account up come first, the optional ones after, and the profile
 * picture last because nothing else depends on it.
 */
export const ONBOARDING_STEP_KEYS: TOnboardingStepKey[] = [
	'create_workspace',
	'role_selection',
	'choose_plan',
	'connect_ai',
	'connect_apps',
	'invite_team',
	'discovery_survey',
	'profile_picture',
];

export const STEP_LABELS: Record<TOnboardingStepKey, string> = {
	create_workspace: 'Create Workspace',
	role_selection: 'Role Selection',
	choose_plan: 'Choose Plan',
	connect_ai: 'Connect AI',
	connect_apps: 'Connect Apps',
	invite_team: 'Invite Team',
	discovery_survey: 'Discovery Survey',
	profile_picture: 'Profile Picture',
};

export const TOTAL_STEPS = ONBOARDING_STEP_KEYS.length;
