import { Pin, PinOff } from 'lucide-react';
import { useWorkflowEditor } from '../../_context/WorkflowEditorProvider.context';
import type { TCanvasNode } from '../../_types/canvas.type';

const NodeRunOutput = ({ nodes }: { nodes: TCanvasNode[] }) => {
	const { dispatch } = useWorkflowEditor();
	const nodesWithOutput = nodes
		.filter((node) => node.data.outputPreview !== undefined || node.data.pinned)
		.slice(-3);

	if (!nodesWithOutput.length) {
		return (
			<div className='flex h-32 items-center justify-center rounded-lg border border-dashed border-zinc-300 text-xs text-zinc-500 dark:border-zinc-700 dark:text-zinc-400'>
				Node outputs will appear here after running
			</div>
		);
	}

	return (
		<div className='grid gap-2 md:grid-cols-3'>
			{nodesWithOutput.map((node) => {
				const pinned = Boolean(node.data.pinned);
				const shown = pinned ? node.data.pinnedOutput : node.data.outputPreview;
				return (
					<div
						key={node.id}
						className={`rounded-lg border bg-white p-3 dark:bg-zinc-900 ${
							pinned
								? 'border-amber-300 dark:border-amber-700/60'
								: 'border-zinc-200 dark:border-zinc-800'
						}`}>
						<div className='mb-2 flex items-center justify-between gap-2'>
							<div className='flex min-w-0 items-center gap-1.5'>
								{pinned && <Pin size={10} className='shrink-0 text-amber-500' />}
								<div className='truncate text-xs font-black text-zinc-800 dark:text-zinc-200'>
									{node.data.label}
								</div>
							</div>
							<div className='flex shrink-0 items-center gap-1.5'>
								{node.data.durationMs !== undefined && (
									<span className='text-[10px] text-zinc-500 dark:text-zinc-400'>
										{node.data.durationMs}ms
									</span>
								)}
								<button
									type='button'
									title={pinned ? 'Unpin output' : 'Pin this output for re-runs'}
									onClick={() =>
										dispatch(
											pinned
												? { type: 'UNPIN_NODE', id: node.id }
												: { type: 'PIN_NODE_OUTPUT', id: node.id },
										)
									}
									className={`flex h-5 w-5 items-center justify-center rounded transition ${
										pinned
											? 'text-amber-500 hover:text-amber-600'
											: 'text-zinc-400 hover:text-amber-500'
									}`}>
									{pinned ? <PinOff size={11} /> : <Pin size={11} />}
								</button>
							</div>
						</div>
						<pre className='max-h-24 overflow-y-auto text-[10px] text-zinc-600 dark:text-zinc-400'>
							{JSON.stringify(shown, null, 2)}
						</pre>
					</div>
				);
			})}
		</div>
	);
};

export default NodeRunOutput;
