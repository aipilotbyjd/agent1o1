import pages, { TPage } from '@/Routes/pages';

export type TNavSection = {
	/** Section heading; omit for an ungrouped run of items. */
	title?: string;
	/** Draw a line above the section, setting it apart from the rest. */
	divider?: boolean;
	items: TNavEntry[];
};

export type TNavEntry = TPage & {
	/** Render as a collapsible group with its `subPages` as children. */
	collapsible?: boolean;
	/** Match the route exactly. Off for items that own a subtree. */
	end?: boolean;
	/** Start a collapsible group open; it still opens on its own pages either way. */
	defaultOpen?: boolean;
};

const workspacePages = pages.workspace.subPages!;
const settingsPages = pages.settings.subPages!;

/**
 * Core-app sidebar. Order and grouping live here and nowhere else - adding a
 * page to the nav is a one-line change in this file.
 */
export const coreAppNavigation: TNavSection[] = [
	{
		items: [workspacePages.dashboard, workspacePages.assistant],
	},
	{
		title: 'Build',
		items: [
			workspacePages.playbooks,
			workspacePages.agents,
			workspacePages.pages,
			workspacePages.blueprints,
		],
	},
	{
		title: 'Connect',
		items: [
			workspacePages.apps,
			workspacePages.knowledge,
			workspacePages.skills,
			workspacePages.vault,
		],
	},
	{
		title: 'Monitor',
		items: [workspacePages.approvals, workspacePages.trail, workspacePages.artifacts],
	},
	{
		divider: true,
		items: [workspacePages.trash],
	},
];

/** Settings sidebar. Billing renders collapsed with its sub-pages nested under it. */
export const settingsNavigation: TNavSection[] = [
	{
		title: 'Account',
		items: [settingsPages.profile, settingsPages.security, settingsPages.notifications],
	},
	{
		title: 'Workspace',
		items: [
			settingsPages.workspace,
			settingsPages.members,
			settingsPages.tags,
			settingsPages.agentPolicy,
		],
	},
	{
		title: 'Integrations',
		items: [
			settingsPages.apiKeys,
			settingsPages.aiProviders,
			settingsPages.notificationChannels,
		],
	},
	{
		title: 'Billing',
		items: [
			{ ...settingsPages.billing, collapsible: true, defaultOpen: true },
			settingsPages.referrals,
		],
	},
];
