import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { AnimatePresence, motion } from 'framer-motion';
import {
	ChartColumn,
	ChevronDown,
	ChevronLeft,
	CloudCheck,
	CloudOff,
	CloudUpload,
	Eye,
	ExternalLink,
	GitMerge,
	Keyboard,
	LayoutTemplate,
	Loader2,
	Monitor,
	Moon,
	PencilRuler,
	Redo2,
	Rocket,
	Share2,
	Sparkles,
	Smartphone,
	Sun,
	Tablet,
	Undo2,
} from 'lucide-react';
import AppLogo from '@/components/AppLogo';
import DARK_MODE from '@/constants/darkMode.constant';
import useDarkMode from '@/hooks/useDarkMode';
import paths from '@/Routes/paths';
import { useUpdateWorkflowPage } from '@/api/modules/workflow-pages';
import SaveAsTemplateModal from '@/parts/SaveAsTemplateModal.part';
import { usePageBuilderStore, type TBuilderDevice } from '../_store/pageBuilder.store';
import { usePageBuilder } from '../_context/PageBuilder.context';
import PublishMenu from './PublishMenu.partial';
import ShareMenu from './ShareMenu.partial';
import VariantMenu from './VariantMenu.partial';
import GenerateDialog from './GenerateDialog.partial';

const FOCUS_RING =
	'outline-none focus-visible:ring-2 focus-visible:ring-primary-500/70 focus-visible:ring-offset-1 focus-visible:ring-offset-white dark:focus-visible:ring-offset-[#07080b]';

export const BuilderTooltip = ({ label, children, align = 'center' }: { label: string; children: ReactNode; align?: 'center' | 'right' }) => (
	<div className='group/tip relative inline-flex'>
		{children}
		<span
			role='tooltip'
			className={`pointer-events-none absolute top-full z-50 mt-1.5 rounded-lg bg-zinc-900/95 px-2 py-1 text-[11px] font-medium whitespace-nowrap text-white opacity-0 shadow-xl transition-opacity delay-200 group-hover/tip:opacity-100 dark:bg-zinc-100 dark:text-zinc-900 ${
				align === 'right' ? 'right-0' : 'left-1/2 -translate-x-1/2'
			}`}>
			{label}
		</span>
	</div>
);

const IconButton = ({
	label,
	onClick,
	disabled,
	active,
	children,
}: {
	label: string;
	onClick: () => void;
	disabled?: boolean;
	active?: boolean;
	children: ReactNode;
}) => (
	<BuilderTooltip label={label}>
		<button
			type='button'
			aria-label={label}
			aria-pressed={active}
			disabled={disabled}
			onClick={onClick}
			className={`flex h-7 w-7 items-center justify-center rounded-md transition disabled:cursor-not-allowed disabled:opacity-30 ${FOCUS_RING} ${
				active
					? 'bg-white text-zinc-900 shadow-xs ring-1 ring-zinc-200 dark:bg-zinc-800 dark:text-white dark:ring-white/10'
					: 'text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-white/[0.06] dark:hover:text-white'
			}`}>
			{children}
		</button>
	</BuilderTooltip>
);

const EditableName = () => {
	const { ws, page } = usePageBuilder();
	const update = useUpdateWorkflowPage(ws, page.id);
	const [editing, setEditing] = useState(false);
	const [draft, setDraft] = useState(page.name);
	const inputRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		if (editing) inputRef.current?.select();
	}, [editing]);

	const commit = () => {
		setEditing(false);
		const name = draft.trim();
		if (name && name !== page.name) update.mutate({ name });
		else setDraft(page.name);
	};

	if (editing) {
		return (
			<input
				ref={inputRef}
				aria-label='Page name'
				value={draft}
				onChange={(e) => setDraft(e.target.value)}
				onBlur={commit}
				onKeyDown={(e) => {
					if (e.key === 'Enter') commit();
					if (e.key === 'Escape') {
						setDraft(page.name);
						setEditing(false);
					}
				}}
				className='border-primary-500 ring-primary-500/30 h-7 w-[220px] rounded-lg border bg-white px-2 text-xs font-bold text-zinc-900 ring-2 outline-none dark:bg-zinc-900 dark:text-zinc-100'
			/>
		);
	}

	return (
		<BuilderTooltip label='Rename page'>
			<button
				type='button'
				onClick={() => {
					setDraft(page.name);
					setEditing(true);
				}}
				className={`max-w-[220px] truncate rounded-lg px-2 py-1 text-xs font-bold text-zinc-900 transition hover:bg-zinc-100 dark:text-zinc-100 dark:hover:bg-white/[0.06] ${FOCUS_RING}`}>
				{page.name}
			</button>
		</BuilderTooltip>
	);
};

const SaveStatus = () => {
	const { saveState, retrySave, resolveConflict } = usePageBuilder();
	const [resolving, setResolving] = useState(false);
	if (saveState === 'conflict') {
		const resolve = (keep: 'mine' | 'theirs') => {
			setResolving(true);
			void resolveConflict(keep).finally(() => setResolving(false));
		};
		return (
			<div
				role='alert'
				className='flex h-8 shrink-0 items-center gap-1.5 rounded-lg border border-amber-300 bg-amber-50 pr-1 pl-2 text-[11px] font-semibold whitespace-nowrap text-amber-900 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-200'>
				<CloudOff size={13} className='shrink-0' />
				<span className='hidden 2xl:inline'>Changed in another window — not saved</span>
				<span className='2xl:hidden'>Not saved</span>
				<button
					type='button'
					disabled={resolving}
					onClick={() => resolve('theirs')}
					title='Load the page as it is now. Your edits since then are dropped.'
					className='h-6 rounded-md bg-amber-500 px-2 text-[11px] font-bold text-white hover:bg-amber-600 disabled:opacity-50'>
					Load latest
				</button>
				<button
					type='button'
					disabled={resolving}
					onClick={() => resolve('mine')}
					title='Save what you see here over the other changes.'
					className='h-6 rounded-md px-2 text-[11px] font-bold hover:bg-amber-100 disabled:opacity-50 dark:hover:bg-amber-500/20'>
					Keep mine
				</button>
			</div>
		);
	}
	const { Icon, label, className } = {
		saved: { Icon: CloudCheck, label: 'All changes saved', className: 'text-emerald-600 dark:text-emerald-400' },
		saving: { Icon: Loader2, label: 'Saving…', className: 'animate-spin text-zinc-400' },
		dirty: { Icon: CloudUpload, label: 'Unsaved changes', className: 'text-amber-500' },
		error: { Icon: CloudOff, label: 'Save failed. Click to retry', className: 'text-rose-500' },
	}[saveState];
	return (
		<BuilderTooltip label={label}>
			<button
				type='button'
				aria-label={label}
				onClick={saveState === 'error' ? retrySave : undefined}
				className={`hidden h-7 w-7 items-center justify-center rounded-lg sm:flex ${saveState === 'error' ? 'hover:bg-rose-50 dark:hover:bg-rose-500/10' : 'cursor-default'} ${FOCUS_RING}`}>
				<Icon size={15} className={className} />
			</button>
		</BuilderTooltip>
	);
};

export const StatusPill = () => {
	const { page } = usePageBuilder();
	const { label, className } = !page.is_published
		? { label: 'Draft', className: 'bg-zinc-100 text-zinc-600 dark:bg-white/[0.06] dark:text-zinc-300' }
		: page.has_unpublished_changes
			? { label: 'Live · edited', className: 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300' }
			: !page.is_enabled
				? { label: 'Turned off', className: 'bg-zinc-100 text-zinc-500 dark:bg-white/[0.06] dark:text-zinc-400' }
				: { label: 'Live', className: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300' };
	return (
		<span className={`hidden h-6 items-center gap-1.5 rounded-full px-2.5 text-[10px] font-bold sm:inline-flex ${className}`}>
			<span className='size-1.5 rounded-full bg-current' />
			{label}
		</span>
	);
};

const DEVICES: { id: TBuilderDevice; label: string; icon: typeof Monitor }[] = [
	{ id: 'desktop', label: 'Desktop', icon: Monitor },
	{ id: 'tablet', label: 'Tablet', icon: Tablet },
	{ id: 'mobile', label: 'Phone', icon: Smartphone },
];

type TMenu = 'share' | 'publish' | null;

const BuilderTopbar = ({ publishOpen, setPublishOpen }: { publishOpen: boolean; setPublishOpen: (open: boolean) => void }) => {
	const { ws, page, flush } = usePageBuilder();
	const { isDarkTheme, setDarkModeStatus } = useDarkMode();
	const [saveAsTemplateOpen, setSaveAsTemplateOpen] = useState(false);
	const [generateOpen, setGenerateOpen] = useState(false);
	const canUndo = usePageBuilderStore((store) => store.past.length > 0);
	const canRedo = usePageBuilderStore((store) => store.future.length > 0);
	const undo = usePageBuilderStore((store) => store.undo);
	const redo = usePageBuilderStore((store) => store.redo);
	const device = usePageBuilderStore((store) => store.device);
	const setDevice = usePageBuilderStore((store) => store.setDevice);
	const mode = usePageBuilderStore((store) => store.mode);
	const setMode = usePageBuilderStore((store) => store.setMode);
	const [shareOpen, setShareOpen] = useState(false);
	const menu: TMenu = shareOpen ? 'share' : publishOpen ? 'publish' : null;
	const open = (next: TMenu) => {
		setShareOpen(next === 'share' && menu !== 'share');
		setPublishOpen(next === 'publish' && menu !== 'publish');
	};

	useEffect(() => {
		if (!menu) return;
		const onKeyDown = (event: KeyboardEvent) => {
			if (event.key === 'Escape') {
				setShareOpen(false);
				setPublishOpen(false);
			}
		};
		window.addEventListener('keydown', onKeyDown);
		return () => window.removeEventListener('keydown', onKeyDown);
	}, [menu, setPublishOpen]);

	const liveUrl = page.access === 'workspace' ? paths.usePage(ws, page.id) : paths.publicPage(page.public_token);

	return (
		<header className='relative z-40 flex h-14 shrink-0 items-center justify-between gap-3 border-b border-zinc-200/80 bg-white/90 px-3 backdrop-blur-md select-none sm:px-4 dark:border-white/[0.08] dark:bg-[#07080b]/90'>
			<span
				aria-hidden
				className='via-primary-500/45 pointer-events-none absolute inset-x-0 -bottom-px h-px bg-gradient-to-r from-transparent to-transparent'
			/>
			<div className='flex min-w-0 items-center gap-1.5 sm:gap-2'>
				<BuilderTooltip label='Back to Pages'>
					<Link
						to={paths.pages(ws)}
						aria-label='Back to Pages'
						className={`flex h-8 w-8 items-center justify-center rounded-lg text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-white/[0.06] dark:hover:text-white ${FOCUS_RING}`}>
						<ChevronLeft size={18} />
					</Link>
				</BuilderTooltip>
				<Link to={paths.dashboard(ws)} className={`hidden rounded-lg sm:flex ${FOCUS_RING}`} aria-label='Dashboard'>
					<AppLogo className='ring-primary-500/20 size-7 ring-1' />
				</Link>
				<span className='hidden text-zinc-300 sm:inline dark:text-zinc-700'>/</span>
				<EditableName />
				<StatusPill />
				<SaveStatus />
			</div>

			<div className='hidden items-center gap-2 md:flex'>
				<div className='flex items-center rounded-lg border border-zinc-200/80 bg-zinc-50/70 p-0.5 dark:border-white/10 dark:bg-zinc-900/60'>
					<IconButton label='Undo (⌘Z)' onClick={undo} disabled={!canUndo || mode === 'preview'}>
						<Undo2 size={14} />
					</IconButton>
					<IconButton label='Redo (⌘⇧Z)' onClick={redo} disabled={!canRedo || mode === 'preview'}>
						<Redo2 size={14} />
					</IconButton>
				</div>
				<div role='radiogroup' aria-label='Preview size' className='flex items-center rounded-lg border border-zinc-200/80 bg-zinc-50/70 p-0.5 dark:border-white/10 dark:bg-zinc-900/60'>
					{DEVICES.map(({ id, label, icon: Icon }) => (
						<IconButton key={id} label={label} active={device === id} onClick={() => setDevice(id)}>
							<Icon size={14} />
						</IconButton>
					))}
				</div>
				<div role='radiogroup' aria-label='Mode' className='flex items-center rounded-xl border border-zinc-200/80 bg-zinc-100/80 p-0.5 dark:border-white/10 dark:bg-zinc-900/80'>
					{(
						[
							{ id: 'edit', label: 'Edit', icon: PencilRuler },
							{ id: 'preview', label: 'Preview', icon: Eye },
						] as const
					).map(({ id, label, icon: Icon }) => (
						<button
							key={id}
							type='button'
							role='radio'
							aria-checked={mode === id}
							onClick={() => setMode(id)}
							title={id === 'preview' ? 'Try the page for real (⌘P)' : 'Edit the page (⌘P)'}
							className={`flex h-7 items-center gap-1.5 rounded-lg px-2.5 text-xs font-bold transition ${FOCUS_RING} ${
								mode === id
									? 'text-primary-800 ring-primary-500/25 dark:text-primary-300 bg-white shadow-xs ring-1 dark:bg-zinc-800'
									: 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white'
							}`}>
							<Icon size={13} />
							{label}
						</button>
					))}
				</div>
			</div>

			<div className='flex items-center gap-1.5 sm:gap-2'>
				<div className='hidden items-center gap-1 lg:flex'>
					<IconButton
						label={isDarkTheme ? 'Light mode' : 'Dark mode'}
						onClick={() => setDarkModeStatus(isDarkTheme ? DARK_MODE.LIGHT : DARK_MODE.DARK)}>
						{isDarkTheme ? <Sun size={14} /> : <Moon size={14} />}
					</IconButton>
					<IconButton label='Keyboard shortcuts (?)' onClick={() => usePageBuilderStore.getState().setOverlay('shortcuts')}>
						<Keyboard size={14} />
					</IconButton>
					<IconButton label='Save as template' onClick={() => setSaveAsTemplateOpen(true)}>
						<LayoutTemplate size={14} />
					</IconButton>
					<BuilderTooltip label={`Workflow: ${page.workflow?.name ?? 'missing'}`}>
						<Link
							to={paths.editPlaybook(ws, page.workflow_id)}
							target='_blank'
							aria-label='Open the workflow'
							className={`flex h-8 max-w-[180px] items-center gap-1.5 rounded-lg border border-zinc-200/80 bg-white px-2.5 text-xs font-semibold text-zinc-700 shadow-xs transition hover:bg-zinc-50 dark:border-white/10 dark:bg-zinc-900/60 dark:text-zinc-300 dark:hover:bg-white/[0.06] ${FOCUS_RING}`}>
							<GitMerge size={13} className='text-primary-700 dark:text-primary-400 shrink-0' />
							<span className='truncate'>{page.workflow?.name ?? 'Workflow'}</span>
						</Link>
					</BuilderTooltip>
				</div>

				{page.is_published && (
					<BuilderTooltip label='Open the live page' align='right'>
						<a
							href={liveUrl}
							target='_blank'
							rel='noopener noreferrer'
							aria-label='Open the live page'
							className={`hidden h-8 w-8 items-center justify-center rounded-lg border border-zinc-200/80 bg-white text-zinc-600 shadow-xs transition hover:bg-zinc-50 sm:flex dark:border-white/10 dark:bg-zinc-900/60 dark:text-zinc-300 ${FOCUS_RING}`}>
							<ExternalLink size={14} />
						</a>
					</BuilderTooltip>
				)}

				<BuilderTooltip label='Insights' align='right'>
					<Link
						to={paths.pageInsights(ws, page.id)}
						aria-label='Insights'
						className={`hidden h-8 w-8 items-center justify-center rounded-lg border border-zinc-200/80 bg-white text-zinc-600 shadow-xs transition hover:bg-zinc-50 sm:flex dark:border-white/10 dark:bg-zinc-900/60 dark:text-zinc-300 ${FOCUS_RING}`}>
						<ChartColumn size={14} />
					</Link>
				</BuilderTooltip>

				<button
					type='button'
					onClick={() => setGenerateOpen(true)}
					className={`hidden h-8 items-center gap-1.5 rounded-lg border border-violet-200 bg-violet-50 px-2.5 text-xs font-bold text-violet-700 shadow-xs transition hover:bg-violet-100 sm:flex dark:border-violet-500/30 dark:bg-violet-500/10 dark:text-violet-300 ${FOCUS_RING}`}>
					<Sparkles size={13} />
					<span className='hidden xl:inline'>Design with AI</span>
				</button>
				<GenerateDialog open={generateOpen} onClose={() => setGenerateOpen(false)} />

				<VariantMenu />

				<div className='relative'>
					<button
						type='button'
						aria-haspopup='dialog'
						aria-expanded={menu === 'share'}
						onClick={() => open('share')}
						className={`flex h-8 items-center gap-1.5 rounded-lg border px-2.5 text-xs font-semibold shadow-xs transition ${FOCUS_RING} ${
							menu === 'share'
								? 'border-primary-400/70 bg-primary-100 text-primary-900 dark:bg-primary-400/15 dark:text-primary-300'
								: 'border-zinc-200/80 bg-white text-zinc-700 hover:bg-zinc-50 dark:border-white/10 dark:bg-zinc-900/60 dark:text-zinc-300 dark:hover:bg-white/[0.06]'
						}`}>
						<Share2 size={13} className='text-primary-700 dark:text-primary-400' />
						<span className='hidden sm:inline'>Share</span>
					</button>
					<AnimatePresence>
						{menu === 'share' && (
							<>
								<div aria-hidden className='fixed inset-0 z-40' onClick={() => setShareOpen(false)} />
								<motion.div
									initial={{ opacity: 0, y: 4, scale: 0.98 }}
									animate={{ opacity: 1, y: 0, scale: 1 }}
									exit={{ opacity: 0, y: 4, scale: 0.98 }}
									transition={{ duration: 0.12 }}
									className='absolute top-10 right-0 z-50'>
									<ShareMenu onClose={() => setShareOpen(false)} />
								</motion.div>
							</>
						)}
					</AnimatePresence>
				</div>

				<div className='relative'>
					<button
						type='button'
						aria-haspopup='dialog'
						aria-expanded={menu === 'publish'}
						onClick={() => open('publish')}
						className={`bg-primary-400 text-primary-950 flex h-8 items-center gap-1.5 rounded-lg px-3 text-xs font-black shadow-sm transition hover:brightness-110 active:scale-[0.98] ${FOCUS_RING}`}>
						<Rocket size={13} />
						{page.is_published && !page.has_unpublished_changes ? 'Published' : 'Publish'}
						<ChevronDown size={12} className={`transition-transform ${menu === 'publish' ? 'rotate-180' : ''}`} />
					</button>
					<AnimatePresence>
						{menu === 'publish' && (
							<>
								<div aria-hidden className='fixed inset-0 z-40' onClick={() => setPublishOpen(false)} />
								<motion.div
									initial={{ opacity: 0, y: 4, scale: 0.98 }}
									animate={{ opacity: 1, y: 0, scale: 1 }}
									exit={{ opacity: 0, y: 4, scale: 0.98 }}
									transition={{ duration: 0.12 }}
									className='absolute top-10 right-0 z-50'>
									<PublishMenu
										onClose={() => setPublishOpen(false)}
										onShare={() => {
											setPublishOpen(false);
											setShareOpen(true);
										}}
									/>
								</motion.div>
							</>
						)}
					</AnimatePresence>
				</div>
			</div>
			<SaveAsTemplateModal
				ws={ws}
				kind='page'
				sourceId={page.id}
				isOpen={saveAsTemplateOpen}
				onClose={() => setSaveAsTemplateOpen(false)}
				defaultName={page.name}
				defaultDescription={page.description}
				beforeSave={async () => {
					// The template copies the server-side draft — save the edits still in the debounce.
					if (!(await flush())) throw new Error('The page could not be saved.');
				}}
			/>
		</header>
	);
};

export default BuilderTopbar;
