import { TrendingUp, CheckCircle2, XCircle, Cpu, Clock } from 'lucide-react';
import { useAgentAnalytics } from '@/api/modules/agents';

type TProps = {
	ws: string;
	agentId?: string;
};

const fmtMs = (ms: number) => {
	if (!ms) return '0ms';
	if (ms < 1000) return `${ms}ms`;
	return `${(ms / 1000).toFixed(1)}s`;
};

const fmtNum = (n: number) => new Intl.NumberFormat().format(n);

const StatTile = ({
	icon: Icon,
	label,
	value,
	accent,
}: {
	icon: typeof TrendingUp;
	label: string;
	value: string;
	accent: string;
}) => (
	<div className='rounded-xl border border-zinc-100 bg-zinc-50/20 p-3 dark:border-zinc-800 dark:bg-zinc-950/20'>
		<div className='flex items-center gap-1.5'>
			<Icon size={12} className={accent} />
			<span className='text-[9px] font-black uppercase tracking-wide text-zinc-400'>{label}</span>
		</div>
		<span className='mt-1 block text-lg font-black text-zinc-900 dark:text-white'>{value}</span>
	</div>
);

/**
 * Aggregate usage analytics for an agent, derived from run history.
 * Backed by {agent}/analytics — see AgentAnalyticsController.
 */
const AgentAnalyticsPanel = ({ ws, agentId }: TProps) => {
	const { data, isLoading } = useAgentAnalytics(ws, agentId ?? '');

	if (!agentId) {
		return (
			<p className='px-1 py-8 text-center text-[11px] font-semibold text-zinc-400 dark:text-zinc-500'>
				Save the agent first to see analytics.
			</p>
		);
	}

	if (isLoading) {
		return <p className='py-6 text-center text-[11px] font-semibold text-zinc-400'>Loading…</p>;
	}

	if (!data) {
		return (
			<p className='py-6 text-center text-[11px] font-semibold text-zinc-400 dark:text-zinc-500'>
				No analytics available.
			</p>
		);
	}

	const { totals, tokens, latency, by_source, by_day } = data;
	const successPct =
		totals.success_rate != null ? `${Math.round(totals.success_rate * 100)}%` : '—';
	const maxDayRuns = Math.max(1, ...by_day.map((d) => d.runs));
	const sources = Object.entries(by_source);

	return (
		<div className='space-y-3'>
			<div>
				<h4 className='text-xs font-black text-zinc-900 dark:text-white'>Analytics</h4>
				<p className='text-[10px] font-semibold text-zinc-400 dark:text-zinc-500'>
					{data.range.from} → {data.range.to}
				</p>
			</div>

			{/* Stat tiles */}
			<div className='grid grid-cols-2 gap-2'>
				<StatTile
					icon={TrendingUp}
					label='Total Runs'
					value={fmtNum(totals.total_runs)}
					accent='text-primary-500'
				/>
				<StatTile icon={CheckCircle2} label='Success' value={successPct} accent='text-emerald-500' />
				<StatTile
					icon={XCircle}
					label='Failed'
					value={fmtNum(totals.failed)}
					accent='text-rose-500'
				/>
				<StatTile
					icon={Cpu}
					label='Total Tokens'
					value={fmtNum(tokens.total)}
					accent='text-blue-500'
				/>
			</div>

			{/* Tokens + latency detail */}
			<div className='grid grid-cols-2 gap-2 rounded-xl border border-zinc-100 bg-zinc-50/20 p-3 dark:border-zinc-800 dark:bg-zinc-950/20'>
				<div>
					<span className='text-[9px] font-black uppercase text-zinc-400'>Avg / run</span>
					<span className='block text-xs font-black text-zinc-800 dark:text-zinc-200'>
						{fmtNum(tokens.avg_per_run)} tok
					</span>
				</div>
				<div>
					<span className='flex items-center gap-1 text-[9px] font-black uppercase text-zinc-400'>
						<Clock size={9} /> Avg latency
					</span>
					<span className='block text-xs font-black text-zinc-800 dark:text-zinc-200'>
						{fmtMs(latency.avg_duration_ms)}
					</span>
				</div>
				<div>
					<span className='text-[9px] font-black uppercase text-zinc-400'>Prompt / Completion</span>
					<span className='block text-xs font-black text-zinc-800 dark:text-zinc-200'>
						{fmtNum(tokens.prompt)} / {fmtNum(tokens.completion)}
					</span>
				</div>
				<div>
					<span className='text-[9px] font-black uppercase text-zinc-400'>Max latency</span>
					<span className='block text-xs font-black text-zinc-800 dark:text-zinc-200'>
						{fmtMs(latency.max_duration_ms)}
					</span>
				</div>
			</div>

			{/* By source */}
			{sources.length > 0 && (
				<div className='rounded-xl border border-zinc-100 bg-zinc-50/20 p-3 dark:border-zinc-800 dark:bg-zinc-950/20'>
					<span className='text-[9px] font-black uppercase text-zinc-400'>By source</span>
					<div className='mt-2 space-y-1.5'>
						{sources.map(([source, count]) => (
							<div key={source} className='flex items-center justify-between'>
								<span className='text-[10px] font-bold capitalize text-zinc-600 dark:text-zinc-300'>
									{source}
								</span>
								<span className='text-[10px] font-black text-zinc-800 dark:text-zinc-200'>
									{fmtNum(count)}
								</span>
							</div>
						))}
					</div>
				</div>
			)}

			{/* By day mini bar chart */}
			{by_day.length > 0 && (
				<div className='rounded-xl border border-zinc-100 bg-zinc-50/20 p-3 dark:border-zinc-800 dark:bg-zinc-950/20'>
					<span className='text-[9px] font-black uppercase text-zinc-400'>Runs per day</span>
					<div className='mt-3 flex h-24 items-end gap-1'>
						{by_day.map((d) => (
							<div
								key={d.day}
								title={`${d.day}: ${d.runs} runs, ${d.tokens} tokens, ${d.failed} failed`}
								className='flex flex-1 flex-col items-center gap-1'>
								<div className='flex w-full flex-1 items-end'>
									<div
										className='w-full rounded-t bg-primary-400 dark:bg-primary-500'
										style={{ height: `${Math.max(4, (d.runs / maxDayRuns) * 100)}%` }}
									/>
								</div>
								<span className='text-[7px] font-bold text-zinc-400'>{d.day.slice(5)}</span>
							</div>
						))}
					</div>
				</div>
			)}
		</div>
	);
};

export default AgentAnalyticsPanel;
