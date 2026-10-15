import { useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import { ChevronDown, CircleAlert, Timer, Zap } from 'lucide-react';
import { useNodeRuns } from '@/api/modules/runs';
import { useNodes } from '@/api/modules/nodes';
import { humanize } from '@/components/workflowPage/PageBlocks';
import type { TNodeRun, TNodeRunStatus, TRun } from '@/types/run.type';

const TRIGGER_LABEL: Record<string, string> = {
	manual: 'Manual',
	page: 'Page',
	webhook: 'Webhook',
	schedule: 'Schedule',
	api: 'API',
};

const STEP_STATUS: Record<TNodeRunStatus, { label: string; dot: string }> = {
	completed: { label: 'Done', dot: 'bg-emerald-500' },
	failed: { label: 'Failed', dot: 'bg-rose-500' },
	skipped: { label: 'Skipped', dot: 'bg-slate-300 dark:bg-zinc-600' },
	cancelled: { label: 'Cancelled', dot: 'bg-slate-400 dark:bg-zinc-500' },
	running: { label: 'Running', dot: 'bg-sky-500 animate-pulse' },
	pending: { label: 'Waiting', dot: 'bg-slate-300 dark:bg-zinc-600' },
	awaiting_approval: { label: 'Needs approval', dot: 'bg-amber-500' },
	awaiting_callback: { label: 'Waiting on callback', dot: 'bg-amber-500' },
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
	value !== null && typeof value === 'object' && !Array.isArray(value);

const formatDuration = (ms: number | null) => {
	if (ms === null) return null;
	if (ms < 1000) return `${ms}ms`;
	if (ms < 60_000) return `${(ms / 1000).toFixed(1)}s`;
	return `${Math.floor(ms / 60_000)}m ${Math.round((ms % 60_000) / 1000)}s`;
};

const SectionTitle = ({ children }: { children: string }) => (
	<h4 className='text-[10px] font-black tracking-widest text-slate-400 uppercase'>{children}</h4>
);

const Value = ({ value, markdown }: { value: unknown; markdown?: boolean }) => {
	if (value === null || value === undefined || value === '')
		return <span className='text-slate-400 dark:text-zinc-500'>—</span>;
	if (typeof value === 'string')
		return markdown ? (
			<div className='[overflow-wrap:anywhere] [&_h1]:mb-1 [&_h1]:text-sm [&_h1]:font-black [&_h2]:mb-1 [&_h2]:text-sm [&_h2]:font-black [&_h3]:mb-1 [&_h3]:text-[13px] [&_h3]:font-black [&_li]:ml-4 [&_ol]:list-decimal [&_p:not(:last-child)]:mb-2 [&_ul]:list-disc'>
				<ReactMarkdown>{value}</ReactMarkdown>
			</div>
		) : (
			<span className='break-words whitespace-pre-wrap'>{value}</span>
		);
	if (typeof value !== 'object') return <span>{String(value)}</span>;
	return (
		<pre className='no-scrollbar max-h-60 overflow-auto rounded-lg bg-slate-100/70 p-2.5 font-mono text-[11px] leading-relaxed text-slate-700 dark:bg-zinc-900 dark:text-zinc-300'>
			{JSON.stringify(value, null, 2)}
		</pre>
	);
};

const Values = ({ values, markdown }: { values: Record<string, unknown>; markdown?: boolean }) => (
	<dl className='space-y-3 rounded-2xl border border-slate-200/70 bg-slate-50/50 p-4 dark:border-zinc-800 dark:bg-zinc-950/20'>
		{Object.entries(values).map(([key, value]) => (
			<div key={key} className='min-w-0'>
				<dt className='text-[10px] font-black tracking-wider text-slate-400 uppercase'>
					{humanize(key)}
				</dt>
				<dd className='mt-1 text-xs leading-relaxed font-semibold text-slate-800 dark:text-zinc-200'>
					<Value value={value} markdown={markdown} />
				</dd>
			</div>
		))}
	</dl>
);

const StepRow = ({
	step,
	index,
	typeName,
}: {
	step: TNodeRun;
	index: number;
	typeName: string;
}) => {
	const status = STEP_STATUS[step.status] ?? STEP_STATUS.pending;
	const hasDetail = step.error !== null || (step.output !== null && step.output !== undefined);
	const duration = formatDuration(step.duration_ms);

	return (
		<details className='group border-b border-slate-100 last:border-0 dark:border-zinc-800/80'>
			<summary
				className={`flex list-none items-center gap-3 py-3 [&::-webkit-details-marker]:hidden ${hasDetail ? 'cursor-pointer' : 'pointer-events-none'}`}>
				<span className='w-4 shrink-0 text-right text-[10px] font-black text-slate-300 tabular-nums dark:text-zinc-600'>
					{index + 1}
				</span>
				<span className={`size-2 shrink-0 rounded-full ${status.dot}`} />
				<span className='min-w-0 flex-1'>
					<span className='block truncate text-xs font-extrabold text-slate-800 dark:text-zinc-100'>
						{humanize(step.key)}
					</span>
					<span className='block truncate text-[10px] font-semibold text-slate-400 dark:text-zinc-500'>
						{typeName} · {status.label}
						{step.attempt > 1 ? ` · attempt ${step.attempt}` : ''}
					</span>
				</span>
				{duration && (
					<span className='shrink-0 text-[10px] font-bold text-slate-400 tabular-nums dark:text-zinc-500'>
						{duration}
					</span>
				)}
				<ChevronDown
					size={13}
					className={`shrink-0 text-slate-400 transition group-open:rotate-180 ${hasDetail ? '' : 'invisible'}`}
				/>
			</summary>
			{hasDetail && (
				<div className='space-y-2 pb-3 pl-9 text-xs font-semibold text-slate-700 dark:text-zinc-300'>
					{step.error && (
						<p className='rounded-lg border border-rose-200 bg-rose-50 p-2.5 text-[11px] break-words whitespace-pre-wrap text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300'>
							{step.error}
						</p>
					)}
					{step.output !== null && step.output !== undefined && (
						<Value value={step.output} />
					)}
				</div>
			)}
		</details>
	);
};

const WorkflowRunDetail = ({ ws, run }: { ws: string; run: TRun }) => {
	const { data: steps = [], isLoading } = useNodeRuns(ws, run.id);
	const { data: nodeTypes } = useNodes(ws);

	const typeNames = useMemo(
		() => new Map((nodeTypes ?? []).map((node) => [node.type, node.name])),
		[nodeTypes],
	);

	const inputs = isRecord(run.input) && Object.keys(run.input).length > 0 ? run.input : null;
	// Without Output steps a run's output is every step's output keyed by step
	// key, which the step list below already shows.
	const hasOutputSteps = steps.some((step) => step.type === 'workflow_output');
	const result =
		hasOutputSteps && isRecord(run.output) && Object.keys(run.output).length > 0
			? run.output
			: null;
	const duration = formatDuration(run.duration_ms);

	return (
		<div className='space-y-6'>
			<div className='flex flex-wrap gap-2'>
				<span className='inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-bold text-slate-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300'>
					<Zap size={12} className='text-primary-500' />
					{TRIGGER_LABEL[run.trigger_type] ?? humanize(run.trigger_type)}
					{run.retried_from_run_id ? ' · retry' : ''}
				</span>
				{duration && (
					<span className='inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-bold text-slate-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300'>
						<Timer size={12} className='text-primary-500' />
						{duration}
					</span>
				)}
			</div>

			{run.error && (
				<div className='flex gap-2.5 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs font-semibold text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300'>
					<CircleAlert size={15} className='mt-px shrink-0' />
					<p className='min-w-0 break-words whitespace-pre-wrap'>{run.error}</p>
				</div>
			)}

			{inputs && (
				<div className='space-y-3'>
					<SectionTitle>Inputs</SectionTitle>
					<Values values={inputs} />
				</div>
			)}

			{result && (
				<div className='space-y-3'>
					<SectionTitle>Result</SectionTitle>
					<Values values={result} markdown />
				</div>
			)}

			<div className='space-y-3'>
				<SectionTitle>Steps</SectionTitle>
				{isLoading ? (
					<div className='space-y-2.5 py-2'>
						<div className='h-4 w-3/4 animate-pulse rounded bg-slate-200 dark:bg-zinc-800' />
						<div className='h-4 w-1/2 animate-pulse rounded bg-slate-200 dark:bg-zinc-800' />
						<div className='h-4 w-5/6 animate-pulse rounded bg-slate-200 dark:bg-zinc-800' />
					</div>
				) : steps.length === 0 ? (
					<p className='py-2 text-xs text-slate-400 dark:text-zinc-500'>No steps ran.</p>
				) : (
					<div className='rounded-2xl border border-slate-200/70 bg-slate-50/50 px-4 dark:border-zinc-800 dark:bg-zinc-950/20'>
						{steps.map((step, index) => (
							<StepRow
								key={step.id}
								step={step}
								index={index}
								typeName={typeNames.get(step.type) ?? humanize(step.type)}
							/>
						))}
					</div>
				)}
			</div>
		</div>
	);
};

export default WorkflowRunDetail;
