import { useEffect, useRef } from 'react';
import { Beaker, ChevronDown, CircleAlert, FileText, Loader2, Pin, PinOff } from 'lucide-react';
import { useNodePin } from '../../_hooks/useNodePin.hook';
import { useWorkflowEditor } from '../../_context/WorkflowEditorProvider.context';
import type { TCanvasNode } from '../../_types/canvas.type';
import RunResult, { OriginalRunData, RunInputDetails } from './RunResult.partial';

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

const NodeRunOutput = ({ nodes }: { nodes: TCanvasNode[] }) => {
	const { pin, unpin } = useNodePin();
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
				const isError = status === 'error';
				const CardIcon = source === 'test' ? Beaker : FileText;
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
						className={`group overflow-hidden rounded-lg border ${entry.key === focusedKey ? 'border-zinc-400 dark:border-white/25' : 'border-zinc-200 dark:border-white/10'}`}>
						<summary className='flex cursor-pointer list-none items-center gap-3 bg-zinc-50/70 p-3.5 transition hover:bg-zinc-100 dark:bg-white/[0.025] dark:hover:bg-white/[0.04] [&::-webkit-details-marker]:hidden'>
							<span className='flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-zinc-200 bg-white text-zinc-400 dark:border-white/10 dark:bg-white/[0.03]'>
								<CardIcon size={13} />
							</span>
							<div className='min-w-0 flex-1'>
								<h4 className='text-xs leading-5 font-medium break-words'>
									{node.data.label}
								</h4>
								<p
									className={`text-[11px] ${isError ? 'text-rose-500' : 'text-zinc-500 dark:text-zinc-400'}`}>
									{source === 'test'
										? 'Step test'
										: pinned
											? 'Saved result'
											: 'Workflow run'}{' '}
									·{' '}
									{isError
										? 'Needs attention'
										: status === 'running'
											? 'In progress'
											: 'Completed'}
								</p>
							</div>
							<ChevronDown
								size={14}
								className='shrink-0 text-zinc-400 transition group-open:rotate-180'
							/>
						</summary>
						<div className='border-t border-zinc-200 p-4 dark:border-white/[0.06]'>
							{typeof entry.durationMs === 'number' && (
								<p className='mb-3 text-[11px] text-zinc-400 tabular-nums'>
									Duration · {(entry.durationMs / 1000).toFixed(1)}s
								</p>
							)}
							{status === 'running' ? (
								<p
									role='status'
									className='flex items-center gap-2 text-xs text-zinc-500'>
									<Loader2 size={13} className='animate-spin' />
									This step is being tested…
								</p>
							) : isError ? (
								<div className='rounded-lg border border-rose-200 bg-rose-50/50 p-3 dark:border-rose-500/20 dark:bg-rose-500/5'>
									<p className='flex items-center gap-2 text-xs font-medium text-rose-600 dark:text-rose-400'>
										<CircleAlert size={14} />
										This step could not finish
									</p>
									<p className='mt-2 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400'>
										Review its settings and the error details below.
									</p>
									{entry.error && (
										<details className='mt-3'>
											<summary className='cursor-pointer text-xs text-zinc-500 dark:text-zinc-400'>
												Error details
											</summary>
											<p className='mt-2 text-xs leading-relaxed break-words text-rose-600 dark:text-rose-400'>
												{entry.error}
											</p>
										</details>
									)}
								</div>
							) : (
								<>
									<div className='max-h-80 overflow-y-auto pr-1'>
										<RunResult value={entry.output} />
									</div>
									<OriginalRunData value={entry.output} />
								</>
							)}
							{status !== 'running' && <RunInputDetails value={entry.input} />}
							{source === 'run' &&
								!isError &&
								status !== 'running' &&
								entry.output !== undefined && (
									<div className='mt-3 flex items-center justify-end'>
										<button
											type='button'
											aria-pressed={pinned}
											onClick={() =>
												void (pinned ? unpin(node.id) : pin(node.id))
											}
											title={
												pinned
													? 'Stop reusing this result in future runs'
													: 'Reuse this result instead of running this step again'
											}
											className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1.5 text-[11px] transition hover:bg-zinc-100 dark:hover:bg-white/5 ${pinned ? 'text-amber-600 dark:text-amber-400' : 'text-zinc-500 dark:text-zinc-400'}`}>
											{pinned ? <PinOff size={12} /> : <Pin size={12} />}
											{pinned ? 'Stop reusing result' : 'Reuse this result'}
										</button>
									</div>
								)}
						</div>
					</details>
				);
			})}
		</div>
	);
};
export default NodeRunOutput;
