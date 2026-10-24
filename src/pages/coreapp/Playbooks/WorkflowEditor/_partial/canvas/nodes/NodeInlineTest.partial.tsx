import { useEffect, useRef } from 'react';
import { ArrowUpRight, Beaker, Check, Loader2, X } from 'lucide-react';
import { useWorkflowEditor } from '../../../_hooks/useWorkflowEditor.hook';
import { useNodeTestRunner } from '../../../_hooks/useNodeTestRunner.hook';
import { countItems, formatDuration, getHttpFailure } from '../../../_helper/runData.helper';

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
	const node = state.nodes.find((item) => item.id === nodeId);
	const hasResult = testStatus === 'success' || testStatus === 'error';
	const httpFailure = testStatus === 'success' ? getHttpFailure(node?.data.testOutput) : null;
	const failed = testStatus === 'error' || Boolean(httpFailure);
	const items = countItems(node?.data.testOutput);
	const durationMs = node?.data.testDurationMs;
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
					title={
						httpFailure
							? `HTTP ${httpFailure.status}${httpFailure.message ? ` · ${httpFailure.message}` : ''}`
							: failed
								? node?.data.testError
								: 'Open the test result'
					}
					className={`focus-visible:outline-primary-500 inline-flex min-w-0 items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[11px] font-medium transition focus-visible:outline-2 ${failed ? 'border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 dark:border-rose-500/25 dark:bg-rose-500/10 dark:text-rose-300 dark:hover:bg-rose-500/15' : 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:border-emerald-500/25 dark:bg-emerald-500/10 dark:text-emerald-300 dark:hover:bg-emerald-500/15'}`}>
					{failed ? (
						<X size={12} strokeWidth={2.5} />
					) : (
						<Check size={12} strokeWidth={2.5} />
					)}
					<span className='shrink-0'>{failed ? 'Test failed' : 'Test passed'}</span>
					{typeof durationMs === 'number' && (
						<span className='shrink-0 tabular-nums opacity-70'>
							· {formatDuration(durationMs)}
						</span>
					)}
					{httpFailure && (
						<span className='shrink-0 font-mono opacity-80'>
							· HTTP {httpFailure.status}
						</span>
					)}
					{!failed && (
						<span className='shrink-0 tabular-nums opacity-70'>
							· {items} item{items === 1 ? '' : 's'}
						</span>
					)}
					<ArrowUpRight size={12} className='shrink-0' />
				</button>
			)}
		</div>
	);
};
export default NodeInlineTest;
