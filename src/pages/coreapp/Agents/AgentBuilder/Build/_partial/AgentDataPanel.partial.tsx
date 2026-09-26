import { useState, useEffect } from 'react';
import { Database, Brain, GitBranch } from 'lucide-react';
import AgentKnowledgePanel from './AgentKnowledgePanel.partial';
import AgentMemoryPanel from './AgentMemoryPanel.partial';
import AgentVersionsPanel from './AgentVersionsPanel.partial';
import { useAgentBuilderStore, type TAgentDataSection } from '@/store/agentBuilder.store';

type TProps = {
	ws: string;
	agentId?: string;
};

const SECTIONS: { id: TAgentDataSection; label: string; icon: typeof Database }[] = [
	{ id: 'knowledge', label: 'Knowledge', icon: Database },
	{ id: 'memory', label: 'Memory', icon: Brain },
	{ id: 'versions', label: 'Versions', icon: GitBranch },
];

/**
 * What the agent knows and has been: its knowledge base, persistent memory
 * and version history. How it is performing lives on the Insights page.
 */
const AgentDataPanel = ({ ws, agentId }: TProps) => {
	const [section, setSection] = useState<TAgentDataSection>('knowledge');

	// The aside can ask for a specific section (see agentBuilder.store.ts); honour
	// it once, then clear so re-renders don't drag the user back here.
	const requestedSection = useAgentBuilderStore((state) => state.requestedDataSection);
	const clearRequestedSection = useAgentBuilderStore((state) => state.clearRequestedDataSection);
	useEffect(() => {
		if (!requestedSection) return;
		setSection(requestedSection);
		clearRequestedSection();
	}, [requestedSection, clearRequestedSection]);

	return (
		<div className='flex-1 overflow-y-auto bg-zinc-50/40 dark:bg-zinc-950/20'>
			{/* Segmented sub-nav */}
			<div className='sticky top-0 z-10 grid grid-cols-3 gap-1 border-b border-zinc-200 bg-white/90 p-2 backdrop-blur dark:border-white/10 dark:bg-zinc-900/90'>
				{SECTIONS.map(({ id, label, icon: Icon }) => (
					<button
						key={id}
						onClick={() => setSection(id)}
						className={`flex items-center justify-center gap-1.5 rounded-lg px-2 py-1.5 text-[10px] font-black transition ${
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
				{section === 'versions' && <AgentVersionsPanel ws={ws} agentId={agentId} />}
			</div>
		</div>
	);
};

export default AgentDataPanel;
