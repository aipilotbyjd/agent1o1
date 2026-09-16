import { useState } from 'react';
import { Beaker, ChevronDown, ChevronUp, CheckCircle2, AlertCircle, Loader2, Clock } from 'lucide-react';
import { useWorkflowEditor } from '../../../_context/WorkflowEditorProvider.context';
import { useNodeTestRunner } from '../../../_hooks/useNodeTestRunner.hook';

/**
 * Inline "Test Node" — runs this single node for real against the backend engine
 * (resolving config + invoking the handler) and shows the actual input it ran on,
 * the produced output, timing, and any real error. Upstream data, when a previous
 * run or pinned output is available, is fed in as the node's input.
 */
const NodeInlineTest = ({
	nodeId,
	defKey,
}: {
	nodeId: string;
	defKey: string;
}) => {
	const { state } = useWorkflowEditor();
	const node = state.nodes.find((n) => n.id === nodeId);
	const { runTest: runNodeTest, testStatus, canRun } = useNodeTestRunner(nodeId, defKey);

	const testOutput = node?.data.testOutput;
	const testInput = node?.data.testInput;
	const testError = node?.data.testError;
	const testDurationMs = node?.data.testDurationMs;
	const [expanded, setExpanded] = useState(false);
	const [showInput, setShowInput] = useState(false);

	const runTest = (e: React.MouseEvent) => {
		e.stopPropagation();
		setExpanded(true);
		runNodeTest();
	};

	const statusIcon = {
		idle: <Beaker size={11} />,
		running: <Loader2 size={11} className='animate-spin' />,
		success: <CheckCircle2 size={11} className='text-emerald-500' />,
		error: <AlertCircle size={11} className='text-rose-500' />,
	}[testStatus];

	const btnClass = {
		idle: 'border-zinc-200 text-zinc-500 hover:border-primary-300 hover:text-primary-600 dark:border-zinc-700 dark:hover:border-primary-700 dark:hover:text-primary-400',
		running: 'border-sky-300 text-sky-600 dark:border-sky-700 dark:text-sky-400 cursor-not-allowed',
		success: 'border-emerald-300 text-emerald-600 dark:border-emerald-700 dark:text-emerald-400',
		error: 'border-rose-300 text-rose-600 dark:border-rose-700 dark:text-rose-400',
	}[testStatus];

	const hasResult = testStatus === 'success' || testStatus === 'error';
	const isError = testStatus === 'error';

	return (
		<div className='mt-3'>
			<div className='flex items-center gap-2'>
				<button
					type='button'
					disabled={testStatus === 'running' || !canRun}
					onClick={runTest}
					title={canRun ? 'Run this node once with the current settings' : 'Save the workflow first'}
					className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg border py-1.5 text-[11px] font-bold transition disabled:opacity-60 ${btnClass}`}>
					{statusIcon}
					{testStatus === 'running' ? 'Testing…' : 'Test Node'}
				</button>
				{hasResult && (
					<button
						type='button'
						onClick={(e) => {
							e.stopPropagation();
							setExpanded((prev) => !prev);
						}}
						aria-label={expanded ? 'Collapse test result' : 'Expand test result'}
						className='flex h-7 w-7 items-center justify-center rounded-lg border border-zinc-200 text-zinc-400 hover:text-zinc-600 dark:border-zinc-700'>
						{expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
					</button>
				)}
			</div>

			{expanded && hasResult && (
				<div
					className={`mt-2 rounded-lg border ${
						isError
							? 'border-rose-100 bg-rose-50 dark:border-rose-900/30 dark:bg-rose-950/20'
							: 'border-emerald-100 bg-emerald-50 dark:border-emerald-900/30 dark:bg-emerald-950/20'
					}`}>
					{/* Status + timing header */}
					<div className='flex items-center justify-between border-b border-black/5 px-2.5 py-1.5 dark:border-white/5'>
						<span
							className={`flex items-center gap-1 text-[10px] font-bold tracking-wide uppercase ${
								isError ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'
							}`}>
							{isError ? <AlertCircle size={11} /> : <CheckCircle2 size={11} />}
							{isError ? 'Failed' : 'Success'}
						</span>
						{typeof testDurationMs === 'number' && (
							<span className='flex items-center gap-1 text-[10px] font-medium text-zinc-500 dark:text-zinc-400'>
								<Clock size={10} />
								{testDurationMs}ms
							</span>
						)}
					</div>

					<div className='p-2'>
						{isError ? (
							<pre className='max-h-28 overflow-y-auto text-[10px] font-medium whitespace-pre-wrap text-rose-700 dark:text-rose-300'>
								{testError || 'Node test failed.'}
							</pre>
						) : (
							<>
								<div className='mb-1 text-[10px] font-bold tracking-wide text-zinc-500 uppercase'>
									Output
								</div>
								<pre className='max-h-40 overflow-y-auto text-[10px] text-zinc-700 dark:text-zinc-300'>
									{JSON.stringify(testOutput, null, 2)}
								</pre>
							</>
						)}

						{/* Resolved input the node ran on — collapsible, Gumloop-style inspection. */}
						{testInput !== undefined && (
							<div className='mt-2 border-t border-black/5 pt-2 dark:border-white/5'>
								<button
									type='button'
									onClick={(e) => {
										e.stopPropagation();
										setShowInput((prev) => !prev);
									}}
									className='flex items-center gap-1 text-[10px] font-bold tracking-wide text-zinc-400 uppercase hover:text-zinc-600 dark:hover:text-zinc-200'>
									{showInput ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
									Input
								</button>
								{showInput && (
									<pre className='mt-1 max-h-28 overflow-y-auto text-[10px] text-zinc-600 dark:text-zinc-400'>
										{JSON.stringify(testInput, null, 2)}
									</pre>
								)}
							</div>
						)}
					</div>
				</div>
			)}
		</div>
	);
};

export default NodeInlineTest;
