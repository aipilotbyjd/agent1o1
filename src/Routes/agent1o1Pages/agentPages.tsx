import pages from '@/Routes/pages';
import { lazy } from 'react';

const AgentBuilderPage = lazy(() => import('@/pages/agent/AgentBuilder/AgentBuilder.page'));

const AgentPages = [
	{
		path: pages.agent.subPages.addAgent.to,
		element: <AgentBuilderPage />,
	},
	{
		path: `${pages.agent.subPages.editAgent.to}/:agentId`,
		element: <AgentBuilderPage />,
	},
];

export default AgentPages;
