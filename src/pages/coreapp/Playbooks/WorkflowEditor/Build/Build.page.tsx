import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Resizable } from 're-resizable';
import { useReactFlow } from '@xyflow/react';
import AiBuilderPanel from '../_partial/ai/AiBuilderPanel.partial';
import Canvas from '../_partial/canvas/Canvas.partial';
import CommandPalette from '../_partial/dialogs/CommandPalette.partial';
import ImportExportDialog from '../_partial/dialogs/ImportExportDialog.partial';
import KeyboardShortcutsModal from '../_partial/dialogs/KeyboardShortcutsModal.partial';
import QuickAddNodeDialog from '../_partial/dialogs/QuickAddNodeDialog.partial';
import TemplateLibraryDialog from '../_partial/dialogs/TemplateLibraryDialog.partial';
import VersionDiffViewer from '../_partial/dialogs/VersionDiffViewer.partial';
import NodeLibrary from '../_partial/library/NodeLibrary.partial';
import LinkCredentialsDialog from '../_partial/dialogs/LinkCredentialsDialog.partial';
import WorkflowGovernanceModal from '../_partial/dialogs/WorkflowGovernanceModal.partial';
import RunPanel from '../_partial/run/RunPanel.partial';
import ActionBar from '../_partial/shell/ActionBar.partial';
import AgentBuilderPage from '@/pages/coreapp/Agents/AgentBuilder/AgentBuilder.page';
import WorkspaceSettingsPage from '@/pages/UnderConstruction.page';
import ConnectedAppsPage from '@/pages/UnderConstruction.page';
import ArtifactsPage from '@/pages/UnderConstruction.page';
import HistoryPage from '@/pages/UnderConstruction.page';
import Topbar from '../_partial/shell/Topbar.partial';
import WorkflowsPage from '@/pages/coreapp/Playbooks/WorkflowsList.page';
import WorkspaceSidebar from '@/templates/asides/AgentAside.template';
import useAsideStatus from '@/hooks/useAsideStatus';
import useDeviceScreen from '@/hooks/useDeviceScreen';
import { useAiBuilderBridge } from '../_hooks/useAiBuilderBridge.hook';
import { useAutosave } from '../_hooks/useAutosave.hook';
import { useEditorHotkeys } from '../_hooks/useEditorHotkeys.hook';
import { useWorkflowApiLoader } from '../_hooks/useWorkflowApiLoader.hook';
import { useWorkflowRouteParams } from '../_hooks/useWorkflowRouteParams.hook';
import { useWorkflowEditor } from '../_context/WorkflowEditorProvider.context';
import { useWorkflowShellStore } from '@/store/workflowShell.store';
import { Boxes, Maximize2, PlaySquare, Sparkles } from 'lucide-react';

const BuildPage = () => {
	const { state, dispatch } = useWorkflowEditor();
	const reactFlow = useReactFlow();
	const { width } = useDeviceScreen();
	const isMobile = width !== undefined && width < 768;
	const activeWorkspaceView = useWorkflowShellStore((store) => store.activeWorkspaceView);
	const resolvedView = window.location.pathname.startsWith('/editor')
		? 'editor'
		: activeWorkspaceView;
	const setActiveWorkspaceView = useWorkflowShellStore((store) => store.setActiveWorkspaceView);
	const mobileSidebarOpen = useWorkflowShellStore((store) => store.mobileSidebarOpen);
	const { closeAside } = useAsideStatus();
	const { workspaceId, workflowId } = useWorkflowRouteParams();
	const apiState = useWorkflowApiLoader(workspaceId, workflowId);
	const [leftPanelWidth, setLeftPanelWidth] = useState(320);
	const [aiPanelWidth, setAiPanelWidth] = useState(400);
	const [runPanelHeight, setRunPanelHeight] = useState(300);

	const openMobileNodes = () => {
		if (state.ui.runPanelOpen) dispatch({ type: 'TOGGLE_RUN_PANEL' });
		if (state.ui.aiPanelOpen) dispatch({ type: 'TOGGLE_AI_PANEL' });
		dispatch({ type: 'TOGGLE_LEFT_PANEL', intent: 'home' });
	};

	const openMobileAi = () => {
		if (state.ui.runPanelOpen) dispatch({ type: 'TOGGLE_RUN_PANEL' });
		if (state.ui.leftPanelOpen) dispatch({ type: 'TOGGLE_LEFT_PANEL' });
		dispatch({ type: 'TOGGLE_AI_PANEL' });
	};

	const openMobileRuns = () => {
		if (state.ui.leftPanelOpen) dispatch({ type: 'TOGGLE_LEFT_PANEL' });
		if (state.ui.aiPanelOpen) dispatch({ type: 'TOGGLE_AI_PANEL' });
		dispatch({ type: 'TOGGLE_RUN_PANEL' });
	};

	useAutosave();
	useEditorHotkeys();
	useAiBuilderBridge();

	useEffect(() => {
		if (window.location.pathname.startsWith('/editor') || (workspaceId && workflowId)) {
			setActiveWorkspaceView('editor');
		}
	}, [setActiveWorkspaceView, workflowId, workspaceId]);

	if (apiState.isLoading && workspaceId && workflowId) {
		return (
			<div className='flex h-full items-center justify-center bg-white text-sm font-bold text-zinc-500 dark:bg-zinc-950 dark:text-zinc-400'>
				Loading workflow...
			</div>
		);
	}

	return (
		<div className='flex h-full min-h-0 flex-col bg-zinc-50 dark:bg-[#07080b]'>
			{apiState.isError && (
				<div className='absolute top-0 right-0 left-0 z-50 flex items-center justify-center gap-2 bg-rose-500 px-4 py-1 text-xs font-bold text-white'>
					API unavailable - running in local mode.
				</div>
			)}
			{resolvedView !== 'settings' && resolvedView !== 'editor' && (
				<div className='hidden shrink-0 lg:block'>
					<WorkspaceSidebar />
				</div>
			)}
			<AnimatePresence>
				{mobileSidebarOpen && resolvedView !== 'settings' && resolvedView !== 'editor' && (
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						className='fixed inset-0 z-[80] lg:hidden'>
						<button
							type='button'
							aria-label='Close sidebar'
							onClick={closeAside}
							className='absolute inset-0 bg-zinc-950/35 backdrop-blur-sm'
						/>
						<motion.div
							initial={{ x: -300 }}
							animate={{ x: 0 }}
							exit={{ x: -300 }}
							transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
							className='relative h-full w-[286px] max-w-[86vw]'>
							<WorkspaceSidebar />
						</motion.div>
					</motion.div>
				)}
			</AnimatePresence>
			{resolvedView === 'workflows' ? (
				<WorkflowsPage />
			) : resolvedView === 'agents' ? (
				<AgentBuilderPage />
			) : resolvedView === 'artifacts' ? (
				<ArtifactsPage />
			) : resolvedView === 'apps' || resolvedView === 'integrations' ? (
				<ConnectedAppsPage />
			) : resolvedView === 'history' ? (
				<HistoryPage />
			) : resolvedView === 'settings' ? (
				<WorkspaceSettingsPage />
			) : (
				<>
					{/* Hide the editor top header on mobile while the AI builder panel is
					    open — the panel has its own header (history/new chat/exit).
					    Keep it visible on desktop (md and up). */}
					<div className={state.ui.aiPanelOpen ? 'hidden md:contents' : 'contents'}>
						<Topbar />
					</div>
					<div className='relative flex min-h-0 flex-1'>
						<AnimatePresence initial={false}>
							{state.ui.aiPanelOpen && (
								<motion.div
									initial={
										isMobile
											? { y: '100%', opacity: 0 }
											: { width: 0, opacity: 0 }
									}
									animate={
										isMobile
											? { y: 0, opacity: 1 }
											: { width: aiPanelWidth, opacity: 1 }
									}
									exit={
										isMobile
											? { y: '100%', opacity: 0 }
											: { width: 0, opacity: 0 }
									}
									transition={{ duration: 0.2 }}
									className={
										isMobile
											? 'absolute inset-0 z-50 min-h-0 w-full overflow-hidden bg-zinc-50 shadow-2xl dark:bg-zinc-950'
											: 'min-h-0 shrink-0 overflow-hidden'
									}>
									{isMobile ? (
										<div className='h-full w-full overflow-y-auto pb-[env(safe-area-inset-bottom)]'>
											<AiBuilderPanel />
										</div>
									) : (
										<Resizable
											size={{ width: aiPanelWidth, height: '100%' }}
											minWidth={360}
											maxWidth='45vw'
											enable={{ right: true }}
											onResize={(e, direction, ref) => {
												setAiPanelWidth(ref.offsetWidth);
											}}
											onResizeStop={(_, __, ref) =>
												setAiPanelWidth(ref.offsetWidth)
											}
											className='min-h-0 shrink-0'>
											<AiBuilderPanel />
										</Resizable>
									)}
								</motion.div>
							)}
						</AnimatePresence>
						<div className='flex min-w-0 flex-1 flex-col overflow-hidden rounded-l-2xl border-l border-zinc-200 bg-white dark:border-white/10 dark:bg-zinc-950'>
							<div className='relative flex min-h-0 flex-1'>
								<AnimatePresence initial={false}>
									{state.ui.leftPanelOpen && (
										<motion.div
											initial={
												isMobile
													? { y: '100%', opacity: 0 }
													: { width: 0, opacity: 0 }
											}
											animate={
												isMobile
													? { y: 0, opacity: 1 }
													: { width: leftPanelWidth, opacity: 1 }
											}
											exit={
												isMobile
													? { y: '100%', opacity: 0 }
													: { width: 0, opacity: 0 }
											}
											transition={{ duration: 0.2 }}
											className={
												isMobile
													? 'absolute inset-x-0 top-3 bottom-0 z-40 min-h-0 overflow-hidden rounded-t-3xl border-t border-zinc-200 bg-white shadow-2xl dark:border-white/10 dark:bg-zinc-950'
													: 'min-h-0 shrink-0 overflow-hidden'
											}>
											{isMobile ? (
												<div className='h-full w-full overflow-y-auto pb-[env(safe-area-inset-bottom)]'>
													<NodeLibrary />
												</div>
											) : (
												<Resizable
													size={{ width: leftPanelWidth, height: '100%' }}
													minWidth={260}
													maxWidth={460}
													enable={{ right: true }}
													onResize={(e, direction, ref) => {
														setLeftPanelWidth(ref.offsetWidth);
													}}
													onResizeStop={(_, __, ref) =>
														setLeftPanelWidth(ref.offsetWidth)
													}
													className='min-h-0 shrink-0'>
													<NodeLibrary />
												</Resizable>
											)}
										</motion.div>
									)}
								</AnimatePresence>
								<div className='relative flex min-w-0 flex-1 flex-col'>
									{!state.ui.leftPanelOpen && (
										<button
											type='button'
											onClick={() => dispatch({ type: 'TOGGLE_LEFT_PANEL' })}
											className='absolute top-1/2 left-0 z-10 flex h-10 w-4 -translate-y-1/2 cursor-pointer items-center justify-center rounded-r-md border border-l-0 border-zinc-200 bg-white text-zinc-400 shadow-sm transition hover:bg-zinc-50 hover:text-zinc-700 dark:hover:text-zinc-200 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:bg-zinc-900'>
											<span className='text-[10px] font-bold'>&gt;</span>
										</button>
									)}
									<Canvas />
									<ActionBar />
								</div>
							</div>
							{state.ui.runPanelOpen &&
								(isMobile ? (
									<motion.div
										initial={{ y: '100%', opacity: 0 }}
										animate={{ y: 0, opacity: 1 }}
										exit={{ y: '100%', opacity: 0 }}
										transition={{ duration: 0.2 }}
										className='absolute inset-x-0 top-[18%] bottom-0 z-50 overflow-hidden rounded-t-3xl border-t border-white/10 bg-zinc-950 shadow-2xl'>
										<RunPanel />
									</motion.div>
								) : (
									<Resizable
										size={{ width: '100%', height: runPanelHeight }}
										minHeight={180}
										maxHeight='58vh'
										enable={{ top: true }}
										onResize={(e, direction, ref) => {
											setRunPanelHeight(ref.offsetHeight);
										}}
										onResizeStop={(_, __, ref) =>
											setRunPanelHeight(ref.offsetHeight)
										}
										className='shrink-0'>
										<RunPanel />
									</Resizable>
								))}
						</div>

						{/* Mobile editor dock: the four most-used canvas actions stay reachable
					    without competing with the workflow title and Run button above. */}
						{!state.ui.aiPanelOpen &&
							!state.ui.leftPanelOpen &&
							!state.ui.runPanelOpen && (
								<nav
									aria-label='Editor tools'
									className='absolute right-3 bottom-[calc(0.75rem+env(safe-area-inset-bottom))] left-3 z-30 flex h-14 items-center justify-around rounded-2xl border border-zinc-200 bg-white/95 px-2 shadow-2xl backdrop-blur-xl md:hidden dark:border-white/10 dark:bg-zinc-950/95'>
									<button
										type='button'
										onClick={openMobileNodes}
										className='flex min-w-16 flex-col items-center gap-0.5 text-[10px] font-bold text-zinc-500 dark:text-zinc-400'>
										<Boxes size={18} /> Nodes
									</button>
									<button
										type='button'
										onClick={openMobileAi}
										className='text-primary-700 dark:text-primary-400 flex min-w-16 flex-col items-center gap-0.5 text-[10px] font-bold'>
										<Sparkles size={18} /> Ask AI
									</button>
									<button
										type='button'
										onClick={openMobileRuns}
										className='flex min-w-16 flex-col items-center gap-0.5 text-[10px] font-bold text-zinc-500 dark:text-zinc-400'>
										<PlaySquare size={18} /> Runs
									</button>
									<button
										type='button'
										onClick={() =>
											reactFlow.fitView({ padding: 0.2, duration: 240 })
										}
										className='flex min-w-16 flex-col items-center gap-0.5 text-[10px] font-bold text-zinc-500 dark:text-zinc-400'>
										<Maximize2 size={18} /> Fit view
									</button>
								</nav>
							)}
					</div>
				</>
			)}
			<CommandPalette />
			<QuickAddNodeDialog />
			<ImportExportDialog />
			<KeyboardShortcutsModal />
			<TemplateLibraryDialog />
			<VersionDiffViewer />
			<LinkCredentialsDialog />
			<WorkflowGovernanceModal />
		</div>
	);
};

export default BuildPage;
