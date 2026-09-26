import { Check, RotateCcw, Square, X } from 'lucide-react';
import { notify } from '@/api/core';
import { useCancelRun, useDecideRunApproval, useRetryRun } from '@/api/modules/runs';
import { usePendingApprovals } from '@/api/modules/dashboard';
import { useConfirm } from '@/context/confirm';
import type { TRun, TRunStatus } from '@/types/run.type';

const IN_FLIGHT: TRunStatus[] = ['pending', 'running', 'awaiting_approval', 'awaiting_callback'];
const TERMINAL: TRunStatus[] = ['completed', 'failed', 'cancelled'];

const buttonBase =
	'flex h-11 cursor-pointer items-center gap-1.5 rounded-xl px-4 text-xs font-black shadow-xs transition disabled:cursor-not-allowed disabled:opacity-60';
const neutralBtn = `${buttonBase} border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800`;

interface IRunActionsProps {
	ws: string;
	run: TRun;
	/** Called with the new run a retry created, so the drawer can switch to it. */
	onRetried?: (runId: string) => void;
}

/**
 * What can be done to a run from the Trail drawer. Retry is limited to
 * workflow runs, because the backend replays a workflow version and agent
 * turns have none.
 */
const RunActions = ({ ws, run, onRetried }: IRunActionsProps) => {
	const { confirm } = useConfirm();
	const cancelRun = useCancelRun(ws);
	const retryRun = useRetryRun(ws);
	const decide = useDecideRunApproval(ws, run.id);

	const isAwaitingApproval = run.status === 'awaiting_approval';
	// The run resource carries no approvals, so the open one comes from the
	// workspace's pending list.
	const { data: pending } = usePendingApprovals(isAwaitingApproval ? ws : '');
	const approval = pending?.approvals.find((a) => String(a.run_id) === String(run.id));

	const isWorkflowRun = !run.runnable_type.toLowerCase().includes('agent');
	const canCancel = IN_FLIGHT.includes(run.status);
	const canRetry = isWorkflowRun && TERMINAL.includes(run.status) && !!run.workflow_version_id;

	const handleCancel = async () => {
		const confirmed = await confirm({
			title: 'Cancel run',
			confirmText: 'Cancel run',
			message: 'The run stops where it is. Nodes that already ran are not undone.',
		});
		if (!confirmed) return;
		cancelRun.mutate(run.id, { onSuccess: () => notify.success('Run cancelled.') });
	};

	const handleRetry = () =>
		retryRun.mutate(run.id, {
			onSuccess: (newRun) => {
				notify.success('Run started again.');
				onRetried?.(String(newRun.id));
			},
		});

	const handleDecision = async (decision: 'approve' | 'reject') => {
		if (!approval) return;
		if (decision === 'reject') {
			const confirmed = await confirm({
				title: 'Reject approval',
				confirmText: 'Reject',
				message: 'The run takes its rejected path, or fails if the workflow has none.',
			});
			if (!confirmed) return;
		}
		decide.mutate(
			{ approvalId: approval.id, body: { decision } },
			{
				onSuccess: () =>
					notify.success(
						decision === 'approve' ? 'Approved. The run continues.' : 'Rejected.',
					),
			},
		);
	};

	if (!canCancel && !canRetry && !isAwaitingApproval) return null;

	return (
		<div className='flex flex-wrap items-center gap-2'>
			{isAwaitingApproval && approval && (
				<>
					<button
						type='button'
						disabled={decide.isPending}
						onClick={() => handleDecision('approve')}
						className={`${buttonBase} bg-emerald-600 text-white hover:bg-emerald-700`}>
						<Check size={14} />
						Approve
					</button>
					<button
						type='button'
						disabled={decide.isPending}
						onClick={() => handleDecision('reject')}
						className={`${neutralBtn} text-rose-600 dark:text-rose-400`}>
						<X size={14} />
						Reject
					</button>
				</>
			)}
			{canCancel && (
				<button
					type='button'
					disabled={cancelRun.isPending}
					onClick={handleCancel}
					className={neutralBtn}>
					<Square size={13} />
					{cancelRun.isPending ? 'Cancelling…' : 'Cancel'}
				</button>
			)}
			{canRetry && (
				<button
					type='button'
					disabled={retryRun.isPending}
					onClick={handleRetry}
					className={neutralBtn}>
					<RotateCcw size={14} />
					{retryRun.isPending
						? 'Starting…'
						: run.status === 'completed'
							? 'Run again'
							: 'Retry'}
				</button>
			)}
		</div>
	);
};

export default RunActions;
