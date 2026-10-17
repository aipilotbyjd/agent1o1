import {
	Play,
	RotateCcw,
	RotateCw,
	Moon,
	Sun,
	Boxes,
	Rocket,
	Send,
	FileCheck2,
	Share2,
	ChevronDown,
	ChevronLeft,
	Keyboard,
	GitCompare,
	Library,
	MoreVertical,
	Sparkles,
	Loader2,
	Pencil,
	LayoutGrid,
	ShieldCheck,
	Download,
	FormInput,
	LayoutTemplate,
	ListChecks,
	Copy,
	Check,
	CloudCheck,
	CloudOff,
	CloudUpload,
	Folder,
	Layers,
	Square,
	Zap,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { Link } from 'react-router';
import DARK_MODE from '@/constants/darkMode.constant';
import useDarkMode from '@/hooks/useDarkMode';
import IssuesChecklist from './IssuesChecklist.partial';
import { useWorkflowEditor } from '../../_hooks/useWorkflowEditor.hook';
import { useAutoLayout } from '../../_hooks/useAutoLayout.hook';
import { usePersistWorkflowDraft } from '../../_hooks/usePersistWorkflowDraft.hook';
import { useRunWorkflow } from '../../_hooks/useRunWorkflow.hook';
import { useWorkflowShellStore } from '@/store/workflowShell.store';
import pages from '@/Routes/pages';
import paths from '@/Routes/paths';
import NotificationsDropdown from '@/components/notifications/NotificationsDropdown';
import AppLogo from '@/components/AppLogo';
import SaveAsTemplateModal from '@/parts/SaveAsTemplateModal.part';
import DraftStatusPill from '../versions/DraftStatusPill.partial';
import { useDraftStatus } from '../../_hooks/useDraftStatus.hook';
import PublishPopover from '../versions/PublishPopover.partial';
import { usePublishReview } from '../../_hooks/usePublishReview.hook';
import { useAiPanelAvailability } from '../../_hooks/useAiPanelAvailability.hook';
import WorkflowPagesMenu from '@/pages/coreapp/WorkflowPages/_partial/WorkflowPagesMenu.partial';

/** Which topbar menu is open. Only one may be open at a time. */
type TopbarMenu = 'publish' | 'save' | 'share' | 'mobile' | null;

/**
 * Shared focus ring. Every control in the bar is keyboard reachable, so every
 * control has to show where the focus actually sits.
 */
const FOCUS_RING =
	'outline-none focus-visible:ring-2 focus-visible:ring-primary-500/70 focus-visible:ring-offset-1 focus-visible:ring-offset-white dark:focus-visible:ring-offset-[#07080b]';

/**
 * Premium micro-tooltip with keyboard shortcut badge (Figma / Linear style).
 */
export const EditorTooltip = ({
	children,
	label,
	shortcut,
	placement = 'bottom',
	align = 'left',
	disabled = false,
}: {
	children: ReactNode;
	label: string;
	shortcut?: string;
	placement?: 'top' | 'bottom';
	align?: 'left' | 'right';
	disabled?: boolean;
}) => {
	const [visible, setVisible] = useState(false);
	const timeoutRef = useRef<number | null>(null);

	const handleMouseEnter = () => {
		if (disabled) return;
		timeoutRef.current = window.setTimeout(() => {
			setVisible(true);
		}, 200);
	};

	const handleMouseLeave = () => {
		if (timeoutRef.current) clearTimeout(timeoutRef.current);
		setVisible(false);
	};

	// Never leave a tooltip hanging over a menu that just opened, and never let a
	// pending timer fire after the trigger unmounts.
	const [wasDisabled, setWasDisabled] = useState(disabled);
	if (wasDisabled !== disabled) {
		setWasDisabled(disabled);
		if (disabled) setVisible(false);
	}

	useEffect(
		() => () => {
			if (timeoutRef.current) clearTimeout(timeoutRef.current);
		},
		[],
	);

	return (
		<div
			className='relative inline-flex items-center justify-center'
			onMouseEnter={handleMouseEnter}
			onMouseLeave={handleMouseLeave}
			onFocus={handleMouseEnter}
			onBlur={handleMouseLeave}>
			{children}
			<AnimatePresence>
				{visible && (
					<motion.div
						initial={{ opacity: 0, y: placement === 'bottom' ? -3 : 3, scale: 0.95 }}
						animate={{ opacity: 1, y: 0, scale: 1 }}
						exit={{ opacity: 0, scale: 0.95 }}
						transition={{ duration: 0.12 }}
						role='tooltip'
						className={[
							'ring-primary-500/25 dark:ring-primary-700/25 pointer-events-none absolute z-50 flex items-center gap-1.5 rounded-lg bg-zinc-900/95 px-2 py-1 text-[11px] font-medium whitespace-nowrap text-white shadow-xl ring-1 backdrop-blur-xs dark:bg-zinc-100 dark:text-zinc-900',
							placement === 'bottom' ? 'top-full mt-1.5' : 'bottom-full mb-1.5',
							// Right-hand controls anchor right so the tooltip cannot run off
							// the edge of the viewport.
							align === 'right' ? 'right-0' : 'left-0',
						].join(' ')}>
						<span>{label}</span>
						{shortcut && (
							<kbd className='bg-primary-400/20 py-0.2 text-primary-200 dark:bg-primary-700/25 dark:text-primary-900 rounded px-1 text-[10px] font-semibold'>
								{shortcut}
							</kbd>
						)}
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	);
};

export const EditableWorkflowName = ({
	name,
	onSave,
	className,
	inputClassName,
}: {
	name: string;
	onSave: (name: string) => void;
	className?: string;
	inputClassName?: string;
}) => {
	const [isEditing, setIsEditing] = useState(false);
	const [draft, setDraft] = useState(name);
	const inputRef = useRef<HTMLInputElement>(null);

	const [syncedName, setSyncedName] = useState(name);
	if (syncedName !== name) {
		setSyncedName(name);
		setDraft(name);
	}

	useEffect(() => {
		if (isEditing) {
			inputRef.current?.focus();
			inputRef.current?.select();
		}
	}, [isEditing]);

	const commit = () => {
		const trimmed = draft.trim();
		if (!trimmed || trimmed === name) {
			setDraft(name);
			setIsEditing(false);
			return;
		}
		setIsEditing(false);
		onSave(trimmed);
	};

	if (isEditing) {
		return (
			<input
				ref={inputRef}
				aria-label='Workflow name'
				value={draft}
				onChange={(e) => setDraft(e.target.value)}
				onBlur={commit}
				onKeyDown={(e) => {
					if (e.key === 'Enter') {
						e.preventDefault();
						commit();
					} else if (e.key === 'Escape') {
						e.preventDefault();
						setDraft(name);
						setIsEditing(false);
					}
				}}
				className={
					inputClassName ??
					'border-primary-500 ring-primary-500/30 dark:border-primary-400 h-7 max-w-[220px] rounded-lg border bg-white px-2 py-0.5 text-xs font-bold text-zinc-900 shadow-xs ring-2 outline-none dark:bg-zinc-900 dark:text-zinc-100'
				}
			/>
		);
	}

	return (
		<EditorTooltip label='Click to rename workflow' shortcut='Enter'>
			<button
				type='button'
				onClick={() => setIsEditing(true)}
				className={
					className ??
					`group hover:bg-primary-100/70 hover:text-primary-900 dark:hover:bg-primary-400/10 dark:hover:text-primary-200 flex max-w-[170px] items-center gap-1.5 rounded-lg px-2 py-1 text-left text-xs font-bold text-zinc-900 transition sm:max-w-[220px] dark:text-zinc-100 ${FOCUS_RING}`
				}>
				<span className='truncate'>{name}</span>
				<Pencil
					size={11}
					className='text-primary-700 dark:text-primary-400 shrink-0 opacity-0 transition-opacity duration-150 group-hover:opacity-100'
				/>
			</button>
		</EditorTooltip>
	);
};

const TopbarIconButton = ({
	label,
	shortcut,
	children,
	onClick,
	disabled,
	active,
	className,
	align,
}: {
	label: string;
	shortcut?: string;
	children: ReactNode;
	onClick?: () => void;
	disabled?: boolean;
	active?: boolean;
	className?: string;
	align?: 'left' | 'right';
}) => (
	<EditorTooltip label={label} shortcut={shortcut} align={align}>
		<button
			type='button'
			aria-label={label}
			onClick={onClick}
			disabled={disabled}
			aria-pressed={active}
			className={[
				'flex h-8 w-8 items-center justify-center rounded-lg border text-xs transition duration-150',
				FOCUS_RING,
				active
					? 'border-primary-400/70 bg-primary-100 text-primary-800 dark:border-primary-400/40 dark:bg-primary-400/15 dark:text-primary-300 shadow-xs'
					: 'text-primary-700 hover:border-primary-300 hover:bg-primary-100/70 hover:text-primary-900 dark:text-primary-400/85 dark:hover:border-primary-400/30 dark:hover:bg-primary-400/10 dark:hover:text-primary-300 border-zinc-200/80 bg-white dark:border-white/10 dark:bg-zinc-900/60',
				disabled
					? 'cursor-not-allowed opacity-35 hover:border-zinc-200/80 hover:bg-white dark:hover:border-white/10 dark:hover:bg-zinc-900/60'
					: '',
				className ?? '',
			]
				.filter(Boolean)
				.join(' ')}>
			{children}
		</button>
	</EditorTooltip>
);

const SaveStatusBadge = ({
	savingState,
	onRetry,
}: {
	savingState: 'saved' | 'saving' | 'dirty' | 'error';
	onRetry?: () => void;
}) => {
	const [isOpen, setIsOpen] = useState(false);

	const { Icon, label, className } = {
		saved: {
			Icon: CloudCheck,
			label: 'All changes saved',
			className: 'text-primary-700 dark:text-primary-400',
		},
		saving: {
			Icon: Loader2,
			label: 'Saving…',
			className: 'text-primary-600 dark:text-primary-400 animate-spin',
		},
		dirty: {
			Icon: CloudUpload,
			label: 'Unsaved changes',
			className: 'text-amber-600 dark:text-amber-400',
		},
		error: {
			Icon: CloudOff,
			label: 'Save failed. Click to retry',
			className: 'text-rose-600 dark:text-rose-400',
		},
	}[savingState];

	return (
		<div className='relative hidden sm:block'>
			<EditorTooltip label={label} disabled={isOpen}>
				<button
					type='button'
					aria-haspopup='dialog'
					aria-expanded={isOpen}
					aria-label={label}
					className={`flex h-7 w-7 items-center justify-center rounded-lg transition ${
						savingState === 'error'
							? 'bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/50 dark:hover:bg-rose-950/70'
							: 'hover:bg-primary-100/70 dark:hover:bg-primary-400/10'
					} ${FOCUS_RING}`}
					onClick={() => {
						if (savingState === 'error' && onRetry) {
							onRetry();
						} else {
							setIsOpen(!isOpen);
						}
					}}>
					<Icon size={15} className={className} />
				</button>
			</EditorTooltip>

			<AnimatePresence>
				{isOpen && (
					<>
						<div
							aria-hidden='true'
							className='fixed inset-0 z-40'
							onClick={() => setIsOpen(false)}
						/>
						<motion.div
							initial={{ opacity: 0, y: 4, scale: 0.96 }}
							animate={{ opacity: 1, y: 0, scale: 1 }}
							exit={{ opacity: 0, y: 4, scale: 0.96 }}
							className='border-primary-500/20 dark:border-primary-400/20 absolute top-8 left-0 z-50 w-60 rounded-xl border bg-white p-3 shadow-xl ring-1 ring-black/5 dark:bg-zinc-950 dark:ring-white/5'>
							<div className='flex items-center justify-between border-b border-zinc-100 pb-2 dark:border-zinc-800'>
								<span className='text-xs font-bold text-zinc-900 dark:text-zinc-100'>
									Cloud Sync Status
								</span>
								<span className='bg-primary-500/15 text-primary-800 dark:text-primary-300 rounded-full px-2 py-0.5 text-[10px] font-bold'>
									Connected
								</span>
							</div>
							<div className='mt-2 space-y-1.5 text-[11px] text-zinc-600 dark:text-zinc-400'>
								<p>Your draft saves automatically as you work.</p>
								<p className='text-[10px] text-zinc-400 dark:text-zinc-500'>
									Press{' '}
									<kbd className='bg-primary-100/80 text-primary-900 dark:bg-primary-400/15 dark:text-primary-300 rounded px-1 py-0.5 font-mono'>
										⌘S
									</kbd>{' '}
									to publish it as the live version.
								</p>
							</div>
						</motion.div>
					</>
				)}
			</AnimatePresence>
		</div>
	);
};

const Topbar = () => {
	const persistWorkflowDraft = usePersistWorkflowDraft();
	const { state, dispatch } = useWorkflowEditor();
	const autoLayout = useAutoLayout();
	const { isDarkTheme, setDarkModeStatus } = useDarkMode();
	const { runWorkflow, stopRun } = useRunWorkflow();
	const { isAiPanelAvailable, isAiPanelShown } = useAiPanelAvailability();
	const workspaceId = state.workflow.workspaceId ?? '';
	const playbooksPath = workspaceId ? paths.playbooks(workspaceId) : pages.choose.to;
	const dashboardPath = workspaceId ? paths.dashboard(workspaceId) : pages.choose.to;

	const setGovModalOpen = useWorkflowShellStore((store) => store.setGovModalOpen);
	const setGovModalTab = useWorkflowShellStore((store) => store.setGovModalTab);
	const openVersionPanel = useWorkflowShellStore((store) => store.openVersionPanel);
	// One menu at a time. Previously each menu had its own backdrop, so clicking a
	// second trigger while one was open was swallowed by that backdrop and the user
	// had to click twice.
	const [openMenu, setOpenMenu] = useState<TopbarMenu>(null);
	const isPublishOpen = openMenu === 'publish';
	const isSaveDropdownOpen = openMenu === 'save';
	const isShareDropdownOpen = openMenu === 'share';
	const isMobileMenuOpen = openMenu === 'mobile';
	const toggleMenu = (menu: Exclude<TopbarMenu, null>) =>
		setOpenMenu((current) => (current === menu ? null : menu));
	const closeMenu = () => setOpenMenu(null);
	const [copiedLink, setCopiedLink] = useState(false);
	const [isSaveAsTemplateOpen, setIsSaveAsTemplateOpen] = useState(false);
	const [runSeconds, setRunSeconds] = useState(0);

	const isRunning = state.run.status === 'running';
	const isRunDisabled = state.nodes.length === 0 && state.ui.emptyCanvasView !== 'chat-started';

	// Live Run Timer
	const [timedRun, setTimedRun] = useState(isRunning);
	if (timedRun !== isRunning) {
		setTimedRun(isRunning);
		setRunSeconds(0);
	}
	useEffect(() => {
		if (!isRunning) return;
		const start = Date.now();
		const timer = window.setInterval(() => {
			setRunSeconds(Math.floor((Date.now() - start) / 1000));
		}, 500);
		return () => clearInterval(timer);
	}, [isRunning]);

	// Escape closes whichever topbar menu is open.
	useEffect(() => {
		if (!openMenu) return;
		const onKeyDown = (event: KeyboardEvent) => {
			if (event.key === 'Escape') setOpenMenu(null);
		};
		window.addEventListener('keydown', onKeyDown);
		return () => window.removeEventListener('keydown', onKeyDown);
	}, [openMenu]);

	const handleCopyShareLink = () => {
		navigator.clipboard.writeText(window.location.href);
		setCopiedLink(true);
		setTimeout(() => setCopiedLink(false), 2000);
	};

	const handleRenameWorkflow = (name: string) => {
		dispatch({ type: 'SET_WORKFLOW_META', patch: { name, savingState: 'dirty' } });
	};

	// Cmd/Ctrl+S opens Publish; the draft itself already saves on its own.
	useEffect(() => {
		const onKeyDown = (event: KeyboardEvent) => {
			if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 's') {
				event.preventDefault();
				setOpenMenu('publish');
			}
		};
		window.addEventListener('keydown', onKeyDown);
		return () => window.removeEventListener('keydown', onKeyDown);
	}, []);

	const openVersionHistory = () => {
		closeMenu();
		if (state.ui.runPanelOpen) dispatch({ type: 'TOGGLE_RUN_PANEL' });
		openVersionPanel();
	};

	const { status: draftStatus, label: draftStatusLabel } = useDraftStatus();
	const hasUnpublishedWork = draftStatus === 'changed' || draftStatus === 'unpublished';
	const { requiresApproval, pending: pendingReview } = usePublishReview();
	const setReviewRequestId = useWorkflowShellStore((store) => store.setReviewRequestId);
	// An open review takes the Publish slot: following it shows the request,
	// and a newer draft is sent from there or from the Publish menu again.
	const publishLabel = pendingReview
		? 'In review'
		: requiresApproval
			? 'Request review'
			: 'Publish';
	const publishTooltip = pendingReview
		? 'See the changes waiting for review'
		: requiresApproval
			? 'Send your changes for review'
			: hasUnpublishedWork
				? 'Publish your changes'
				: 'Publish';

	return (
		<header className='relative z-40 flex h-14 shrink-0 items-center justify-between border-b border-zinc-200/80 bg-white/90 px-3 backdrop-blur-md select-none sm:px-4 dark:border-white/[0.08] dark:bg-[#07080b]/90'>
			{/* Primary accent hairline tying the bar to the brand colour. */}
			<span
				aria-hidden
				className='via-primary-500/45 pointer-events-none absolute inset-x-0 -bottom-px h-px bg-gradient-to-r from-transparent to-transparent'
			/>
			{/* Left Section: Back, Breadcrumb, Title, Version & Status */}
			<div className='flex min-w-0 items-center gap-1.5 sm:gap-2.5'>
				<EditorTooltip label='Back to Workflows'>
					<Link
						to={playbooksPath}
						aria-label='Back to Workflows'
						className={`hover:bg-primary-100/70 hover:text-primary-900 dark:hover:bg-primary-400/10 dark:hover:text-primary-300 flex h-8 w-8 items-center justify-center rounded-lg text-zinc-500 transition dark:text-zinc-400 ${FOCUS_RING}`}>
						<ChevronLeft size={18} />
					</Link>
				</EditorTooltip>

				<EditorTooltip label='Agent1o1 Dashboard'>
					<Link
						to={dashboardPath}
						className={`group text-primary-700 hover:text-primary-900 dark:text-primary-400 dark:hover:text-primary-300 hidden items-center rounded-lg transition sm:flex ${FOCUS_RING}`}>
						<AppLogo className='ring-primary-500/20 dark:ring-primary-400/20 size-7 ring-1' />
					</Link>
				</EditorTooltip>

				<span className='hidden text-zinc-300 sm:inline dark:text-zinc-700'>/</span>

				{/* Folder (if categorized) */}
				{state.workflow.folder && (
					<div className='hidden items-center gap-1.5 lg:flex'>
						<EditorTooltip label={`Folder: ${state.workflow.folder}`}>
							<span
								role='img'
								aria-label={`Folder: ${state.workflow.folder}`}
								className='flex h-7 w-7 items-center justify-center rounded-lg'>
								<Folder
									size={14}
									className='text-primary-700 dark:text-primary-400'
								/>
							</span>
						</EditorTooltip>
						<span className='text-zinc-300 dark:text-zinc-700'>/</span>
					</div>
				)}

				{/* Editable Workflow Title */}
				<EditableWorkflowName name={state.workflow.name} onSave={handleRenameWorkflow} />

				{/* Draft vs. live */}
				<EditorTooltip label={`${draftStatusLabel} · Version history`}>
					<DraftStatusPill
						onClick={openVersionHistory}
						className={`hidden sm:inline-flex ${FOCUS_RING}`}
					/>
				</EditorTooltip>

				{/* Node Count Chip */}
				<EditorTooltip
					label={`${state.nodes.length} nodes · ${state.edges.length} connections`}>
					<div
						role='img'
						aria-label={`${state.nodes.length} nodes, ${state.edges.length} connections`}
						className='text-primary-800 dark:text-primary-300/90 hidden h-7 items-center gap-1 rounded-lg px-1.5 text-[11px] font-semibold tabular-nums xl:flex'>
						<Layers size={14} className='text-primary-700 dark:text-primary-400' />
						<span>{state.nodes.length}</span>
					</div>
				</EditorTooltip>

				{/* Live Save Status */}
				<SaveStatusBadge
					savingState={state.workflow.savingState}
					onRetry={() => dispatch({ type: 'SET_SAVE_STATE', savingState: 'dirty' })}
				/>
			</div>

			{/* Center Section: Smooth Segmented Studio Control (Apps, Triggers, AI Chat) */}
			<div
				role='group'
				aria-label='Editor panels'
				className='border-primary-500/15 dark:border-primary-400/15 hidden items-center rounded-xl border bg-zinc-100/80 p-0.5 shadow-xs md:flex dark:bg-zinc-900/80'>
				<button
					type='button'
					aria-pressed={state.ui.leftPanelOpen && state.ui.leftPanelIntent === 'home'}
					onClick={() => dispatch({ type: 'TOGGLE_LEFT_PANEL', intent: 'home' })}
					className={[
						'relative flex h-7 items-center gap-1.5 rounded-lg px-2.5 text-xs font-bold transition duration-150',
						FOCUS_RING,
						state.ui.leftPanelOpen && state.ui.leftPanelIntent === 'home'
							? 'text-primary-800 ring-primary-500/25 dark:text-primary-300 dark:ring-primary-400/25 bg-white shadow-xs ring-1 dark:bg-zinc-800'
							: 'hover:bg-primary-100/60 hover:text-primary-900 dark:hover:bg-primary-400/10 dark:hover:text-primary-300 text-zinc-600 dark:text-zinc-400',
					].join(' ')}>
					<Boxes size={13} />
					<span>Apps</span>
				</button>

				<button
					type='button'
					aria-pressed={state.ui.leftPanelOpen && state.ui.leftPanelIntent === 'trigger'}
					onClick={() => dispatch({ type: 'TOGGLE_LEFT_PANEL', intent: 'trigger' })}
					className={[
						'relative flex h-7 items-center gap-1.5 rounded-lg px-2.5 text-xs font-bold transition duration-150',
						FOCUS_RING,
						state.ui.leftPanelOpen && state.ui.leftPanelIntent === 'trigger'
							? 'text-primary-800 ring-primary-500/25 dark:text-primary-300 dark:ring-primary-400/25 bg-white shadow-xs ring-1 dark:bg-zinc-800'
							: 'hover:bg-primary-100/60 hover:text-primary-900 dark:hover:bg-primary-400/10 dark:hover:text-primary-300 text-zinc-600 dark:text-zinc-400',
					].join(' ')}>
					<Rocket size={13} />
					<span>Triggers</span>
				</button>

				{isAiPanelAvailable && (
					<>
						<div className='bg-primary-500/20 dark:bg-primary-400/20 mx-0.5 h-3.5 w-px' />

						<button
							type='button'
							aria-pressed={isAiPanelShown}
							onClick={() => dispatch({ type: 'TOGGLE_AI_PANEL' })}
							className={[
								'relative flex h-7 items-center gap-1.5 rounded-lg px-2.5 text-xs font-bold transition duration-150',
								FOCUS_RING,
								isAiPanelShown
									? 'bg-primary-500/15 text-primary-800 ring-primary-500/35 dark:bg-primary-400/15 dark:text-primary-300 dark:ring-primary-400/40 shadow-xs ring-1'
									: 'hover:bg-primary-100/60 hover:text-primary-900 dark:hover:bg-primary-400/10 dark:hover:text-primary-300 text-zinc-600 dark:text-zinc-400',
							].join(' ')}>
							<Sparkles
								size={13}
								className='text-primary-700 dark:text-primary-400'
							/>
							<span>AI Chat</span>
						</button>
					</>
				)}
			</div>

			{/* Right Section: Canvas Controls & Actions */}
			<div className='flex items-center gap-1.5 sm:gap-2'>
				{/* Desktop History & Tools Group */}
				<div className='hidden items-center gap-1 xl:flex'>
					{/* Undo / Redo / Diff Group */}
					<div className='flex items-center rounded-lg border border-zinc-200/80 bg-zinc-50/50 p-0.5 dark:border-white/10 dark:bg-zinc-900/50'>
						<EditorTooltip label='Undo' shortcut='⌘Z'>
							<button
								type='button'
								aria-label='Undo'
								disabled={!state.history.past.length}
								onClick={() => dispatch({ type: 'UNDO' })}
								className={`text-primary-700 hover:bg-primary-100/70 hover:text-primary-900 dark:text-primary-400/85 dark:hover:bg-primary-400/10 dark:hover:text-primary-300 flex h-7 w-7 items-center justify-center rounded-md transition disabled:cursor-not-allowed disabled:text-zinc-400 disabled:opacity-30 disabled:hover:bg-transparent dark:disabled:text-zinc-500 ${FOCUS_RING}`}>
								<RotateCcw size={13} />
							</button>
						</EditorTooltip>
						<EditorTooltip label='Redo' shortcut='⌘⇧Z'>
							<button
								type='button'
								aria-label='Redo'
								disabled={!state.history.future.length}
								onClick={() => dispatch({ type: 'REDO' })}
								className={`text-primary-700 hover:bg-primary-100/70 hover:text-primary-900 dark:text-primary-400/85 dark:hover:bg-primary-400/10 dark:hover:text-primary-300 flex h-7 w-7 items-center justify-center rounded-md transition disabled:cursor-not-allowed disabled:text-zinc-400 disabled:opacity-30 disabled:hover:bg-transparent dark:disabled:text-zinc-500 ${FOCUS_RING}`}>
								<RotateCw size={13} />
							</button>
						</EditorTooltip>
						<div className='bg-primary-500/20 dark:bg-primary-400/20 mx-0.5 h-3.5 w-px' />
						<EditorTooltip label='Version Diff' shortcut='⌘⇧V'>
							<button
								type='button'
								aria-label='Version diff'
								disabled={!state.history.past.length}
								onClick={() => dispatch({ type: 'SET_DIFF_VIEWER', open: true })}
								className={`text-primary-700 hover:bg-primary-100/70 hover:text-primary-900 dark:text-primary-400/85 dark:hover:bg-primary-400/10 dark:hover:text-primary-300 flex h-7 w-7 items-center justify-center rounded-md transition disabled:cursor-not-allowed disabled:text-zinc-400 disabled:opacity-30 disabled:hover:bg-transparent dark:disabled:text-zinc-500 ${FOCUS_RING}`}>
								<GitCompare size={13} />
							</button>
						</EditorTooltip>
					</div>

					{/* Auto-layout */}
					<TopbarIconButton label='Auto-layout canvas' shortcut='L' onClick={autoLayout}>
						<LayoutGrid size={13} />
					</TopbarIconButton>

					{/* Dark mode */}
					<TopbarIconButton
						label={isDarkTheme ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
						onClick={() =>
							setDarkModeStatus(isDarkTheme ? DARK_MODE.LIGHT : DARK_MODE.DARK)
						}>
						{isDarkTheme ? <Sun size={13} /> : <Moon size={13} />}
					</TopbarIconButton>

					{/* Keyboard shortcuts */}
					<TopbarIconButton
						label='Keyboard Shortcuts'
						shortcut='?'
						onClick={() => dispatch({ type: 'SET_SHORTCUTS_OPEN', open: true })}>
						<Keyboard size={13} />
					</TopbarIconButton>
				</div>

				{/* Templates Modal Trigger */}
				<EditorTooltip label='Browse templates library'>
					<button
						type='button'
						onClick={() => dispatch({ type: 'SET_TEMPLATE_LIBRARY', open: true })}
						className={`hover:border-primary-400/60 hover:bg-primary-100/60 hover:text-primary-900 dark:hover:border-primary-400/30 dark:hover:bg-primary-400/10 dark:hover:text-primary-300 hidden h-8 items-center gap-1.5 rounded-lg border border-zinc-200/80 bg-white px-2.5 text-xs font-semibold text-zinc-700 shadow-xs transition md:flex dark:border-white/10 dark:bg-zinc-900/60 dark:text-zinc-300 ${FOCUS_RING}`}>
						<Library size={13} className='text-primary-700 dark:text-primary-400' />
						<span>Templates</span>
					</button>
				</EditorTooltip>

				{/* Share Dropdown */}
				<div className='relative hidden sm:block'>
					<button
						type='button'
						aria-haspopup='menu'
						aria-expanded={isShareDropdownOpen}
						onClick={() => toggleMenu('share')}
						className={[
							'flex h-8 items-center gap-1.5 rounded-lg border px-2.5 text-xs font-semibold shadow-xs transition',
							FOCUS_RING,
							isShareDropdownOpen
								? 'border-primary-400/70 bg-primary-100 text-primary-900 dark:border-primary-400/40 dark:bg-primary-400/15 dark:text-primary-300'
								: 'hover:border-primary-400/60 hover:bg-primary-100/60 hover:text-primary-900 dark:hover:border-primary-400/30 dark:hover:bg-primary-400/10 dark:hover:text-primary-300 border-zinc-200/80 bg-white text-zinc-700 dark:border-white/10 dark:bg-zinc-900/60 dark:text-zinc-300',
						].join(' ')}>
						<Share2 size={13} className='text-primary-700 dark:text-primary-400' />
						<span>Share</span>
						<ChevronDown
							size={12}
							className={`transition-transform duration-150 ${isShareDropdownOpen ? 'rotate-180' : ''}`}
						/>
					</button>

					<AnimatePresence>
						{isShareDropdownOpen && (
							<>
								<div
									aria-hidden='true'
									className='fixed inset-0 z-40'
									onClick={() => closeMenu()}
								/>
								<motion.div
									initial={{ opacity: 0, y: 4, scale: 0.96 }}
									animate={{ opacity: 1, y: 0, scale: 1 }}
									exit={{ opacity: 0, y: 4, scale: 0.96 }}
									role='menu'
									className='border-primary-500/20 dark:border-primary-400/20 absolute top-10 right-0 z-50 w-64 origin-top-right rounded-xl border bg-white p-1.5 shadow-xl ring-1 ring-black/5 dark:bg-zinc-950 dark:ring-white/5'>
									<button
										type='button'
										onClick={handleCopyShareLink}
										className='hover:bg-primary-100/70 hover:text-primary-900 dark:hover:bg-primary-400/10 dark:hover:text-primary-200 flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-xs font-medium text-zinc-700 transition dark:text-zinc-300'>
										<div className='flex items-center gap-2'>
											{copiedLink ? (
												<Check
													size={14}
													className='text-primary-700 dark:text-primary-400'
												/>
											) : (
												<Copy
													size={14}
													className='text-primary-700 dark:text-primary-400'
												/>
											)}
											<span>
												{copiedLink ? 'Link Copied!' : 'Copy Workflow URL'}
											</span>
										</div>
									</button>

									<button
										type='button'
										onClick={() => {
											closeMenu();
											dispatch({ type: 'SET_IMPORT_EXPORT', open: true });
										}}
										className='hover:bg-primary-100/70 hover:text-primary-900 dark:hover:bg-primary-400/10 dark:hover:text-primary-200 flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-xs font-medium text-zinc-700 transition dark:text-zinc-300'>
										<Download
											size={14}
											className='text-primary-700 dark:text-primary-400'
										/>
										<span>Export JSON Blueprint</span>
									</button>

									<div className='bg-primary-500/15 dark:bg-primary-400/15 my-1 h-px' />

									{workspaceId && state.workflow.apiId && (
										<>
											<WorkflowPagesMenu
												ws={workspaceId}
												workflowId={state.workflow.apiId}
												onNavigate={closeMenu}
											/>
											<div className='bg-primary-500/15 dark:bg-primary-400/15 my-1 h-px' />
										</>
									)}

									<button
										type='button'
										onClick={() => {
											closeMenu();
											setGovModalTab('sharing');
											setGovModalOpen(true);
										}}
										className='hover:bg-primary-100/70 hover:text-primary-900 dark:hover:bg-primary-400/10 dark:hover:text-primary-200 flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-xs font-medium text-zinc-700 transition dark:text-zinc-300'>
										<ShieldCheck
											size={14}
											className='text-primary-700 dark:text-primary-400'
										/>
										<span>Access & Governance</span>
									</button>
								</motion.div>
							</>
						)}
					</AnimatePresence>
				</div>

				{/* Notifications */}
				<div className='flex items-center'>
					<NotificationsDropdown />
				</div>

				<IssuesChecklist />

				{/* Publish Split Button */}
				<div
					className={[
						'relative flex items-center rounded-lg border shadow-xs transition duration-150',
						// Something waiting to go live earns the accent.
						hasUnpublishedWork
							? 'border-primary-400/70 bg-primary-100/60 dark:border-primary-400/40 dark:bg-primary-400/10'
							: 'border-zinc-200/80 bg-white dark:border-white/10 dark:bg-zinc-900/80',
					].join(' ')}>
					<EditorTooltip
						label={publishTooltip}
						shortcut={pendingReview ? undefined : '⌘S'}
						disabled={isSaveDropdownOpen || isPublishOpen}>
						<button
							type='button'
							aria-haspopup='dialog'
							aria-expanded={isPublishOpen}
							onClick={() => {
								if (pendingReview) {
									closeMenu();
									setReviewRequestId(pendingReview.id);
								} else {
									toggleMenu('publish');
								}
							}}
							className={[
								'hover:bg-primary-100/70 dark:hover:bg-primary-400/10 flex h-8 items-center gap-1.5 rounded-l-lg px-2.5 text-xs font-bold transition sm:px-3',
								FOCUS_RING,
								hasUnpublishedWork
									? 'text-primary-900 dark:text-primary-300'
									: 'hover:text-primary-900 dark:hover:text-primary-300 text-zinc-700 dark:text-zinc-200',
							].join(' ')}>
							{pendingReview ? (
								<FileCheck2
									size={13}
									className='text-amber-600 dark:text-amber-400'
								/>
							) : requiresApproval ? (
								<Send
									size={13}
									className='text-primary-700 dark:text-primary-400'
								/>
							) : (
								<Rocket
									size={13}
									className='text-primary-700 dark:text-primary-400'
								/>
							)}
							<span>{publishLabel}</span>
						</button>
					</EditorTooltip>

					<AnimatePresence>
						{isPublishOpen && <PublishPopover onClose={closeMenu} />}
					</AnimatePresence>

					<button
						type='button'
						aria-label='Save and release options'
						aria-haspopup='menu'
						aria-expanded={isSaveDropdownOpen}
						onClick={() => toggleMenu('save')}
						className={`text-primary-700 hover:bg-primary-100/70 hover:text-primary-900 dark:text-primary-400 dark:hover:bg-primary-400/10 dark:hover:text-primary-300 flex h-8 items-center justify-center rounded-r-lg border-l border-zinc-200/80 px-1.5 transition dark:border-white/10 ${FOCUS_RING}`}>
						<ChevronDown
							size={13}
							className={`transition-transform duration-150 ${isSaveDropdownOpen ? 'rotate-180' : ''}`}
						/>
					</button>

					<AnimatePresence>
						{isSaveDropdownOpen && (
							<>
								<div
									aria-hidden='true'
									className='fixed inset-0 z-40'
									onClick={() => closeMenu()}
								/>
								<motion.div
									initial={{ opacity: 0, y: 4, scale: 0.96 }}
									animate={{ opacity: 1, y: 0, scale: 1 }}
									exit={{ opacity: 0, y: 4, scale: 0.96 }}
									transition={{ duration: 0.12 }}
									role='menu'
									className='border-primary-500/20 dark:border-primary-400/20 absolute top-10 right-0 z-50 w-56 origin-top-right rounded-xl border bg-white p-1.5 shadow-xl ring-1 ring-black/5 dark:bg-zinc-950 dark:ring-white/5'>
									<div className='text-primary-800/70 dark:text-primary-400/70 px-2 py-1 text-[10px] font-bold tracking-wider uppercase'>
										Governance & Versions
									</div>
									<button
										type='button'
										onClick={openVersionHistory}
										className='hover:bg-primary-100/70 hover:text-primary-900 dark:hover:bg-primary-400/10 dark:hover:text-primary-200 flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-xs font-medium text-zinc-700 transition dark:text-zinc-300'>
										<GitCompare
											size={14}
											className='text-primary-700 dark:text-primary-400'
										/>
										<span>Version History</span>
									</button>
									<button
										type='button'
										onClick={() => {
											closeMenu();
											setGovModalTab('approvals');
											setGovModalOpen(true);
										}}
										className='hover:bg-primary-100/70 hover:text-primary-900 dark:hover:bg-primary-400/10 dark:hover:text-primary-200 flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-xs font-medium text-zinc-700 transition dark:text-zinc-300'>
										<ShieldCheck
											size={14}
											className='text-primary-700 dark:text-primary-400'
										/>
										<span>Approvals</span>
									</button>
									<button
										type='button'
										onClick={() => {
											closeMenu();
											setGovModalTab('interface');
											setGovModalOpen(true);
										}}
										className='hover:bg-primary-100/70 hover:text-primary-900 dark:hover:bg-primary-400/10 dark:hover:text-primary-200 flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-xs font-medium text-zinc-700 transition dark:text-zinc-300'>
										<FormInput
											size={14}
											className='text-primary-700 dark:text-primary-400'
										/>
										<span>Run Form</span>
									</button>
									<button
										type='button'
										onClick={() => {
											closeMenu();
											setGovModalTab('triggers');
											setGovModalOpen(true);
										}}
										className='hover:bg-primary-100/70 hover:text-primary-900 dark:hover:bg-primary-400/10 dark:hover:text-primary-200 flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-xs font-medium text-zinc-700 transition dark:text-zinc-300'>
										<Zap
											size={14}
											className='text-primary-700 dark:text-primary-400'
										/>
										<span>Triggers</span>
									</button>

									<div className='bg-primary-500/15 dark:bg-primary-400/15 my-1 h-px' />

									<button
										type='button'
										onClick={() => {
											closeMenu();
											dispatch({ type: 'SET_IMPORT_EXPORT', open: true });
										}}
										className='hover:bg-primary-100/70 hover:text-primary-900 dark:hover:bg-primary-400/10 dark:hover:text-primary-200 flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-xs font-medium text-zinc-700 transition dark:text-zinc-300'>
										<Download
											size={14}
											className='text-primary-700 dark:text-primary-400'
										/>
										<span>Export Workflow JSON</span>
									</button>
									<button
										type='button'
										disabled={!state.workflow.apiId}
										onClick={() => {
											closeMenu();
											setIsSaveAsTemplateOpen(true);
										}}
										className='hover:bg-primary-100/70 hover:text-primary-900 dark:hover:bg-primary-400/10 dark:hover:text-primary-200 flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-xs font-medium text-zinc-700 transition disabled:opacity-50 dark:text-zinc-300'>
										<LayoutTemplate
											size={14}
											className='text-primary-700 dark:text-primary-400'
										/>
										<span>Save as Template</span>
									</button>
								</motion.div>
							</>
						)}
					</AnimatePresence>
				</div>

				<button
					type='button'
					aria-label='Toggle runs panel'
					aria-pressed={state.ui.runPanelOpen}
					onClick={() => dispatch({ type: 'TOGGLE_RUN_PANEL' })}
					className={`hidden h-8 shrink-0 items-center gap-1.5 rounded-lg border px-3 text-xs font-medium transition md:inline-flex ${FOCUS_RING} ${state.ui.runPanelOpen ? 'border-zinc-300 bg-zinc-100 text-zinc-900 dark:border-white/15 dark:bg-white/10 dark:text-white' : 'border-zinc-200 text-zinc-500 hover:bg-zinc-50 dark:border-white/10 dark:text-zinc-400 dark:hover:bg-white/5'}`}>
					<ListChecks size={14} />
					Runs
				</button>

				{/* Primary Run Action */}
				<EditorTooltip
					label={
						isRunning
							? 'Stop Execution'
							: isRunDisabled
								? 'Add nodes to run'
								: 'Run Workflow'
					}
					shortcut='⌘↵'
					align='right'>
					<motion.button
						whileTap={!isRunDisabled ? { scale: 0.98 } : undefined}
						type='button'
						onClick={isRunning ? stopRun : runWorkflow}
						disabled={isRunDisabled}
						className={[
							'flex h-8 shrink-0 items-center gap-1.5 rounded-lg px-3.5 text-xs font-bold shadow-sm transition duration-150 sm:px-4',
							FOCUS_RING,
							isRunDisabled ? 'cursor-not-allowed opacity-40' : 'cursor-pointer',
							isRunning
								? 'bg-rose-600 text-white shadow-rose-950/20 hover:bg-rose-500'
								: 'from-primary-400 to-primary-500 text-primary-foreground shadow-primary-500/30 hover:from-primary-500 hover:to-primary-600 hover:shadow-primary-500/40 bg-gradient-to-r active:shadow-none',
						].join(' ')}>
						{isRunning ? (
							<>
								<Square size={11} fill='currentColor' />
								<span>Stop ({runSeconds}s)</span>
							</>
						) : (
							<>
								<Play size={11} fill='currentColor' />
								<span>Run</span>
							</>
						)}
					</motion.button>
				</EditorTooltip>

				{/* Mobile More Options Button */}
				<div className='relative md:hidden'>
					<TopbarIconButton
						label='More Options'
						align='right'
						active={isMobileMenuOpen}
						onClick={() => toggleMenu('mobile')}>
						<MoreVertical size={15} />
					</TopbarIconButton>

					<AnimatePresence>
						{isMobileMenuOpen && (
							<>
								<div
									aria-hidden='true'
									className='fixed inset-0 z-40'
									onClick={() => closeMenu()}
								/>
								<motion.div
									initial={{ opacity: 0, y: 4, scale: 0.96 }}
									animate={{ opacity: 1, y: 0, scale: 1 }}
									exit={{ opacity: 0, y: 4, scale: 0.96 }}
									role='menu'
									className='border-primary-500/20 dark:border-primary-400/20 absolute top-10 right-0 z-50 w-56 origin-top-right rounded-xl border bg-white p-1.5 shadow-xl ring-1 ring-black/5 dark:bg-zinc-950 dark:ring-white/5'>
									<button
										type='button'
										onClick={() => {
											closeMenu();
											dispatch({
												type: 'TOGGLE_LEFT_PANEL',
												intent: 'home',
											});
										}}
										className='hover:bg-primary-100/70 hover:text-primary-900 dark:hover:bg-primary-400/10 dark:hover:text-primary-200 flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-zinc-700 dark:text-zinc-300'>
										<Boxes
											size={14}
											className='text-primary-700 dark:text-primary-400'
										/>
										<span>Apps & Nodes</span>
									</button>
									<button
										type='button'
										onClick={() => {
											closeMenu();
											dispatch({
												type: 'TOGGLE_LEFT_PANEL',
												intent: 'trigger',
											});
										}}
										className='hover:bg-primary-100/70 hover:text-primary-900 dark:hover:bg-primary-400/10 dark:hover:text-primary-200 flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-zinc-700 dark:text-zinc-300'>
										<Rocket
											size={14}
											className='text-primary-700 dark:text-primary-400'
										/>
										<span>Triggers</span>
									</button>
									{isAiPanelAvailable && (
										<button
											type='button'
											onClick={() => {
												closeMenu();
												dispatch({ type: 'TOGGLE_AI_PANEL' });
											}}
											className='hover:bg-primary-100/70 hover:text-primary-900 dark:hover:bg-primary-400/10 dark:hover:text-primary-200 flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-zinc-700 dark:text-zinc-300'>
											<Sparkles
												size={14}
												className='text-primary-700 dark:text-primary-400'
											/>
											<span>AI Assistant</span>
										</button>
									)}

									<div className='bg-primary-500/15 dark:bg-primary-400/15 my-1 h-px' />

									<button
										type='button'
										onClick={() => {
											closeMenu();
											dispatch({ type: 'SET_TEMPLATE_LIBRARY', open: true });
										}}
										className='hover:bg-primary-100/70 hover:text-primary-900 dark:hover:bg-primary-400/10 dark:hover:text-primary-200 flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-zinc-700 dark:text-zinc-300'>
										<Library
											size={14}
											className='text-primary-700 dark:text-primary-400'
										/>
										<span>Templates</span>
									</button>
									<button
										type='button'
										onClick={() => {
											closeMenu();
											handleCopyShareLink();
										}}
										className='hover:bg-primary-100/70 hover:text-primary-900 dark:hover:bg-primary-400/10 dark:hover:text-primary-200 flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-zinc-700 dark:text-zinc-300'>
										<Share2
											size={14}
											className='text-primary-700 dark:text-primary-400'
										/>
										<span>Share Workflow</span>
									</button>
									<button
										type='button'
										onClick={openVersionHistory}
										className='hover:bg-primary-100/70 hover:text-primary-900 dark:hover:bg-primary-400/10 dark:hover:text-primary-200 flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-zinc-700 dark:text-zinc-300'>
										<GitCompare
											size={14}
											className='text-primary-700 dark:text-primary-400'
										/>
										<span>Version History</span>
									</button>

									<div className='bg-primary-500/15 dark:bg-primary-400/15 my-1 h-px' />

									<button
										type='button'
										onClick={() => {
											closeMenu();
											dispatch({ type: 'SET_SHORTCUTS_OPEN', open: true });
										}}
										className='hover:bg-primary-100/70 hover:text-primary-900 dark:hover:bg-primary-400/10 dark:hover:text-primary-200 flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-zinc-700 dark:text-zinc-300'>
										<Keyboard
											size={14}
											className='text-primary-700 dark:text-primary-400'
										/>
										<span>Keyboard Shortcuts</span>
									</button>

									<button
										type='button'
										onClick={() => {
											setDarkModeStatus(
												isDarkTheme ? DARK_MODE.LIGHT : DARK_MODE.DARK,
											);
										}}
										className='hover:bg-primary-100/70 hover:text-primary-900 dark:hover:bg-primary-400/10 dark:hover:text-primary-200 flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-zinc-700 dark:text-zinc-300'>
										{isDarkTheme ? (
											<Sun
												size={14}
												className='text-primary-700 dark:text-primary-400'
											/>
										) : (
											<Moon
												size={14}
												className='text-primary-700 dark:text-primary-400'
											/>
										)}
										<span>{isDarkTheme ? 'Light Mode' : 'Dark Mode'}</span>
									</button>
								</motion.div>
							</>
						)}
					</AnimatePresence>
				</div>
			</div>
			{state.workflow.apiId && (
				<SaveAsTemplateModal
					ws={workspaceId}
					kind='workflow'
					sourceId={state.workflow.apiId}
					isOpen={isSaveAsTemplateOpen}
					onClose={() => setIsSaveAsTemplateOpen(false)}
					defaultName={state.workflow.name}
					beforeSave={async () => {
						// The template copies the server-side draft: push the canvas first.
						await persistWorkflowDraft({
							workspaceId,
							workflowId: state.workflow.apiId!,
							name: state.workflow.name,
							description: state.workflow.description,
							nodes: state.nodes,
							edges: state.edges,
						});
					}}
				/>
			)}
		</header>
	);
};

export default Topbar;
