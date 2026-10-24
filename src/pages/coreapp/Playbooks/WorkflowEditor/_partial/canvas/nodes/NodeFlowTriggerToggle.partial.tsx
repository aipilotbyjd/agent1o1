import { useMemo } from 'react';
import { Info, Zap } from 'lucide-react';
import {
	usePauseWorkflowTrigger,
	useResumeWorkflowTrigger,
	useWorkflowTrigger,
} from '@/api/modules/workflows/workflows.hooks';
import { useWorkflowEditor } from '../../../_hooks/useWorkflowEditor.hook';
import { useWorkflowRouteParams } from '../../../_hooks/useWorkflowRouteParams.hook';

type Props = {
	nodeId: string;
	/** The node's `activate` config: what the next publish turns the trigger into. */
	active: boolean;
};

/**
 * Gumloop's "Activate as flow trigger" strip. The switch is the node's
 * `activate` config, so it's saved with the workflow and publishing turns the
 * trigger on or off to match (`TriggerNodeSync`). Once published it also flips
 * the live trigger straight away, no republish needed. A flow may have several
 * triggers; each starts its own runs.
 */
const NodeFlowTriggerToggle = ({ nodeId, active }: Props) => {
	const { dispatch } = useWorkflowEditor();
	const { workspaceId, workflowId } = useWorkflowRouteParams();
	const { data: workflowTriggers } = useWorkflowTrigger(workspaceId, workflowId);
	const pauseTrigger = usePauseWorkflowTrigger(workspaceId);
	const resumeTrigger = useResumeWorkflowTrigger(workspaceId);

	// The published row this node owns: the canvas node id is its node key.
	const liveTrigger = useMemo(
		() => workflowTriggers.find((trigger) => trigger.trigger_node_key === nodeId),
		[workflowTriggers, nodeId],
	);

	const status = !active
		? null
		: !liveTrigger
			? 'Publish to activate'
			: liveTrigger.is_active
				? 'Listening'
				: liveTrigger.consecutive_failure_count > 0
					? 'Off after failures'
					: 'Paused';

	const handleToggle = () => {
		const enabling = !active;
		dispatch({ type: 'UPDATE_NODE_VALUE', id: nodeId, fieldKey: 'activate', value: enabling });
		if (liveTrigger && liveTrigger.is_active !== enabling) {
			(enabling ? resumeTrigger : pauseTrigger).mutate(liveTrigger.id);
		}
	};

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
					<span className='bg-primary-500 flex size-4 shrink-0 items-center justify-center rounded-full text-white'>
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
					title='When on, the flow starts from this node every time it detects something new. Publish to make it live; after that this switch pauses and resumes it instantly.'
					className='hover:text-primary-900 dark:hover:text-primary-400 shrink-0 text-zinc-400 transition dark:text-zinc-500'>
					<Info size={11} />
				</span>
			</span>

			<span className='flex shrink-0 items-center gap-2'>
				<span
					className={[
						'text-[11px] font-bold',
						active ? 'text-primary-600 dark:text-primary-400' : 'text-zinc-400',
					].join(' ')}>
					{status ?? 'No'}
				</span>
				<button
					type='button'
					role='switch'
					aria-checked={active}
					aria-label='Activate as flow trigger'
					disabled={pauseTrigger.isPending || resumeTrigger.isPending}
					onClick={(event) => {
						event.stopPropagation();
						handleToggle();
					}}
					className={[
						'flex h-5 w-9 cursor-pointer items-center rounded-full border p-0.5 transition-all duration-200 disabled:opacity-50',
						active
							? 'border-primary-400 bg-primary-400 justify-end'
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
