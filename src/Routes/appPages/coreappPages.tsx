import { lazy } from 'react';
import { Navigate } from 'react-router';
import CoreAppLayout from '@/layouts/CoreApp.layout';
import AgentLayout from '@/layouts/Agent.layout';
import UnderConstructionPage from '@/pages/UnderConstruction.page';
import pages, { TPages } from '@/Routes/pages';

const workspacePages = pages.workspace.subPages as TPages;
const dashboardPages = workspacePages.dashboard.subPages as TPages;
const playbookEditorPages = pages.playbookEditor.subPages as TPages;
const agentEditorPages = pages.agentEditor.subPages as TPages;

/** `/:workspaceId/dashboard` -> `dashboard`, so the redirect below stays relative to the
 *  matched workspace instead of navigating to the literal `:workspaceId` segment. */
const dashboardRelativePath = workspacePages.dashboard.to.replace(`${pages.workspace.to}/`, '');

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
const TrailLayout = lazy(() => import('@/pages/coreapp/Trail/_layouts/Trail.layout'));
const SkillsLayout = lazy(() => import('@/pages/coreapp/Skills/_layouts/Skills.layout'));
const AppsLayout = lazy(() => import('@/pages/coreapp/Apps/_layouts/Apps.layout'));
const KnowledgeLayout = lazy(() => import('@/pages/coreapp/Knowledge/_layouts/Knowledge.layout'));
const ArtifactsLayout = lazy(() => import('@/pages/coreapp/Artifacts/_layouts/Artifacts.layout'));
const BlueprintsLayout = lazy(
	() => import('@/pages/coreapp/Blueprints/_layouts/Blueprints.layout'),
);

/**
 * Workspace scoped routes (`/:workspaceId/...`).
 *
 * Every screen lives under `CoreAppLayout` (aside + wrapper + suspense) and, where the
 * feature folder ships one, under its own `_layouts` shell from `@/pages/coreapp/*`.
 *
 * The leaf elements are `UnderConstructionPage` placeholders on purpose: the feature
 * folders under `@/pages/coreapp` only hold layouts so far. Swap each placeholder for the
 * real `*.page.tsx` as it lands - the paths stay owned by `@/Routes/pages`.
 */
const CoreAppPages = [
	{
		path: pages.workspace.to,
		element: <CoreAppLayout />,
		children: [
			{
				index: true,
				element: <Navigate to={dashboardRelativePath} replace />,
			},
			{
				path: workspacePages.dashboard.to,
				element: <DashboardLayout />,
				children: [
					{
						index: true,
						element: <DashboardPage />,
					},
					{
						path: dashboardPages.runStats.to,
						element: <UnderConstructionPage />,
					},
					{
						path: dashboardPages.creditUsage.to,
						element: <UnderConstructionPage />,
					},
					{
						path: dashboardPages.pendingApprovals.to,
						element: <UnderConstructionPage />,
					},
				],
			},
			{
				path: workspacePages.playbooks.to,
				element: <PlaybooksLayout />,
				children: [
					{
						index: true,
						element: <WorkflowsListPage />,
					},
				],
			},
			{
				path: workspacePages.agents.to,
				element: <AgentsLayout />,
				children: [
					{
						index: true,
						element: <AgentsListPage />,
					},
				],
			},
			{
				path: workspacePages.trail.to,
				element: <TrailLayout />,
				children: [
					{
						index: true,
						element: <UnderConstructionPage />,
					},
				],
			},
			{
				path: workspacePages.skills.to,
				element: <SkillsLayout />,
				children: [
					{
						index: true,
						element: <UnderConstructionPage />,
					},
				],
			},
			{
				path: workspacePages.apps.to,
				element: <AppsLayout />,
				children: [
					{
						index: true,
						element: <UnderConstructionPage />,
					},
				],
			},
			{
				path: workspacePages.knowledge.to,
				element: <KnowledgeLayout />,
				children: [
					{
						index: true,
						element: <UnderConstructionPage />,
					},
				],
			},
			{
				path: workspacePages.artifacts.to,
				element: <ArtifactsLayout />,
				children: [
					{
						index: true,
						element: <UnderConstructionPage />,
					},
				],
			},
			{
				path: workspacePages.blueprints.to,
				element: <BlueprintsLayout />,
				children: [
					{
						index: true,
						element: <UnderConstructionPage />,
					},
				],
			},
			{
				// No feature shell yet - rendered straight into the core app layout.
				path: workspacePages.vault.to,
				element: <UnderConstructionPage />,
			},
		],
	},
	/**
	 * Same reasoning as the agent builder below: the workflow editor renders its own
	 * full-height shell (canvas + topbar + panels) and must not sit inside the core
	 * app layout. It carries no wrapper element of its own - the page mounts
	 * `WorkflowEditorLayout` itself, exactly as `editorPages` did in the old frontend.
	 */
	{
		path: playbookEditorPages.add.to,
		element: <WorkflowEditorPage />,
	},
	{
		path: `${playbookEditorPages.edit.to}/:workflowId`,
		element: <WorkflowEditorPage />,
	},
	{
		path: `${playbookEditorPages.view.to}/:workflowId`,
		element: <WorkflowEditorPage />,
	},
	{
		/**
		 * The builder is a sibling of `CoreAppLayout`, not a child: it ships its own
		 * full-height shell (AgentAside + app bar) and must not render the core app
		 * aside alongside it. Mirrors `agentPages` in the old frontend, which sat
		 * outside the app layout for the same reason. Paths still carry the
		 * `:workspaceId` prefix, so `useParams` resolves the workspace as before.
		 */
		element: <AgentLayout />,
		children: [
			{
				path: agentEditorPages.add.to,
				element: <AgentBuilderPage />,
			},
			{
				path: `${agentEditorPages.edit.to}/:agentId`,
				element: <AgentBuilderPage />,
			},
		],
	},
];

export default CoreAppPages;
