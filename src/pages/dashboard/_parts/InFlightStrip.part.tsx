import { FC } from 'react';
import { useNavigate } from 'react-router';
import Card, { CardBody } from '@/components/ui/Card';
import Skeleton from '@/components/ui/Skeleton';
import RunStatusBadge from '@/components/common/RunStatusBadge';
import { formatNumber } from '@/utils/format.util';
import type { TInFlightCounts, TInFlightStatus } from '@/types/dashboard.type';

// ============================================================
// In-Flight Strip
// ------------------------------------------------------------
// Work happening right now. Deliberately not window-scoped — a run
// stuck since last week is the one an operator most needs to see,
// and a 7-day window would hide exactly the worst case.
//
// Each chip deep-links into the run list pre-filtered on that
// status, so the strip is a navigation surface, not just a readout.
// ============================================================

const ORDER: TInFlightStatus[] = ['running', 'awaiting_approval', 'awaiting_callback', 'pending'];

interface IInFlightStripProps {
	counts?: TInFlightCounts;
	isLoading?: boolean;
}

const InFlightStripPart: FC<IInFlightStripProps> = ({ counts, isLoading = false }) => {
	const navigate = useNavigate();
	const total = counts ? ORDER.reduce((sum, status) => sum + (counts[status] ?? 0), 0) : 0;

	return (
		<Card>
			<CardBody className='flex flex-wrap items-center gap-x-6 gap-y-3'>
				<div className='text-sm font-semibold'>
					In flight
					{!isLoading && <span className='ml-2 text-zinc-500'>{formatNumber(total)}</span>}
				</div>

				{isLoading && <Skeleton className='h-6 w-64' />}

				{!isLoading &&
					ORDER.map((status) => (
						<button
							key={status}
							type='button'
							className='flex items-center gap-2 rounded-lg px-1 py-0.5 hover:bg-zinc-500/10'
							onClick={() => navigate(`/runs?status=${status}`)}>
							<RunStatusBadge status={status} />
							<span className='text-sm font-medium'>
								{formatNumber(counts?.[status] ?? 0)}
							</span>
						</button>
					))}

				{!isLoading && total === 0 && (
					<span className='text-sm text-zinc-500'>Nothing running right now.</span>
				)}
			</CardBody>
		</Card>
	);
};

export default InFlightStripPart;
