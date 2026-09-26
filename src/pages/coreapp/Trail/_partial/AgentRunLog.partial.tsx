import { useState, type ReactNode } from 'react';
import ReactMarkdown from 'react-markdown';
import { ChevronRight, ExternalLink, Wrench } from 'lucide-react';
import { useRun } from '@/api/modules/runs';
import paths from '@/Routes/paths';
import type { TRun } from '@/types/run.type';

interface AgentRunLogProps {
	ws: string;
	run: TRun;
}

const prettifyToolName = (raw: string) =>
	raw.replace(/[_-]+/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());

/** Tool output is usually JSON; pretty-printed it reads without escapes.
 *  Output cut at the backend's length cap no longer parses and stays as-is. */
const formatOutput = (output: string) => {
	try {
		const parsed: unknown = JSON.parse(output);
		return typeof parsed === 'object' && parsed !== null
			? JSON.stringify(parsed, null, 2)
			: output;
	} catch {
		return output;
	}
};

const formatValue = (value: unknown) =>
	typeof value === 'string' ? value : JSON.stringify(value, null, 2);

const Section = ({ label, children }: { label: string; children: ReactNode }) => (
	<div className='space-y-1.5'>
		<span className='block text-[9px] font-black tracking-wider text-slate-400 uppercase'>
			{label}
		</span>
		{children}
	</div>
);

const CodeBlock = ({ children, failed = false }: { children: string; failed?: boolean }) => (
	<pre
		className={`no-scrollbar max-h-48 overflow-y-auto rounded-xl px-3 py-2 font-mono text-[11px] leading-relaxed [overflow-wrap:anywhere] whitespace-pre-wrap ${
			failed
				? 'bg-rose-50 text-rose-700 dark:bg-rose-950/25 dark:text-rose-300'
				: 'bg-white text-slate-700 dark:bg-zinc-900 dark:text-zinc-300'
		}`}>
		{children}
	</pre>
);

const ToolCallStep = ({
	name,
	args,
	output,
}: {
	name: string;
	args: Record<string, unknown>;
	output?: string;
}) => {
	const [expanded, setExpanded] = useState(false);
	const entries = Object.entries(args);

	return (
		<li className='rounded-xl border border-slate-200 bg-white dark:border-zinc-800 dark:bg-zinc-900'>
			<button
				type='button'
				onClick={() => setExpanded((value) => !value)}
				className='flex w-full cursor-pointer items-center gap-2 px-3 py-2 text-left'>
				<ChevronRight
					size={12}
					className={`shrink-0 text-slate-400 transition-transform ${expanded ? 'rotate-90' : ''}`}
				/>
				<Wrench size={12} className='text-primary-500 shrink-0' />
				<span className='truncate text-xs font-extrabold text-slate-800 dark:text-zinc-200'>
					{prettifyToolName(name)}
				</span>
			</button>
			{expanded && (
				<div className='space-y-3 border-t border-slate-100 bg-slate-50/60 px-3 py-2.5 dark:border-zinc-800 dark:bg-zinc-950/30'>
					{entries.length > 0 && (
						<Section label='Input'>
							<dl className='space-y-1.5'>
								{entries.map(([key, value]) => (
									<div key={key} className='min-w-0'>
										<dt className='mb-0.5 font-mono text-[10.5px] font-bold text-slate-500 dark:text-zinc-400'>
											{key}
										</dt>
										<dd>
											<CodeBlock>{formatValue(value)}</CodeBlock>
										</dd>
									</div>
								))}
							</dl>
						</Section>
					)}
					<Section label='Output'>
						{output ? (
							<CodeBlock>{formatOutput(output)}</CodeBlock>
						) : (
							<p className='text-[11px] font-semibold text-slate-400'>
								No output recorded.
							</p>
						)}
					</Section>
				</div>
			)}
		</li>
	);
};

/**
 * An agent run has no node runs to list. A chat turn shows the prompt, each
 * tool call the reply made, and the answer; a reflection, grading or eval
 * run shows what it was given and what it produced.
 */
const AgentRunLog = ({ ws, run }: AgentRunLogProps) => {
	const isChatTurn = run.runnable_type === 'agent_session';
	const { data: detail, isLoading } = useRun(ws, isChatTurn ? run.id : '');

	const input = (run.input ?? {}) as Record<string, unknown>;
	const output = (run.output ?? {}) as Record<string, unknown>;
	const reply = detail?.agent_reply;
	const toolCalls = reply?.tool_calls ?? [];
	const answer = typeof output.text === 'string' ? output.text : '';

	return (
		<div className='border-slate-150 space-y-4 rounded-2xl border bg-slate-50/50 p-4.5 dark:border-zinc-800 dark:bg-zinc-950/20'>
			{isChatTurn ? (
				<>
					{typeof input.message === 'string' && (
						<div className='flex flex-col items-end gap-1.5'>
							<span className='text-[9px] font-black tracking-wider text-slate-400 uppercase'>
								User Input
							</span>
							<div className='border-primary-700 bg-primary-400 text-primary-950 max-w-[85%] rounded-2xl rounded-tr-none border p-3 text-xs leading-relaxed font-semibold [overflow-wrap:anywhere] whitespace-pre-wrap shadow-xs'>
								{input.message}
							</div>
						</div>
					)}

					{isLoading ? (
						<div className='space-y-2'>
							<div className='h-9 animate-pulse rounded-xl bg-slate-200 dark:bg-zinc-800' />
							<div className='h-9 animate-pulse rounded-xl bg-slate-200 dark:bg-zinc-800' />
						</div>
					) : (
						toolCalls.length > 0 && (
							<Section label={`Steps · ${toolCalls.length}`}>
								<ol className='space-y-1.5'>
									{toolCalls.map((call) => (
										<ToolCallStep
											key={call.id}
											name={call.name}
											args={call.arguments ?? {}}
											output={
												reply?.tool_results.find(
													(result) => result.id === call.id,
												)?.output
											}
										/>
									))}
								</ol>
							</Section>
						)
					)}

					{answer && (
						<div className='flex flex-col items-start gap-1.5'>
							<span className='text-[9px] font-black tracking-wider text-slate-400 uppercase'>
								Agent Response
							</span>
							<div className='max-w-[85%] rounded-2xl rounded-tl-none border border-slate-200 bg-white p-3 text-xs leading-relaxed font-semibold [overflow-wrap:anywhere] text-slate-800 shadow-xs dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200 [&_li]:ml-4 [&_ol]:list-decimal [&_p:not(:last-child)]:mb-2 [&_ul]:list-disc'>
								<ReactMarkdown>{answer}</ReactMarkdown>
							</div>
						</div>
					)}
				</>
			) : (
				<>
					{Object.keys(input).length > 0 && (
						<Section label='Input'>
							<CodeBlock>{JSON.stringify(input, null, 2)}</CodeBlock>
						</Section>
					)}
					{Object.keys(output).length > 0 && (
						<Section label='Output'>
							<CodeBlock>{JSON.stringify(output, null, 2)}</CodeBlock>
						</Section>
					)}
				</>
			)}

			{run.error && (
				<Section label='Error'>
					<CodeBlock failed>{run.error}</CodeBlock>
				</Section>
			)}

			{isChatTurn && run.agent && (
				<a
					href={`${paths.editAgent(ws, run.agent.id)}?session=${run.runnable_id}`}
					target='_blank'
					rel='noreferrer'
					className='text-primary-600 dark:text-primary-400 flex w-fit items-center gap-1.5 text-[11px] font-black hover:underline'>
					Open conversation
					<ExternalLink size={12} />
				</a>
			)}
		</div>
	);
};

export default AgentRunLog;
