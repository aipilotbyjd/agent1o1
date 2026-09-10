import pages from '@/Routes/pages';
import { lazy } from 'react';
import { Navigate } from 'react-router';

const DashboardLayout = lazy(() => import('@/pages/app/Dashboard/_layouts/Dashboard.layout'));
const DashboardPage = lazy(() => import('@/pages/app/Dashboard/Dashboard.page'));

const WorkflowsLayout = lazy(() => import('@/pages/app/Workflows/_layouts/Workflows.layout'));
const WorkflowsListPage = lazy(() => import('@/pages/app/Workflows/WorkflowsList.page'));

const AgentBuilderPage = lazy(() => import('@/pages/agent/AgentBuilder/AgentBuilder.page'));
const AgentsLayout = lazy(() => import('@/pages/app/Agents/_layouts/Agents.layout'));
const AgentsListPage = lazy(() => import('@/pages/app/Agents/AgentsList.page'));

const SkillsLayout = lazy(() => import('@/pages/app/Skills/_layouts/Skills.layout'));
const SkillsListPage = lazy(() => import('@/pages/app/Skills/SkillsList.page'));

const AppsLayout = lazy(() => import('@/pages/app/Apps/_layouts/Apps.layout'));
const AppsListPage = lazy(() => import('@/pages/app/Apps/AppsList.page'));

const ArtifactsLayout = lazy(() => import('@/pages/app/Artifacts/_layouts/Artifacts.layout'));
const ArtifactsListPage = lazy(() => import('@/pages/app/Artifacts/ArtifactsList.page'));

const HistoryLayout = lazy(() => import('@/pages/app/History/_layouts/History.layout'));
const HistoryListPage = lazy(() => import('@/pages/app/History/HistoryList.page'));

const TemplatesLayout = lazy(() => import('@/pages/app/Templates/_layouts/Templates.layout'));
const TemplatesCatalogPage = lazy(() => import('@/pages/app/Templates/TemplatesCatalog.page'));

const AppPages = [
	{
		path: pages.app.subPages.dashboard.to,
		element: <DashboardLayout />,
		children: [
			{
				path: pages.app.subPages.dashboard.to,
				element: <DashboardPage />,
			},
		],
	},
	{
		path: pages.app.subPages.workflows.to,
		element: <WorkflowsLayout />,
		children: [
			{
				path: pages.app.subPages.workflows.to,
				element: <WorkflowsListPage />,
			},
		],
	},
	{
		path: pages.app.subPages.agents.to,
		element: <AgentsLayout />,
		children: [
			{
				path: pages.app.subPages.agents.to,
				element: <AgentsListPage />,
			},
		],
	},
	{
		path: pages.app.subPages.skills.to,
		element: <SkillsLayout />,
		children: [
			{
				path: pages.app.subPages.skills.to,
				element: <SkillsListPage />,
			},
		],
	},
	{
		path: pages.app.subPages.apps.to,
		element: <AppsLayout />,
		children: [
			{
				path: pages.app.subPages.apps.to,
				element: <AppsListPage />,
			},
		],
	},
	{
		path: pages.app.subPages.artifacts.to,
		element: <ArtifactsLayout />,
		children: [
			{
				path: pages.app.subPages.artifacts.to,
				element: <ArtifactsListPage />,
			},
		],
	},
	{
		path: '/files',
		element: <Navigate to={pages.app.subPages.artifacts.to} replace />,
	},
	{
		path: pages.app.subPages.history.to,
		element: <HistoryLayout />,
		children: [
			{
				path: pages.app.subPages.history.to,
				element: <HistoryListPage />,
			},
		],
	},
	{
		path: pages.app.subPages.templates.to,
		element: <TemplatesLayout />,
		children: [
			{
				path: pages.app.subPages.templates.to,
				element: <TemplatesCatalogPage />,
			},
		],
	},
];

export default AppPages;
