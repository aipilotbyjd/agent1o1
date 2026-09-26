import { useNavigate } from 'react-router';
import { Check, Hourglass, X } from 'lucide-react';
import { notify } from '@/api/core';
import { usePendingApprovals } from '@/api/modules/dashboard';
import { useDecideRunApproval } from '@/api/modules/runs';
import { useConfirm } from '@/context/confirm';
import pages from '@/Routes/pages';
import { withWorkspace } from '@/Routes/paths';
import type { TPendingApproval } from '@/types/dashboard.type';

/** "12m", "3h", "2d" — how long a run has been paused on this approval. */
const formatWaiting = (seconds: number | null) => {
	if (seconds === null) return null;
	if (seconds < 60) return 'just now';
	const minutes = Math.floor(seconds / 60);
	if (minutes < 60) return `${minutes}m`;
	const hours = Math.floor(minutes / 60);
	if (hours < 48) return `${hours}h`;
	return `${Math.floor(hours / 24)}d`;
};

const ApprovalRow = ({ ws, approval }: { ws: string; approval: TPendingApproval }) => {
	const navigate = useNavigate();
	const { confirm } = useConfirm();
	const decide = useDecideRunApproval(ws, approval.run_id);
	const workflowName = approval.run?.workflow?.name ?? 'Workflow run';
	const waiting = formatWaiting(approval.waiting_seconds);

	const handleDecision = async (decision: 'approve' | 'reject') => {
		if (decision === 'reject') {
			const confirmed = await confirm({
				title: 'Reject approval',
				confirmText: 'Reject',
				message: `"${workflowName}" takes its rejected path, or fails if it has none.`,
			});
			if (!confirmed) return;
		}
		decide.mutate(
			{ approvalId: approval.id, body: { decision } },
			{
				onSuccess: () =>
					notify.success(
						decision === 'approve'
							? `Approved. "${workflowName}" continues.`
							: `Rejected "${workflowName}".`,
					),
			},
		);
	};

	return (
		<div className='flex items-center justify-between gap-3 px-5 py-3.5'>
			<button
				type='button'
				onClick={() =>
					navigate(
						`${withWorkspace(pages.workspace.subPages!.trail.to, ws)}?run=${encodeURIComponent(approval.run_id)}`,
					)
				}
				className='flex min-w-0 items-center gap-3 text-left'>
				<div className='flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400'>
					<Hourglass size={15} />
				</div>
				<div className='min-w-0'>
					<p className='text-text-main truncate text-xs font-bold'>{workflowName}</p>
					<p className='text-text-muted truncate text-[10px] font-semibold'>
						{approval.node?.key ? `At ${approval.node.key}` : 'Waiting for a decision'}
						{waiting ? ` · waiting ${waiting}` : ''}
					</p>
				</div>
			</button>
			<div className='flex shrink-0 items-center gap-2'>
				<button
					type='button'
					disabled={decide.isPending}
					onClick={() => handleDecision('reject')}
					aria-label={`Reject ${workflowName}`}
					className='flex h-7.5 items-center gap-1 rounded-lg border border-rose-500/25 bg-rose-500/5 px-2.5 text-[10px] font-black text-rose-600 transition hover:bg-rose-500 hover:text-white disabled:opacity-50 dark:text-rose-400'>
					<X size={11} /> Reject
				</button>
				<button
					type='button'
					disabled={decide.isPending}
					onClick={() => handleDecision('approve')}
					aria-label={`Approve ${workflowName}`}
					className='flex h-7.5 items-center gap-1 rounded-lg bg-emerald-600 px-2.5 text-[10px] font-black text-white transition hover:bg-emerald-700 disabled:opacity-50'>
					<Check size={11} /> Approve
				</button>
			</div>
		</div>
	);
};

/**
 * Runs paused on an approval node. Hidden entirely when nothing is waiting,
 * so it only takes space on the dashboard when a decision is actually due.
 */
const PendingApprovalsCard = ({ ws }: { ws: string }) => {
	const { data } = usePendingApprovals(ws);
	const approvals = data?.approvals ?? [];
	const total = data?.meta?.total ?? approvals.length;

	if (approvals.length === 0) return null;

	return (
		<div className='border-border-main bg-bg-card overflow-hidden rounded-3xl border shadow-sm'>
			<div className='border-border-main flex items-center justify-between border-b px-5 py-4.5'>
				<span className='text-text-main flex items-center gap-2 text-xs font-black tracking-widest uppercase'>
					<Hourglass size={13} className='text-amber-500' />
					Waiting for approval
				</span>
				<span className='rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-black text-amber-600 dark:text-amber-400'>
					{total}
				</span>
			</div>
			<div className='divide-border-main divide-y'>
				{approvals.slice(0, 5).map((approval) => (
					<ApprovalRow key={approval.id} ws={ws} approval={approval} />
				))}
			</div>
		</div>
	);
};

export default PendingApprovalsCard;
