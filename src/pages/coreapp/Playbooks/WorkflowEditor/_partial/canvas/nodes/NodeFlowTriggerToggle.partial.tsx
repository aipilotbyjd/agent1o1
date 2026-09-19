import { Info, Zap } from 'lucide-react';
import { useWorkflowEditor } from '../../../_context/WorkflowEditorProvider.context';

/**
 * Top strip — promotes this node to the flow's entry trigger, so the flow starts
 * running from here whenever this integration reports new data. Gumloop-style:
 * exactly one node in a flow may carry the trigger.
 */
const NodeFlowTriggerToggle = ({ nodeId, active }: { nodeId: string; active: boolean }) => {
	const { dispatch } = useWorkflowEditor();

	return (
		<div
			className={[
				'nodrag flex items-center justify-between gap-2 rounded-t-2xl border-b px-3.5 py-2.5 transition-colors',
				active
					? 'border-primary-100 bg-primary-50/70 dark:border-primary-900/40 dark:bg-primary-950/25'
					: 'border-zinc-100 bg-zinc-50/70 dark:border-zinc-800/70 dark:bg-zinc-900/40',
			].join(' ')}
			onPointerDown={(event) => event.stopPropagation()}>
			<span className='flex min-w-0 items-center gap-1.5'>
				{active && (
					<span className='flex size-4 shrink-0 items-center justify-center rounded-full bg-primary-500 text-white'>
						<Zap size={9} fill='currentColor' strokeWidth={0} />
					</span>
				)}
				<span
					className={[
						'truncate text-[12px] font-bold tracking-tight',
						active
							? 'text-primary-600 dark:text-primary-400'
							: 'text-zinc-700 dark:text-zinc-200',
					].join(' ')}>
					Activate as flow trigger
				</span>
				<span
					title='When on, the flow starts from this node whenever it detects new data — one trigger per flow.'
					className='shrink-0 text-zinc-400 transition hover:text-primary-500 dark:text-zinc-500'>
					<Info size={11} />
				</span>
			</span>

			<span className='flex shrink-0 items-center gap-2'>
				<span
					className={[
						'text-[11px] font-bold tabular-nums',
						active ? 'text-primary-600 dark:text-primary-400' : 'text-zinc-400',
					].join(' ')}>
					{active ? 'Yes' : 'No'}
				</span>
				<button
					type='button'
					role='switch'
					aria-checked={active}
					aria-label='Activate as flow trigger'
					onClick={(event) => {
						event.stopPropagation();
						dispatch({ type: 'TOGGLE_NODE_FLOW_TRIGGER', id: nodeId });
					}}
					className={[
						'flex h-5 w-9 cursor-pointer items-center rounded-full border p-0.5 transition-all duration-200',
						active
							? 'justify-end border-primary-400 bg-primary-400'
							: 'justify-start border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-800',
					].join(' ')}>
					<span
						className={[
							'size-3.5 rounded-full shadow-sm transition-colors',
							active ? 'bg-white' : 'bg-zinc-300 dark:bg-zinc-600',
						].join(' ')}
					/>
				</button>
			</span>
		</div>
	);
};

export default NodeFlowTriggerToggle;
