import { useState } from 'react';
import { CheckCircle2, ChevronDown, ChevronRight, Clock, RotateCw, Trash2, XCircle } from 'lucide-react';
import { useWorkflowEditor } from '../../_context/WorkflowEditorProvider.context';
import { useRunWorkflow } from '../../_hooks/useRunWorkflow.hook';
import type { TRunRecord } from '../../_types/run.type';

const statusMeta: Record<TRunRecord['status'], { label: string; cls: string; icon: typeof CheckCircle2 }> = {
	success: { label: 'Success', cls: 'text-emerald-400', icon: CheckCircle2 },
	error: { label: 'Failed', cls: 'text-rose-400', icon: XCircle },
	stopped: { label: 'Stopped', cls: 'text-amber-400', icon: Clock },
};

const RunRow = ({ record }: { record: TRunRecord }) => {
	const [open, setOpen] = useState(false);
	const meta = statusMeta[record.status];
	const Icon = meta.icon;
	const total = record.nodeRuns.reduce((acc, n) => acc + (n.durationMs ?? 0), 0);
	const skipped = record.nodeRuns.filter((n) => n.status === 'skipped').length;

	return (
		<div className='rounded-lg border border-white/10 bg-white/[0.025]'>
			<button
				type='button'
				onClick={() => setOpen((v) => !v)}
				className='flex w-full items-center gap-2 px-3 py-2 text-left'>
				{open ? <ChevronDown size={13} className='text-zinc-500' /> : <ChevronRight size={13} className='text-zinc-500' />}
				<Icon size={14} className={meta.cls} />
				<span className={`text-xs font-bold ${meta.cls}`}>{meta.label}</span>
				<span className='text-[11px] text-zinc-500'>
					{new Date(record.startedAt).toLocaleTimeString()}
				</span>
				<span className='ml-auto text-[11px] text-zinc-500'>
					{record.nodeRuns.length} nodes{skipped ? ` · ${skipped} skipped` : ''} · {total}ms
				</span>
			</button>

			{open && (
				<div className='space-y-1 border-t border-white/10 px-3 py-2'>
					{record.nodeRuns.map((node) => (
						<div key={node.nodeId} className='flex items-start gap-2 text-[11px]'>
							<span
								className={`mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full ${
									node.status === 'success'
										? 'bg-emerald-400'
										: node.status === 'error'
											? 'bg-rose-400'
											: 'bg-zinc-600'
								}`}
							/>
							<span className='w-32 shrink-0 truncate text-zinc-300'>{node.label}</span>
							<span className='truncate font-mono text-zinc-500'>
								{node.status === 'error'
									? node.error
									: node.status === 'skipped'
										? 'skipped'
										: JSON.stringify(node.output)}
							</span>
						</div>
					))}
				</div>
			)}
		</div>
	);
};

const RunHistory = () => {
	const { state, dispatch } = useWorkflowEditor();
	const { runWorkflow } = useRunWorkflow();
	const history = state.runHistory;

	if (!history.length) {
		return (
			<div className='flex h-32 items-center justify-center rounded-lg border border-dashed border-white/10 text-xs text-zinc-500'>
				No runs yet — execute the workflow to build history
			</div>
		);
	}

	return (
		<div className='space-y-2'>
			<div className='flex items-center justify-between'>
				<div className='text-xs font-semibold tracking-[0.16em] text-zinc-600 uppercase'>
					{history.length} past run{history.length === 1 ? '' : 's'}
				</div>
				<div className='flex items-center gap-2'>
					<button
						type='button'
						onClick={() => void runWorkflow()}
						disabled={state.run.status === 'running'}
						className='flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-xs font-bold text-emerald-300 hover:bg-emerald-500/20 disabled:opacity-50'>
						<RotateCw size={12} />
						Replay
					</button>
					<button
						type='button'
						onClick={() => dispatch({ type: 'CLEAR_RUN_HISTORY' })}
						className='flex items-center gap-1.5 rounded-lg border border-white/10 px-2.5 py-1 text-xs font-bold text-zinc-400 hover:bg-white/[0.06] hover:text-white'>
						<Trash2 size={12} />
						Clear
					</button>
				</div>
			</div>
			{history.map((record) => (
				<RunRow key={record.id} record={record} />
			))}
		</div>
	);
};

export default RunHistory;
