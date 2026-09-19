import {
	Bot,
	Play,
	RotateCcw,
	RotateCw,
	Settings2,
	Moon,
	Square,
	Sun,
	Boxes,
	Rocket,
	Share,
	ChevronDown,
	Save,
	Keyboard,
	GitCompare,
	Library,
	MoreVertical,
	Sparkles,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { Link } from 'react-router';
import DARK_MODE from '@/constants/darkMode.constant';
import useDarkMode from '@/hooks/useDarkMode';
import { useCreateWorkflowVersion, useUpdateWorkflow } from '@/api/modules/workflows';
import { useWorkflowEditor } from '../../_context/WorkflowEditorProvider.context';
import { buildVersionPayload } from '../../_helper/workflowApiTransform.helper';
import { useRunWorkflow } from '../../_hooks/useRunWorkflow.hook';
import { useAiChatStore } from '@/store/aiChat.store';
import { useWorkflowShellStore } from '@/store/workflowShell.store';

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

	useEffect(() => {
		setDraft(name);
	}, [name]);

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
					'rounded-md border border-primary-300 bg-white px-1.5 py-0.5 text-sm font-bold text-zinc-800 outline-none focus:ring-1 focus:ring-primary-500 dark:border-primary-700 dark:bg-zinc-900 dark:text-zinc-100'
				}
			/>
		);
	}

	return (
		<button
			type='button'
			title='Click to rename workflow'
			onClick={() => setIsEditing(true)}
			className={
				className ??
				'truncate rounded-md px-1 py-0.5 text-left font-bold text-zinc-800 hover:bg-zinc-100 dark:text-zinc-100 dark:hover:bg-white/[0.06]'
			}>
			{name}
		</button>
	);
};

const PurpleOutlineButton = ({
	children,
	onClick,
	disabled,
	active,
}: {
	children: ReactNode;
	onClick?: () => void;
	disabled?: boolean;
	active?: boolean;
}) => (
	<button
		type='button'
		onClick={onClick}
		disabled={disabled}
		className={[
			'flex h-9 items-center gap-1.5 sm:gap-2 rounded-lg border px-2.5 sm:px-3 text-xs font-semibold shadow-xs transition disabled:cursor-not-allowed disabled:opacity-40',
			active
				? 'border-primary-300 bg-primary-50 text-primary-700 dark:border-primary-700/60 dark:bg-primary-950/40 dark:text-primary-300'
				: 'border-zinc-200 bg-white text-primary-600 hover:bg-zinc-50 dark:border-zinc-800/40 dark:bg-zinc-900 dark:text-primary-400 dark:hover:bg-white/[0.04]',
		].join(' ')}>
		{children}
	</button>
);

const IconButton = ({
	title,
	children,
	onClick,
	disabled,
	active,
}: {
	title: string;
	children: ReactNode;
	onClick?: () => void;
	disabled?: boolean;
	active?: boolean;
}) => (
	<button
		type='button'
		title={title}
		aria-label={title}
		onClick={onClick}
		disabled={disabled}
		className={[
			'flex h-9 w-9 items-center justify-center rounded-lg border text-sm transition',
			active
				? 'border-emerald-300/40 bg-emerald-50 text-emerald-700 dark:border-emerald-300/30 dark:bg-emerald-400/15 dark:text-emerald-200'
				: 'border-zinc-200 bg-white text-zinc-500 hover:bg-zinc-100 hover:text-zinc-950 dark:border-white/10 dark:bg-white/[0.03] dark:text-zinc-400 dark:hover:bg-white/[0.07] dark:hover:text-white',
			disabled ? 'cursor-not-allowed opacity-30' : '',
		].join(' ')}>
		{children}
	</button>
);

const Topbar = () => {
	const { state, dispatch } = useWorkflowEditor();
	const { isDarkTheme, setDarkModeStatus } = useDarkMode();
	const { runWorkflow, stopRun } = useRunWorkflow();
	const saveVersion = useCreateWorkflowVersion(state.workflow.workspaceId ?? '');
	const updateWorkflow = useUpdateWorkflow(state.workflow.workspaceId ?? '');
	const setGovModalOpen = useWorkflowShellStore((store) => store.setGovModalOpen);
	const setGovModalTab = useWorkflowShellStore((store) => store.setGovModalTab);
	const [isSaveDropdownOpen, setIsSaveDropdownOpen] = useState(false);
	const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
	const isRunning = state.run.status === 'running';

	const handleRenameWorkflow = (name: string) => {
		dispatch({ type: 'SET_WORKFLOW_META', patch: { name, savingState: 'dirty' } });
		if (!state.workflow.workspaceId || !state.workflow.apiId) return;
		updateWorkflow.mutate(
			{ id: state.workflow.apiId, body: { name } },
			{
				onSuccess: () => dispatch({ type: 'SET_WORKFLOW_META', patch: { savingState: 'saved' } }),
				onError: () => dispatch({ type: 'SET_SAVE_STATE', savingState: 'error' }),
			},
		);
	};

	const handleSave = () => {
		if (!state.workflow.workspaceId || !state.workflow.apiId) {
			dispatch({ type: 'SET_SAVE_STATE', savingState: 'dirty' });
			return;
		}

		dispatch({ type: 'SET_SAVE_STATE', savingState: 'saving' });
		saveVersion.mutate(
			{
				id: state.workflow.apiId,
				body: buildVersionPayload(state),
			},
			{
				onSuccess: (version) => {
					dispatch({
						type: 'SET_WORKFLOW_META',
						patch: {
							currentVersionId: version.id,
							currentVersionNumber: version.version_number,
							savingState: 'saved',
						},
					});
				},
				onError: () => dispatch({ type: 'SET_SAVE_STATE', savingState: 'error' }),
			},
		);
	};

	const isChatActive = useAiChatStore((store) => store.isChatActive);

	if (isChatActive) {
		return (
			<header className='z-20 flex h-14 w-full shrink-0 items-center justify-between border-b border-zinc-200 bg-white px-6 dark:border-white/10 dark:bg-[#07080b] select-none'>
				{/* Left Section: Breadcrumb Title */}
				<div className='flex items-center gap-2'>
					<span className='flex items-center gap-1 text-zinc-400 dark:text-zinc-550 text-sm font-medium'>
						<svg className='h-4 w-4 stroke-current mr-1 text-zinc-500' viewBox='0 0 24 24' fill='none' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'>
							<path d='M22 12h-4l-3 9L9 3l-3 9H2' />
						</svg>
						<span className='hidden sm:inline'>Pipeline</span>
						<span className='hidden sm:inline mx-1 text-zinc-300 dark:text-zinc-700'>/</span>
					</span>
					<EditableWorkflowName name={state.workflow.name} onSave={handleRenameWorkflow} />
				</div>

				{/* Right Section: Notification bell with badge dot */}
				<div className='flex items-center gap-3'>
					<button
						type='button'
						title='Notifications'
						className='relative flex h-8 w-8 items-center justify-center rounded-lg text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800 dark:text-zinc-450 dark:hover:bg-white/[0.05] dark:hover:text-white'
					>
						<svg className='h-5 w-5 fill-none stroke-current' viewBox='0 0 24 24' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'>
							<path d='M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9' />
							<path d='M10.3 21a1.94 1.94 0 0 0 3.4 0' />
						</svg>
						<span className='absolute top-1 right-1 h-2 w-2 rounded-full bg-primary-400 ring-2 ring-white dark:ring-[#07080b]' />
					</button>
				</div>
			</header>
		);
	}

	return (
		<header className='z-20 flex h-16 shrink-0 items-center justify-between border-b border-zinc-200 bg-white px-5 dark:border-white/10 dark:bg-[#07080b]'>
			{/* Left Section: Branding & Navigation */}
			<div className='flex items-center gap-4'>
				<div className='flex items-center gap-2'>
					<Link to='/dashboard' className='flex items-center gap-1.5 text-primary-600 dark:text-primary-400 hover:opacity-80 transition-opacity'>
						<Bot size={24} strokeWidth={2.5} />
						<span className='text-base font-extrabold tracking-tight hidden sm:inline'>agent101</span>
					</Link>
					<button
						type='button'
						title='Workspace Settings'
						className='flex h-7 w-7 items-center justify-center rounded-lg text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-white/[0.05] dark:hover:text-white hidden sm:flex'>
						<Settings2 size={15} />
					</button>
				</div>

				<div className='h-6 w-px bg-zinc-200 dark:bg-zinc-800 hidden sm:block' />

				<EditableWorkflowName
					name={state.workflow.name}
					onSave={handleRenameWorkflow}
					className='max-w-[220px] truncate rounded-md px-1.5 py-1 text-left text-sm font-bold text-zinc-800 hover:bg-zinc-100 dark:text-zinc-100 dark:hover:bg-white/[0.06] hidden sm:block'
					inputClassName='max-w-[220px] rounded-md border border-primary-300 bg-white px-1.5 py-1 text-sm font-bold text-zinc-800 outline-none focus:ring-1 focus:ring-primary-500 dark:border-primary-700 dark:bg-zinc-900 dark:text-zinc-100'
				/>

				<div className='h-6 w-px bg-zinc-200 dark:bg-zinc-800 hidden sm:block' />

				{/* Add buttons — visible as icon-only on mobile, full buttons on desktop */}
				<div className='flex items-center gap-1.5 sm:gap-2'>
					<PurpleOutlineButton onClick={() => dispatch({ type: 'TOGGLE_AI_PANEL' })}>
						<Sparkles size={14} className='text-primary-600 dark:text-primary-400' />
						<span className='hidden sm:inline'>{state.ui.aiPanelOpen ? 'Hide Chat' : 'AI Chat'}</span>
					</PurpleOutlineButton>
					{state.ui.leftPanelOpen && state.ui.leftPanelIntent === 'home' ? (
						<button
							type='button'
							onClick={() => dispatch({ type: 'TOGGLE_LEFT_PANEL', intent: 'home' })}
							className='dark:bg-primary-400 dark:hover:bg-primary-500 flex h-9 cursor-pointer items-center gap-1.5 sm:gap-2 rounded-lg bg-primary-400 px-2.5 sm:px-3 text-xs font-semibold text-primary-950 shadow-xs transition hover:bg-primary-500'>
							<Boxes size={14} className='text-white' />
							<span className='hidden sm:inline'>Apps</span>
						</button>
					) : (
						<PurpleOutlineButton
							onClick={() => dispatch({ type: 'TOGGLE_LEFT_PANEL', intent: 'home' })}>
							<Boxes size={14} className='text-primary-600 dark:text-primary-400' />
							<span className='hidden sm:inline'>Apps</span>
						</PurpleOutlineButton>
					)}
					{state.ui.leftPanelOpen && state.ui.leftPanelIntent === 'trigger' ? (
						<button
							type='button'
							onClick={() => dispatch({ type: 'TOGGLE_LEFT_PANEL', intent: 'trigger' })}
							className='dark:bg-primary-400 dark:hover:bg-primary-500 flex h-9 cursor-pointer items-center gap-1.5 sm:gap-2 rounded-lg bg-primary-400 px-2.5 sm:px-3 text-xs font-semibold text-primary-950 shadow-xs transition hover:bg-primary-500'>
							<Rocket size={14} className='fill-white text-white' />
							<span className='hidden sm:inline'>Triggers</span>
						</button>
					) : (
						<PurpleOutlineButton
							onClick={() => dispatch({ type: 'TOGGLE_LEFT_PANEL', intent: 'trigger' })}>
							<Rocket
								size={14}
								className='fill-primary-600 text-primary-600 dark:fill-primary-400 dark:text-primary-400'
							/>
							<span className='hidden sm:inline'>Triggers</span>
						</PurpleOutlineButton>
					)}
				</div>
			</div>

			{/* Right Section: Action Controls — hidden on mobile, only the agent logo shows */}
			<div className='flex items-center gap-1.5 sm:gap-3.5'>
				{/* Desktop-only action groups */}
				<div className='hidden md:flex items-center gap-3.5'>
					{/* Undo/Redo & Darkmode & Keyboard */}
					<div className='flex items-center gap-1.5'>
						<IconButton
							title='Undo (⌘Z)'
							onClick={() => dispatch({ type: 'UNDO' })}
							disabled={!state.history.past.length}>
							<RotateCcw size={14} />
						</IconButton>
						<IconButton
							title='Redo (⌘⇧Z)'
							onClick={() => dispatch({ type: 'REDO' })}
							disabled={!state.history.future.length}>
							<RotateCw size={14} />
						</IconButton>
						<IconButton
							title='Version diff (⌘⇧V)'
							onClick={() => dispatch({ type: 'SET_DIFF_VIEWER', open: true })}
							disabled={!state.history.past.length}>
							<GitCompare size={14} />
						</IconButton>
						<IconButton
							title={isDarkTheme ? 'Switch to light mode' : 'Switch to dark mode'}
							onClick={() =>
								setDarkModeStatus(isDarkTheme ? DARK_MODE.LIGHT : DARK_MODE.DARK)
							}>
							{isDarkTheme ? <Sun size={14} /> : <Moon size={14} />}
						</IconButton>
						<IconButton
							title='Keyboard shortcuts (?)'
							onClick={() => dispatch({ type: 'SET_SHORTCUTS_OPEN', open: true })}>
							<Keyboard size={14} />
						</IconButton>
					</div>

					<div className='h-6 w-px bg-zinc-200 dark:bg-zinc-800' />

					<PurpleOutlineButton
						onClick={() => dispatch({ type: 'SET_TEMPLATE_LIBRARY', open: true })}>
						<Library size={14} className='text-primary-600 dark:text-primary-400' />
						<span>Templates</span>
					</PurpleOutlineButton>
					<PurpleOutlineButton
						onClick={() => {
							setGovModalTab('sharing');
							setGovModalOpen(true);
						}}>
						<Share size={14} className='text-primary-600 dark:text-primary-400' />
						<span>Share</span>
					</PurpleOutlineButton>

					<div className='relative flex items-center shadow-xs'>
						<button
							type='button'
							onClick={handleSave}
							disabled={saveVersion.isPending}
							className='flex h-9 items-center gap-1.5 rounded-l-lg border border-r-0 border-zinc-200 bg-white px-3 text-xs font-semibold text-primary-600 shadow-xs transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-800/40 dark:bg-zinc-900 dark:text-primary-400'>
							<Save size={14} className='text-primary-600 dark:text-primary-400' />
							<span>{saveVersion.isPending ? 'Saving' : 'Save'}</span>
						</button>
						<button
							type='button'
							onClick={() => setIsSaveDropdownOpen(!isSaveDropdownOpen)}
							className='flex h-9 items-center justify-center rounded-r-lg border border-zinc-200 bg-white px-2 text-primary-600 shadow-xs transition hover:bg-zinc-50 dark:border-zinc-800/40 dark:bg-zinc-900 dark:text-primary-400'>
							<ChevronDown size={14} />
						</button>

						{isSaveDropdownOpen && (
							<>
								<div
									className="fixed inset-0 z-10"
									onClick={() => setIsSaveDropdownOpen(false)}
								/>
								<div className="absolute right-0 top-11 z-20 w-52 rounded-xl border border-zinc-200 bg-white p-1 text-zinc-900 shadow-xl dark:border-white/10 dark:bg-zinc-950">
									<button
										type="button"
										onClick={() => {
											setIsSaveDropdownOpen(false);
											setGovModalTab('versions');
											setGovModalOpen(true);
										}}
										className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-semibold hover:bg-zinc-50 hover:text-primary-600 dark:text-zinc-300 dark:hover:bg-white/[0.04] dark:hover:text-primary-400"
									>
										<span>Version History</span>
									</button>
									<button
										type="button"
										onClick={() => {
											setIsSaveDropdownOpen(false);
											setGovModalTab('approvals');
											setGovModalOpen(true);
										}}
										className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-semibold hover:bg-zinc-50 hover:text-primary-600 dark:text-zinc-300 dark:hover:bg-white/[0.04] dark:hover:text-primary-400"
									>
										<span>Request Approval</span>
									</button>
									<button
										type="button"
										onClick={() => {
											setIsSaveDropdownOpen(false);
											setGovModalTab('releases');
											setGovModalOpen(true);
										}}
										className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-semibold hover:bg-zinc-50 hover:text-primary-600 dark:text-zinc-300 dark:hover:bg-white/[0.04] dark:hover:text-primary-400"
									>
										<span>Deploy Release</span>
									</button>
									<button
										type="button"
										onClick={() => {
											setIsSaveDropdownOpen(false);
											setGovModalTab('contracts');
											setGovModalOpen(true);
										}}
										className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-semibold hover:bg-zinc-50 hover:text-primary-600 dark:text-zinc-300 dark:hover:bg-white/[0.04] dark:hover:text-primary-400"
									>
										<span>Contracts Verification</span>
									</button>
								</div>
							</>
						)}
					</div>
				</div>

				{/* Mobile-only menu button and dropdown */}
				<div className='relative md:hidden flex items-center gap-1.5'>
					<IconButton
						title='More Actions'
						active={isMobileMenuOpen}
						onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
						<MoreVertical size={16} />
					</IconButton>
					{isMobileMenuOpen && (
						<>
							<div
								className="fixed inset-0 z-10"
								onClick={() => setIsMobileMenuOpen(false)}
							/>
							<div className="absolute right-0 top-11 z-50 w-56 rounded-xl border border-zinc-200 bg-white p-1 text-zinc-900 shadow-xl dark:border-white/10 dark:bg-zinc-950">
								<button
									type="button"
									onClick={() => {
										setIsMobileMenuOpen(false);
										handleSave();
									}}
									disabled={saveVersion.isPending}
									className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-xs font-semibold text-zinc-700 hover:bg-zinc-50 hover:text-primary-600 disabled:opacity-40 dark:text-zinc-300 dark:hover:bg-white/[0.04] dark:hover:text-primary-400"
								>
									<Save size={14} className="text-zinc-450 dark:text-zinc-500" />
									<span>{saveVersion.isPending ? 'Saving...' : 'Save Workflow'}</span>
								</button>
								<button
									type="button"
									onClick={() => {
										setIsMobileMenuOpen(false);
										setGovModalTab('sharing');
										setGovModalOpen(true);
									}}
									className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-xs font-semibold text-zinc-700 hover:bg-zinc-50 hover:text-primary-600 dark:text-zinc-300 dark:hover:bg-white/[0.04] dark:hover:text-primary-400"
								>
									<Share size={14} className="text-zinc-450 dark:text-zinc-500" />
									<span>Share Workflow</span>
								</button>
								<button
									type="button"
									onClick={() => {
										setIsMobileMenuOpen(false);
										dispatch({ type: 'SET_TEMPLATE_LIBRARY', open: true });
									}}
									className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-xs font-semibold text-zinc-700 hover:bg-zinc-50 hover:text-primary-600 dark:text-zinc-300 dark:hover:bg-white/[0.04] dark:hover:text-primary-400"
								>
									<Library size={14} className="text-zinc-450 dark:text-zinc-500" />
									<span>Templates</span>
								</button>

								<div className="my-1 h-px bg-zinc-150 dark:bg-zinc-800" />

								<button
									type="button"
									onClick={() => {
										setIsMobileMenuOpen(false);
										setGovModalTab('versions');
										setGovModalOpen(true);
									}}
									className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-xs font-semibold text-zinc-700 hover:bg-zinc-50 hover:text-primary-600 dark:text-zinc-300 dark:hover:bg-white/[0.04] dark:hover:text-primary-400"
								>
									<GitCompare size={14} className="text-zinc-450 dark:text-zinc-500" />
									<span>Version History</span>
								</button>
								<button
									type="button"
									onClick={() => {
										setIsMobileMenuOpen(false);
										setGovModalTab('approvals');
										setGovModalOpen(true);
									}}
									className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-xs font-semibold text-zinc-700 hover:bg-zinc-50 hover:text-primary-600 dark:text-zinc-300 dark:hover:bg-white/[0.04] dark:hover:text-primary-400"
								>
									<Settings2 size={14} className="text-zinc-450 dark:text-zinc-500" />
									<span>Request Approval</span>
								</button>
								<button
									type="button"
									onClick={() => {
										setIsMobileMenuOpen(false);
										setGovModalTab('releases');
										setGovModalOpen(true);
									}}
									className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-xs font-semibold text-zinc-700 hover:bg-zinc-50 hover:text-primary-600 dark:text-zinc-300 dark:hover:bg-white/[0.04] dark:hover:text-primary-400"
								>
									<Play size={14} className="text-zinc-450 dark:text-zinc-500" />
									<span>Deploy Release</span>
								</button>

								<div className="my-1 h-px bg-zinc-150 dark:bg-zinc-800" />

								<button
									type="button"
									disabled={!state.history.past.length}
									onClick={() => {
										dispatch({ type: 'UNDO' });
									}}
									className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-xs font-semibold text-zinc-700 hover:bg-zinc-50 hover:text-primary-600 disabled:opacity-30 dark:text-zinc-300 dark:hover:bg-white/[0.04] dark:hover:text-primary-400"
								>
									<RotateCcw size={14} className="text-zinc-450 dark:text-zinc-500" />
									<span>Undo</span>
								</button>
								<button
									type="button"
									disabled={!state.history.future.length}
									onClick={() => {
										dispatch({ type: 'REDO' });
									}}
									className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-xs font-semibold text-zinc-700 hover:bg-zinc-50 hover:text-primary-600 disabled:opacity-30 dark:text-zinc-300 dark:hover:bg-white/[0.04] dark:hover:text-primary-400"
								>
									<RotateCw size={14} className="text-zinc-450 dark:text-zinc-500" />
									<span>Redo</span>
								</button>

								<div className="my-1 h-px bg-zinc-150 dark:bg-zinc-800" />

								<button
									type="button"
									onClick={() => {
										setDarkModeStatus(isDarkTheme ? DARK_MODE.LIGHT : DARK_MODE.DARK);
									}}
									className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-xs font-semibold text-zinc-700 hover:bg-zinc-50 hover:text-primary-600 dark:text-zinc-300 dark:hover:bg-white/[0.04] dark:hover:text-primary-400"
								>
									{isDarkTheme ? <Sun size={14} className="text-zinc-450 dark:text-zinc-500" /> : <Moon size={14} className="text-zinc-450 dark:text-zinc-500" />}
									<span>{isDarkTheme ? 'Light Mode' : 'Dark Mode'}</span>
								</button>
							</div>
						</>
					)}
				</div>

				<motion.button
					whileTap={!(state.nodes.length === 0 && state.ui.emptyCanvasView !== 'chat-started') ? { scale: 0.98 } : undefined}
					type='button'
					onClick={isRunning ? stopRun : runWorkflow}
					disabled={state.nodes.length === 0 && state.ui.emptyCanvasView !== 'chat-started'}
					className={[
						'flex h-9 items-center gap-2 rounded-lg px-4 sm:px-5 text-xs font-bold text-white shadow-md transition duration-200 shrink-0',
						state.nodes.length === 0 && state.ui.emptyCanvasView !== 'chat-started'
							? 'opacity-40 cursor-not-allowed'
							: 'cursor-pointer',
						isRunning
							? 'bg-rose-500 shadow-rose-950/20 hover:bg-rose-400'
							: 'dark:bg-primary-400 dark:hover:bg-primary-500 bg-primary-400 shadow-primary-500/10 hover:bg-primary-500',
					].join(' ')}>
					{isRunning ? (
						<Square size={12} fill='currentColor' />
					) : (
						<Play size={12} fill='currentColor' />
					)}
					<span className='hidden sm:inline'>Run</span>
				</motion.button>
			</div>
		</header>
	);
};

export default Topbar;
