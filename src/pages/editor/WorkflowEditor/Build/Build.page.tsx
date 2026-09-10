import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Resizable } from 're-resizable';
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
import AgentBuilderPage from '@/pages/agent/AgentBuilder/AgentBuilder.page';
import WorkspaceSettingsPage from '@/pages/settings/Workspace/Workspace.page';
import ConnectedAppsPage from '@/pages/app/Apps/AppsList.page';
import ArtifactsPage from '@/pages/app/Artifacts/ArtifactsList.page';
import HistoryPage from '@/pages/app/History/HistoryList.page';
import Topbar from '../_partial/shell/Topbar.partial';
import WorkflowsPage from '@/pages/app/Workflows/WorkflowsList.page';
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
import { useAiChatStore } from '@/store/aiChat.store';
import { CanvasTopbar } from '../_partial/shell/CanvasTopbar.partial';

const BuildPage = () => {
	const isChatActive = useAiChatStore((store) => store.isChatActive);
	const { state, dispatch } = useWorkflowEditor();
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
		<div className='flex h-full min-h-0 bg-zinc-50 dark:bg-[#07080b] flex-col'>
			{apiState.isError && (
				<div className='absolute top-0 right-0 left-0 z-50 flex items-center justify-center gap-2 bg-rose-500 px-4 py-1 text-xs font-bold text-white'>
					API unavailable — running in local mode.
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
					<div className='relative flex flex-1 min-h-0'>
						<AnimatePresence initial={false}>
							{state.ui.aiPanelOpen && (
								<motion.div
									initial={{ width: 0, opacity: 0 }}
									animate={{ width: isMobile ? (width || '100%') : aiPanelWidth, opacity: 1 }}
									exit={{ width: 0, opacity: 0 }}
									transition={{ duration: 0.2 }}
									className={isMobile ? 'absolute inset-y-0 left-0 z-50 bg-zinc-50 dark:bg-zinc-950 shadow-2xl min-h-0 w-full' : 'min-h-0 shrink-0 overflow-hidden'}>
									{isMobile ? (
										<div className="w-full h-full overflow-y-auto">
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
											onResizeStop={(_, __, ref) => setAiPanelWidth(ref.offsetWidth)}
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
										initial={{ width: 0, opacity: 0 }}
										animate={{ width: isMobile ? 320 : leftPanelWidth, opacity: 1 }}
										exit={{ width: 0, opacity: 0 }}
										transition={{ duration: 0.2 }}
										className={isMobile ? 'absolute inset-y-0 left-0 z-40 bg-white dark:bg-zinc-950 border-r border-zinc-200 dark:border-white/10 shadow-2xl min-h-0' : 'min-h-0 shrink-0 overflow-hidden'}>
										{isMobile ? (
											<div className="w-[320px] max-w-[100vw] h-full overflow-y-auto">
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
								{isChatActive && <CanvasTopbar />}
								{!state.ui.leftPanelOpen && (
									<button
										type='button'
										onClick={() => dispatch({ type: 'TOGGLE_LEFT_PANEL' })}
										className='absolute top-1/2 left-0 z-10 flex h-10 w-4 -translate-y-1/2 cursor-pointer items-center justify-center rounded-r-md border border-l-0 border-zinc-200 bg-white text-zinc-400 shadow-sm transition hover:bg-zinc-50 hover:text-zinc-700 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:bg-zinc-900'
										style={{ top: isChatActive ? 'calc(50% + 28px)' : '50%' }}>
										<span className='text-[10px] font-bold'>&gt;</span>
									</button>
								)}
								<Canvas />
								{!isChatActive && <ActionBar />}
							</div>
						</div>
						{state.ui.runPanelOpen && (
							<Resizable
								size={{ width: '100%', height: runPanelHeight }}
								minHeight={180}
								maxHeight='58vh'
								enable={{ top: true }}
								onResize={(e, direction, ref) => {
									setRunPanelHeight(ref.offsetHeight);
								}}
								onResizeStop={(_, __, ref) => setRunPanelHeight(ref.offsetHeight)}
								className='shrink-0'>
								<RunPanel />
							</Resizable>
						)}
					</div>
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
