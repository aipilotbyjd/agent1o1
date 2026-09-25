import { Loader2, MessageSquare } from 'lucide-react';
import { useAgentSessions } from '@/api/modules/agents';

type TProps = {
	ws: string;
	agentId?: string;
	activeSessionId: string | null;
	onOpen: (sessionId: string) => void;
};

/** Every chat with this agent, newest first, with its size and last activity. */
const AgentChatsPanel = ({ ws, agentId, activeSessionId, onOpen }: TProps) => {
	const { data: sessions, isLoading } = useAgentSessions(ws, agentId ?? '');

	if (!agentId) {
		return (
			<p className='px-1 py-8 text-center text-[11px] font-semibold text-zinc-400 dark:text-zinc-500'>
				Save the agent first to see its chats.
			</p>
		);
	}

	if (isLoading) {
		return (
			<div className='flex items-center justify-center gap-2 py-10 text-xs font-semibold text-zinc-400'>
				<Loader2 size={14} className='animate-spin' /> Loading chats…
			</div>
		);
	}

	if (!sessions?.length) {
		return (
			<div className='flex flex-col items-center gap-2 py-12 text-center'>
				<MessageSquare size={22} className='text-zinc-300 dark:text-zinc-600' />
				<p className='text-xs font-bold text-zinc-600 dark:text-zinc-300'>No chats yet</p>
				<p className='text-[11px] font-semibold text-zinc-400 dark:text-zinc-500'>
					Send the agent a message to start one.
				</p>
			</div>
		);
	}

	return (
		<ul className='space-y-2'>
			{sessions.map((session) => {
				const isActive = String(session.id) === String(activeSessionId);
				return (
					<li key={session.id}>
						<button
							type='button'
							onClick={() => onOpen(session.id)}
							className={`flex w-full items-start gap-3 rounded-xl border p-3 text-left transition ${
								isActive
									? 'border-primary-500/40 bg-primary-400/10'
									: 'border-zinc-200 bg-white hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900/40 dark:hover:bg-zinc-800/60'
							}`}>
							<MessageSquare size={14} className='text-primary-500 mt-0.5 shrink-0' />
							<div className='min-w-0 flex-1'>
								<p className='truncate text-xs font-black text-zinc-800 dark:text-zinc-100'>
									{session.title?.trim() || 'Untitled chat'}
								</p>
								<p className='mt-0.5 text-[10px] font-semibold text-zinc-400 dark:text-zinc-500'>
									{session.messages_count ?? 0}{' '}
									{session.messages_count === 1 ? 'message' : 'messages'} · Last
									active{' '}
									{new Date(
										session.last_activity_at ?? session.created_at,
									).toLocaleString()}
								</p>
							</div>
							{isActive && (
								<span className='bg-primary-400 text-primary-950 shrink-0 rounded-full px-2 py-0.5 text-[9px] font-black'>
									Open
								</span>
							)}
						</button>
					</li>
				);
			})}
		</ul>
	);
};

export default AgentChatsPanel;
