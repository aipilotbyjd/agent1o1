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
const HistoryListPage = lazy(() => import('@/pages/coreapp/Trail/HistoryList.page'));
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
const VaultLayout = lazy(() => import('@/pages/coreapp/Vault/_layouts/Secrets.layout'));
const SecretsPage = lazy(() => import('@/pages/coreapp/Vault/Secrets.page'));

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
						element: <HistoryListPage />,
					},
				],
			},
			{
				path: workspacePages.skills.to,
				element: <SkillsLayout />,
				children: [
					{
						index: true,
						element: <SkillsListPage />,
					},
				],
			},
			{
				path: workspacePages.apps.to,
				element: <AppsLayout />,
				children: [
					{
						index: true,
						element: <AppsListPage />,
					},
				],
			},
			{
				path: workspacePages.knowledge.to,
				element: <KnowledgeLayout />,
				children: [
					{
						index: true,
						element: <KnowledgeListPage />,
					},
				],
			},
			{
				path: workspacePages.artifacts.to,
				element: <ArtifactsLayout />,
				children: [
					{
						index: true,
						element: <ArtifactsListPage />,
					},
				],
			},
			{
				path: workspacePages.blueprints.to,
				element: <BlueprintsLayout />,
				children: [
					{
						index: true,
						element: <BlueprintsListPage />,
					},
				],
			},
			{
				path: workspacePages.vault.to,
				element: <VaultLayout />,
				children: [
					{
						index: true,
						element: <SecretsPage />,
					},
				],
			},
		],
	},
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
