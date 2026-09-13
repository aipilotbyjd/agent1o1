import { FC } from 'react';
import classNames from 'classnames';
import RunStatusBadge from '@/components/common/RunStatusBadge';
import EmptyState from '@/components/common/EmptyState';
import { formatDuration, formatNumber } from '@/utils/format.util';
import type { TNodeRun } from '@/types/run.type';

// ============================================================
// Node Run Timeline
// ------------------------------------------------------------
// Each step of a run in execution order, as the run detail
// endpoint already returns them — no extra request to draw the
// list, only to open one.
//
// `attempt` is surfaced whenever it is above 1: a node that
// succeeded on its third try looks identical to a clean one
// otherwise, and that difference is usually the whole reason
// somebody opened this run.
// ============================================================

interface INodeRunTimelineProps {
	nodeRuns?: TNodeRun[];
	selectedId?: string | null;
	onSelect: (nodeRun: TNodeRun) => void;
}

const NodeRunTimelinePart: FC<INodeRunTimelineProps> = ({ nodeRuns, selectedId, onSelect }) => {
	if (!nodeRuns?.length) {
		return (
			<EmptyState
				icon='WorkflowSquare10'
				title='No steps recorded'
				description='This run has not executed a node yet.'
			/>
		);
	}

	return (
		<ol className='flex flex-col'>
			{nodeRuns.map((nodeRun, index) => (
				<li key={nodeRun.id} className='relative flex gap-3'>
					{/* The connector stops at the last row so the line doesn't
					    trail past the end of the list. */}
					<div className='flex flex-col items-center'>
						<span className='mt-4 size-2 shrink-0 rounded-full bg-zinc-500/50' />
						{index < nodeRuns.length - 1 && (
							<span className='w-px grow bg-zinc-500/25' />
						)}
					</div>

					<button
						type='button'
						onClick={() => onSelect(nodeRun)}
						className={classNames(
							'my-1 flex w-full cursor-pointer flex-col gap-1 rounded-xl px-3 py-2 text-start transition-colors',
							selectedId === nodeRun.id ? 'bg-zinc-500/15' : 'hover:bg-zinc-500/5',
						)}>
						<div className='flex items-center justify-between gap-2'>
							<span className='truncate font-medium'>{nodeRun.key}</span>
							<RunStatusBadge status={nodeRun.status} withIcon={false} />
						</div>
						<div className='flex flex-wrap items-center gap-2 text-xs text-zinc-500'>
							<span>{nodeRun.type}</span>
							<span>·</span>
							<span>{formatDuration(nodeRun.duration_ms)}</span>
							{nodeRun.credits_used ? (
								<>
									<span>·</span>
									<span>{formatNumber(nodeRun.credits_used)} credits</span>
								</>
							) : null}
							{nodeRun.attempt > 1 && (
								<>
									<span>·</span>
									<span className='text-amber-500'>attempt {nodeRun.attempt}</span>
								</>
							)}
						</div>
					</button>
				</li>
			))}
		</ol>
	);
};

export default NodeRunTimelinePart;
