import { useEffect, useRef } from 'react';
import { ArrowUpRight, Beaker, Loader2 } from 'lucide-react';
import { useWorkflowEditor } from '../../../_context/WorkflowEditorProvider.context';
import { useNodeTestRunner } from '../../../_hooks/useNodeTestRunner.hook';

/** Single-step tests keep the canvas compact; inspection lives in Runs. */
const NodeInlineTest = ({ nodeId, defKey }: { nodeId: string; defKey: string }) => {
	const { state, dispatch } = useWorkflowEditor();
	const { runTest, testStatus, canRun } = useNodeTestRunner(nodeId, defKey);
	const { nodeTestRequestId, nodeTestRequestNodeId } = state.ui;
	const lastHandledRequest = useRef(nodeTestRequestId);
	useEffect(() => {
		if (nodeTestRequestId === lastHandledRequest.current) return;
		lastHandledRequest.current = nodeTestRequestId;
		if (nodeTestRequestNodeId === nodeId) void runTest();
	}, [nodeTestRequestId, nodeTestRequestNodeId, nodeId, runTest]);
	const hasResult = testStatus === 'success' || testStatus === 'error';
	return (
		<div className='nodrag mt-3 flex flex-wrap items-center gap-2'>
			<button
				type='button'
				disabled={testStatus === 'running' || !canRun}
				onClick={(event) => {
					event.stopPropagation();
					void runTest();
				}}
				title={
					canRun
						? 'Run this step once with the current settings'
						: 'Save the workflow first'
				}
				className='focus-visible:outline-primary-500 inline-flex items-center justify-center gap-1.5 rounded-lg border border-zinc-200 px-3 py-1.5 text-[11px] font-medium text-zinc-500 transition hover:bg-zinc-50 focus-visible:outline-2 disabled:opacity-50 dark:border-white/10 dark:text-zinc-400 dark:hover:bg-white/5'>
				{testStatus === 'running' ? (
					<Loader2 size={12} className='animate-spin' />
				) : (
					<Beaker size={12} />
				)}
				{testStatus === 'running' ? 'Testing…' : 'Test step'}
			</button>
			{hasResult && (
				<button
					type='button'
					onClick={(event) => {
						event.stopPropagation();
						dispatch({ type: 'SHOW_RUN_RESULT', nodeId, source: 'test' });
					}}
					className={`focus-visible:outline-primary-500 inline-flex items-center gap-1 rounded-md px-2 py-1.5 text-[11px] font-medium hover:underline focus-visible:outline-2 ${testStatus === 'error' ? 'text-rose-600 dark:text-rose-400' : 'text-zinc-500 dark:text-zinc-400'}`}>
					View test result
					<ArrowUpRight size={12} />
				</button>
			)}
		</div>
	);
};
export default NodeInlineTest;
