import { useState } from 'react';
import { Database, Brain, History, BarChart2 } from 'lucide-react';
import AgentKnowledgePanel from './AgentKnowledgePanel.partial';
import AgentMemoryPanel from './AgentMemoryPanel.partial';
import AgentRunsPanel from './AgentRunsPanel.partial';
import AgentAnalyticsPanel from './AgentAnalyticsPanel.partial';

type TDataSection = 'knowledge' | 'memory' | 'runs' | 'analytics';

type TProps = {
	ws: string;
	agentId?: string;
};

const SECTIONS: { id: TDataSection; label: string; icon: typeof Database }[] = [
	{ id: 'knowledge', label: 'Knowledge', icon: Database },
	{ id: 'memory', label: 'Memory', icon: Brain },
	{ id: 'runs', label: 'Runs', icon: History },
	{ id: 'analytics', label: 'Analytics', icon: BarChart2 },
];

/**
 * Container for the agent's data-layer features — knowledge base, persistent
 * memory, run history, and usage analytics — behind a compact segmented nav.
 */
const AgentDataPanel = ({ ws, agentId }: TProps) => {
	const [section, setSection] = useState<TDataSection>('knowledge');

	return (
		<div className='flex-1 overflow-y-auto bg-zinc-50/40 dark:bg-zinc-950/20'>
			{/* Segmented sub-nav */}
			<div className='sticky top-0 z-10 flex gap-1 border-b border-zinc-200 bg-white/90 p-2 backdrop-blur dark:border-white/10 dark:bg-zinc-900/90'>
				{SECTIONS.map(({ id, label, icon: Icon }) => (
					<button
						key={id}
						onClick={() => setSection(id)}
						className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-2 py-1.5 text-[10px] font-black transition ${
							section === id
								? 'bg-primary-400/10 text-primary-600 dark:bg-primary-400/10 dark:text-primary-400'
								: 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300'
						}`}>
						<Icon size={13} />
						<span>{label}</span>
					</button>
				))}
			</div>

			<div className='p-4'>
				{section === 'knowledge' && <AgentKnowledgePanel ws={ws} agentId={agentId} />}
				{section === 'memory' && <AgentMemoryPanel ws={ws} agentId={agentId} />}
				{section === 'runs' && <AgentRunsPanel ws={ws} agentId={agentId} />}
				{section === 'analytics' && <AgentAnalyticsPanel ws={ws} agentId={agentId} />}
			</div>
		</div>
	);
};

export default AgentDataPanel;
