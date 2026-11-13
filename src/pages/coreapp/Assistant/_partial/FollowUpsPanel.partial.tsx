import dayjs from 'dayjs';
import { X } from 'lucide-react';
import { useAssistantFollowUps, useCancelAssistantFollowUp } from '@/api/modules/assistant';
import type { TAssistantFollowUp } from '@/types/assistant.type';

const SETTLED_LABEL: Record<Exclude<TAssistantFollowUp['status'], 'pending'>, string> = {
	replied: 'Replied',
	reminded: 'No reply, reminded you',
	cancelled: 'Stopped',
};

/** Email threads the assistant is watching for a reply, and a way to stop watching. */
const FollowUpsPanelPartial = ({ workspaceId }: { workspaceId: string }) => {
	const { data: followUps = [], isLoading } = useAssistantFollowUps(workspaceId);
	const cancel = useCancelAssistantFollowUp(workspaceId);

	const waiting = followUps.filter((followUp) => followUp.status === 'pending');
	const settled = followUps.filter((followUp) => followUp.status !== 'pending').slice(0, 5);

	return (
		<div className='flex flex-col gap-2'>
			<p className='px-2 text-xs font-semibold tracking-wide text-zinc-400 uppercase'>
				Waiting for a reply
			</p>
			{isLoading ? null : followUps.length === 0 ? (
				<p className='px-2 text-xs text-zinc-500'>
					{'Nothing yet. Ask me to follow up on an email and I will remind you.'}
				</p>
			) : (
				<ul className='flex flex-col gap-1'>
					{waiting.map((followUp) => (
						<li
							key={followUp.id}
							className='group flex items-start gap-2 rounded-lg px-2 py-1 text-xs text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-white/5'>
							<span className='min-w-0 flex-1'>
								<span className='block truncate font-semibold'>
									{followUp.subject || 'Email thread'}
								</span>
								<span className='text-zinc-400'>
									{`Remind ${dayjs(followUp.remind_at).format('ddd, MMM D')}`}
								</span>
								{followUp.note ? (
									<span className='block truncate text-zinc-500'>
										{followUp.note}
									</span>
								) : null}
							</span>
							<button
								type='button'
								onClick={() => cancel.mutate(followUp.id)}
								disabled={cancel.isPending}
								aria-label='Stop watching this thread'
								title='Stop watching this thread'
								className='text-zinc-400 opacity-0 group-hover:opacity-100 hover:text-red-500 focus:opacity-100'>
								<X className='h-3.5 w-3.5' />
							</button>
						</li>
					))}
					{settled.map((followUp) => (
						<li key={followUp.id} className='px-2 py-1 text-xs text-zinc-400'>
							<span className='block truncate'>
								{followUp.subject || 'Email thread'}
							</span>
							{SETTLED_LABEL[followUp.status as keyof typeof SETTLED_LABEL]}
						</li>
					))}
				</ul>
			)}
		</div>
	);
};

export default FollowUpsPanelPartial;
