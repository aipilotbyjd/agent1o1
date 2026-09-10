import { useState } from 'react';
import {
	CheckCircle2,
	XCircle,
	Loader2,
	Clock,
	ChevronDown,
	ChevronRight,
	Zap,
	MessageSquare,
	Play,
	Wrench,
	FileDown,
	Download,
} from 'lucide-react';
import { useAgentRuns, useAgentRun } from '@/api/modules/agents';
import { useDownloadArtifact } from '@/api/modules/artifacts';
import type { TAgentRun, TAgentRunStatus, TAiAgentStep } from '@/types/agent.type';

type TArtifactStepOutput = { id: string; filename: string; version: number };

const isArtifactStep = (step: TAiAgentStep): step is TAiAgentStep & { tool_output: TArtifactStepOutput } =>
	step.tool_name === 'ExportArtifactTool' &&
	!!step.tool_output &&
	typeof step.tool_output === 'object' &&
	'filename' in step.tool_output;

/** Compact download chip for a step that exported an artifact — replaces the generic wrench row. */
const ArtifactStepRow = ({ ws, output }: { ws: string; output: TArtifactStepOutput }) => {
	const downloadMutation = useDownloadArtifact(ws);
	return (
		<div className='flex items-center gap-2 rounded-lg bg-white p-2 dark:bg-zinc-900/40'>
			<FileDown size={14} className='shrink-0 text-primary-500' />
			<span className='min-w-0 flex-1 truncate text-[10px] font-black text-zinc-700 dark:text-zinc-300'>
				{output.filename} <span className='font-semibold text-zinc-400'>v{output.version}</span>
			</span>
			<button
				onClick={() => downloadMutation.mutate({ artifactId: output.id, filename: output.filename })}
				className='shrink-0 cursor-pointer text-zinc-400 hover:text-primary-500'>
				<Download size={12} />
			</button>
		</div>
	);
};

type TProps = {
	ws: string;
	agentId?: string;
};

const STATUS_STYLE: Record<string, { icon: typeof CheckCircle2; className: string }> = {
	completed: { icon: CheckCircle2, className: 'text-emerald-500' },
	failed: { icon: XCircle, className: 'text-rose-500' },
	running: { icon: Loader2, className: 'text-blue-500 animate-spin' },
	pending: { icon: Clock, className: 'text-amber-500' },
};

const SOURCE_ICON: Record<string, typeof Zap> = {
	conversation: MessageSquare,
	trigger: Zap,
	manual: Play,
};

const fmtDuration = (ms: number | null) => {
	if (ms == null) return '—';
	if (ms < 1000) return `${ms}ms`;
	return `${(ms / 1000).toFixed(1)}s`;
};

const StatusBadge = ({ status }: { status: TAgentRunStatus }) => {
	const style = STATUS_STYLE[status] ?? STATUS_STYLE.pending;
	const Icon = style.icon;
	return <Icon size={14} className={style.className} />;
};

/** Expandable row: run summary + on-demand step trace. */
const RunRow = ({ ws, agentId, run }: { ws: string; agentId: string; run: TAgentRun }) => {
	const [open, setOpen] = useState(false);
	const { data: detail, isLoading } = useAgentRun(ws, agentId, open ? run.id : null);
	const SourceIcon = SOURCE_ICON[run.source] ?? Play;

	return (
		<div className='rounded-xl border border-zinc-100 bg-zinc-50/20 dark:border-zinc-800 dark:bg-zinc-950/20'>
			<button
				onClick={() => setOpen((v) => !v)}
				className='flex w-full items-center gap-3 p-3 text-left'>
				{open ? (
					<ChevronDown size={13} className='shrink-0 text-zinc-400' />
				) : (
					<ChevronRight size={13} className='shrink-0 text-zinc-400' />
				)}
				<StatusBadge status={run.status} />
				<div className='min-w-0 flex-1'>
					<div className='flex items-center gap-2'>
						<SourceIcon size={11} className='shrink-0 text-zinc-400' />
						<span className='truncate text-[11px] font-black text-zinc-800 dark:text-zinc-200'>
							{run.model ?? run.source}
						</span>
					</div>
					<span className='text-[9px] font-semibold text-zinc-400 dark:text-zinc-600'>
						{new Date(run.created_at).toLocaleString()}
					</span>
				</div>
				<div className='flex shrink-0 flex-col items-end'>
					<span className='text-[10px] font-black text-zinc-600 dark:text-zinc-300'>
						{run.total_tokens ?? 0} tok
					</span>
					<span className='text-[9px] font-semibold text-zinc-400'>{fmtDuration(run.duration_ms)}</span>
				</div>
			</button>

			{open && (
				<div className='border-t border-zinc-100 p-3 dark:border-zinc-800'>
					{isLoading ? (
						<p className='text-center text-[10px] font-semibold text-zinc-400'>Loading trace…</p>
					) : (
						<div className='space-y-2'>
							{run.error && (
								<p className='rounded-lg bg-rose-500/10 px-2.5 py-1.5 text-[10px] font-semibold text-rose-600 dark:text-rose-400'>
									{run.error}
								</p>
							)}
							{(detail?.steps ?? []).length === 0 ? (
								<p className='text-[10px] font-semibold text-zinc-400'>No step trace recorded.</p>
							) : (
								(detail?.steps ?? []).map((step) =>
									isArtifactStep(step) ? (
										<ArtifactStepRow key={step.id} ws={ws} output={step.tool_output} />
									) : (
										<div
											key={step.id}
											className='flex items-start gap-2 rounded-lg bg-white p-2 dark:bg-zinc-900/40'>
											<span className='mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-zinc-100 text-[9px] font-black text-zinc-500 dark:bg-zinc-800'>
												{step.step_number}
											</span>
											<div className='min-w-0 flex-1'>
												<div className='flex items-center gap-1.5'>
													{step.tool_name && <Wrench size={10} className='text-primary-500' />}
													<span className='truncate text-[10px] font-black text-zinc-700 dark:text-zinc-300'>
														{step.tool_name ?? step.action ?? 'step'}
													</span>
												</div>
												{step.llm_reasoning && (
													<p className='mt-0.5 line-clamp-2 text-[9px] font-semibold text-zinc-400'>
														{step.llm_reasoning}
													</p>
												)}
											</div>
											{step.tokens_used != null && (
												<span className='shrink-0 text-[9px] font-bold text-zinc-400'>
													{step.tokens_used} tok
												</span>
											)}
										</div>
									),
								)
							)}
						</div>
					)}
				</div>
			)}
		</div>
	);
};

/**
 * Read-only run history for an agent — every reply, trigger fire, and manual run.
 * Backed by {agent}/runs — see AgentRunController.
 */
const AgentRunsPanel = ({ ws, agentId }: TProps) => {
	const [statusFilter, setStatusFilter] = useState<TAgentRunStatus | undefined>(undefined);
	const { data, isLoading } = useAgentRuns(
		ws,
		agentId ?? '',
		statusFilter ? { status: statusFilter } : undefined,
	);

	if (!agentId) {
		return (
			<p className='px-1 py-8 text-center text-[11px] font-semibold text-zinc-400 dark:text-zinc-500'>
				Save the agent first to see run history.
			</p>
		);
	}

	const runs = data?.data ?? [];

	return (
		<div className='space-y-3'>
			<div>
				<h4 className='text-xs font-black text-zinc-900 dark:text-white'>Run History</h4>
				<p className='text-[10px] font-semibold text-zinc-400 dark:text-zinc-500'>
					Every reply, trigger fire, and manual run.
				</p>
			</div>

			<div className='flex gap-1.5'>
				{([undefined, 'completed', 'failed', 'running'] as (TAgentRunStatus | undefined)[]).map(
					(s) => (
						<button
							key={s ?? 'all'}
							type='button'
							onClick={() => setStatusFilter(s)}
							className={`rounded-lg px-2.5 py-1 text-[10px] font-black capitalize transition ${
								statusFilter === s
									? 'bg-primary-400 text-primary-950'
									: 'border border-zinc-200 bg-white text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400'
							}`}>
							{s ?? 'All'}
						</button>
					),
				)}
			</div>

			{isLoading ? (
				<p className='py-6 text-center text-[11px] font-semibold text-zinc-400'>Loading…</p>
			) : runs.length === 0 ? (
				<p className='py-6 text-center text-[11px] font-semibold text-zinc-400 dark:text-zinc-500'>
					No runs recorded yet.
				</p>
			) : (
				<div className='space-y-2'>
					{runs.map((run) => (
						<RunRow key={run.id} ws={ws} agentId={agentId} run={run} />
					))}
				</div>
			)}
		</div>
	);
};

export default AgentRunsPanel;
