import { Link } from 'react-router';
import { Loader2 } from 'lucide-react';
import paths from '@/Routes/paths';
import { usePublishApprovalPolicy, useUpdatePublishApprovalPolicy } from '@/api/modules/workflows';

/**
 * The workspace's "review workflow changes before they go live" switch —
 * admins change it, everyone else sees how it's set. Off and locked on plans
 * without approvals, with the way to a plan that has them.
 */
const PublishApprovalSetting = ({ workspaceId }: { workspaceId: string }) => {
	const { data: policy, isLoading } = usePublishApprovalPolicy(workspaceId);
	const update = useUpdatePublishApprovalPolicy(workspaceId);

	if (isLoading || !policy) {
		return (
			<div className='flex items-center gap-2 py-3 text-xs text-zinc-500'>
				<Loader2 size={13} className='animate-spin' />
				Loading…
			</div>
		);
	}

	const checked = policy.require_publish_approval && policy.plan_includes_approvals;
	const disabled = !policy.can_manage || !policy.plan_includes_approvals || update.isPending;

	return (
		<div className='py-3'>
			<div className='flex items-center justify-between gap-4'>
				<div>
					<p className='text-sm font-bold text-zinc-800 dark:text-zinc-100'>
						Review changes before they go live
					</p>
					<p className='mt-0.5 text-xs font-medium text-zinc-500 dark:text-zinc-400'>
						Editors send workflow changes for review instead of publishing. Another
						admin or owner approves them, which publishes exactly what they saw.
					</p>
				</div>
				<button
					type='button'
					role='switch'
					aria-checked={checked}
					aria-label='Review changes before they go live'
					disabled={disabled}
					onClick={() => update.mutate(!checked)}
					className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
						checked ? 'bg-primary-400' : 'bg-zinc-200 dark:bg-zinc-700'
					}`}>
					<span
						className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition ${
							checked ? 'translate-x-4' : 'translate-x-0'
						}`}
					/>
				</button>
			</div>
			{!policy.plan_includes_approvals && (
				<p className='mt-2 text-xs font-medium text-zinc-500 dark:text-zinc-400'>
					Your plan doesn't include approvals.{' '}
					{policy.can_manage && (
						<Link
							to={paths.billingPlans(workspaceId)}
							className='text-primary-700 dark:text-primary-400 font-semibold hover:underline'>
							See plans
						</Link>
					)}
				</p>
			)}
			{policy.plan_includes_approvals && !policy.can_manage && (
				<p className='mt-2 text-xs font-medium text-zinc-500 dark:text-zinc-400'>
					Only workspace admins can change this.
				</p>
			)}
			{checked && policy.approver_count < 2 && (
				<p className='mt-2 text-xs font-medium text-amber-700 dark:text-amber-300'>
					Only one person here can approve, and nobody can approve their own changes. Make
					another member an admin so that person's changes can go live too.
				</p>
			)}
		</div>
	);
};

export default PublishApprovalSetting;
