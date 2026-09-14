import pages from '@/Routes/pages';
import { lazy } from 'react';

// ============================================================
// Agent builder routes
// ------------------------------------------------------------
// pages/agent/AgentBuilder is not ported onto the current API yet —
// see the note in editorPages.tsx.
// ============================================================
const AgentBuilderPage = lazy(() => import('@/pages/UnderConstruction.page'));

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
