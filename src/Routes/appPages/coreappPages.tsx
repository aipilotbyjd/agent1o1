import { lazy } from 'react';
import { Navigate } from 'react-router';
import CoreAppLayout from '@/layouts/CoreApp.layout';
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
const PlaybooksLayout = lazy(() => import('@/pages/coreapp/Playbooks/_layouts/Playbooks.layout'));
const AgentsLayout = lazy(() => import('@/pages/coreapp/Agents/_layouts/Agents.layout'));
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
						element: <UnderConstructionPage />,
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
						element: <UnderConstructionPage />,
					},
					{
						path: playbookEditorPages.add.to,
						element: <UnderConstructionPage />,
					},
					{
						path: playbookEditorPages.edit.to,
						element: <UnderConstructionPage />,
					},
					{
						path: playbookEditorPages.view.to,
						element: <UnderConstructionPage />,
					},
				],
			},
			{
				path: workspacePages.agents.to,
				element: <AgentsLayout />,
				children: [
					{
						index: true,
						element: <UnderConstructionPage />,
					},
					{
						path: agentEditorPages.add.to,
						element: <UnderConstructionPage />,
					},
					{
						path: agentEditorPages.edit.to,
						element: <UnderConstructionPage />,
					},
				],
			},
			{
				// The run/activity trail.
				path: workspacePages.activity.to,
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
				// Connected apps / integrations.
				path: workspacePages.connections.to,
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
];

export default CoreAppPages;
