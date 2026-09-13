import { FC } from 'react';
import { useNavigate } from 'react-router';
import Card, { CardBody, CardHeader, CardHeaderChild, CardTitle } from '@/components/ui/Card';
import Table, { TBody, THead, Td, Th, Tr } from '@/components/ui/Table';
import Skeleton from '@/components/ui/Skeleton';
import Button from '@/components/ui/Button';
import EmptyState from '@/components/common/EmptyState';
import RunStatusBadge from '@/components/common/RunStatusBadge';
import { formatDuration, formatNumber, formatRelative, humanize } from '@/utils/format.util';
import type { TRun } from '@/types/run.type';

// ============================================================
// Recent Runs
// ------------------------------------------------------------
// The last five top-level runs, as the overview endpoint returns
// them — this is a glance, not a history. "View all" is the real
// listing, which is why there is no pagination here.
// ============================================================

interface IRecentRunsProps {
	runs?: TRun[];
	isLoading?: boolean;
}

const RecentRunsPart: FC<IRecentRunsProps> = ({ runs, isLoading = false }) => {
	const navigate = useNavigate();

	return (
		<Card className='h-full'>
			<CardHeader>
				<CardHeaderChild>
					<CardTitle>Recent runs</CardTitle>
				</CardHeaderChild>
				<CardHeaderChild>
					<Button variant='outline' color='zinc' onClick={() => navigate('/runs')}>
						View all
					</Button>
				</CardHeaderChild>
			</CardHeader>
			<CardBody className='overflow-x-auto'>
				{isLoading && (
					<div className='flex flex-col gap-3'>
						<Skeleton className='h-10 w-full' />
						<Skeleton className='h-10 w-full' />
						<Skeleton className='h-10 w-full' />
					</div>
				)}

				{!isLoading && !runs?.length && (
					<EmptyState
						icon='Activity03'
						title='No runs yet'
						description='Once a workflow or trigger fires, its runs show up here.'
					/>
				)}

				{!isLoading && !!runs?.length && (
					<Table className='w-full'>
						<THead>
							<Tr>
								<Th>Status</Th>
								<Th>Trigger</Th>
								<Th>Started</Th>
								<Th>Duration</Th>
								<Th className='text-right'>Credits</Th>
							</Tr>
						</THead>
						<TBody>
							{runs.map((run) => (
								<Tr
									key={run.id}
									className='cursor-pointer hover:bg-zinc-500/5'
									onClick={() => navigate(`/runs/${run.id}`)}>
									<Td>
										<RunStatusBadge status={run.status} />
									</Td>
									<Td className='text-sm text-zinc-500'>
										{humanize(run.trigger_type)}
									</Td>
									<Td className='text-sm text-zinc-500'>
										{formatRelative(run.started_at ?? run.created_at)}
									</Td>
									<Td className='text-sm'>{formatDuration(run.duration_ms)}</Td>
									<Td className='text-right text-sm'>
										{formatNumber(run.total_credits_used)}
									</Td>
								</Tr>
							))}
						</TBody>
					</Table>
				)}
			</CardBody>
		</Card>
	);
};

export default RecentRunsPart;
