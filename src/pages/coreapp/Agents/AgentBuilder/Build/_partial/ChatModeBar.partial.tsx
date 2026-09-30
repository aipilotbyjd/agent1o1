import { FlaskConical, ShieldCheck } from 'lucide-react';
import { useUpdateAgentSession } from '@/api/modules/agents';
import { AUTONOMY_MODES, AUTONOMY_MODE_META, type TAutonomyMode } from '@/types/agent-action.type';
import type { TAgent, TAgentSession } from '@/types/agent.type';

/**
 * How the open conversation may act, above the transcript: its mode (the
 * agent's, or this chat's own override) and whether Test run is on. Anyone who
 * can chat may make a conversation stricter; loosening it past the agent is
 * refused by the backend unless you may manage the agent.
 */
const ChatModeBar = ({
	ws,
	agent,
	session,
	disabled,
}: {
	ws: string;
	agent: TAgent;
	session: TAgentSession;
	disabled?: boolean;
}) => {
	const updateSession = useUpdateAgentSession(ws, agent.id);
	const override = session.autonomy_mode ?? null;
	// `ask` is the backend's default for an agent that predates modes.
	const agentMode: TAutonomyMode = agent.autonomy_mode ?? 'ask';
	const mode: TAutonomyMode = override ?? agentMode;
	const testRun = session.test_mode ?? agent.test_mode;

	return (
		<div className='flex flex-wrap items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400'>
			<ShieldCheck size={13} className='shrink-0' />
			<span className='min-w-0 flex-1 truncate'>{AUTONOMY_MODE_META[mode].description}</span>
			{testRun && (
				<span className='flex items-center gap-1 rounded-md bg-violet-50 px-1.5 py-0.5 font-bold text-violet-700 dark:bg-violet-950/60 dark:text-violet-300'>
					<FlaskConical size={11} /> Test run
				</span>
			)}
			<label className='sr-only' htmlFor={`chat-mode-${session.id}`}>
				Mode for this chat
			</label>
			<select
				id={`chat-mode-${session.id}`}
				value={override ?? ''}
				disabled={disabled || updateSession.isPending}
				onChange={(event) =>
					updateSession.mutate({
						id: session.id,
						body: {
							autonomy_mode: (event.target.value || null) as TAutonomyMode | null,
						},
					})
				}
				className='min-h-8 rounded-lg border border-zinc-200 bg-white px-2 text-[11px] font-bold text-zinc-700 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-200'>
				<option value=''>Agent's mode ({AUTONOMY_MODE_META[agentMode].label})</option>
				{AUTONOMY_MODES.map((option) => (
					<option key={option} value={option}>
						{AUTONOMY_MODE_META[option].label} in this chat
					</option>
				))}
			</select>
		</div>
	);
};

export default ChatModeBar;
