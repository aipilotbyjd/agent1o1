import { Link } from 'react-router';
import { ShieldCheck } from 'lucide-react';
import { useAgentActionInbox } from '@/api/modules/agent-actions';
import paths from '@/Routes/paths';

const prettify = (raw: string) => raw.replace(/[_-]+/g, ' ');

/**
 * Agent actions paused for a person — the agent-side counterpart of
 * `PendingApprovalsCard`. Hidden when nothing is waiting; deciding happens in
 * the Approvals inbox, where the full request (and editing it) fits.
 */
const PendingAgentActionsCard = ({ ws }: { ws: string }) => {
	const { data } = useAgentActionInbox(ws, { status: 'pending' });
	const actions = data?.actions ?? [];
	const total = data?.meta?.total ?? actions.length;

	if (actions.length === 0) return null;

	return (
		<div className='border-border-main bg-bg-card overflow-hidden rounded-3xl border shadow-sm'>
			<div className='border-border-main flex items-center justify-between border-b px-5 py-4.5'>
				<span className='text-text-main flex items-center gap-2 text-xs font-black tracking-widest uppercase'>
					<ShieldCheck size={13} className='text-amber-500' />
					Agents waiting on you
				</span>
				<span className='rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-black text-amber-600 dark:text-amber-400'>
					{total}
				</span>
			</div>
			<div className='divide-border-main divide-y'>
				{actions.slice(0, 5).map((action) => (
					<div
						key={action.id}
						className='flex items-center justify-between gap-3 px-5 py-3.5'>
						<div className='min-w-0'>
							<p className='text-text-main truncate text-xs font-bold'>
								{action.agent?.name ?? 'Agent'} wants to{' '}
								{prettify(action.tool_name)}
							</p>
							<p className='text-text-muted truncate text-[10px] font-semibold'>
								{action.reason?.detail ?? 'Waiting for a decision'}
							</p>
						</div>
					</div>
				))}
			</div>
			<Link
				to={paths.approvals(ws)}
				className='border-border-main text-primary-600 dark:text-primary-400 block border-t px-5 py-3 text-center text-xs font-black hover:underline'>
				Review in Approvals
			</Link>
		</div>
	);
};

export default PendingAgentActionsCard;
