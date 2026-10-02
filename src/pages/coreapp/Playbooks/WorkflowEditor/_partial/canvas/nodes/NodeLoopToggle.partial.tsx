import { useWorkflowEditor } from '../../../_context/WorkflowEditorProvider.context';

/** Runs the node once per item of its incoming list input. */
const NodeLoopToggle = ({ nodeId, active }: { nodeId: string; active: boolean }) => {
	const { dispatch } = useWorkflowEditor();

	return (
		<div className='nodrag flex items-center gap-1.5'>
			<span
				className={
					active
						? 'text-[10px] font-bold text-primary-600 dark:text-primary-400'
						: 'text-[10px] font-bold text-zinc-400'
				}>
				Loop Mode
			</span>
			<button
				type='button'
				role='switch'
				aria-checked={active}
				aria-label='Loop mode'
				title='Run this node once per item of the incoming list'
				onPointerDown={(event) => event.stopPropagation()}
				onClick={(event) => {
					event.stopPropagation();
					dispatch({ type: 'TOGGLE_NODE_LOOP_MODE', id: nodeId });
				}}
				className={[
					'flex h-4 w-7 cursor-pointer items-center rounded-full border p-0.5 transition-all duration-200',
					active
						? 'justify-end border-primary-400 bg-primary-400'
						: 'justify-start border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-800',
				].join(' ')}>
				<div
					className={[
						'h-3 w-3 rounded-full transition-colors',
						active ? 'bg-white' : 'bg-zinc-300 dark:bg-zinc-600',
					].join(' ')}
				/>
			</button>
		</div>
	);
};

export default NodeLoopToggle;
