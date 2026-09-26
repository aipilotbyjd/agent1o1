import pages, { TPage } from '@/Routes/pages';

export type TNavSection = {
	/** Section heading; omit for an ungrouped run of items. */
	title?: string;
	items: TNavEntry[];
};

export type TNavEntry = TPage & {
	/** Render as a collapsible group with its `subPages` as children. */
	collapsible?: boolean;
	/** Match the route exactly. Off for items that own a subtree. */
	end?: boolean;
};

const workspacePages = pages.workspace.subPages!;
const settingsPages = pages.settings.subPages!;

/**
 * Core-app sidebar. Order and grouping live here and nowhere else - adding a
 * page to the nav is a one-line change in this file.
 */
export const coreAppNavigation: TNavSection[] = [
	{
		title: 'Overview',
		items: [workspacePages.dashboard],
	},
	{
		title: 'Automate',
		items: [workspacePages.playbooks, workspacePages.agents, workspacePages.blueprints],
	},
	{
		title: 'Resources',
		items: [
			workspacePages.skills,
			workspacePages.apps,
			workspacePages.knowledge,
			workspacePages.vault,
		],
	},
	{
		title: 'Activity',
		items: [workspacePages.trail, workspacePages.artifacts],
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
			settingsPages.apiKeys,
			settingsPages.notificationChannels,
		],
	},
	{
		title: 'Billing',
		items: [{ ...settingsPages.billing, collapsible: true }],
	},
];
