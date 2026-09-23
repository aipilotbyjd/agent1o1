import {
	Play,
	Square,
	ChevronDown,
	Share,
	Save,
	Sparkles,
	Boxes,
	Rocket,
	Loader2,
	AlertCircle,
	GitCompare,
	ShieldCheck,
	Download,
	FileCheck,
} from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCreateWorkflowVersion, useUpdateWorkflow } from '@/api/modules/workflows';
import { useWorkflowEditor } from '../../_context/WorkflowEditorProvider.context';
import { buildVersionPayload } from '../../_helper/workflowApiTransform.helper';
import { useRunWorkflow } from '../../_hooks/useRunWorkflow.hook';
import { useWorkflowShellStore } from '@/store/workflowShell.store';
import { EditableWorkflowName } from './Topbar.partial';

export const CanvasTopbar = () => {
	const { state, dispatch } = useWorkflowEditor();
	const { runWorkflow, stopRun } = useRunWorkflow();
	const saveVersion = useCreateWorkflowVersion(state.workflow.workspaceId ?? '');
	const updateWorkflow = useUpdateWorkflow(state.workflow.workspaceId ?? '');
	const setGovModalOpen = useWorkflowShellStore((store) => store.setGovModalOpen);
	const setGovModalTab = useWorkflowShellStore((store) => store.setGovModalTab);
	const [isSaveDropdownOpen, setIsSaveDropdownOpen] = useState(false);
	const isRunning = state.run.status === 'running';
	const isRunDisabled = state.nodes.length === 0 && state.ui.emptyCanvasView !== 'chat-started';

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
				workflowId: state.workflow.apiId,
			},
			{
				onSuccess: (data) => {
					dispatch({
						type: 'SET_WORKFLOW_META',
						patch: {
							currentVersionId: data.version.id,
							currentVersionNumber: data.version.version_number,
							savingState: 'saved',
						},
					});
				},
				onError: () => dispatch({ type: 'SET_SAVE_STATE', savingState: 'error' }),
			},
		);
	};

	return (
		<div className="z-10 flex h-13 shrink-0 items-center justify-between border-b border-zinc-200/80 bg-white/90 px-4 backdrop-blur-md select-none dark:border-white/[0.08] dark:bg-[#07080b]/90">
			{/* Left side actions */}
			<div className="flex items-center gap-2 sm:gap-3">
				<EditableWorkflowName
					name={state.workflow.name}
					onSave={handleRenameWorkflow}
				/>

				{/* Version Pill */}
				<button
					type='button'
					onClick={() => {
						setGovModalTab('versions');
						setGovModalOpen(true);
					}}
					title='View Version History'
					className='hidden rounded-md border border-zinc-200/80 bg-zinc-50/80 px-2 py-0.5 text-[10px] font-bold text-zinc-600 transition hover:border-zinc-300 hover:bg-zinc-100 sm:inline-flex dark:border-white/10 dark:bg-zinc-900/60 dark:text-zinc-400 dark:hover:bg-zinc-800'
				>
					v{state.workflow.currentVersionNumber || 1}
				</button>

				<div className="h-4 w-px bg-zinc-200 dark:bg-zinc-800" />

				{/* Segmented Controls */}
				<div className="flex items-center rounded-xl border border-zinc-200/70 bg-zinc-100/80 p-0.5 shadow-xs dark:border-white/[0.06] dark:bg-zinc-900/80">
					<button
						type="button"
						onClick={() => dispatch({ type: 'TOGGLE_LEFT_PANEL', intent: 'home' })}
						className={[
							"flex h-7 items-center gap-1.5 rounded-lg px-2.5 text-xs font-bold transition duration-150",
							state.ui.leftPanelOpen && state.ui.leftPanelIntent === 'home'
								? "bg-white text-zinc-900 shadow-xs dark:bg-zinc-800 dark:text-white"
								: "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
						].join(' ')}
					>
						<Boxes size={13} />
						<span className="hidden sm:inline">Apps</span>
					</button>
					<button
						type="button"
						onClick={() => dispatch({ type: 'TOGGLE_LEFT_PANEL', intent: 'trigger' })}
						className={[
							"flex h-7 items-center gap-1.5 rounded-lg px-2.5 text-xs font-bold transition duration-150",
							state.ui.leftPanelOpen && state.ui.leftPanelIntent === 'trigger'
								? "bg-white text-zinc-900 shadow-xs dark:bg-zinc-800 dark:text-white"
								: "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
						].join(' ')}
					>
						<Rocket size={13} />
						<span className="hidden sm:inline">Triggers</span>
					</button>
					<div className="mx-0.5 h-3.5 w-px bg-zinc-200 dark:bg-zinc-700/60" />
					<button
						type="button"
						title="Toggle AI Chat Panel"
						onClick={() => dispatch({ type: 'TOGGLE_AI_PANEL' })}
						className={[
							"flex h-7 items-center gap-1.5 rounded-lg px-2.5 text-xs font-bold transition duration-150",
							state.ui.aiPanelOpen
								? "bg-primary-500/10 text-primary-700 shadow-xs ring-1 ring-primary-500/30 dark:bg-primary-400/15 dark:text-primary-300 dark:ring-primary-500/40"
								: "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
						].join(' ')}
					>
						<Sparkles size={13} className={state.ui.aiPanelOpen ? 'text-primary-600 dark:text-primary-400' : 'text-zinc-500 dark:text-zinc-400'} />
						<span className="hidden sm:inline">{state.ui.aiPanelOpen ? 'Hide Chat' : 'AI Chat'}</span>
					</button>
				</div>
			</div>

			{/* Right side actions */}
			<div className="flex items-center gap-2 sm:gap-2.5">
				{/* Share Button */}
				<button
					type="button"
					onClick={() => {
						setGovModalTab('sharing');
						setGovModalOpen(true);
					}}
					className="hidden h-8 items-center gap-1.5 rounded-lg border border-zinc-200/80 bg-white px-2.5 text-xs font-semibold text-zinc-700 shadow-xs transition hover:border-zinc-300 hover:bg-zinc-50 hover:text-zinc-900 sm:flex dark:border-white/10 dark:bg-zinc-900/60 dark:text-zinc-300 dark:hover:border-white/15 dark:hover:bg-zinc-800/80 dark:hover:text-zinc-100"
				>
					<Share size={13} className="text-zinc-500 dark:text-zinc-400" />
					<span>Share</span>
				</button>

				{/* Save Split Button */}
				<div className="relative flex items-center rounded-lg border border-zinc-200/80 bg-white shadow-xs dark:border-white/10 dark:bg-zinc-900/80">
					<button
						type="button"
						onClick={handleSave}
						disabled={saveVersion.isPending}
						className="flex h-8 items-center gap-1.5 px-2.5 text-xs font-bold text-zinc-700 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-40 sm:px-3 dark:text-zinc-200 dark:hover:bg-zinc-800/60"
					>
						{saveVersion.isPending ? (
							<Loader2 size={13} className="animate-spin text-primary-500" />
						) : (
							<Save size={13} className="text-zinc-500 dark:text-zinc-400" />
						)}
						<span>{saveVersion.isPending ? 'Saving...' : 'Save'}</span>
					</button>

					<button
						type="button"
						title="Save and Release Options"
						onClick={() => setIsSaveDropdownOpen(!isSaveDropdownOpen)}
						className="flex h-8 items-center justify-center border-l border-zinc-200/80 px-1.5 text-zinc-500 transition hover:bg-zinc-50 hover:text-zinc-800 dark:border-white/10 dark:text-zinc-400 dark:hover:bg-zinc-800/60 dark:hover:text-zinc-200"
					>
						<ChevronDown size={13} />
					</button>

					<AnimatePresence>
						{isSaveDropdownOpen && (
							<>
								<div
									className="fixed inset-0 z-40"
									onClick={() => setIsSaveDropdownOpen(false)}
								/>
								<motion.div
									initial={{ opacity: 0, y: 4, scale: 0.96 }}
									animate={{ opacity: 1, y: 0, scale: 1 }}
									exit={{ opacity: 0, y: 4, scale: 0.96 }}
									transition={{ duration: 0.12 }}
									className="absolute right-0 top-10 z-50 w-56 rounded-xl border border-zinc-200/90 bg-white p-1.5 shadow-xl dark:border-white/10 dark:bg-zinc-950"
								>
									<div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-zinc-400">
										Governance & Versions
									</div>
									<button
										type="button"
										onClick={() => {
											setIsSaveDropdownOpen(false);
											setGovModalTab('versions');
											setGovModalOpen(true);
										}}
										className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-xs font-medium text-zinc-700 transition hover:bg-zinc-100 hover:text-zinc-950 dark:text-zinc-300 dark:hover:bg-white/[0.06] dark:hover:text-white"
									>
										<GitCompare size={14} className="text-zinc-400" />
										<span>Version History</span>
									</button>
									<button
										type="button"
										onClick={() => {
											setIsSaveDropdownOpen(false);
											setGovModalTab('approvals');
											setGovModalOpen(true);
										}}
										className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-xs font-medium text-zinc-700 transition hover:bg-zinc-100 hover:text-zinc-950 dark:text-zinc-300 dark:hover:bg-white/[0.06] dark:hover:text-white"
									>
										<ShieldCheck size={14} className="text-zinc-400" />
										<span>Request Approval</span>
									</button>
									<button
										type="button"
										onClick={() => {
											setIsSaveDropdownOpen(false);
											setGovModalTab('releases');
											setGovModalOpen(true);
										}}
										className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-xs font-medium text-zinc-700 transition hover:bg-zinc-100 hover:text-zinc-950 dark:text-zinc-300 dark:hover:bg-white/[0.06] dark:hover:text-white"
									>
										<Rocket size={14} className="text-zinc-400" />
										<span>Deploy Release</span>
									</button>
									<button
										type="button"
										onClick={() => {
											setIsSaveDropdownOpen(false);
											setGovModalTab('contracts');
											setGovModalOpen(true);
										}}
										className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-xs font-medium text-zinc-700 transition hover:bg-zinc-100 hover:text-zinc-950 dark:text-zinc-300 dark:hover:bg-white/[0.06] dark:hover:text-white"
									>
										<FileCheck size={14} className="text-zinc-400" />
										<span>Contracts Verification</span>
									</button>

									<div className="my-1 h-px bg-zinc-100 dark:bg-zinc-800" />

									<button
										type="button"
										onClick={() => {
											setIsSaveDropdownOpen(false);
											dispatch({ type: 'SET_IMPORT_EXPORT', open: true });
										}}
										className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-xs font-medium text-zinc-700 transition hover:bg-zinc-100 hover:text-zinc-950 dark:text-zinc-300 dark:hover:bg-white/[0.06] dark:hover:text-white"
									>
										<Download size={14} className="text-zinc-400" />
										<span>Export Workflow JSON</span>
									</button>
								</motion.div>
							</>
						)}
					</AnimatePresence>
				</div>

				{/* Primary Run Action */}
				<motion.button
					whileTap={!isRunDisabled ? { scale: 0.98 } : undefined}
					type="button"
					onClick={isRunning ? stopRun : runWorkflow}
					disabled={isRunDisabled}
					className={[
						"flex h-8 shrink-0 items-center gap-1.5 rounded-lg px-3.5 text-xs font-bold text-white shadow-sm transition duration-150 sm:px-4",
						isRunDisabled ? "cursor-not-allowed opacity-40" : "cursor-pointer",
						isRunning
							? "bg-rose-600 shadow-rose-950/20 hover:bg-rose-500"
							: "bg-gradient-to-r from-primary-500 to-primary-600 shadow-primary-500/20 hover:from-primary-600 hover:to-primary-700 active:shadow-none"
					].join(' ')}
				>
					{isRunning ? (
						<>
							<span className="relative flex h-2 w-2">
								<span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75"></span>
								<span className="relative inline-flex h-2 w-2 rounded-full bg-white"></span>
							</span>
							<span>Stop</span>
						</>
					) : (
						<>
							<Play size={12} fill="currentColor" />
							<span>Run</span>
						</>
					)}
				</motion.button>
			</div>
		</div>
	);
};
