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
} from 'lucide-react';
import { useAgentRuns } from '@/api/modules/agents';
import AgentRunLog, { AGENT_RUN_KINDS } from '@/components/common/AgentRunLog';
import type { TAgentRunStatus } from '@/types/agent.type';
import type { TRun, TRunStatus } from '@/types/run.type';

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
	if (ms == null) return '-';
	if (ms < 1000) return `${ms}ms`;
	return `${(ms / 1000).toFixed(1)}s`;
};

const StatusBadge = ({ status }: { status: TAgentRunStatus }) => {
	const style = STATUS_STYLE[status] ?? STATUS_STYLE.pending;
	const Icon = style.icon;
	return <Icon size={14} className={style.className} />;
};

/** A chat turn by what was asked; a reflection, grading or eval run by its kind. */
const runTitle = (run: TRun) => {
	const message = (run.input as { message?: unknown } | null)?.message;
	if (typeof message === 'string' && message.trim()) return message;
	return AGENT_RUN_KINDS[run.runnable_type] ?? 'Run';
};

/** Expandable row: run summary + what the run did. */
const RunRow = ({ ws, run }: { ws: string; run: TRun }) => {
	const [open, setOpen] = useState(false);
	const SourceIcon = SOURCE_ICON[run.trigger_type as keyof typeof SOURCE_ICON] ?? Play;

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
							{runTitle(run)}
						</span>
					</div>
					<span className='text-[9px] font-semibold text-zinc-400 capitalize dark:text-zinc-600'>
						{run.trigger_type.replace(/_/g, ' ')} · {new Date(run.created_at).toLocaleString()}
					</span>
				</div>
				<div className='flex shrink-0 flex-col items-end'>
					<span className='text-[10px] font-black text-zinc-600 dark:text-zinc-300'>
						{run.total_credits_used ?? 0} cr
					</span>
					<span className='text-[9px] font-semibold text-zinc-400'>
						{fmtDuration(run.duration_ms)}
					</span>
				</div>
			</button>

			{open && (
				<div className='border-t border-zinc-100 p-3 dark:border-zinc-800'>
					<AgentRunLog ws={ws} run={run} />
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
	const [statusFilter, setStatusFilter] = useState<TRunStatus | undefined>(undefined);
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

	const runs = data ?? [];

	return (
		<div className='space-y-3'>
			<div>
				<h4 className='text-xs font-black text-zinc-900 dark:text-white'>Run History</h4>
				<p className='text-[10px] font-semibold text-zinc-400 dark:text-zinc-500'>
					Every reply, trigger fire, and manual run.
				</p>
			</div>

			<div className='flex gap-1.5'>
				{([undefined, 'completed', 'failed', 'running'] as (TRunStatus | undefined)[]).map(
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
						<RunRow key={run.id} ws={ws} run={run} />
					))}
				</div>
			)}
		</div>
	);
};

export default AgentRunsPanel;
