import {
	Play,
	Square,
	ChevronDown,
	Share,
	Save,
	LayoutGrid,
	GitBranch,
	Sparkles,
} from 'lucide-react';
import { useState } from 'react';
import { motion } from 'framer-motion';
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

	return (
		<div className="flex h-14 shrink-0 items-center justify-between border-b border-zinc-200 bg-white px-5 dark:border-white/10 dark:bg-[#07080b] select-none z-10">
			{/* Left side actions */}
			<div className="flex items-center gap-2">
				<EditableWorkflowName
					name={state.workflow.name}
					onSave={handleRenameWorkflow}
					className="max-w-[200px] truncate rounded-md px-1.5 py-1 text-left text-sm font-bold text-zinc-800 hover:bg-zinc-100 dark:text-zinc-100 dark:hover:bg-white/[0.06]"
					inputClassName="max-w-[200px] rounded-md border border-primary-300 bg-white px-1.5 py-1 text-sm font-bold text-zinc-800 outline-none focus:ring-1 focus:ring-primary-500 dark:border-primary-700 dark:bg-zinc-900 dark:text-zinc-100"
				/>
				<div className="h-6 w-px bg-zinc-200 dark:bg-zinc-800" />
				<button
					type="button"
					onClick={() => dispatch({ type: 'TOGGLE_LEFT_PANEL', intent: 'home' })}
					className={[
						"flex h-9 items-center gap-2 rounded-xl border px-3.5 text-xs font-bold shadow-xs transition",
						state.ui.leftPanelOpen && state.ui.leftPanelIntent === 'home'
							? "border-primary-400 bg-primary-100 text-primary-700 dark:border-primary-600 dark:bg-primary-950/50 dark:text-primary-300"
							: "border-primary-200 bg-primary-50/50 text-primary-600 hover:bg-primary-100/70 dark:border-primary-800 dark:bg-primary-950/20 dark:text-primary-400"
					].join(' ')}
				>
					<span className="text-sm font-extrabold">+</span>
					<span>Apps</span>
				</button>
				<button
					type="button"
					title="Toggle AI Chat Panel"
					onClick={() => dispatch({ type: 'TOGGLE_AI_PANEL' })}
					className={`flex h-9 items-center gap-1.5 rounded-xl border px-3.5 text-xs font-bold shadow-xs transition ${
						state.ui.aiPanelOpen
							? 'border-primary-200 bg-primary-400 text-primary-950 hover:bg-primary-500 dark:border-primary-800 dark:bg-primary-400 dark:hover:bg-primary-500'
							: 'border-zinc-200 bg-white text-zinc-650 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-350 dark:hover:bg-zinc-800'
					}`}
				>
					<Sparkles size={13} className={state.ui.aiPanelOpen ? 'fill-white text-white' : 'text-primary-500 fill-primary-500/10'} />
					<span>{state.ui.aiPanelOpen ? 'Hide Chat' : 'Reopen Chat'}</span>
				</button>
				<button
					type="button"
					title="Toggle Left Panel"
					onClick={() => dispatch({ type: 'TOGGLE_LEFT_PANEL' })}
					className="flex h-9 w-9 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-500 shadow-xs transition hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400"
				>
					<GitBranch size={15} />
				</button>
				<button
					type="button"
					title="View Code"
					className="flex h-9 px-3 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-650 shadow-xs transition hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400 font-mono text-xs font-extrabold"
				>
					{"{}"}
				</button>
			</div>

			{/* Right side actions */}
			<div className="flex items-center gap-2.5">
				<button
					type="button"
					onClick={() => {
						setGovModalTab('sharing');
						setGovModalOpen(true);
					}}
					className="flex h-9 items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-3.5 text-xs font-bold text-zinc-600 shadow-xs transition hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300"
				>
					<Share size={14} className="text-zinc-500" />
					<span>Share</span>
				</button>

				<div className="relative flex items-center shadow-xs rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
					<button
						type="button"
						onClick={handleSave}
						disabled={saveVersion.isPending}
						className="flex h-9 items-center gap-1.5 px-3.5 text-xs font-bold text-zinc-600 hover:bg-zinc-50 disabled:opacity-40 dark:text-zinc-300"
					>
						<Save size={14} className="text-zinc-500" />
						<span>{saveVersion.isPending ? 'Saving' : 'Save'}</span>
					</button>
					<button
						type="button"
						onClick={() => setIsSaveDropdownOpen(!isSaveDropdownOpen)}
						className="flex h-9 items-center justify-center border-l border-zinc-200 px-2 text-zinc-500 hover:bg-zinc-50 dark:border-zinc-800"
					>
						<ChevronDown size={13} />
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

				<div className={[
					"flex items-center shadow-md rounded-xl overflow-hidden transition",
					isRunDisabled
						? "bg-primary-400 opacity-40 cursor-not-allowed"
						: "bg-primary-400 hover:bg-primary-500"
				].join(' ')}>
					<motion.button
						whileTap={!isRunDisabled ? { scale: 0.98 } : undefined}
						type="button"
						disabled={isRunDisabled}
						onClick={isRunning ? stopRun : runWorkflow}
						className={[
							"flex h-9 items-center gap-1.5 px-4 text-xs font-bold text-white",
							isRunDisabled ? "cursor-not-allowed" : "cursor-pointer"
						].join(' ')}
					>
						{isRunning ? (
							<Square size={11} fill="currentColor" />
						) : (
							<Play size={11} fill="currentColor" className="fill-white" />
						)}
						<span>Run</span>
					</motion.button>
					<button
						type="button"
						disabled={isRunDisabled}
						className={[
							"flex h-9 items-center justify-center border-l border-white/20 px-2.5 text-white",
							isRunDisabled ? "cursor-not-allowed" : "hover:bg-primary-500"
						].join(' ')}
					>
						<ChevronDown size={13} />
					</button>
				</div>
			</div>
		</div>
	);
};
