import { FC } from 'react';
import classNames from 'classnames';
import Icon from '@/components/icon/Icon';
import Popover from '@/components/ui/Popover';
import { useRunCost } from '@/api/modules/runs';
import RunCostDetails from './RunCostDetails';

interface IRunCostBadgeProps {
	workspaceId: string;
	runId: string;
	className?: string;
}

/**
 * The running credit cost of a chat turn or workflow run, for a chat or run
 * header. Updates live while the run is in progress; click it for the
 * line-by-line breakdown.
 */
const RunCostBadge: FC<IRunCostBadgeProps> = ({ workspaceId, runId, className }) => {
	const { data: cost, isLoading } = useRunCost(workspaceId, runId);

	if (isLoading || !cost) {
		return null;
	}

	return (
		<Popover placement='bottom-end' content={<RunCostDetails cost={cost} className='w-80' />}>
			<button
				type='button'
				aria-label={`This run has cost ${cost.credits} credits. Show the breakdown.`}
				className={classNames(
					'inline-flex items-center gap-1.5 rounded-full border border-zinc-500/25 px-2.5 py-1 text-sm tabular-nums hover:bg-zinc-500/10',
					className,
				)}>
				<Icon icon='Coins01' size='text-base' />
				<span>{cost.credits.toLocaleString()}</span>
				{cost.in_progress && (
					<span className='relative flex h-2 w-2' aria-hidden='true'>
						<span className='absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75 motion-reduce:animate-none' />
						<span className='relative inline-flex h-2 w-2 rounded-full bg-emerald-500' />
					</span>
				)}
			</button>
		</Popover>
	);
};

export default RunCostBadge;
