import { useEffect } from 'react';
import { ArrowLeft, Bot, Settings2, Sparkles } from 'lucide-react';
import { useNavigate, useParams } from 'react-router';
import { useAgent } from '@/api/modules/agents';
import paths from '@/Routes/paths';
import { useAgentChatStore } from '@/store/agentChat.store';
import AgentReflectionsPanel from './AgentBuilder/Build/_partial/AgentReflectionsPanel.partial';

const AgentReflectionsPage = () => {
	const navigate = useNavigate();
	const { workspaceId = '', agentId = '' } = useParams<{
		workspaceId: string;
		agentId: string;
	}>();
	const { data: agent, isLoading } = useAgent(workspaceId, agentId);
	const setChatAgentId = useAgentChatStore((state) => state.setAgentId);

	useEffect(() => {
		setChatAgentId(agentId || null);
	}, [agentId, setChatAgentId]);

	return (
		<div className='flex min-h-0 flex-1 flex-col overflow-hidden bg-zinc-50/60 dark:bg-zinc-950'>
			<header className='shrink-0 border-b border-zinc-200 bg-white/95 px-4 py-3 backdrop-blur-xl sm:px-6 dark:border-white/10 dark:bg-zinc-950/95'>
				<div className='mx-auto flex w-full max-w-6xl items-center gap-3'>
					<button
						type='button'
						onClick={() => navigate(paths.editAgent(workspaceId, agentId))}
						aria-label='Back to agent'
						className='flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900 dark:border-white/10 dark:bg-white/[0.03] dark:text-zinc-400 dark:hover:bg-white/[0.07] dark:hover:text-white'>
						<ArrowLeft size={18} />
					</button>

					<div className='bg-primary-400/15 text-primary-600 dark:text-primary-400 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl'>
						<Sparkles size={19} />
					</div>
					<div className='min-w-0 flex-1'>
						<h1 className='truncate text-base font-black text-zinc-950 sm:text-lg dark:text-white'>
							Reflections
						</h1>
						<p className='truncate text-xs font-semibold text-zinc-500 dark:text-zinc-400'>
							{isLoading ? 'Loading agent…' : (agent?.name ?? 'Agent')}
						</p>
					</div>

					<button
						type='button'
						onClick={() => navigate(paths.editAgent(workspaceId, agentId))}
						className='hidden h-10 items-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 text-xs font-bold text-zinc-700 transition hover:bg-zinc-100 sm:flex dark:border-white/10 dark:bg-white/[0.03] dark:text-zinc-300 dark:hover:bg-white/[0.07]'>
						<Settings2 size={15} /> Configure agent
					</button>
				</div>
			</header>

			<main className='min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-6 sm:py-8'>
				<div className='mx-auto w-full max-w-6xl'>
					<section className='border-primary-200/60 from-primary-400/10 dark:border-primary-500/20 dark:from-primary-400/10 mb-5 overflow-hidden rounded-3xl border bg-linear-to-br via-white to-white p-5 sm:p-7 dark:via-zinc-900 dark:to-zinc-900'>
						<div className='flex items-start gap-4'>
							<div className='text-primary-400 hidden h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-zinc-950 sm:flex dark:border dark:border-white/10 dark:bg-zinc-900'>
								<Bot size={22} />
							</div>
							<div>
								<h2 className='text-xl font-black tracking-tight text-zinc-950 dark:text-white'>
									Improve your agent from real conversations
								</h2>
								<p className='mt-1 max-w-3xl text-sm leading-relaxed font-medium text-zinc-500 dark:text-zinc-400'>
									Review proposed prompt changes, skills, and insights. Apply
									useful suggestions, dismiss the rest, or run a review manually.
								</p>
							</div>
						</div>
					</section>

					<section className='rounded-3xl border border-zinc-200 bg-white p-4 shadow-sm sm:p-6 dark:border-white/10 dark:bg-zinc-900/70'>
						<AgentReflectionsPanel
							ws={workspaceId}
							agentId={agentId}
							displayMode='page'
						/>
					</section>
				</div>
			</main>
		</div>
	);
};

export default AgentReflectionsPage;
