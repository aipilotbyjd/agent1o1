import { CheckCircle2, Globe, Loader2, Lock, Rocket, Users } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { ApiError, notify } from '@/api/core';
import { usePublishWorkflowPage, useUnpublishWorkflowPage, workflowPageKeys } from '@/api/modules/workflow-pages';
import { useConfirm } from '@/context/confirm';
import relativeTime from '@/utils/relativeTime.util';
import { usePageBuilder } from '../_context/PageBuilder.context';
import { IssueList } from './IssuesChip.partial';

const ACCESS = {
	workspace: { icon: Users, label: 'Workspace members can use it from the app.' },
	link: { icon: Globe, label: 'Anyone with the link can use it.' },
	password: { icon: Lock, label: 'Anyone with the link and password can use it.' },
} as const;

const PublishMenu = ({ onClose, onShare }: { onClose: () => void; onShare: () => void }) => {
	const { ws, page, flush, saveState } = usePageBuilder();
	const { confirm } = useConfirm();
	const qc = useQueryClient();
	const publish = usePublishWorkflowPage(ws, page.id);
	const unpublish = useUnpublishWorkflowPage(ws, page.id);
	const errors = page.issues.filter((issue) => issue.severity === 'error');
	const saving = saveState === 'saving' || saveState === 'dirty';
	const upToDate = page.is_published && !page.has_unpublished_changes && !saving;
	const access = ACCESS[page.access];

	const onPublish = async () => {
		const saved = await flush();
		if (!saved) return;
		publish.mutate(undefined, {
			onSuccess: () => {
				notify.success(page.is_published ? 'Changes are live.' : 'Page published.');
				onClose();
			},
			onError: (error) => {
				if (ApiError.is(error) && error.isValidation) {
					qc.invalidateQueries({ queryKey: workflowPageKeys.detail(ws, page.id) });
				}
			},
		});
	};

	const onUnpublish = async () => {
		const ok = await confirm({
			title: 'Unpublish this page?',
			message: 'Nobody will be able to open it until you publish it again. Your draft is kept.',
			confirmText: 'Unpublish',
		});
		if (ok) unpublish.mutate(undefined, { onSuccess: () => notify.success('Page unpublished.') });
	};

	return (
		<div className='w-[340px] rounded-xl border border-zinc-200 bg-white shadow-xl ring-1 ring-black/5 dark:border-white/10 dark:bg-zinc-950 dark:ring-white/5'>
			<div className='border-b border-zinc-100 px-4 py-3 dark:border-white/[0.06]'>
				<p className='text-sm font-bold text-zinc-900 dark:text-zinc-100'>
					{page.is_published ? (upToDate ? 'Your page is live' : 'Publish your changes') : 'Publish this page'}
				</p>
				<p className='mt-0.5 text-[11px] text-zinc-500 dark:text-zinc-400'>
					{page.is_published && page.published_at
						? `Last published ${relativeTime(page.published_at)}${page.published_by ? ` by ${page.published_by.name}` : ''}.`
						: 'People see the published version. Your edits stay a draft until then.'}
				</p>
			</div>

			{page.issues.length > 0 && (
				<div className='max-h-56 overflow-y-auto border-b border-zinc-100 p-2 dark:border-white/[0.06]'>
					<IssueList issues={page.issues} onPick={onClose} />
				</div>
			)}

			<button
				type='button'
				onClick={onShare}
				className='flex w-full items-center gap-2.5 border-b border-zinc-100 px-4 py-2.5 text-left text-[11px] text-zinc-600 transition hover:bg-zinc-50 dark:border-white/[0.06] dark:text-zinc-300 dark:hover:bg-white/[0.03]'>
				<access.icon size={14} className='text-primary-700 dark:text-primary-400 shrink-0' />
				<span className='flex-1'>{access.label}</span>
				<span className='text-primary-700 dark:text-primary-400 font-bold'>Change</span>
			</button>

			<div className='flex items-center gap-2 p-3'>
				{page.is_published && (
					<button
						type='button'
						onClick={() => void onUnpublish()}
						disabled={unpublish.isPending}
						className='h-9 rounded-lg border border-zinc-200 px-3 text-xs font-semibold text-zinc-600 transition hover:bg-zinc-50 disabled:opacity-50 dark:border-white/10 dark:text-zinc-300 dark:hover:bg-white/[0.05]'>
						Unpublish
					</button>
				)}
				<button
					type='button'
					onClick={() => void onPublish()}
					disabled={errors.length > 0 || publish.isPending || upToDate}
					className='bg-primary-400 text-primary-950 flex h-9 flex-1 items-center justify-center gap-1.5 rounded-lg text-xs font-black transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50'>
					{publish.isPending || saveState === 'saving' ? (
						<Loader2 size={14} className='animate-spin' />
					) : upToDate ? (
						<CheckCircle2 size={14} />
					) : (
						<Rocket size={14} />
					)}
					{errors.length > 0
						? `Fix ${errors.length} issue${errors.length > 1 ? 's' : ''} first`
						: upToDate
							? 'Up to date'
							: page.is_published
								? 'Publish changes'
								: 'Publish'}
				</button>
			</div>
		</div>
	);
};

export default PublishMenu;
