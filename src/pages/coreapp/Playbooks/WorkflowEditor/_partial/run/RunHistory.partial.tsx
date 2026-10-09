import {
	Check,
	ChevronDown,
	CircleAlert,
	History,
	Loader2,
	RotateCw,
	Square,
	Trash2,
} from 'lucide-react';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { RunService, runKeys } from '@/api/modules/runs';
import { useWorkflowEditor } from '../../_context/WorkflowEditorProvider.context';
import type { TRunRecord } from '../../_types/run.type';
import DataInspector from './DataInspector.partial';
import StepError from './StepError.partial';

const statusMeta = {
	success: {
		label: 'Completed',
		cls: 'text-emerald-600 dark:text-emerald-400',
		bg: 'bg-emerald-50 dark:bg-emerald-500/10',
		icon: Check,
	},
	error: {
		label: 'Needs attention',
		cls: 'text-rose-600 dark:text-rose-400',
		bg: 'bg-rose-50 dark:bg-rose-500/10',
		icon: CircleAlert,
	},
	stopped: {
		label: 'Stopped',
		cls: 'text-amber-600 dark:text-amber-400',
		bg: 'bg-amber-50 dark:bg-amber-500/10',
		icon: Square,
	},
};
const RunRow = ({ record }: { record: TRunRecord }) => {
	const { state } = useWorkflowEditor();
	const [open, setOpen] = useState(false);
	const workspaceId = state.workflow.workspaceId ?? '';
	// Practice runs only exist locally. Fetch server results on demand for real runs.
	const isRemote = Boolean(workspaceId) && !record.id.startsWith('run_');
	const resultQuery = useQuery({
		queryKey: runKeys.nodeRuns(workspaceId, record.id),
		queryFn: ({ signal }) => RunService.nodeRuns(workspaceId, record.id, signal),
		enabled: open && isRemote,
		staleTime: 60_000,
		retry: 1,
	});
	const nodeRuns =
		resultQuery.data?.map((node) => ({
			nodeId: node.key,
			label:
				record.nodeRuns.find((saved) => saved.nodeId === node.key)?.label ??
				state.nodes.find((step) => step.id === node.key)?.data.label ??
				node.key,
			status:
				node.status === 'completed'
					? 'success'
					: node.status === 'skipped'
						? 'skipped'
						: 'error',
			output: node.output,
			input: node.input,
			error: node.error ?? undefined,
		})) ?? record.nodeRuns;
	const meta = statusMeta[record.status];
	const Icon = meta.icon;
	const completed = record.nodeRuns.filter((node) => node.status === 'success').length;
	return (
		<details
			onToggle={(event) => {
				if (event.target === event.currentTarget) setOpen(event.currentTarget.open);
			}}
			className='group border-b border-zinc-100 last:border-0 dark:border-white/[0.06]'>
			<summary className='flex cursor-pointer list-none items-center gap-3 py-4 [&::-webkit-details-marker]:hidden'>
				<span
					className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${meta.bg} ${meta.cls}`}>
					<Icon size={15} />
				</span>
				<div className='min-w-0 flex-1'>
					<p className='text-xs font-medium'>
						{new Date(record.startedAt).toLocaleString([], {
							month: 'short',
							day: 'numeric',
							hour: '2-digit',
							minute: '2-digit',
						})}
					</p>
					<p className={`mt-1 text-[11px] ${meta.cls}`}>
						{meta.label}
						<span className='text-zinc-400'>
							{' '}
							· {completed}/{record.nodeRuns.length} steps
						</span>
					</p>
				</div>
				<span className='text-[11px] text-zinc-500 tabular-nums dark:text-zinc-400'>
					{(Math.max(0, record.finishedAt - record.startedAt) / 1000).toFixed(1)}s
				</span>
				<ChevronDown size={13} className='text-zinc-400 transition group-open:rotate-180' />
			</summary>
			<div className='mb-4 space-y-4 rounded-lg bg-zinc-50 p-4 dark:bg-white/[0.025]'>
				{isRemote && resultQuery.isFetching && (
					<p
						role='status'
						className='flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400'>
						<Loader2 size={13} className='animate-spin' />
						Loading saved results…
					</p>
				)}
				{isRemote && resultQuery.isError && (
					<div
						role='alert'
						className='rounded-lg border border-rose-200 p-3 dark:border-rose-500/20'>
						<p className='text-xs leading-relaxed text-zinc-600 dark:text-zinc-400'>
							Could not load saved results. Your run summary is still available.
						</p>
						<button
							type='button'
							onClick={() => void resultQuery.refetch()}
							className='mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-rose-600 dark:text-rose-400'>
							<RotateCw size={12} />
							Try again
						</button>
					</div>
				)}
				{!nodeRuns.length && !resultQuery.isFetching && (
					<p className='text-xs text-zinc-500'>No step details were recorded.</p>
				)}
				{nodeRuns.map((node, index) => (
					<div
						key={node.nodeId}
						className='border-b border-zinc-200 pb-4 last:border-0 last:pb-0 dark:border-white/[0.06]'>
						<div className='mb-3 flex items-start justify-between gap-3'>
							<h4 className='text-xs font-medium break-words'>
								<span className='mr-2 text-zinc-400'>{index + 1}.</span>
								{node.label}
							</h4>
							<span
								className={`shrink-0 text-[10px] ${node.status === 'error' ? statusMeta.error.cls : 'text-zinc-500 dark:text-zinc-400'}`}>
								{node.status === 'success'
									? 'Done'
									: node.status === 'error'
										? 'Needs attention'
										: 'Skipped'}
							</span>
						</div>
						{node.status === 'success' && node.output === undefined && (
							<p className='text-xs text-zinc-500 dark:text-zinc-400'>
								{isRemote
									? resultQuery.isFetching
										? 'Retrieving this result…'
										: resultQuery.isError
											? 'This result could not be loaded.'
											: 'No saved result is available for this step.'
									: 'Practice results are only available until the editor reloads.'}
							</p>
						)}
						{node.status === 'success' && node.output !== undefined && (
							<DataInspector
								value={node.output}
								emptyLabel='This step finished but returned no data.'
								maxHeight='max-h-60'
							/>
						)}
						{node.status === 'error' && <StepError message={node.error} />}
						{node.input !== undefined && (
							<details className='mt-3'>
								<summary className='cursor-pointer text-[11px] font-medium text-zinc-500 dark:text-zinc-400'>
									Input
								</summary>
								<div className='mt-2'>
									<DataInspector
										value={node.input}
										emptyLabel='This step received no input.'
										maxHeight='max-h-60'
									/>
								</div>
							</details>
						)}
					</div>
				))}
			</div>
		</details>
	);
};
const RunHistory = () => {
	const { state, dispatch } = useWorkflowEditor();
	const history = state.runHistory;
	if (!history.length)
		return (
			<div className='py-12 text-center'>
				<span className='mx-auto flex h-11 w-11 items-center justify-center rounded-xl border border-zinc-200 text-zinc-400 dark:border-white/10'>
					<History size={20} />
				</span>
				<h3 className='mt-4 text-sm font-medium'>No past runs</h3>
				<p className='mt-2 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400'>
					Completed and stopped runs will appear here.
				</p>
			</div>
		);
	return (
		<div>
			<div className='mb-1 flex items-center justify-between gap-2'>
				<div>
					<h3 className='text-sm font-semibold'>Run history</h3>
					<p className='mt-1 text-[11px] text-zinc-500 dark:text-zinc-400'>
						{history.length} recorded run{history.length === 1 ? '' : 's'}
					</p>
				</div>
				<button
					type='button'
					onClick={() => dispatch({ type: 'CLEAR_RUN_HISTORY' })}
					className='inline-flex items-center gap-1.5 rounded-md px-2 py-1.5 text-[11px] text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-white/5 dark:hover:text-zinc-300'>
					<Trash2 size={12} />
					Clear
				</button>
			</div>
			{history.map((record) => (
				<RunRow key={record.id} record={record} />
			))}
		</div>
	);
};
export default RunHistory;
