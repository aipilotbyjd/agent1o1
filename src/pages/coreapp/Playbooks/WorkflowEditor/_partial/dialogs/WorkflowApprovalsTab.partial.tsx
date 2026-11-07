import { ChevronRight, FileCheck2 } from 'lucide-react';
import { usePublishRequests } from '@/api/modules/workflows';
import PublishApprovalSetting from '@/parts/PublishApprovalSetting.part';
import { useWorkflowShellStore } from '@/store/workflowShell.store';
import type { TPublishRequest, TPublishRequestStatus } from '@/types/workflow-extras.type';
import relativeTime from '@/utils/relativeTime.util';

const STATUS_LABEL: Record<TPublishRequestStatus, { label: string; className: string }> = {
	pending: {
		label: 'Waiting',
		className: 'bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300',
	},
	approved: {
		label: 'Approved',
		className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
	},
	rejected: {
		label: 'Rejected',
		className: 'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300',
	},
	withdrawn: {
		label: 'Withdrawn',
		className: 'bg-zinc-100 text-zinc-600 dark:bg-white/[0.06] dark:text-zinc-300',
	},
	superseded: {
		label: 'Replaced',
		className: 'bg-zinc-100 text-zinc-600 dark:bg-white/[0.06] dark:text-zinc-300',
	},
};

const outcome = (request: TPublishRequest) => {
	const reviewer = request.reviewer?.name;
	if (request.status === 'approved') {
		const version = request.published_version ? `v${request.published_version.version}` : '';
		return `${reviewer ?? 'An admin'} approved ${relativeTime(request.reviewed_at)}${version ? `, ${version} went live` : ''}`;
	}
	if (request.status === 'rejected')
		return `${reviewer ?? 'An admin'} rejected ${relativeTime(request.reviewed_at)}`;
	if (request.status === 'withdrawn') return 'Withdrawn by the sender';
	if (request.status === 'superseded') return 'A newer request replaced it';
	return 'Waiting for an admin';
};

/**
 * This workflow's reviews: the workspace rule, and every request sent;
 * opening one shows its changes over the canvas.
 */
const WorkflowApprovalsTab = ({
	workspaceId,
	workflowId,
}: {
	workspaceId: string;
	workflowId: string;
}) => {
	const { data, isLoading } = usePublishRequests(workspaceId, workflowId);
	const setGovModalOpen = useWorkflowShellStore((store) => store.setGovModalOpen);
	const setReviewRequestId = useWorkflowShellStore((store) => store.setReviewRequestId);

	const open = (id: string) => {
		setGovModalOpen(false);
		setReviewRequestId(id);
	};

	const requests = data?.requests ?? [];

	return (
		<div className='space-y-6'>
			<div>
				<h3 className='text-sm font-bold text-zinc-800 dark:text-zinc-200'>Approvals</h3>
				<p className='mt-1 text-xs text-zinc-500 dark:text-zinc-400'>
					Have changes reviewed before they go live. Nothing reaches triggers or runs
					until another admin approves it.
				</p>
			</div>

			<div className='rounded-xl border border-zinc-200 px-4 dark:border-white/10'>
				<PublishApprovalSetting workspaceId={workspaceId} />
			</div>

			<div className='space-y-2'>
				<h4 className='text-[11px] font-bold tracking-wider text-zinc-500 uppercase dark:text-zinc-400'>
					Review history
				</h4>
				{isLoading ? (
					<p className='py-6 text-center text-xs text-zinc-400'>Loading…</p>
				) : requests.length === 0 ? (
					<p className='rounded-xl border border-dashed border-zinc-200 py-8 text-center text-xs text-zinc-400 dark:border-white/10'>
						No changes have been sent for review yet.
					</p>
				) : (
					<ul className='space-y-2'>
						{requests.map((request) => {
							const status = STATUS_LABEL[request.status];
							return (
								<li key={request.id}>
									<button
										type='button'
										onClick={() => open(request.id)}
										className='group flex w-full items-start gap-3 rounded-xl border border-zinc-200 p-3 text-left transition hover:bg-zinc-50 dark:border-white/10 dark:hover:bg-white/[0.03]'>
										<FileCheck2
											size={15}
											className='mt-0.5 shrink-0 text-zinc-400'
										/>
										<span className='min-w-0 flex-1'>
											<span className='flex flex-wrap items-center gap-2'>
												<span className='text-xs font-semibold text-zinc-800 dark:text-zinc-100'>
													{request.requester?.name ?? 'Someone'}
												</span>
												<span
													className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${status.className}`}>
													{status.label}
												</span>
												<span className='text-[11px] text-zinc-400'>
													{relativeTime(request.created_at)}
												</span>
											</span>
											<span className='mt-1 block text-xs text-zinc-600 dark:text-zinc-300'>
												{request.notes || 'No description'}
											</span>
											<span className='mt-1 block text-[11px] text-zinc-500 dark:text-zinc-400'>
												{outcome(request)}
											</span>
											{request.review_notes && (
												<span className='mt-1 block text-[11px] whitespace-pre-wrap text-zinc-500 italic dark:text-zinc-400'>
													“{request.review_notes}”
												</span>
											)}
										</span>
										<ChevronRight
											size={14}
											className='mt-0.5 shrink-0 text-zinc-300 transition group-hover:translate-x-0.5 group-hover:text-zinc-500'
										/>
									</button>
								</li>
							);
						})}
					</ul>
				)}
			</div>
		</div>
	);
};

export default WorkflowApprovalsTab;
