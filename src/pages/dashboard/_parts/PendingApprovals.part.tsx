import { FC } from 'react';
import { Link } from 'react-router';
import { useQueryClient } from '@tanstack/react-query';
import { useDecideRunApproval } from '@/api/modules/runs';
import { dashboardKeys } from '@/api/modules/dashboard';
import { runKeys } from '@/api/modules/runs';
import Card, { CardBody, CardHeader, CardHeaderChild, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Skeleton from '@/components/ui/Skeleton';
import EmptyState from '@/components/common/EmptyState';
import { formatSeconds, formatRelative } from '@/utils/format.util';
import type { TPendingApproval } from '@/types/dashboard.type';

// ============================================================
// Pending Approvals
// ------------------------------------------------------------
// The work queue behind the overview's `pending_approvals` count.
// Oldest first, because the run blocked longest is the one to
// unblock — and never window-scoped, so an approval nobody has
// actioned since last month still shows up today.
//
// One row is one component so each can own its own decide
// mutation: `useDecideRunApproval` is keyed by run id, and a
// single shared mutation would have to be re-created per click.
// ============================================================

interface IApprovalRowProps {
	ws: string;
	approval: TPendingApproval;
}

const ApprovalRow: FC<IApprovalRowProps> = ({ ws, approval }) => {
	const queryClient = useQueryClient();
	const decide = useDecideRunApproval(ws, approval.run_id);

	const onDecide = async (decision: 'approve' | 'reject') => {
		await decide.mutateAsync({ approvalId: approval.id, body: { decision } });
		// The hook refreshes the run it belongs to; the dashboard's own
		// count and queue are separate reads and have to be told too.
		await Promise.all([
			queryClient.invalidateQueries({ queryKey: dashboardKeys.all(ws) }),
			queryClient.invalidateQueries({ queryKey: runKeys.lists(ws) }),
		]);
	};

	const workflowName = approval.run?.workflow?.name ?? 'Untitled workflow';

	return (
		<div className='flex flex-wrap items-center justify-between gap-3 border-b border-zinc-500/15 py-3 last:border-0'>
			<div className='min-w-0'>
				<Link
					to={`/runs/${approval.run_id}`}
					className='block truncate font-medium hover:underline'>
					{workflowName}
				</Link>
				<div className='mt-1 flex flex-wrap items-center gap-2 text-xs text-zinc-500'>
					{approval.node && (
						<Badge color='zinc' variant='soft' rounded='rounded-full'>
							{approval.node.key}
						</Badge>
					)}
					<span>waiting {formatSeconds(approval.waiting_seconds)}</span>
					<span>·</span>
					<span>{formatRelative(approval.requested_at)}</span>
				</div>
			</div>

			<div className='flex shrink-0 gap-2'>
				<Button
					variant='outline'
					color='red'
					isDisable={decide.isPending}
					onClick={() => onDecide('reject')}>
					Reject
				</Button>
				<Button
					variant='solid'
					color='emerald'
					isLoading={decide.isPending}
					isDisable={decide.isPending}
					onClick={() => onDecide('approve')}>
					Approve
				</Button>
			</div>
		</div>
	);
};

interface IPendingApprovalsProps {
	ws: string;
	approvals?: TPendingApproval[];
	isLoading?: boolean;
}

const PendingApprovalsPart: FC<IPendingApprovalsProps> = ({ ws, approvals, isLoading = false }) => (
	<Card className='h-full'>
		<CardHeader>
			<CardHeaderChild>
				<CardTitle>Pending approvals</CardTitle>
			</CardHeaderChild>
			<CardHeaderChild>
				{!isLoading && !!approvals?.length && (
					<Badge color='amber' variant='soft' rounded='rounded-full'>
						{approvals.length} waiting
					</Badge>
				)}
			</CardHeaderChild>
		</CardHeader>
		<CardBody>
			{isLoading && (
				<div className='flex flex-col gap-3'>
					<Skeleton className='h-12 w-full' />
					<Skeleton className='h-12 w-full' />
				</div>
			)}

			{!isLoading && !approvals?.length && (
				<EmptyState
					icon='UserCheck01'
					title='Nothing waiting on you'
					description='Runs paused by a human-approval node will queue up here.'
				/>
			)}

			{!isLoading &&
				approvals?.map((approval) => (
					<ApprovalRow key={approval.id} ws={ws} approval={approval} />
				))}
		</CardBody>
	</Card>
);

export default PendingApprovalsPart;
