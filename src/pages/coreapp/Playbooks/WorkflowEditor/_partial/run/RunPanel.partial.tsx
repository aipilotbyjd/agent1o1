import { useReactFlow } from '@xyflow/react';
import { useWorkflowEditor } from '../../_context/WorkflowEditorProvider.context';
import { Bug, ChevronRight, X } from 'lucide-react';
import NodeRunOutput from './NodeRunOutput.partial';
import RunConsole from './RunConsole.partial';
import RunHistory from './RunHistory.partial';
import RunTimeline from './RunTimeline.partial';

const ProfilerSummary = ({ nodes }: { nodes: { label: string; durationMs?: number }[] }) => {
	const timed = nodes.filter((n) => n.durationMs !== undefined);
	if (!timed.length) return null;

	const total = timed.reduce((acc, n) => acc + (n.durationMs ?? 0), 0);
	const slowest = timed.reduce((prev, curr) =>
		(curr.durationMs ?? 0) > (prev.durationMs ?? 0) ? curr : prev,
	);

	const barColor = (ms?: number) => {
		if (!ms) return 'bg-zinc-300 dark:bg-zinc-700';
		if (ms < 200) return 'bg-emerald-400';
		if (ms < 800) return 'bg-amber-400';
		return 'bg-rose-400';
	};

	const maxMs = Math.max(...timed.map((n) => n.durationMs ?? 0), 1);

	return (
		<div>
			<div className='mb-2 flex items-center justify-between'>
				<div className='text-xs font-semibold tracking-[0.16em] text-zinc-600 uppercase'>
					Execution Profile
				</div>
				<div className='text-xs text-zinc-500'>
					Total: <span className='font-bold text-zinc-300'>{total}ms</span> · Slowest:{' '}
					<span className='font-bold text-zinc-300'>{slowest.label}</span>
				</div>
			</div>
			<div className='space-y-1.5'>
				{timed
					.sort((a, b) => (b.durationMs ?? 0) - (a.durationMs ?? 0))
					.map((node, i) => (
						<div key={i} className='flex items-center gap-2'>
							<div className='w-28 shrink-0 truncate text-[11px] text-zinc-400'>
								{node.label}
							</div>
							<div className='relative h-3 flex-1 rounded-full bg-zinc-800'>
								<div
									className={`absolute inset-y-0 left-0 rounded-full transition-all ${barColor(node.durationMs)}`}
									style={{
										width: `${Math.round(((node.durationMs ?? 0) / maxMs) * 100)}%`,
									}}
								/>
							</div>
							<div className='w-14 shrink-0 text-right text-[11px] font-bold text-zinc-400'>
								{node.durationMs}ms
							</div>
						</div>
					))}
			</div>
		</div>
	);
};

const RunPanel = () => {
	const { state, dispatch } = useWorkflowEditor();
	const reactFlow = useReactFlow();
	if (!state.ui.runPanelOpen) return null;

	const run = state.run;
	const tab = state.ui.runPanelTab;
	const hasOutput = state.nodes.some((node) => node.data.outputPreview !== undefined);
	const timedNodes = state.nodes
		.filter((n) => n.data.durationMs !== undefined)
		.map((n) => ({ label: n.data.label, durationMs: n.data.durationMs as number | undefined }));

	const zoomToCurrentNode = () => {
		if (!run.currentNodeId) return;
		reactFlow.fitView({ nodes: [{ id: run.currentNodeId }], padding: 0.4, duration: 350 });
	};

	return (
		<section className='flex h-full flex-col overflow-y-auto border-t border-white/10 bg-zinc-950 text-zinc-100'>
			<div className='flex-shrink-0 border-b border-white/10 bg-white/[0.025] p-4'>
				<div className='flex items-center justify-between'>
					<div className='flex flex-col gap-1'>
						<div className='flex items-center gap-2'>
							<div className='text-sm font-semibold text-white'>
								Execution console
							</div>
							{state.ui.stepMode && (
								<span className='flex items-center gap-1 rounded-full bg-rose-500/20 px-2 py-0.5 text-[10px] font-bold text-rose-300'>
									<Bug size={10} />
									Step mode
								</span>
							)}
						</div>
						<RunTimeline run={run} />
						<div className='mt-1 flex items-center gap-1'>
							{(['console', 'history'] as const).map((value) => (
								<button
									key={value}
									type='button'
									onClick={() => dispatch({ type: 'SET_RUN_PANEL_TAB', tab: value })}
									className={`rounded-md px-2.5 py-1 text-[11px] font-bold capitalize transition ${
										tab === value
											? 'bg-white/10 text-white'
											: 'text-zinc-500 hover:text-zinc-300'
									}`}>
									{value}
									{value === 'history' && state.runHistory.length > 0 && (
										<span className='ml-1 text-zinc-500'>
											({state.runHistory.length})
										</span>
									)}
								</button>
							))}
						</div>
					</div>
					<div className='flex items-center gap-2'>
						{run.status === 'running' && run.currentNodeId && (
							<button
								type='button'
								onClick={zoomToCurrentNode}
								className='flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-xs font-bold text-emerald-300 hover:bg-emerald-500/20'>
								<ChevronRight size={12} />
								Zoom to active
							</button>
						)}
						{state.ui.stepMode && state.ui.waitingForStep && (
							<button
								type='button'
								onClick={() => dispatch({ type: 'STEP_NEXT' })}
								className='flex animate-pulse items-center gap-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-xs font-bold text-amber-300 hover:bg-amber-500/20'>
								<ChevronRight size={12} />
								Step (Space)
							</button>
						)}
						<button
							type='button'
							onClick={() => dispatch({ type: 'TOGGLE_RUN_PANEL' })}
							className='flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 text-zinc-500 hover:bg-white/[0.06] hover:text-white'>
							<X size={14} />
						</button>
					</div>
				</div>
			</div>

			{tab === 'history' ? (
				<div className='flex-1 p-4'>
					<RunHistory />
				</div>
			) : (
			<div className='flex-1 space-y-6 p-4'>
				{hasOutput && (
					<div>
						<div className='mb-2 text-xs font-semibold tracking-[0.16em] text-zinc-600 uppercase'>
							Node Outputs
						</div>
						<NodeRunOutput nodes={state.nodes} />
					</div>
				)}

				{timedNodes.length > 0 && <ProfilerSummary nodes={timedNodes} />}

				<div className='flex-1'>
					<div className='mb-2 text-xs font-semibold tracking-[0.16em] text-zinc-600 uppercase'>
						Logs
					</div>
					<RunConsole logs={run.logs} />
				</div>
			</div>
			)}
		</section>
	);
};

export default RunPanel;
