import type { TWorkspaceRole } from '@/types/workspace.type';
import type { TOnboardingStepKey } from '@/types/onboarding.type';
import { WORKSPACE_ROLE_LABELS } from '@/constants/workspaceRole.constant';

/**
 * The apps the preview panel shows for each job role, keyed by the role value
 * the API serves. Decoration only: the roles themselves, and their wording,
 * come from the API.
 */
export const ROLE_APPS: Record<string, string[]> = {
	sales: ['salesforce', 'slack', 'gmail', 'hubspot', 'apollo'],
	marketing: ['tiktok', 'youtube', 'instagram', 'x (twitter)', 'google analytics'],
	operations: ['airtable', 'google sheets', 'slack', 'google drive', 'notion'],
	support: ['zendesk', 'gmail', 'slack', 'notion', 'stripe'],
	engineering: ['github', 'slack', 'vercel', 'jira', 'google drive'],
	product: ['notion', 'figma', 'slack', 'jira', 'google sheets'],
	security: ['github', 'slack', 'google drive', 'notion', 'airtable'],
	hr: ['notion', 'slack', 'gmail', 'google sheets', 'google drive'],
	legal: ['google drive', 'notion', 'gmail', 'slack', 'github'],
	finance: ['stripe', 'google sheets', 'slack', 'gmail', 'airtable'],
};

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
