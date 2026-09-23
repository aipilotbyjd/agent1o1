import { lazy } from 'react';
import { Navigate, RouteObject } from 'react-router';
import WorkspaceGuardLayout from '@/layouts/WorkspaceGuard.layout';
import CoreAppLayout from '@/layouts/CoreApp.layout';
import AgentLayout from '@/layouts/Agent.layout';
import pages, { editorRedirects, relativeToWorkspace } from '@/Routes/pages';
import WorkspaceRedirect from '@/Routes/redirects';
import SettingsPages from '@/Routes/appPages/settingsPages';

const workspacePages = pages.workspace.subPages!;
const playbookEditorPages = pages.playbookEditor.subPages!;
const agentEditorPages = pages.agentEditor.subPages!;

/** Children of `/:workspaceId` are registered relative to it. */
const rel = relativeToWorkspace;

const DashboardLayout = lazy(() => import('@/pages/coreapp/Dashboard/_layouts/Dashboard.layout'));
const DashboardPage = lazy(() => import('@/pages/coreapp/Dashboard/Dashboard.page'));
const PlaybooksLayout = lazy(() => import('@/pages/coreapp/Playbooks/_layouts/Playbooks.layout'));
const WorkflowsListPage = lazy(() => import('@/pages/coreapp/Playbooks/WorkflowsList.page'));
const WorkflowEditorPage = lazy(
	() => import('@/pages/coreapp/Playbooks/WorkflowEditor/WorkflowEditor.page'),
);
const AgentsLayout = lazy(() => import('@/pages/coreapp/Agents/_layouts/Agents.layout'));
const AgentsListPage = lazy(() => import('@/pages/coreapp/Agents/AgentsList.page'));
const AgentBuilderPage = lazy(
	() => import('@/pages/coreapp/Agents/AgentBuilder/AgentBuilder.page'),
);
const AgentReflectionsPage = lazy(() => import('@/pages/coreapp/Agents/AgentReflections.page'));
const TrailLayout = lazy(() => import('@/pages/coreapp/Trail/_layouts/Trail.layout'));
const TrailListPage = lazy(() => import('@/pages/coreapp/Trail/TrailList.page'));
const SkillsLayout = lazy(() => import('@/pages/coreapp/Skills/_layouts/Skills.layout'));
const SkillsListPage = lazy(() => import('@/pages/coreapp/Skills/SkillsList.page'));
const AppsLayout = lazy(() => import('@/pages/coreapp/Apps/_layouts/Apps.layout'));
const AppsListPage = lazy(() => import('@/pages/coreapp/Apps/AppsList.page'));
const KnowledgeLayout = lazy(() => import('@/pages/coreapp/Knowledge/_layouts/Knowledge.layout'));
const KnowledgeListPage = lazy(() => import('@/pages/coreapp/Knowledge/KnowledgeList.page'));
const ArtifactsLayout = lazy(() => import('@/pages/coreapp/Artifacts/_layouts/Artifacts.layout'));
const ArtifactsListPage = lazy(() => import('@/pages/coreapp/Artifacts/ArtifactsList.page'));
const BlueprintsLayout = lazy(
	() => import('@/pages/coreapp/Blueprints/_layouts/Blueprints.layout'),
);
const BlueprintsListPage = lazy(() => import('@/pages/coreapp/Blueprints/BlueprintsList.page'));
const VaultLayout = lazy(() => import('@/pages/coreapp/Vault/_layouts/Vault.layout'));
const SecretsPage = lazy(() => import('@/pages/coreapp/Vault/Secrets.page'));

/**
 * The dashboard sub-tab URLs (`/run-stats`, `/credit-usage`, `/pending-approvals`)
 * are gone; anything still pointing at one lands on the dashboard rather than the
 * global 404. Relative, so it resolves against `/:workspaceId/dashboard`.
 */
const dashboardRoute: RouteObject = {
	path: rel(workspacePages.dashboard.to),
	element: <DashboardLayout />,
	children: [
		{ index: true, element: <DashboardPage /> },
		{ path: '*', element: <WorkspaceRedirect to={workspacePages.dashboard.to} /> },
	],
};

/** List pages: each gets its own layout wrapper, rendered inside the core-app shell. */
const listRoutes: RouteObject[] = (
	[
		[workspacePages.playbooks.to, <PlaybooksLayout />, <WorkflowsListPage />],
		[workspacePages.agents.to, <AgentsLayout />, <AgentsListPage />],
		[workspacePages.blueprints.to, <BlueprintsLayout />, <BlueprintsListPage />],
		[workspacePages.skills.to, <SkillsLayout />, <SkillsListPage />],
		[workspacePages.apps.to, <AppsLayout />, <AppsListPage />],
		[workspacePages.knowledge.to, <KnowledgeLayout />, <KnowledgeListPage />],
		[workspacePages.vault.to, <VaultLayout />, <SecretsPage />],
		[workspacePages.trail.to, <TrailLayout />, <TrailListPage />],
		[workspacePages.artifacts.to, <ArtifactsLayout />, <ArtifactsListPage />],
	] as const
).map(([to, layout, page]) => ({
	path: rel(to),
	element: layout,
	children: [{ index: true, element: page }],
}));

/**
 * Full-screen editors. They share the `/:workspaceId` guard but deliberately sit
 * outside CoreAppLayout so the sidebar and header do not render around them.
 */
const editorRoutes: RouteObject[] = [
	{ path: rel(playbookEditorPages.add.to), element: <WorkflowEditorPage /> },
	{ path: rel(playbookEditorPages.edit.to), element: <WorkflowEditorPage /> },
	{ path: rel(playbookEditorPages.view.to), element: <WorkflowEditorPage /> },
	{
		element: <AgentLayout />,
		children: [
			{ path: rel(agentEditorPages.add.to), element: <AgentBuilderPage /> },
			{ path: rel(agentEditorPages.edit.to), element: <AgentBuilderPage /> },
			{ path: rel(agentEditorPages.reflections.to), element: <AgentReflectionsPage /> },
		],
	},
	// Pre-normalisation editor URLs (`playbooks/edit/:id`), kept resolvable.
	...editorRedirects.map(({ from, to }) => ({
		path: rel(from),
		element: <WorkspaceRedirect to={to} />,
	})),
];

const CoreAppPages: RouteObject[] = [
	{
		path: pages.workspace.to,
		element: <WorkspaceGuardLayout />,
		children: [
			{
				element: <CoreAppLayout />,
				children: [
					{
						index: true,
						element: <Navigate to={rel(workspacePages.dashboard.to)} replace />,
					},
					dashboardRoute,
					...listRoutes,
				],
			},
			...SettingsPages,
			...editorRoutes,
		],
	},
];

export default CoreAppPages;
