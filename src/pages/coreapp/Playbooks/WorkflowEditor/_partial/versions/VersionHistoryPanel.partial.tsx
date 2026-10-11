import { differenceInCalendarDays, format, isToday, isYesterday } from 'date-fns';
import { FileCheck2, History, Loader2, PencilLine, RotateCcw, X } from 'lucide-react';
import { useWorkflowVersions } from '@/api/modules/workflows';
import { useWorkflowShellStore } from '@/store/workflowShell.store';
import type { TWorkflowVersion } from '@/types/workflow-extras.type';
import relativeTime from '@/utils/relativeTime.util';
import { describeDiff } from '../../_helper/versionDiff.helper';
import { useDraftStatus } from '../../_hooks/useDraftStatus.hook';
import { usePublishReview } from '../../_hooks/usePublishReview.hook';
import { useVersionRestore } from '../../_hooks/useVersionRestore.hook';
import { useWorkflowEditor } from '../../_hooks/useWorkflowEditor.hook';

const groupLabel = (iso: string) => {
	const date = new Date(iso);
	if (isToday(date)) return 'Today';
	if (isYesterday(date)) return 'Yesterday';
	if (differenceInCalendarDays(new Date(), date) < 7) return 'Earlier this week';
	return format(date, 'MMMM yyyy');
};

const groupVersions = (versions: TWorkflowVersion[]) =>
	versions.reduce<{ label: string; versions: TWorkflowVersion[] }[]>((groups, version) => {
		const label = groupLabel(version.created_at);
		const last = groups[groups.length - 1];
		if (last?.label === label) last.versions.push(version);
		else groups.push({ label, versions: [version] });
		return groups;
	}, []);

const DraftCard = ({ isSelected, onSelect }: { isSelected: boolean; onSelect: () => void }) => {
	const { status, diff, liveGraph, draftGraph, liveVersionId, liveVersionNumber } =
		useDraftStatus();
	const { restore, isRestoring } = useVersionRestore();

	const meta = {
		unpublished: {
			dot: 'bg-zinc-400',
			title: 'Not published yet',
			body: 'Publish to make this workflow live and save its first version.',
		},
		changed: {
			dot: 'bg-amber-500',
			title: 'Unpublished changes',
			body:
				diff && liveGraph
					? `${describeDiff(diff, liveGraph, draftGraph)}.`
					: 'Your draft differs from the live version.',
		},
		live: {
			dot: 'bg-emerald-500',
			title: 'Up to date',
			body: `Your draft matches v${liveVersionNumber ?? ''}, the live version.`,
		},
		checking: {
			dot: 'bg-zinc-300 dark:bg-zinc-600',
			title: 'Checking…',
			body: 'Comparing your draft with the live version.',
		},
	}[status];

	return (
		<div
			className={[
				'rounded-xl border p-3.5 transition',
				isSelected
					? 'border-primary-400 bg-primary-50/50 dark:border-primary-400/50 dark:bg-primary-400/[0.06]'
					: 'border-zinc-200 dark:border-white/10',
			].join(' ')}>
			<button type='button' onClick={onSelect} className='block w-full text-left'>
				<div className='flex items-center gap-2'>
					<PencilLine size={14} className='text-zinc-500 dark:text-zinc-400' />
					<span className='text-sm font-semibold text-zinc-900 dark:text-zinc-100'>
						Current draft
					</span>
					{isSelected && (
						<span className='ml-auto text-[11px] text-zinc-500 dark:text-zinc-400'>
							On canvas
						</span>
					)}
				</div>
				<p className='mt-2 flex items-center gap-1.5 text-xs font-medium text-zinc-700 dark:text-zinc-200'>
					<span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
					{meta.title}
				</p>
				<p className='mt-1 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400'>
					{meta.body}
				</p>
			</button>
			{status === 'changed' && liveVersionId && (
				<button
					type='button'
					disabled={isRestoring}
					onClick={() =>
						void restore(
							{ id: liveVersionId, version: liveVersionNumber ?? 0 },
							{ draftHasChanges: true, isDiscard: true },
						)
					}
					className='mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-zinc-600 transition hover:text-rose-600 disabled:opacity-50 dark:text-zinc-300 dark:hover:text-rose-400'>
					<RotateCcw size={12} />
					Discard changes
				</button>
			)}
		</div>
	);
};

const VersionRow = ({
	version,
	isLive,
	isSelected,
	isLast,
	onSelect,
}: {
	version: TWorkflowVersion;
	isLive: boolean;
	isSelected: boolean;
	isLast: boolean;
	onSelect: () => void;
}) => {
	const runs = version.runs_count ?? 0;
	const details = [
		version.publisher?.name,
		relativeTime(version.created_at),
		runs > 0 ? `${runs} run${runs === 1 ? '' : 's'}` : null,
	].filter(Boolean);

	return (
		<li className='relative pl-6'>
			<span
				aria-hidden
				className={`absolute top-[18px] left-[5px] h-2.5 w-2.5 rounded-full border-2 ${isLive ? 'border-emerald-500 bg-emerald-500' : 'border-zinc-300 bg-white dark:border-zinc-600 dark:bg-zinc-900'}`}
			/>
			{!isLast && (
				<span
					aria-hidden
					className='absolute top-8 bottom-[-12px] left-[9px] w-px bg-zinc-200 dark:bg-white/10'
				/>
			)}
			<button
				type='button'
				onClick={onSelect}
				aria-pressed={isSelected}
				className={[
					'block w-full rounded-lg px-3 py-2.5 text-left transition',
					isSelected
						? 'bg-primary-100/70 ring-primary-400/60 dark:bg-primary-400/10 ring-1'
						: 'hover:bg-zinc-100 dark:hover:bg-white/[0.04]',
				].join(' ')}>
				<span className='flex items-center gap-2'>
					<span className='text-sm font-semibold text-zinc-900 dark:text-zinc-100'>
						v{version.version}
					</span>
					{isLive && (
						<span className='rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300'>
							Live
						</span>
					)}
				</span>
				<span
					className={`mt-0.5 block text-xs leading-relaxed ${version.notes ? 'text-zinc-700 dark:text-zinc-300' : 'text-zinc-400 italic dark:text-zinc-500'}`}>
					{version.notes || 'No description'}
				</span>
				<span className='mt-1 block text-[11px] text-zinc-500 dark:text-zinc-400'>
					{details.join(' · ')}
				</span>
			</button>
		</li>
	);
};

/**
 * Every published version of the workflow, newest first, beside the canvas.
 * Picking one shows it read-only on the canvas (`VersionPreview`), where it
 * can be restored into the draft.
 */
/** The draft sent for review, if one is waiting — opens it over the canvas. */
const PendingReviewCard = () => {
	const { pending } = usePublishReview();
	const reviewRequestId = useWorkflowShellStore((store) => store.reviewRequestId);
	const setReviewRequestId = useWorkflowShellStore((store) => store.setReviewRequestId);
	if (!pending) return null;
	const isOpen = reviewRequestId === pending.id;

	return (
		<button
			type='button'
			onClick={() => setReviewRequestId(isOpen ? null : pending.id)}
			className={[
				'mb-3 block w-full rounded-xl border p-3.5 text-left transition',
				isOpen
					? 'border-amber-400 bg-amber-50/60 dark:border-amber-400/50 dark:bg-amber-400/[0.06]'
					: 'border-amber-200 hover:bg-amber-50/40 dark:border-amber-400/20 dark:hover:bg-amber-400/[0.04]',
			].join(' ')}>
			<span className='flex items-center gap-2'>
				<FileCheck2 size={14} className='text-amber-600 dark:text-amber-400' />
				<span className='text-sm font-semibold text-zinc-900 dark:text-zinc-100'>
					Waiting for review
				</span>
				{isOpen && (
					<span className='ml-auto text-[11px] text-zinc-500 dark:text-zinc-400'>
						On canvas
					</span>
				)}
			</span>
			<span className='mt-1.5 block text-xs text-zinc-600 dark:text-zinc-300'>
				{pending.notes || 'No description'}
			</span>
			<span className='mt-1 block text-[11px] text-zinc-500 dark:text-zinc-400'>
				Sent by {pending.requester?.name ?? 'someone'} {relativeTime(pending.created_at)}
			</span>
		</button>
	);
};

const VersionHistoryPanel = () => {
	const { state } = useWorkflowEditor();
	const closeVersionPanel = useWorkflowShellStore((store) => store.closeVersionPanel);
	const previewVersionId = useWorkflowShellStore((store) => store.previewVersionId);
	const setPreviewVersionId = useWorkflowShellStore((store) => store.setPreviewVersionId);
	const reviewRequestId = useWorkflowShellStore((store) => store.reviewRequestId);
	const workspaceId = state.workflow.workspaceId ?? '';
	const workflowId = state.workflow.apiId ?? '';
	const {
		data: versions,
		isLoading,
		isError,
		refetch,
	} = useWorkflowVersions(workspaceId, workflowId);
	const liveVersionId = state.workflow.currentVersionId;

	return (
		<section
			aria-label='Version history'
			className='flex h-full min-h-0 flex-col overflow-hidden bg-white text-zinc-900 dark:bg-[#111315] dark:text-zinc-100'>
			<header className='flex shrink-0 items-center justify-between gap-3 px-5 pt-5 pb-4'>
				<div className='flex items-center gap-2.5'>
					<span className='flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-200 text-zinc-500 dark:border-white/10 dark:text-zinc-400'>
						<History size={16} />
					</span>
					<div>
						<h2 className='text-sm font-semibold tracking-tight'>Version history</h2>
						<p className='text-[11px] text-zinc-500 dark:text-zinc-400'>
							Pick a version to see it on the canvas
						</p>
					</div>
				</div>
				<button
					type='button'
					aria-label='Close version history'
					onClick={closeVersionPanel}
					className='flex h-8 w-8 items-center justify-center rounded-md text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-white/5 dark:hover:text-white'>
					<X size={16} />
				</button>
			</header>

			<div className='min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-6'>
				<PendingReviewCard />
				<DraftCard
					isSelected={previewVersionId === null && reviewRequestId === null}
					onSelect={() => setPreviewVersionId(null)}
				/>

				{isLoading && (
					<p className='mt-6 flex items-center gap-2 text-xs text-zinc-500'>
						<Loader2 size={13} className='animate-spin' />
						Loading versions…
					</p>
				)}
				{isError && (
					<div className='mt-6 text-xs text-zinc-500'>
						Versions could not be loaded.{' '}
						<button
							type='button'
							onClick={() => void refetch()}
							className='font-medium text-zinc-900 underline dark:text-zinc-100'>
							Try again
						</button>
					</div>
				)}
				{versions && versions.length === 0 && (
					<p className='mt-6 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400'>
						No versions yet. Every time you publish, a version is saved here so you can
						look back or restore it.
					</p>
				)}

				{versions &&
					groupVersions(versions).map((group) => (
						<div key={group.label} className='mt-6'>
							<h3 className='mb-2 text-[11px] font-medium text-zinc-500 dark:text-zinc-400'>
								{group.label}
							</h3>
							<ul className='space-y-3'>
								{group.versions.map((version, index) => (
									<VersionRow
										key={version.id}
										version={version}
										isLive={version.id === liveVersionId}
										isSelected={version.id === previewVersionId}
										isLast={index === group.versions.length - 1}
										onSelect={() =>
											setPreviewVersionId(
												version.id === previewVersionId ? null : version.id,
											)
										}
									/>
								))}
							</ul>
						</div>
					))}
			</div>
		</section>
	);
};

export default VersionHistoryPanel;
