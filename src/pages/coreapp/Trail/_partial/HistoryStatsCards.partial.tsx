import { CheckCircle2, XCircle } from 'lucide-react';
import { useRunStats } from '@/api/modules/dashboard';

/** The stats window, in days. The run list itself is not windowed. */
const STATS_DAYS = 30;

/**
 * Turns a series into a sparkline path inside the cards' 100×40 viewBox.
 * Fewer than two points (or an all-zero series) draws a flat baseline rather
 * than inventing a trend.
 */
const toSparkline = (values: number[]) => {
	if (values.length < 2)
		return { line: 'M 0,35 L 100,35', area: 'M 0,35 L 100,35 L 100,40 L 0,40 Z' };
	const max = Math.max(...values);
	const points = values.map((v, i) => {
		const x = (i / (values.length - 1)) * 100;
		const y = max > 0 ? 35 - (v / max) * 30 : 35;
		return `${x.toFixed(2)},${y.toFixed(2)}`;
	});
	const line = `M ${points.join(' L ')}`;
	return { line, area: `${line} L 100,40 L 0,40 Z` };
};

interface HistoryStatsCardsProps {
	ws: string;
}

const HistoryStatsCards = ({ ws }: HistoryStatsCardsProps) => {
	const { data: stats, isLoading, isError } = useRunStats(ws, { days: STATS_DAYS });

	const totals = stats?.totals;
	const series = stats?.series ?? [];
	const format = (value: number | undefined) =>
		isLoading || isError || value === undefined ? '—' : value.toLocaleString();
	const successRate =
		isLoading || isError || totals?.success_rate == null
			? '—'
			: `${(totals.success_rate * 100).toFixed(1).replace(/\.0$/, '')}%`;

	const runsSparkline = toSparkline(series.map((p) => p.total));
	// Daily success rate over days that finished at least one run.
	const rateSparkline = toSparkline(
		series
			.filter((p) => p.completed + p.failed > 0)
			.map((p) => p.completed / (p.completed + p.failed)),
	);

	return (
		<div className='grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4'>
			{/* Card 1: Total Runs */}
			<div className='group relative flex items-center justify-between rounded-3xl border border-slate-200/60 bg-white p-6 shadow-sm transition-all duration-350 hover:-translate-y-1 hover:border-primary-500/20 hover:shadow-md dark:border-zinc-800/80 dark:bg-[#11131c]'>
				<div className='flex flex-col gap-1 text-left'>
					<span className='text-[10px] font-black tracking-widest text-primary-600 uppercase dark:text-primary-400'>
						Total Runs
					</span>
					<span className='text-3.5xl font-black tracking-tight text-slate-900 dark:text-white'>
						{format(totals?.total)}
					</span>
					<span className='text-[10px] font-semibold text-slate-400'>
						Last {STATS_DAYS} days
					</span>
				</div>
				{/* SVG sparkline chart */}
				<div className='h-12 w-24 text-primary-500 drop-shadow-[0_2px_4px_rgba(139,92,246,0.15)]'>
					<svg
						viewBox='0 0 100 40'
						className='h-full w-full overflow-visible'
						aria-hidden='true'>
						<defs>
							<linearGradient id='violet-glow' x1='0' y1='0' x2='0' y2='1'>
								<stop offset='0%' stopColor='rgb(139, 92, 246)' stopOpacity='0.15' />
								<stop offset='100%' stopColor='rgb(139, 92, 246)' stopOpacity='0.0' />
							</linearGradient>
						</defs>
						<path
							d={runsSparkline.area}
							fill='url(#violet-glow)'
							className='transition-all duration-300'
						/>
						<path
							d={runsSparkline.line}
							fill='none'
							stroke='currentColor'
							strokeWidth='2.8'
							strokeLinecap='round'
							strokeLinejoin='round'
						/>
					</svg>
				</div>
			</div>

			{/* Card 2: Completed */}
			<div className='group relative flex items-center justify-between rounded-3xl border border-slate-200/60 bg-white p-6 shadow-sm transition-all duration-350 hover:-translate-y-1 hover:border-primary-500/20 hover:shadow-md dark:border-zinc-800/80 dark:bg-[#11131c]'>
				<div className='flex flex-col gap-1 text-left'>
					<span className='text-[10px] font-black tracking-widest text-primary-600 uppercase dark:text-primary-400'>
						Completed
					</span>
					<span className='text-3.5xl font-black tracking-tight text-slate-900 dark:text-white'>
						{format(totals?.completed)}
					</span>
				</div>
				<div className='flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-50 text-primary-600 shadow-inner transition-transform duration-300 group-hover:scale-105 dark:bg-primary-950/30 dark:text-primary-400'>
					<CheckCircle2 className='h-5 w-5' />
				</div>
			</div>

			{/* Card 3: Failed */}
			<div className='group relative flex items-center justify-between rounded-3xl border border-slate-200/60 bg-white p-6 shadow-sm transition-all duration-350 hover:-translate-y-1 hover:border-primary-500/20 hover:shadow-md dark:border-zinc-800/80 dark:bg-[#11131c]'>
				<div className='flex flex-col gap-1 text-left'>
					<span className='text-[10px] font-black tracking-widest text-primary-600 uppercase dark:text-primary-400'>
						Failed
					</span>
					<span className='text-3.5xl font-black tracking-tight text-slate-900 dark:text-white'>
						{format(totals?.failed)}
					</span>
				</div>
				<div className='flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-50 text-primary-600 shadow-inner transition-transform duration-300 group-hover:scale-105 dark:bg-primary-950/30 dark:text-primary-400'>
					<XCircle className='h-5 w-5' />
				</div>
			</div>

			{/* Card 4: Success Rate */}
			<div className='group relative flex items-center justify-between rounded-3xl border border-slate-200/60 bg-white p-6 shadow-sm transition-all duration-350 hover:-translate-y-1 hover:border-primary-500/20 hover:shadow-md dark:border-zinc-800/80 dark:bg-[#11131c]'>
				<div className='flex flex-col gap-1 text-left'>
					<span className='text-[10px] font-black tracking-widest text-primary-600 uppercase dark:text-primary-400'>
						Success Rate
					</span>
					<span className='text-3.5xl font-black tracking-tight text-slate-900 dark:text-white'>
						{successRate}
					</span>
				</div>
				{/* SVG sparkline chart */}
				<div className='h-12 w-24 text-primary-500 drop-shadow-[0_2px_4px_rgba(196,238,61,0.15)]'>
					<svg
						viewBox='0 0 100 40'
						className='h-full w-full overflow-visible'
						aria-hidden='true'>
						<defs>
							<linearGradient id='blue-glow' x1='0' y1='0' x2='0' y2='1'>
								<stop offset='0%' stopColor='var(--primary-500)' stopOpacity='0.15' />
								<stop offset='100%' stopColor='var(--primary-500)' stopOpacity='0.0' />
							</linearGradient>
						</defs>
						<path
							d={rateSparkline.area}
							fill='url(#blue-glow)'
							className='transition-all duration-300'
						/>
						<path
							d={rateSparkline.line}
							fill='none'
							stroke='currentColor'
							strokeWidth='2.8'
							strokeLinecap='round'
							strokeLinejoin='round'
						/>
					</svg>
				</div>
			</div>
		</div>
	);
};

export default HistoryStatsCards;
