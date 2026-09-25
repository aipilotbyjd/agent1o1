import pages from '@/Routes/pages';

type TParams = Record<string, string | number | undefined>;

/**
 * Fills `:param` placeholders in a page template. Missing values are left in
 * place rather than silently producing `/undefined/`, so a bad call is visible
 * in the URL bar instead of 404-ing somewhere unrelated.
 */
export const buildPath = (template: string, params: TParams = {}) =>
	Object.entries(params).reduce(
		(path, [key, value]) =>
			value === undefined || value === '' ? path : path.replace(`:${key}`, String(value)),
		template,
	);

/**
 * Substitutes just the workspace id. For components that resolve the id
 * themselves - from a shell-store fallback, or the `?ws=` param on the Stripe
 * callbacks - and so cannot use `useResolvePath`.
 */
export const withWorkspace = (to: string, workspaceId: string) => buildPath(to, { workspaceId });

const workspacePages = pages.workspace.subPages!;
const playbookEditorPages = pages.playbookEditor.subPages!;
const agentEditorPages = pages.agentEditor.subPages!;
const settingsPages = pages.settings.subPages!;
const billingPages = settingsPages.billing.subPages!;

/** Named builders for every path that carries a param beyond the workspace id. */
const paths = {
	workspace: (workspaceId: string) => buildPath(pages.workspace.to, { workspaceId }),
	dashboard: (workspaceId: string) => buildPath(workspacePages.dashboard.to, { workspaceId }),

	playbooks: (workspaceId: string) => buildPath(workspacePages.playbooks.to, { workspaceId }),
	newPlaybook: (workspaceId: string) => buildPath(playbookEditorPages.add.to, { workspaceId }),
	editPlaybook: (workspaceId: string, workflowId: string | number) =>
		buildPath(playbookEditorPages.edit.to, { workspaceId, workflowId }),
	viewPlaybook: (workspaceId: string, workflowId: string | number) =>
		buildPath(playbookEditorPages.view.to, { workspaceId, workflowId }),

	agents: (workspaceId: string) => buildPath(workspacePages.agents.to, { workspaceId }),
	newAgent: (workspaceId: string) => buildPath(agentEditorPages.add.to, { workspaceId }),
	editAgent: (workspaceId: string, agentId: string | number) =>
		buildPath(agentEditorPages.edit.to, { workspaceId, agentId }),
	agentInsights: (workspaceId: string, agentId: string | number, tab?: string) =>
		buildPath(agentEditorPages.insights.to, { workspaceId, agentId }) + (tab ? `?tab=${tab}` : ''),

	apps: (workspaceId: string) => buildPath(workspacePages.apps.to, { workspaceId }),
	trail: (workspaceId: string, runId?: string) =>
		buildPath(workspacePages.trail.to, { workspaceId }) + (runId ? `?run=${runId}` : ''),

	settings: (workspaceId: string) => buildPath(pages.settings.to, { workspaceId }),
	members: (workspaceId: string) => buildPath(settingsPages.members.to, { workspaceId }),
	notificationSettings: (workspaceId: string) =>
		buildPath(settingsPages.notifications.to, { workspaceId }),
	billing: (workspaceId: string) => buildPath(settingsPages.billing.to, { workspaceId }),
	billingPlans: (workspaceId: string) => buildPath(billingPages.plans.to, { workspaceId }),
	billingCredits: (workspaceId: string) => buildPath(billingPages.credits.to, { workspaceId }),
	billingUsage: (workspaceId: string) => buildPath(billingPages.usage.to, { workspaceId }),
};

export default paths;
