import { useEffect } from 'react';
import {
	ArrowLeft,
	BarChart2,
	FlaskConical,
	Gauge,
	History,
	LineChart,
	MessageSquare,
	Sparkles,
} from 'lucide-react';
import { useNavigate, useParams, useSearchParams } from 'react-router';
import { useAgent } from '@/api/modules/agents';
import paths from '@/Routes/paths';
import { useAgentChatStore } from '@/store/agentChat.store';
import AgentRunsPanel from './AgentBuilder/Build/_partial/AgentRunsPanel.partial';
import AgentAnalyticsPanel from './AgentBuilder/Build/_partial/AgentAnalyticsPanel.partial';
import AgentEvalsPanel from './AgentBuilder/Build/_partial/AgentEvalsPanel.partial';
import AgentEvaluationsPanel from './AgentBuilder/Build/_partial/AgentEvaluationsPanel.partial';
import AgentReflectionsPanel from './AgentBuilder/Build/_partial/AgentReflectionsPanel.partial';

export const INSIGHT_TABS = [
	{ id: 'runs', label: 'Runs', icon: History },
	{ id: 'analytics', label: 'Analytics', icon: BarChart2 },
	{ id: 'evals', label: 'Evals', icon: FlaskConical },
	{ id: 'grading', label: 'Grading', icon: Gauge },
	{ id: 'reflections', label: 'Reflections', icon: Sparkles },
] as const;

export type TInsightTab = (typeof INSIGHT_TABS)[number]['id'];

/** How the agent is doing: its run history, usage, tests, chat grading and self-review. */
const AgentInsightsPage = () => {
	const navigate = useNavigate();
	const { workspaceId = '', agentId = '' } = useParams<{
		workspaceId: string;
		agentId: string;
	}>();
	const [searchParams, setSearchParams] = useSearchParams();
	const requestedTab = searchParams.get('tab');
	const tab: TInsightTab = INSIGHT_TABS.some(({ id }) => id === requestedTab)
		? (requestedTab as TInsightTab)
		: 'runs';

	const { data: agent, isLoading } = useAgent(workspaceId, agentId);
	const setChatAgentId = useAgentChatStore((state) => state.setAgentId);

	useEffect(() => {
		setChatAgentId(agentId || null);
	}, [agentId, setChatAgentId]);

	return (
		<div className='flex min-h-0 flex-1 flex-col overflow-hidden bg-zinc-50/60 dark:bg-zinc-950'>
			<header className='shrink-0 border-b border-zinc-200 bg-white/95 px-4 pt-3 backdrop-blur-xl sm:px-6 dark:border-white/10 dark:bg-zinc-950/95'>
				<div className='mx-auto flex w-full max-w-6xl items-center gap-3'>
					<button
						type='button'
						onClick={() => navigate(paths.editAgent(workspaceId, agentId))}
						aria-label='Back to agent'
						className='flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900 dark:border-white/10 dark:bg-white/[0.03] dark:text-zinc-400 dark:hover:bg-white/[0.07] dark:hover:text-white'>
						<ArrowLeft size={18} />
					</button>

					<div className='bg-primary-400/15 text-primary-600 dark:text-primary-400 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl'>
						<LineChart size={19} />
					</div>
					<div className='min-w-0 flex-1'>
						<h1 className='truncate text-base font-black text-zinc-950 sm:text-lg dark:text-white'>
							Insights
						</h1>
						<p className='truncate text-xs font-semibold text-zinc-500 dark:text-zinc-400'>
							{isLoading ? 'Loading agent…' : (agent?.name ?? 'Agent')}
						</p>
					</div>

					<button
						type='button'
						onClick={() => navigate(paths.editAgent(workspaceId, agentId))}
						className='hidden h-10 items-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 text-xs font-bold text-zinc-700 transition hover:bg-zinc-100 sm:flex dark:border-white/10 dark:bg-white/[0.03] dark:text-zinc-300 dark:hover:bg-white/[0.07]'>
						<MessageSquare size={15} /> Back to chat
					</button>
				</div>

				<nav className='no-scrollbar mx-auto mt-3 flex w-full max-w-6xl gap-5 overflow-x-auto text-xs font-black'>
					{INSIGHT_TABS.map(({ id, label, icon: Icon }) => (
						<button
							key={id}
							type='button'
							onClick={() => setSearchParams({ tab: id }, { replace: true })}
							className={`flex shrink-0 items-center gap-1.5 border-b-2 pb-3 transition ${
								tab === id
									? 'border-primary-400 text-zinc-950 dark:text-white'
									: 'border-transparent text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200'
							}`}>
							<Icon size={14} />
							{label}
						</button>
					))}
				</nav>
			</header>

			<main className='min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-6 sm:py-8'>
				<section className='mx-auto w-full max-w-6xl rounded-3xl border border-zinc-200 bg-white p-4 shadow-sm sm:p-6 dark:border-white/10 dark:bg-zinc-900/70'>
					{tab === 'runs' && <AgentRunsPanel ws={workspaceId} agentId={agentId} />}
					{tab === 'analytics' && <AgentAnalyticsPanel ws={workspaceId} agentId={agentId} />}
					{tab === 'evals' && <AgentEvalsPanel ws={workspaceId} agentId={agentId} />}
					{tab === 'grading' && <AgentEvaluationsPanel ws={workspaceId} agentId={agentId} />}
					{tab === 'reflections' && (
						<AgentReflectionsPanel ws={workspaceId} agentId={agentId} displayMode='page' />
					)}
				</section>
			</main>
		</div>
	);
};

export default AgentInsightsPage;
