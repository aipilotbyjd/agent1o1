import { AlarmClock } from 'lucide-react';
import type { TAgentMessageOrigin } from '@/types/agent.type';

/**
 * The task a scheduled follow-up runs (`AgentFollowUps::messageFor()` on the
 * backend): what follows the preamble the agent is sent with it.
 */
const followUpTask = (text: string) => {
	const start = text.indexOf('\n\n');
	return start === -1 ? text : text.slice(start + 2).trim();
};

/**
 * A follow-up the agent scheduled itself, shown where it ran in the
 * conversation: a marker, not a message the person sent. The agent's reply
 * to it follows as usual.
 */
const FollowUpMessage = ({
	origin,
	text,
	timestamp,
}: {
	origin: TAgentMessageOrigin;
	text: string;
	timestamp: string;
}) => (
	<div className='flex w-full justify-center'>
		<div className='w-full max-w-xl rounded-2xl border border-dashed border-zinc-300 bg-zinc-50/70 px-4 py-3 dark:border-zinc-700 dark:bg-zinc-900/40'>
			<div className='flex flex-wrap items-center gap-x-2 gap-y-1'>
				<AlarmClock size={14} className='text-primary-600 dark:text-primary-400 shrink-0' />
				<span className='text-[12.5px] font-black text-zinc-800 dark:text-zinc-100'>
					Scheduled follow-up
				</span>
				{origin.title && (
					<span className='min-w-0 truncate text-[12px] font-bold text-zinc-500 dark:text-zinc-400'>
						· {origin.title}
					</span>
				)}
				<span className='ml-auto text-[11px] font-semibold text-zinc-400'>{timestamp}</span>
			</div>
			<p className='mt-1.5 text-[12.5px] leading-relaxed font-semibold [overflow-wrap:anywhere] whitespace-pre-line text-zinc-600 dark:text-zinc-300'>
				{followUpTask(text)}
			</p>
		</div>
	</div>
);

export default FollowUpMessage;
