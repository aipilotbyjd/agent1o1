import { useEffect, useRef, useState } from 'react';
import { Check, ChevronDown, FileText, Loader2, Pin, PinOff, RotateCw, X } from 'lucide-react';
import { useNodePin } from '../../_hooks/useNodePin.hook';
import { useNodeTestRunner } from '../../_hooks/useNodeTestRunner.hook';
import { useWorkflowEditor } from '../../_hooks/useWorkflowEditor.hook';
import type { TCanvasNode } from '../../_types/canvas.type';
import { countItems, formatDuration, getHttpFailure } from '../../_helper/runData.helper';
import DataInspector from './DataInspector.partial';
import StepError from './StepError.partial';

type ResultEntry = {
	key: string;
	node: TCanvasNode;
	source: 'run' | 'test';
	output: unknown;
	input: unknown;
	error?: string;
	status: string;
	pinned: boolean;
	durationMs?: number;
};

const RetestButton = ({ node }: { node: TCanvasNode }) => {
	const { runTest, testStatus, canRun } = useNodeTestRunner(node.id, node.data.defKey);
	return (
		<button
			type='button'
			disabled={!canRun || testStatus === 'running'}
			onClick={() => void runTest()}
			className='inline-flex items-center gap-1.5 rounded-md px-2 py-1.5 text-[11px] font-medium text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-800 disabled:opacity-50 dark:text-zinc-400 dark:hover:bg-white/5 dark:hover:text-zinc-200'>
			<RotateCw size={12} className={testStatus === 'running' ? 'animate-spin' : ''} />
			Test again
		</button>
	);
};

const ResultBody = ({ entry }: { entry: ResultEntry }) => {
	const { pin, unpin } = useNodePin();
	const [pane, setPane] = useState<'output' | 'input'>('output');
	const { node, pinned, source, status } = entry;
	const isError = status === 'error';
	const httpFailure = isError ? null : getHttpFailure(entry.output);
	const hasInput =
		entry.input !== undefined &&
		!(entry.input && typeof entry.input === 'object' && !Object.keys(entry.input).length);

	if (status === 'running')
		return (
			<div
				role='status'
				className='flex items-center gap-2 border-t border-zinc-200 px-4 py-5 text-xs text-zinc-500 dark:border-white/[0.06]'>
				<Loader2 size={13} className='animate-spin' />
				Running this step…
			</div>
		);

	return (
		<div className='border-t border-zinc-200 p-3.5 dark:border-white/[0.06]'>
			{hasInput && (
				<div
					role='tablist'
					aria-label='Step data'
					className='mb-3 flex gap-4 border-b border-zinc-200 text-xs dark:border-white/10'>
					{(['output', 'input'] as const).map((id) => (
						<button
							key={id}
							type='button'
							role='tab'
							aria-selected={pane === id}
							onClick={() => setPane(id)}
							className={`-mb-px border-b-2 pb-2 font-medium capitalize transition ${pane === id ? 'dark:border-primary-400 border-zinc-900 text-zinc-900 dark:text-zinc-100' : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200'}`}>
							{id}
						</button>
					))}
				</div>
			)}

			{pane === 'input' && hasInput ? (
				<DataInspector value={entry.input} emptyLabel='This step received no input.' />
			) : isError ? (
				<StepError message={entry.error} />
			) : (
				<>
					{httpFailure && (
						<div className='mb-3'>
							<StepError
								title={`HTTP ${httpFailure.status}`}
								message={httpFailure.message ?? 'The server rejected this request.'}
							/>
						</div>
					)}
					<DataInspector
						value={entry.output}
						nodeId={node.id}
						emptyLabel='This step finished but returned no data.'
					/>
				</>
			)}

			<div className='mt-3 flex items-center justify-end gap-1'>
				{source === 'test' && <RetestButton node={node} />}
				{source === 'run' && !isError && entry.output !== undefined && (
					<button
						type='button'
						aria-pressed={pinned}
						onClick={() => void (pinned ? unpin(node.id) : pin(node.id))}
						title={
							pinned
								? 'Stop reusing this result in future runs'
								: 'Reuse this result instead of running this step again'
						}
						className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1.5 text-[11px] font-medium transition hover:bg-zinc-100 dark:hover:bg-white/5 ${pinned ? 'text-amber-600 dark:text-amber-400' : 'text-zinc-500 dark:text-zinc-400'}`}>
						{pinned ? <PinOff size={12} /> : <Pin size={12} />}
						{pinned ? 'Unpin data' : 'Pin data'}
					</button>
				)}
			</div>
		</div>
	);
};

const NodeRunOutput = ({ nodes }: { nodes: TCanvasNode[] }) => {
	const { state } = useWorkflowEditor();
	const focusedKey = state.ui.runPanelResultKey;
	const cards = useRef(new Map<string, HTMLDetailsElement>());
	const results: ResultEntry[] = nodes.flatMap((node) => {
		const entries: ResultEntry[] = [];
		if (node.data.status === 'success' || node.data.status === 'error' || node.data.pinned)
			entries.push({
				key: `${node.id}:run`,
				node,
				source: 'run',
				output: node.data.pinned ? node.data.pinnedOutput : node.data.outputPreview,
				input: node.data.inputPreview,
				error: node.data.error,
				status: node.data.status ?? 'idle',
				pinned: Boolean(node.data.pinned),
				durationMs: node.data.durationMs,
			});
		if (node.data.testStatus && node.data.testStatus !== 'idle')
			entries.push({
				key: `${node.id}:test`,
				node,
				source: 'test',
				output: node.data.testOutput,
				input: node.data.testInput,
				error: node.data.testError,
				status: node.data.testStatus,
				pinned: false,
				durationMs: node.data.testDurationMs,
			});
		return entries;
	});
	useEffect(() => {
		if (!focusedKey) return;
		const card = cards.current.get(focusedKey);
		if (card) {
			card.open = true;
			card.scrollIntoView({ block: 'nearest' });
			card.querySelector('summary')?.focus({ preventScroll: true });
		}
	}, [focusedKey, state.ui.runPanelResultRequestId]);

	if (!results.length)
		return (
			<div className='flex flex-col items-center px-4 py-12 text-center'>
				<span className='flex h-11 w-11 items-center justify-center rounded-xl border border-zinc-200 text-zinc-400 dark:border-white/10'>
					<FileText size={20} />
				</span>
				<h4 className='mt-4 text-sm font-medium'>No results yet</h4>
				<p className='mt-2 max-w-60 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400'>
					Run your workflow or test a step to inspect its results here.
				</p>
			</div>
		);
	return (
		<div className='space-y-3'>
			{results.map((entry, index) => {
				const { node, pinned, source, status } = entry;
				const httpFailure = status === 'error' ? null : getHttpFailure(entry.output);
				const isError = status === 'error' || Boolean(httpFailure);
				const isRunning = status === 'running';
				const items = countItems(entry.output);
				const verdict = isRunning
					? 'Running'
					: isError
						? source === 'test'
							? 'Test failed'
							: 'Failed'
						: source === 'test'
							? 'Test passed'
							: 'Succeeded';
				return (
					<details
						key={entry.key}
						ref={(element) => {
							if (element) cards.current.set(entry.key, element);
							else cards.current.delete(entry.key);
						}}
						open={
							entry.key === focusedKey ||
							(!focusedKey && index === results.length - 1)
						}
						className={`group overflow-hidden rounded-xl border bg-white dark:bg-white/[0.015] ${entry.key === focusedKey ? 'border-zinc-400 dark:border-white/25' : 'border-zinc-200 dark:border-white/10'}`}>
						<summary className='flex cursor-pointer list-none items-center gap-3 px-3.5 py-3 transition hover:bg-zinc-50 dark:hover:bg-white/[0.03] [&::-webkit-details-marker]:hidden'>
							<span
								className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${isRunning ? 'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400' : isError ? 'bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400' : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400'}`}>
								{isRunning ? (
									<Loader2 size={13} className='animate-spin' />
								) : isError ? (
									<X size={13} strokeWidth={2.5} />
								) : (
									<Check size={13} strokeWidth={2.5} />
								)}
							</span>
							<div className='min-w-0 flex-1'>
								<div className='flex items-center gap-1.5'>
									<h4 className='truncate text-xs leading-5 font-semibold'>
										{node.data.label}
									</h4>
									<span className='shrink-0 rounded bg-zinc-100 px-1.5 py-px text-[10px] font-medium text-zinc-500 dark:bg-white/[0.06] dark:text-zinc-400'>
										{source === 'test' ? 'Test' : pinned ? 'Pinned' : 'Run'}
									</span>
								</div>
								<p className='mt-0.5 flex flex-wrap items-center gap-x-1.5 text-[11px] text-zinc-500 tabular-nums dark:text-zinc-400'>
									<span
										className={
											isError
												? 'font-medium text-rose-600 dark:text-rose-400'
												: isRunning
													? 'text-blue-600 dark:text-blue-400'
													: 'font-medium text-emerald-600 dark:text-emerald-400'
										}>
										{verdict}
									</span>
									{typeof entry.durationMs === 'number' && (
										<>
											<span className='text-zinc-300 dark:text-zinc-600'>
												·
											</span>
											{formatDuration(entry.durationMs)}
										</>
									)}
									{httpFailure && (
										<>
											<span className='text-zinc-300 dark:text-zinc-600'>
												·
											</span>
											<span className='rounded bg-rose-50 px-1 font-mono text-[10px] font-semibold text-rose-600 dark:bg-rose-500/10 dark:text-rose-400'>
												HTTP {httpFailure.status}
											</span>
										</>
									)}
									{!isError && !isRunning && entry.output !== undefined && (
										<>
											<span className='text-zinc-300 dark:text-zinc-600'>
												·
											</span>
											{items} item{items === 1 ? '' : 's'}
										</>
									)}
								</p>
							</div>
							<ChevronDown
								size={14}
								className='shrink-0 text-zinc-400 transition group-open:rotate-180'
							/>
						</summary>
						<ResultBody entry={entry} />
					</details>
				);
			})}
		</div>
	);
};
export default NodeRunOutput;
