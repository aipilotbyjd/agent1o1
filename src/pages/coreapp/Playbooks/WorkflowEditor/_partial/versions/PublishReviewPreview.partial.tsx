import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router';
import { AlertTriangle, ArrowLeft, Check, FileCheck2, Loader2, Send, Undo2, X } from 'lucide-react';
import { notify } from '@/api/core';
import {
	useApprovePublishRequest,
	usePublishRequest,
	useRejectPublishRequest,
	useWithdrawPublishRequest,
	useWorkflowVersion,
} from '@/api/modules/workflows';
import { useWorkflowShellStore } from '@/store/workflowShell.store';
import type { TPublishRequest, TPublishRequestStatus } from '@/types/workflow-extras.type';
import relativeTime from '@/utils/relativeTime.util';
import type { TCanvasPosition } from '../../_types/canvas.type';
import { diffGraphs } from '../../_helper/versionDiff.helper';
import { usePublishDraft } from '../../_hooks/usePublishDraft.hook';
import { useWorkflowEditor } from '../../_hooks/useWorkflowEditor.hook';
import {
	ChangeSummary,
	GraphPreviewCanvas,
	primaryButton,
	secondaryButton,
} from './GraphPreviewCanvas.partial';

const NOTES_LIMIT = 1000;

const STATUS_BADGE: Record<TPublishRequestStatus, { label: string; className: string }> = {
	pending: {
		label: 'Waiting for review',
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
		label: 'Replaced by a newer request',
		className: 'bg-zinc-100 text-zinc-600 dark:bg-white/[0.06] dark:text-zinc-300',
	},
};

const dangerButton =
	'inline-flex items-center gap-1.5 rounded-lg border border-rose-200 bg-white px-3 py-1.5 text-xs font-medium text-rose-700 transition hover:bg-rose-50 disabled:opacity-50 dark:border-rose-400/20 dark:bg-white/[0.04] dark:text-rose-300 dark:hover:bg-rose-400/10';

const Notice = ({ children }: { children: React.ReactNode }) => (
	<p className='flex items-start gap-2 rounded-lg bg-amber-50 px-3 py-2 text-xs leading-relaxed text-amber-900 dark:bg-amber-400/10 dark:text-amber-200'>
		<AlertTriangle size={13} className='mt-0.5 shrink-0' />
		<span>{children}</span>
	</p>
);

const Decision = ({ request }: { request: TPublishRequest }) => {
	if (request.status === 'pending' || !request.reviewer) return null;
	const verb = request.status === 'approved' ? 'Approved' : 'Rejected';
	return (
		<div className='rounded-lg border border-zinc-200 px-3 py-2 text-xs dark:border-white/10'>
			<p className='text-zinc-700 dark:text-zinc-200'>
				{verb} by {request.reviewer.name} {relativeTime(request.reviewed_at)}
				{request.published_version && ` · v${request.published_version.version} went live`}
			</p>
			{request.review_notes && (
				<p className='mt-1 whitespace-pre-wrap text-zinc-500 dark:text-zinc-400'>
					{request.review_notes}
				</p>
			)}
		</div>
	);
};

/**
 * A draft sent for review, shown read-only over the canvas with what it
 * changes against the version that was live when it was sent. Reviewers
 * approve (which publishes exactly this copy) or reject it with a note; the
 * person who sent it can withdraw it or send their newer draft instead.
 * Opens from the Publish button, the approvals inbox, a notification, or a
 * `?publish_request=` link in an email.
 */
const PublishReviewPreview = () => {
	const { state, dispatch } = useWorkflowEditor();
	const workspaceId = state.workflow.workspaceId ?? '';
	const workflowId = state.workflow.apiId ?? '';
	const reviewRequestId = useWorkflowShellStore((store) => store.reviewRequestId);
	const setReviewRequestId = useWorkflowShellStore((store) => store.setReviewRequestId);
	const close = () => setReviewRequestId(null);

	const [searchParams, setSearchParams] = useSearchParams();
	const linkedRequestId = searchParams.get('publish_request');
	useEffect(() => {
		if (!linkedRequestId) return;
		setReviewRequestId(linkedRequestId);
		setSearchParams(
			(params) => {
				params.delete('publish_request');
				return params;
			},
			{ replace: true },
		);
	}, [linkedRequestId, setReviewRequestId, setSearchParams]);

	const requestQuery = usePublishRequest(workspaceId, workflowId, reviewRequestId);
	const request = requestQuery.data;
	const baseQuery = useWorkflowVersion(workspaceId, workflowId, request?.base_version?.id ?? '');
	const approve = useApprovePublishRequest(workspaceId, workflowId);
	const reject = useRejectPublishRequest(workspaceId, workflowId);
	const withdraw = useWithdrawPublishRequest(workspaceId, workflowId);
	const { requestReview, isRequesting } = usePublishDraft();
	const [reviewNotes, setReviewNotes] = useState('');

	const graph = request?.editor_graph;
	const baseGraph = baseQuery.data?.editor_graph;
	const diff = useMemo(
		() => (graph && baseGraph ? diffGraphs(baseGraph, graph) : null),
		[graph, baseGraph],
	);
	// Taken when a request opens, not on every canvas change underneath.
	const [canvasPositions, setCanvasPositions] = useState(
		() => new Map<string, TCanvasPosition>(),
	);
	const [shownRequestId, setShownRequestId] = useState(reviewRequestId);
	if (shownRequestId !== reviewRequestId) {
		setShownRequestId(reviewRequestId);
		setReviewNotes('');
		setCanvasPositions(new Map(state.nodes.map((node) => [node.id, node.position])));
	}

	useEffect(() => {
		if (!reviewRequestId) return;
		const onKeyDown = (event: KeyboardEvent) => {
			if (event.key === 'Escape') setReviewRequestId(null);
		};
		window.addEventListener('keydown', onKeyDown);
		return () => window.removeEventListener('keydown', onKeyDown);
	}, [reviewRequestId, setReviewRequestId]);

	if (!reviewRequestId) return null;

	const isPending = request?.status === 'pending';
	const isBusy = approve.isPending || reject.isPending || withdraw.isPending || isRequesting;
	const requester = request?.requester?.name ?? 'Someone';
	const notes = reviewNotes.trim() || null;

	const handleApprove = async () => {
		if (!request) return;
		const data = await approve.mutateAsync({ id: request.id, notes }).catch(() => null);
		if (!data) return;
		dispatch({
			type: 'SET_WORKFLOW_META',
			patch: {
				currentVersionId: data.workflow.current_version_id,
				currentVersionNumber: data.request.published_version?.version,
			},
		});
		notify.success(`Approved. v${data.request.published_version?.version ?? ''} is live`);
		close();
	};

	const handleReject = async () => {
		if (!request) return;
		const rejected = await reject.mutateAsync({ id: request.id, notes }).catch(() => null);
		if (!rejected) return;
		notify.success(`Rejected. ${requester} has been told.`);
		close();
	};

	const handleWithdraw = async () => {
		if (!request) return;
		const withdrawn = await withdraw.mutateAsync(request.id).catch(() => null);
		if (withdrawn) close();
	};

	const handleResend = async () => {
		if (!request) return;
		if (await requestReview(request.notes ?? undefined)) close();
	};

	const badge = request ? STATUS_BADGE[request.status] : null;

	return (
		<div className='absolute inset-0 z-[15] flex flex-col bg-zinc-50 dark:bg-[#0b0c0f]'>
			<div className='shrink-0 border-b border-zinc-200 bg-white px-4 py-3 dark:border-white/10 dark:bg-zinc-950'>
				<div className='flex flex-wrap items-center justify-between gap-3'>
					<div className='flex min-w-0 items-center gap-3'>
						<span className='flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-700 dark:bg-amber-400/15 dark:text-amber-300'>
							<FileCheck2 size={15} />
						</span>
						<div className='min-w-0'>
							<div className='flex items-center gap-2'>
								<h2 className='text-sm font-semibold text-zinc-900 dark:text-zinc-100'>
									{isPending ? 'Review changes' : 'Review request'}
								</h2>
								{badge && (
									<span
										className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${badge.className}`}>
										{badge.label}
									</span>
								)}
							</div>
							{request && (
								<p className='truncate text-xs text-zinc-500 dark:text-zinc-400'>
									{request.notes || 'No description'}
									{' · '}
									Sent by {requester} {relativeTime(request.created_at)}
								</p>
							)}
						</div>
					</div>
					<div className='flex flex-wrap items-center gap-2'>
						<button type='button' onClick={close} className={secondaryButton}>
							<ArrowLeft size={13} />
							Back to draft
						</button>
						{isPending && request?.can_withdraw && request.draft_changed_since && (
							<button
								type='button'
								onClick={handleResend}
								disabled={isBusy}
								className={secondaryButton}>
								{isRequesting ? (
									<Loader2 size={13} className='animate-spin' />
								) : (
									<Send size={13} />
								)}
								Send my latest draft instead
							</button>
						)}
						{isPending && request?.can_withdraw && (
							<button
								type='button'
								onClick={handleWithdraw}
								disabled={isBusy}
								className={secondaryButton}>
								{withdraw.isPending ? (
									<Loader2 size={13} className='animate-spin' />
								) : (
									<Undo2 size={13} />
								)}
								Withdraw
							</button>
						)}
					</div>
				</div>

				{request && (
					<div className='mt-2.5 space-y-2.5'>
						<ChangeSummary
							diff={diff}
							previousGraph={baseGraph}
							previousNumber={request.base_version?.version}
							firstLabel='Nothing is live yet, so this would be the first version.'
						/>
						{isPending && request.live_version_changed_since && (
							<Notice>
								A newer version went live after this was sent. Approving replaces it
								with what's shown here.
							</Notice>
						)}
						{isPending && request.draft_changed_since && (
							<Notice>
								The draft has changed since this was sent. Approving publishes
								what's shown here, not the later edits.
							</Notice>
						)}
						<Decision request={request} />
						{isPending && request.can_review && (
							<form
								className='flex flex-col gap-2 sm:flex-row sm:items-start'
								onSubmit={(event) => {
									event.preventDefault();
									void handleApprove();
								}}>
								<label htmlFor='review-notes' className='sr-only'>
									Note for {requester}
								</label>
								<textarea
									id='review-notes'
									rows={1}
									maxLength={NOTES_LIMIT}
									value={reviewNotes}
									placeholder={`Note for ${requester} (optional)`}
									onChange={(event) => setReviewNotes(event.target.value)}
									className='focus:border-primary-400 min-h-[34px] w-full flex-1 resize-y rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs text-zinc-900 outline-none dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-100'
								/>
								<div className='flex shrink-0 items-center gap-2'>
									<button
										type='button'
										onClick={handleReject}
										disabled={isBusy}
										className={dangerButton}>
										{reject.isPending ? (
											<Loader2 size={13} className='animate-spin' />
										) : (
											<X size={13} />
										)}
										Reject
									</button>
									<button
										type='submit'
										disabled={isBusy}
										className={primaryButton}>
										{approve.isPending ? (
											<Loader2 size={13} className='animate-spin' />
										) : (
											<Check size={13} />
										)}
										Approve & publish
									</button>
								</div>
							</form>
						)}
						{isPending && !request.can_review && (
							<p className='text-xs text-zinc-500 dark:text-zinc-400'>
								Waiting for a workspace admin to review it.
							</p>
						)}
					</div>
				)}
			</div>

			<div className='relative min-h-0 flex-1'>
				{requestQuery.isLoading && (
					<div className='flex h-full items-center justify-center gap-2 text-sm text-zinc-500'>
						<Loader2 size={16} className='animate-spin' />
						Loading the changes…
					</div>
				)}
				{requestQuery.isError && (
					<div className='flex h-full items-center justify-center text-sm text-zinc-500'>
						This review request could not be loaded.
					</div>
				)}
				{graph && (
					<GraphPreviewCanvas
						key={reviewRequestId}
						graph={graph}
						diff={diff}
						canvasPositions={canvasPositions}
						emptyLabel='This draft has no steps.'
					/>
				)}
			</div>
		</div>
	);
};

export default PublishReviewPreview;
