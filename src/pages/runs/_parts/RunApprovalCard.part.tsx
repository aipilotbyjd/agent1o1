import { FC, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { usePendingApprovals, dashboardKeys } from '@/api/modules/dashboard';
import { useDecideRunApproval, runKeys } from '@/api/modules/runs';
import Card, { CardBody } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Textarea from '@/components/form/Textarea';
import Icon from '@/components/icon/Icon';
import { formatSeconds } from '@/utils/format.util';

// ============================================================
// Run Approval Card
// ------------------------------------------------------------
// The approve/reject action for a run paused on a HumanApproval
// node.
//
// The approval id has to come from the dashboard's pending queue:
// `GET /runs/{run}` returns the run and its node runs but no
// approvals, so that queue is the only endpoint that lists them
// (its own docblock says as much). We therefore pull a page of
// pending approvals and pick the one belonging to this run.
//
// That page is capped, so a workspace with more pending approvals
// than `LOOKUP_PER_PAGE` could fail to find this run's — in which
// case the card renders nothing rather than a broken button, and
// the dashboard queue remains the way to action it. Worth
// replacing with a per-run approvals endpoint when one exists.
// ============================================================

const LOOKUP_PER_PAGE = 100;

interface IRunApprovalCardProps {
	ws: string;
	runId: string;
}

const RunApprovalCardPart: FC<IRunApprovalCardProps> = ({ ws, runId }) => {
	const queryClient = useQueryClient();
	const { data } = usePendingApprovals(ws, { per_page: LOOKUP_PER_PAGE });
	const decide = useDecideRunApproval(ws, runId);
	const [message, setMessage] = useState('');

	const approval = data?.approvals.find((item) => String(item.run_id) === String(runId));

	if (!approval) return null;

	const onDecide = async (decision: 'approve' | 'reject') => {
		await decide.mutateAsync({
			approvalId: approval.id,
			body: { decision, message: message.trim() || null },
		});
		await Promise.all([
			queryClient.invalidateQueries({ queryKey: runKeys.detail(ws, runId) }),
			queryClient.invalidateQueries({ queryKey: dashboardKeys.all(ws) }),
		]);
		setMessage('');
	};

	return (
		<Card className='border-amber-500/50'>
			<CardBody className='flex flex-col gap-4'>
				<div className='flex items-start gap-3'>
					<span className='flex size-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/15 text-amber-500'>
						<Icon icon='UserCheck01' size='text-2xl' />
					</span>
					<div>
						<div className='font-semibold'>Waiting for approval</div>
						<div className='text-sm text-zinc-500'>
							{approval.node ? `Node “${approval.node.key}” · ` : ''}
							paused for {formatSeconds(approval.waiting_seconds)}
						</div>
					</div>
				</div>

				<Textarea
					name='approval-message'
					rows={2}
					value={message}
					placeholder='Add a note for the record (optional)'
					onChange={(event) => setMessage(event.target.value)}
				/>

				<div className='flex justify-end gap-2'>
					<Button
						variant='outline'
						color='red'
						isDisable={decide.isPending}
						onClick={() => void onDecide('reject')}>
						Reject
					</Button>
					<Button
						variant='solid'
						color='emerald'
						isLoading={decide.isPending}
						isDisable={decide.isPending}
						onClick={() => void onDecide('approve')}>
						Approve
					</Button>
				</div>
			</CardBody>
		</Card>
	);
};

export default RunApprovalCardPart;
