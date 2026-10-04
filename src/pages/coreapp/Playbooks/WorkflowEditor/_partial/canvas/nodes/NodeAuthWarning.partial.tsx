import { AlertCircle } from 'lucide-react';
import { useWorkflowEditor } from '../../../_context/WorkflowEditorProvider.context';

/** Shown when a node declares `requiresCredential` but none is selected. */
const NodeAuthWarning = () => {
	const { dispatch } = useWorkflowEditor();

	return (
		<div className='border-b border-red-100 bg-[#fff6f5] px-3 pt-1 pb-3 dark:border-red-900/30 dark:bg-red-950/20'>
			<div className='flex flex-col gap-1.5'>
				<div className='flex items-center gap-1.5 text-[11px] font-bold text-red-500'>
					<AlertCircle size={13} />
					Missing credential(s) or scope(s)
				</div>
				<div className='text-[10px] leading-tight text-red-500/80'>
					This node may not work properly until you authenticate, switch credentials or
					attain the right scopes.
				</div>
				<button
					type='button'
					onPointerDown={(event) => event.stopPropagation()}
					onClick={(event) => {
						event.stopPropagation();
						dispatch({ type: 'SET_LINK_CREDENTIALS_OPEN', open: true });
					}}
					className='border-zinc-250 nodrag mt-1 flex cursor-pointer items-center gap-1.5 self-start rounded-md border bg-white px-2.5 py-1 text-[11px] font-semibold text-primary-600 shadow-xs hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-primary-400 dark:hover:bg-zinc-800'>
					Authenticate credentials
				</button>
			</div>
		</div>
	);
};

export default NodeAuthWarning;
