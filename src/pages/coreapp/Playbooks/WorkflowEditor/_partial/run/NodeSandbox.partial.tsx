import { useState } from 'react';
import {
	AlertCircle,
	CheckCircle2,
	ChevronDown,
	ChevronUp,
	Coins,
	Loader2,
	Play,
	Terminal,
} from 'lucide-react';
import { useWorkspaceContext } from '@/context/workspace';
import { useNodeSandbox } from '@/api/modules/node-sandbox';

const MAX_CODE_CHARS = 50_000;
const WARN_CODE_CHARS = 40_000;

function validateJson(value: string): string | null {
	if (!value.trim()) return null;
	try {
		JSON.parse(value);
		return null;
	} catch {
		return 'Input must be valid JSON';
	}
}

const areaCls =
	'w-full rounded-xl border border-zinc-200 bg-zinc-50 p-3 font-mono text-xs text-zinc-700 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 resize-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:focus:border-primary-500 dark:focus:ring-primary-500/20';

interface NodeSandboxProps {
	code: string;
}

const NodeSandbox = ({ code }: NodeSandboxProps) => {
	const { activeWorkspaceId } = useWorkspaceContext();
	const sandbox = useNodeSandbox(activeWorkspaceId);

	const [inputJson, setInputJson] = useState('{}');
	const [jsonError, setJsonError] = useState<string | null>(null);
	const [outputExpanded, setOutputExpanded] = useState(true);
	const [logsExpanded, setLogsExpanded] = useState(true);

	const handleInputChange = (v: string) => {
		setInputJson(v);
		setJsonError(validateJson(v));
	};

	const handleRun = () => {
		const err = validateJson(inputJson);
		if (err) {
			setJsonError(err);
			return;
		}
		const input_data = inputJson.trim()
			? (JSON.parse(inputJson) as Record<string, unknown>)
			: {};
		sandbox.mutate({ code, input_data });
	};

	const result = sandbox.data;
	const isRunning = sandbox.isPending;
	const hasError = !!sandbox.error || !!result?.error;
	const codeLen = code.length;
	const overLimit = codeLen > MAX_CODE_CHARS;

	return (
		<div className='flex flex-col gap-3 p-3 text-xs'>
			{/* Input */}
			<div>
				<div className='mb-1.5 flex items-center justify-between'>
					<span className='text-[11px] font-bold tracking-wide text-zinc-500 uppercase dark:text-zinc-400'>
						Input Data (JSON)
					</span>
					{jsonError && (
						<span className='flex items-center gap-1 text-[11px] font-semibold text-red-500'>
							<AlertCircle size={11} />
							{jsonError}
						</span>
					)}
				</div>
				<textarea
					className={`${areaCls} ${jsonError ? 'border-red-400 focus:border-red-400 focus:ring-red-100' : ''}`}
					rows={4}
					value={inputJson}
					onChange={(e) => handleInputChange(e.target.value)}
					placeholder='{"key": "value"}'
					spellCheck={false}
				/>
			</div>

			{/* Code limit warning */}
			{codeLen > WARN_CODE_CHARS && (
				<div
					className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-semibold ${
						overLimit
							? 'bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-400'
							: 'bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-400'
					}`}>
					<AlertCircle size={11} />
					{overLimit
						? `Code exceeds ${MAX_CODE_CHARS.toLocaleString()} character limit`
						: `${codeLen.toLocaleString()} / ${MAX_CODE_CHARS.toLocaleString()} characters`}
				</div>
			)}

			{/* Run button */}
			<button
				type='button'
				disabled={isRunning || !!jsonError || overLimit}
				onClick={handleRun}
				className='flex h-9 w-full items-center justify-center gap-2 rounded-xl bg-primary-400 text-[12px] font-bold text-primary-950 shadow-sm shadow-primary-500/20 transition hover:bg-primary-500 disabled:cursor-not-allowed disabled:opacity-60'>
				{isRunning ? (
					<>
						<Loader2 size={13} className='animate-spin' />
						Running…
					</>
				) : (
					<>
						<Play size={13} />
						Run Test · ~2 credits
					</>
				)}
			</button>

			{/* Results */}
			{result && (
				<>
					{/* Status bar */}
					<div className='flex items-center justify-between rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-800'>
						<div
							className={`flex items-center gap-1.5 font-semibold ${
								result.error
									? 'text-red-500 dark:text-red-400'
									: 'text-emerald-600 dark:text-emerald-400'
							}`}>
							{result.error ? <AlertCircle size={12} /> : <CheckCircle2 size={12} />}
							{result.error ? 'Error' : 'Completed'}
						</div>
						<div className='flex items-center gap-3 text-zinc-400 dark:text-zinc-500'>
							<span>{result.duration_ms}ms</span>
							<span className='flex items-center gap-1'>
								<Coins size={11} />2 credits
							</span>
						</div>
					</div>

					{/* Error message */}
					{result.error && (
						<div className='rounded-xl border border-red-200 bg-red-50 p-3 text-[11px] font-semibold text-red-600 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-400'>
							{result.error}
						</div>
					)}

					{/* Output */}
					<div>
						<button
							type='button'
							onClick={() => setOutputExpanded((v) => !v)}
							className='flex w-full items-center justify-between text-[11px] font-bold tracking-wide text-zinc-500 uppercase dark:text-zinc-400'>
							Output
							{outputExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
						</button>
						{outputExpanded && (
							<pre className='mt-1.5 max-h-40 overflow-y-auto rounded-xl border border-zinc-200 bg-zinc-50 p-3 text-[11px] text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300'>
								{JSON.stringify(result.output, null, 2)}
							</pre>
						)}
					</div>

					{/* Console logs */}
					{result.logs.length > 0 && (
						<div>
							<button
								type='button'
								onClick={() => setLogsExpanded((v) => !v)}
								className='flex w-full items-center justify-between text-[11px] font-bold tracking-wide text-zinc-500 uppercase dark:text-zinc-400'>
								<span className='flex items-center gap-1.5'>
									<Terminal size={11} />
									Console ({result.logs.length})
								</span>
								{logsExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
							</button>
							{logsExpanded && (
								<div className='mt-1.5 max-h-32 overflow-y-auto rounded-xl border border-zinc-200 bg-zinc-900 p-3 dark:border-zinc-700'>
									{result.logs.map((line, i) => (
										<div
											key={i}
											className='font-mono text-[11px] text-emerald-400'>
											{'>'} {line}
										</div>
									))}
								</div>
							)}
						</div>
					)}
				</>
			)}

			{/* Idle placeholder */}
			{!result && !isRunning && (
				<div className='flex flex-col items-center gap-2 rounded-xl border border-dashed border-zinc-200 py-6 text-center dark:border-zinc-700'>
					<Terminal size={20} className='text-zinc-300 dark:text-zinc-600' />
					<p className='text-[11px] text-zinc-400 dark:text-zinc-500'>
						Run the test to see output here
					</p>
				</div>
			)}
		</div>
	);
};

export default NodeSandbox;
