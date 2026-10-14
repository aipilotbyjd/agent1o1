import { useState } from 'react';
import { Eye, History, Loader2, RotateCcw, Save } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import {
	WorkflowPageService,
	useRestoreWorkflowPageVersion,
	useSaveWorkflowPageVersion,
	useWorkflowPageVersions,
	workflowPageKeys,
} from '@/api/modules/workflow-pages';
import { notify } from '@/api/core';
import { useConfirm } from '@/context/confirm';
import Modal, { ModalBody, ModalHeader } from '@/components/ui/Modal';
import PageTemplatePreview from '@/components/workflowPage/PageTemplatePreview';
import relativeTime from '@/utils/relativeTime.util';
import type { TPageVersion, TPageVersionKind } from '@/types/workflow-page.type';
import { usePageBuilderStore } from '../_store/pageBuilder.store';
import { usePageBuilder } from '../_context/PageBuilder.context';
import { panelInputClass } from './controls.partial';

const KIND: Record<TPageVersionKind, { label: string; className: string }> = {
	published: {
		label: 'Published',
		className: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300',
	},
	saved: {
		label: 'Saved',
		className: 'bg-zinc-100 text-zinc-700 dark:bg-white/10 dark:text-zinc-300',
	},
	before_restore: {
		label: 'Before restore',
		className: 'bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300',
	},
	before_generation: {
		label: 'Before AI',
		className: 'bg-violet-100 text-violet-800 dark:bg-violet-500/15 dark:text-violet-300',
	},
};

const VersionPreview = ({
	version,
	onClose,
	onRestore,
}: {
	version: TPageVersion;
	onClose: () => void;
	onRestore: () => void;
}) => {
	const { ws, page } = usePageBuilder();
	const { data, isLoading } = useQuery({
		queryKey: [...workflowPageKeys.versions(ws, page.id), version.id],
		queryFn: ({ signal }) => WorkflowPageService.version(ws, page.id, version.id, signal),
	});
	const [showB, setShowB] = useState(false);
	const content = showB ? data?.variant_content : data?.content;

	return (
		<Modal isOpen setIsOpen={(open) => !open && onClose()} size='xl'>
			<ModalHeader setIsOpen={(open) => !open && onClose()}>
				<div className='flex flex-wrap items-center gap-2'>
					<span className='text-lg font-extrabold tracking-tight text-zinc-950 dark:text-white'>
						Version {version.number}
					</span>
					<span
						className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${KIND[version.kind].className}`}>
						{KIND[version.kind].label}
					</span>
					{version.label && (
						<span className='text-sm text-zinc-500'>{version.label}</span>
					)}
				</div>
			</ModalHeader>
			<ModalBody>
				<div className='mb-3 flex items-center gap-2'>
					{data?.variant_content && (
						<div
							role='radiogroup'
							aria-label='Version'
							className='flex rounded-lg bg-zinc-100 p-0.5 dark:bg-white/[0.06]'>
							{[false, true].map((b) => (
								<button
									key={String(b)}
									type='button'
									role='radio'
									aria-checked={showB === b}
									onClick={() => setShowB(b)}
									className={`h-7 rounded-md px-3 text-xs font-bold ${showB === b ? 'bg-white shadow-xs dark:bg-zinc-800' : 'text-zinc-500'}`}>
									{b ? 'B' : 'A'}
								</button>
							))}
						</div>
					)}
					<button
						type='button'
						onClick={onRestore}
						className='bg-primary-400 text-primary-950 ml-auto flex h-8 items-center gap-1.5 rounded-lg px-3 text-xs font-bold hover:brightness-105'>
						<RotateCcw size={13} /> Restore this version
					</button>
				</div>
				<div className='max-h-[70vh] overflow-y-auto rounded-xl border border-zinc-200 dark:border-white/10'>
					{isLoading || !content ? (
						<p className='flex items-center gap-2 p-8 text-sm text-zinc-500'>
							<Loader2 size={14} className='animate-spin' /> Loading…
						</p>
					) : (
						<PageTemplatePreview content={content} />
					)}
				</div>
			</ModalBody>
		</Modal>
	);
};

/**
 * The page's versions: one for every publish, any the team saved, and the
 * ones kept automatically before a restore or an AI design replaced the
 * draft. Restoring replaces the draft only; publish to make it live.
 */
const HistoryPanel = () => {
	const { ws, page, flush } = usePageBuilder();
	const { confirm } = useConfirm();
	const { data: versions, isLoading } = useWorkflowPageVersions(ws, page.id);
	const save = useSaveWorkflowPageVersion(ws, page.id);
	const restore = useRestoreWorkflowPageVersion(ws, page.id);
	const load = usePageBuilderStore((store) => store.load);
	const [label, setLabel] = useState('');
	const [previewing, setPreviewing] = useState<TPageVersion | null>(null);

	const saveVersion = async () => {
		if (!(await flush())) return;
		save.mutate(
			{ label: label.trim() || null },
			{
				onSuccess: (version) => {
					setLabel('');
					notify.success(`Saved as version ${version.number}.`);
				},
			},
		);
	};

	const restoreVersion = async (version: TPageVersion) => {
		const ok = await confirm({
			title: `Restore version ${version.number}?`,
			message:
				'It replaces the draft you’re editing. The current draft is saved as a version first, so you can go back to it. Nothing goes live until you publish.',
			confirmText: 'Restore',
			tone: 'primary',
		});
		if (!ok || !(await flush())) return;
		restore.mutate(version.id, {
			onSuccess: (restored) => {
				if (restored.content) load(restored.id, restored.content, 'a', restored.draft_revision);
				setPreviewing(null);
				notify.success(`Version ${version.number} restored. Publish to make it live.`);
			},
		});
	};

	return (
		<div className='flex h-full flex-col'>
			<div className='space-y-2 border-b border-zinc-100 p-4 dark:border-white/[0.06]'>
				<p className='text-xs font-bold text-zinc-900 dark:text-zinc-100'>
					Save this draft as a version
				</p>
				<div className='flex gap-2'>
					<input
						value={label}
						maxLength={120}
						placeholder='Label (optional)'
						onChange={(e) => setLabel(e.target.value)}
						onKeyDown={(e) => e.key === 'Enter' && void saveVersion()}
						className={panelInputClass}
					/>
					<button
						type='button'
						onClick={() => void saveVersion()}
						disabled={save.isPending}
						className='flex h-8 shrink-0 items-center gap-1 rounded-lg bg-zinc-900 px-3 text-xs font-bold text-white transition hover:bg-zinc-700 disabled:opacity-40 dark:bg-white dark:text-zinc-900'>
						{save.isPending ? (
							<Loader2 size={12} className='animate-spin' />
						) : (
							<Save size={12} />
						)}
						Save
					</button>
				</div>
				<p className='text-[10px] text-zinc-400'>
					Every publish is saved automatically too.
				</p>
			</div>

			<div className='min-h-0 flex-1 overflow-y-auto'>
				{isLoading ? (
					<p className='p-4 text-[11px] text-zinc-400'>Loading history…</p>
				) : !versions?.length ? (
					<div className='flex flex-col items-center gap-2 px-6 py-10 text-center'>
						<History size={22} className='text-zinc-300 dark:text-zinc-600' />
						<p className='text-xs font-semibold text-zinc-600 dark:text-zinc-300'>
							No versions yet
						</p>
						<p className='text-[11px] text-zinc-400'>
							Publish the page or save a version to start its history.
						</p>
					</div>
				) : (
					<ol className='divide-y divide-zinc-100 dark:divide-white/[0.06]'>
						{versions.map((version) => (
							<li key={version.id} className='group flex items-start gap-3 px-4 py-3'>
								<span className='mt-0.5 w-8 shrink-0 text-xs font-black text-zinc-400 tabular-nums'>
									v{version.number}
								</span>
								<div className='min-w-0 flex-1'>
									<div className='flex flex-wrap items-center gap-1.5'>
										<span
											className={`rounded-full px-1.5 py-0.5 text-[9px] font-bold ${KIND[version.kind].className}`}>
											{KIND[version.kind].label}
										</span>
										{version.has_variant && (
											<span className='rounded-full bg-zinc-100 px-1.5 py-0.5 text-[9px] font-bold text-zinc-600 dark:bg-white/10 dark:text-zinc-300'>
												A + B
											</span>
										)}
									</div>
									{version.label && (
										<p className='mt-1 truncate text-xs font-semibold text-zinc-800 dark:text-zinc-100'>
											{version.label}
										</p>
									)}
									<p
										className='mt-0.5 text-[10px] text-zinc-400'
										title={new Date(version.created_at).toLocaleString()}>
										{version.created_by?.name ?? 'Someone'} ·{' '}
										{relativeTime(version.created_at)}
									</p>
								</div>
								<div className='flex shrink-0 gap-0.5 opacity-0 transition group-hover:opacity-100 focus-within:opacity-100'>
									<button
										type='button'
										onClick={() => setPreviewing(version)}
										aria-label={`Preview version ${version.number}`}
										title='Preview'
										className='flex size-7 items-center justify-center rounded-md text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-white/[0.06] dark:hover:text-white'>
										<Eye size={13} />
									</button>
									<button
										type='button'
										onClick={() => void restoreVersion(version)}
										disabled={restore.isPending}
										aria-label={`Restore version ${version.number}`}
										title='Restore'
										className='flex size-7 items-center justify-center rounded-md text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 disabled:opacity-40 dark:hover:bg-white/[0.06] dark:hover:text-white'>
										<RotateCcw size={13} />
									</button>
								</div>
							</li>
						))}
					</ol>
				)}
			</div>

			{previewing && (
				<VersionPreview
					version={previewing}
					onClose={() => setPreviewing(null)}
					onRestore={() => void restoreVersion(previewing)}
				/>
			)}
		</div>
	);
};

export default HistoryPanel;
