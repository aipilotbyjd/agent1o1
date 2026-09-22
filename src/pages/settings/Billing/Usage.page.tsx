import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router';
import {
	Activity,
	Calendar,
	ChevronDown,
	Code,
	CreditCard,
	FileText,
	GitBranch,
	Sparkles,
	TrendingDown,
	Wallet,
	ArrowDownRight,
	ArrowUpRight,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useWorkspaceContext } from '@/context/workspace';
import { useBillingOverview, useCredits } from '@/api/modules/billing';
import { useCreditUsage } from '@/api/modules/dashboard';
import pages from '@/Routes/pages';

const billingPages = pages.settings.subPages!.billing.subPages!;

/** The backend's `CreditTransactionType` enum — these four are the only
 *  `source_type` values credit_transactions ever carries. */
const SOURCE_TYPE_LABELS: Record<string, { label: string; color: string }> = {
	node_run: {
		label: 'Workflow Run',
		color: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400',
	},
	agent_step: {
		label: 'Agent Step',
		color: 'bg-primary-100 text-primary-700 dark:bg-primary-950 dark:text-primary-400',
	},
	eval_case: {
		label: 'Eval Case',
		color: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400',
	},
	session_evaluation: {
		label: 'Session Evaluation',
		color: 'bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-400',
	},
};

const BREAKDOWN_CARDS = [
	{
		type: 'node_run',
		label: 'Workflow Runs',
		icon: GitBranch,
		iconBg: 'bg-primary-50 text-primary-600 dark:bg-primary-950/40 dark:text-primary-400',
		bar: 'bg-primary-400',
	},
	{
		type: 'agent_step',
		label: 'Agent Steps',
		icon: Sparkles,
		iconBg: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400',
		bar: 'bg-emerald-500',
	},
	{
		type: 'eval_case',
		label: 'Eval Cases',
		icon: Code,
		iconBg: 'bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400',
		bar: 'bg-amber-500',
	},
	{
		type: 'session_evaluation',
		label: 'Session Evals',
		icon: Activity,
		iconBg: 'bg-sky-50 text-sky-600 dark:bg-sky-950/40 dark:text-sky-400',
		bar: 'bg-sky-500',
	},
] as const;

const CHART_WIDTH = 240;
const CHART_HEIGHT = 110;

/** Burn-rate projection: how long the remaining credits last at the pace set
 *  so far this period. Pure — takes `now` rather than reading the clock. */
const projectDepletion = ({
	now,
	startsAt,
	endsAt,
	used,
	remaining,
	isUnlimited,
}: {
	now: number;
	startsAt?: string;
	endsAt?: string;
	used: number;
	remaining: number;
	isUnlimited: boolean;
}): string => {
	if (isUnlimited || !startsAt || used <= 0 || remaining <= 0) return '';
	const elapsed = Math.max(1, Math.ceil((now - new Date(startsAt).getTime()) / 86_400_000));
	const burnPerDay = used / elapsed;
	if (burnPerDay <= 0) return '';
	const depletionDate = new Date(now + Math.floor(remaining / burnPerDay) * 86_400_000);
	const periodEnd = endsAt ? new Date(endsAt) : null;
	if (periodEnd && depletionDate < periodEnd) {
		return `At current rate, credits run out around ${depletionDate.toLocaleDateString(
			undefined,
			{
				month: 'short',
				day: 'numeric',
			},
		)}`;
	}
	return 'At current rate, credits last through this period';
};

const UsagePage = () => {
	const { workspaceId } = useParams<{ workspaceId: string }>();
	const { activeWorkspaceId } = useWorkspaceContext();
	const ws = workspaceId || activeWorkspaceId;

	const { data: overview, isLoading: overviewLoading } = useBillingOverview(ws);
	const { data: creditUsage } = useCreditUsage(ws, { days: 30 });

	const [page, setPage] = useState(1);
	const [txType, setTxType] = useState<string>('all');
	const { data, isLoading } = useCredits(ws, { page, per_page: 25 });

	const transactions = data?.transactions ?? [];
	const meta = data?.meta;
	const lastPage = meta?.last_page ?? 1;

	const filteredTx =
		txType === 'all' ? transactions : transactions.filter((t) => t.source_type === txType);

	// ── credit maths (same shape Overview.page uses, so the two agree) ─────────
	const usage = overview?.usage_period;
	const used = usage?.credits_used ?? 0;
	const limit = usage?.credits_limit ?? null;
	const fromPacks = overview?.topup_credits ?? 0;
	const total = limit === null ? null : limit + fromPacks;
	const remaining = overview?.credits_available ?? total ?? 0;
	const usedPct = total && total > 0 ? Math.min(100, Math.round((used / total) * 100)) : 0;
	const isUnlimited = limit === null;

	// `now` is captured once per mount: the projection is a day-scale estimate,
	// so re-reading the clock on every render would only make it unstable.
	const [now] = useState(() => Date.now());
	const projectionText = projectDepletion({
		now,
		startsAt: usage?.starts_at,
		endsAt: usage?.ends_at,
		used,
		remaining,
		isUnlimited,
	});

	// ── breakdown: whole-period totals from the backend, not the visible page ──
	const bySource = creditUsage?.by_source_type ?? {};
	const breakdownTotal = BREAKDOWN_CARDS.reduce((s, c) => s + (bySource[c.type] ?? 0), 0);

	// ── chart from the real credit-usage series ───────────────────────────────
	const chart = useMemo(() => {
		const series = creditUsage?.series ?? [];
		if (series.length < 2) return null;
		const maxVal = Math.max(...series.map((s) => s.credits), 10);
		const points = series.map((snap, idx) => ({
			x: (idx / (series.length - 1)) * CHART_WIDTH,
			y: CHART_HEIGHT - (snap.credits / maxVal) * (CHART_HEIGHT - 24) - 12,
			snap,
		}));
		let linePath = `M ${points[0].x} ${points[0].y}`;
		for (let i = 0; i < points.length - 1; i++) {
			const p0 = points[i];
			const p1 = points[i + 1];
			const midX = p0.x + (p1.x - p0.x) / 2;
			linePath += ` C ${midX.toFixed(1)} ${p0.y.toFixed(1)}, ${midX.toFixed(1)} ${p1.y.toFixed(
				1,
			)}, ${p1.x.toFixed(1)} ${p1.y.toFixed(1)}`;
		}
		return {
			points,
			linePath,
			areaPath: `${linePath} L ${CHART_WIDTH} ${CHART_HEIGHT} L 0 ${CHART_HEIGHT} Z`,
		};
	}, [creditUsage?.series]);

	const [hoveredPoint, setHoveredPoint] = useState<{
		x: number;
		y: number;
		date: string;
		credits: number;
	} | null>(null);

	return (
		<div className='space-y-8 text-zinc-950 dark:text-zinc-50'>
			{/* Header */}
			<div className='mb-2 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
				<div>
					<div className='flex items-center gap-2.5'>
						<h1 className='text-3xl font-black tracking-tight text-zinc-950 dark:text-zinc-50'>
							Usage
						</h1>
						{overview?.current_plan?.name && (
							<span className='border-primary-100/50 bg-primary-50 text-primary-600 dark:border-primary-900/30 dark:bg-primary-950/40 dark:text-primary-400 rounded-full border px-2.5 py-0.5 text-xs font-bold'>
								{overview.current_plan.name} Plan
							</span>
						)}
					</div>
					{usage?.starts_at && usage?.ends_at && (
						<div className='mt-2 flex items-center gap-1.5 text-xs font-bold text-zinc-400 dark:text-zinc-500'>
							<Calendar size={13.5} className='text-zinc-400' />
							<span>
								Billing period:{' '}
								{new Date(usage.starts_at).toLocaleDateString(undefined, {
									month: 'short',
									day: 'numeric',
								})}
								{' – '}
								{new Date(usage.ends_at).toLocaleDateString(undefined, {
									month: 'short',
									day: 'numeric',
									year: 'numeric',
								})}
							</span>
						</div>
					)}
				</div>

				<Link
					to={billingPages.credits.to.replace(':workspaceId', ws ?? '')}
					className='border-primary-500/20 bg-primary-400 text-primary-950 shadow-primary-500/15 hover:shadow-primary-500/25 flex h-10 items-center gap-2 rounded-xl border px-5 text-sm font-bold shadow-md transition-all duration-200'>
					<CreditCard size={15} />
					<span>Buy credits</span>
				</Link>
			</div>

			{/* Credit health card */}
			{overviewLoading ? (
				<div className='h-40 animate-pulse rounded-2xl bg-zinc-100 dark:bg-zinc-800/60' />
			) : (
				<div className='relative overflow-hidden rounded-2xl border border-zinc-100 bg-white p-6 shadow-xs backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-950/60'>
					<div className='bg-primary-400/10 dark:bg-primary-400/5 absolute -top-10 -right-10 -z-10 h-40 w-40 rounded-full blur-3xl' />
					<div className='bg-primary-400/10 dark:bg-primary-400/5 absolute -bottom-10 -left-10 -z-10 h-40 w-40 rounded-full blur-3xl' />

					<div className='grid gap-6 md:grid-cols-[1fr_auto] md:items-center'>
						<div>
							<div className='flex items-center gap-4.5'>
								<div className='border-primary-100/30 bg-primary-50 text-primary-600 dark:border-primary-900/30 dark:bg-primary-950/40 dark:text-primary-400 flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border shadow-xs'>
									<Wallet size={20} className='fill-primary-600/10' />
								</div>

								<div>
									<div className='text-[10px] font-black tracking-wider text-zinc-400 uppercase dark:text-zinc-500'>
										{isUnlimited ? 'Credits used' : 'Credits remaining'}
									</div>
									<div className='mt-0.5 flex items-baseline gap-2'>
										<span className='text-3xl font-black tracking-tight text-zinc-950 dark:text-zinc-50'>
											{(isUnlimited ? used : remaining).toLocaleString()}
										</span>
										{!isUnlimited && total !== null && (
											<span className='text-xs font-bold text-zinc-400 dark:text-zinc-500'>
												/ {total.toLocaleString()} total
											</span>
										)}
										{isUnlimited && (
											<span className='text-xs font-bold text-zinc-400 dark:text-zinc-500'>
												unlimited plan
											</span>
										)}
									</div>
								</div>
							</div>

							{/* Progress bar — only meaningful when there is a limit */}
							{!isUnlimited && (
								<div className='mt-6'>
									<div className='h-2.5 w-full overflow-hidden rounded-full border border-zinc-200/10 bg-zinc-100 p-[1px] dark:bg-zinc-800/60'>
										<motion.div
											initial={{ width: 0 }}
											animate={{ width: `${100 - usedPct}%` }}
											transition={{ duration: 1, ease: 'easeOut' }}
											className={`relative h-full rounded-full ${usedPct >= 80 ? 'bg-rose-500' : 'bg-primary-400'}`}>
											<div className='absolute top-0 right-0 bottom-0 w-2 animate-pulse rounded-full bg-white/30' />
										</motion.div>
									</div>
									<div className='mt-2 flex items-center justify-between text-[10px] font-bold text-zinc-400 dark:text-zinc-500'>
										<span>{usedPct}% used</span>
										{projectionText && (
											<span className='flex items-center gap-1 font-bold'>
												<TrendingDown size={11} />
												{projectionText}
											</span>
										)}
									</div>
								</div>
							)}

							{/* Limit badges */}
							<div className='mt-5 flex flex-wrap gap-2'>
								{!isUnlimited && limit !== null && (
									<span className='border-primary-100/50 bg-primary-50/50 text-primary-600 dark:border-primary-900/30 dark:bg-primary-950/10 dark:text-primary-400 rounded-full border px-3 py-1 text-[10px] font-bold'>
										Plan credits: {limit.toLocaleString()}
									</span>
								)}
								{fromPacks > 0 && (
									<span className='rounded-full border border-emerald-100/40 bg-emerald-50 px-3 py-1 text-[10px] font-bold text-emerald-700 dark:border-emerald-900/30 dark:bg-emerald-950/10 dark:text-emerald-400'>
										From packs: +{fromPacks.toLocaleString()}
									</span>
								)}
								{(usage?.overage_credits_used ?? 0) > 0 && (
									<span className='rounded-full border border-amber-100/40 bg-amber-50 px-3 py-1 text-[10px] font-bold text-amber-700 dark:border-amber-900/30 dark:bg-amber-950/10 dark:text-amber-400'>
										Overage: {usage!.overage_credits_used.toLocaleString()}
									</span>
								)}
							</div>
						</div>

						{/* Credit-usage chart (last 30 days) */}
						<div className='relative hidden pr-2 md:block'>
							{hoveredPoint && (
								<div className='border-zinc-150 pointer-events-none absolute -top-12 right-2 z-10 rounded-lg border bg-white p-2 text-[9px] font-bold shadow-md select-none dark:border-zinc-800 dark:bg-zinc-900'>
									<div className='text-[8px] text-zinc-400 uppercase'>
										{new Date(hoveredPoint.date).toLocaleDateString(undefined, {
											month: 'short',
											day: 'numeric',
										})}
									</div>
									<div className='text-primary-600 dark:text-primary-400 mt-0.5'>
										{hoveredPoint.credits.toLocaleString()} credits used
									</div>
								</div>
							)}

							<div className='border-zinc-150/45 relative rounded-xl border bg-zinc-50/50 p-3.5 dark:border-zinc-800/60 dark:bg-zinc-900/40'>
								{chart ? (
									<svg
										className='h-28 w-60 overflow-visible'
										viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
										fill='none'
										xmlns='http://www.w3.org/2000/svg'>
										{[10, 55, 100].map((y) => (
											<line
												key={y}
												x1='0'
												y1={y}
												x2={CHART_WIDTH}
												y2={y}
												stroke='currentColor'
												strokeWidth='1'
												className='text-zinc-100 dark:text-zinc-800/40'
												strokeDasharray='4 4'
											/>
										))}

										<path
											d={chart.areaPath}
											fill='url(#paint_linear_usage_new)'
										/>
										<path
											d={chart.linePath}
											stroke='url(#paint_line_gradient)'
											strokeWidth='2.5'
											strokeLinecap='round'
											strokeLinejoin='round'
										/>

										{hoveredPoint && (
											<line
												x1={hoveredPoint.x}
												y1='0'
												x2={hoveredPoint.x}
												y2={CHART_HEIGHT}
												stroke='currentColor'
												strokeWidth='1'
												className='text-primary-400/55 dark:text-primary-500/30'
												strokeDasharray='2 2'
											/>
										)}

										{chart.points.map((pt) => (
											<g key={pt.snap.date}>
												{hoveredPoint?.date === pt.snap.date && (
													<circle
														cx={pt.x}
														cy={pt.y}
														r='3.5'
														fill='currentColor'
														className='text-primary-600 dark:text-primary-400 stroke-white stroke-2 dark:stroke-zinc-950'
													/>
												)}
												<rect
													x={
														pt.x -
														CHART_WIDTH / (chart.points.length - 1) / 2
													}
													y='0'
													width={CHART_WIDTH / (chart.points.length - 1)}
													height={CHART_HEIGHT}
													fill='transparent'
													className='cursor-crosshair'
													onMouseEnter={() =>
														setHoveredPoint({
															x: pt.x,
															y: pt.y,
															date: pt.snap.date,
															credits: pt.snap.credits,
														})
													}
													onMouseLeave={() => setHoveredPoint(null)}
												/>
											</g>
										))}

										<defs>
											<linearGradient
												id='paint_linear_usage_new'
												x1='120'
												y1='0'
												x2='120'
												y2={CHART_HEIGHT}
												gradientUnits='userSpaceOnUse'>
												<stop stopColor='#6366f1' stopOpacity='0.22' />
												<stop
													offset='1'
													stopColor='#6366f1'
													stopOpacity='0'
												/>
											</linearGradient>
											<linearGradient
												id='paint_line_gradient'
												x1='0'
												y1='0'
												x2={CHART_WIDTH}
												y2='0'
												gradientUnits='userSpaceOnUse'>
												<stop stopColor='#6366f1' />
												<stop offset='0.55' stopColor='#8b5cf6' />
												<stop offset='1' stopColor='#ec4899' />
											</linearGradient>
										</defs>
									</svg>
								) : (
									<div className='flex h-28 w-60 flex-col items-center justify-center gap-1.5 text-center'>
										<Activity
											size={18}
											className='text-zinc-300 dark:text-zinc-600'
										/>
										<span className='text-[10px] font-bold text-zinc-400 dark:text-zinc-500'>
											Not enough history yet
										</span>
									</div>
								)}
							</div>
						</div>
					</div>
				</div>
			)}

			{/* Breakdown by source type — whole-period totals */}
			<section>
				<h3 className='mb-4 text-xs font-black tracking-wider text-zinc-400 uppercase dark:text-zinc-500'>
					Usage Breakdown
					<span className='ml-2 font-bold normal-case'>(last 30 days)</span>
				</h3>
				<div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
					{BREAKDOWN_CARDS.map((item) => {
						const credits = bySource[item.type] ?? 0;
						const isSelected = txType === item.type;
						const categoryPct =
							breakdownTotal > 0 ? Math.round((credits / breakdownTotal) * 100) : 0;

						return (
							<motion.button
								key={item.type}
								type='button'
								whileTap={{ scale: 0.98 }}
								onClick={() =>
									setTxType((prev) => (prev === item.type ? 'all' : item.type))
								}
								className={[
									'relative flex h-32 cursor-pointer flex-col justify-between overflow-hidden rounded-2xl border bg-white p-5 text-left shadow-xs transition-all duration-350 dark:bg-zinc-950',
									isSelected
										? 'border-primary-500/80 ring-primary-500/15 dark:border-primary-400/80 shadow-md ring-2'
										: 'hover:border-zinc-350/80 border-zinc-100 hover:shadow-sm dark:border-zinc-800 dark:hover:border-zinc-700/80',
								].join(' ')}>
								<div className='flex w-full items-start justify-between'>
									<div className='flex items-center gap-3.5'>
										<div
											className={`border-zinc-150/15 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border shadow-xs ${item.iconBg}`}>
											<item.icon size={18} />
										</div>
										<div>
											<div className='text-[10px] font-black tracking-wider text-zinc-400 uppercase dark:text-zinc-500'>
												{item.label}
											</div>
											<div className='mt-0.5 text-2xl font-black tracking-tight text-zinc-950 dark:text-zinc-50'>
												{credits.toLocaleString()}
											</div>
										</div>
									</div>
									<span
										className={`border-zinc-150/15 rounded-full border px-2 py-0.5 text-[10px] font-bold ${item.iconBg}`}>
										{categoryPct}%
									</span>
								</div>

								<div className='mt-4 w-full'>
									<div className='h-1 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800'>
										<motion.div
											initial={{ width: 0 }}
											animate={{ width: `${categoryPct}%` }}
											transition={{ duration: 0.8, ease: 'easeOut' }}
											className={`h-full rounded-full ${item.bar}`}
										/>
									</div>
									<div className='mt-1 flex items-center justify-between text-[9px] font-bold text-zinc-400 dark:text-zinc-500'>
										<span>credits used</span>
										{isSelected && (
											<span className='text-primary-600 dark:text-primary-400 animate-pulse'>
												Filter active
											</span>
										)}
									</div>
								</div>
							</motion.button>
						);
					})}
				</div>
			</section>

			{/* Activity log */}
			<section>
				<div className='mb-4 flex flex-wrap items-center justify-between gap-3'>
					<h3 className='text-xs font-black tracking-wider text-zinc-400 uppercase dark:text-zinc-500'>
						Activity Log
					</h3>
					<div className='flex items-center gap-2'>
						<div className='relative'>
							<select
								value={txType}
								onChange={(e) => setTxType(e.target.value)}
								className='cursor-pointer appearance-none rounded-xl border border-zinc-200 bg-white bg-none py-1.5 pr-8 pl-3 text-xs font-bold text-zinc-700 shadow-xs transition hover:border-zinc-300 focus:outline-hidden dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300'>
								<option value='all'>All types</option>
								{Object.keys(SOURCE_TYPE_LABELS).map((t) => (
									<option key={t} value={t}>
										{SOURCE_TYPE_LABELS[t].label}
									</option>
								))}
							</select>
							<ChevronDown
								size={14}
								className='pointer-events-none absolute top-1/2 right-2.5 -translate-y-1/2 text-zinc-400'
							/>
						</div>
					</div>
				</div>

				{txType !== 'all' && (
					<p className='mb-3 text-[10px] font-bold text-zinc-400 dark:text-zinc-500'>
						Filtering the current page only - the backend does not filter this list
						server-side.
					</p>
				)}

				{isLoading ? (
					<div className='space-y-3'>
						{[...Array(5)].map((_, i) => (
							<div
								key={i}
								className='h-14 animate-pulse rounded-xl bg-zinc-100 dark:bg-zinc-800/60'
							/>
						))}
					</div>
				) : filteredTx.length === 0 ? (
					<div className='rounded-2xl border border-dashed border-zinc-200 bg-zinc-50/20 px-6 py-12 text-center backdrop-blur-xs dark:border-zinc-800 dark:bg-zinc-950/10'>
						<div className='border-primary-100/30 bg-primary-50 text-primary-600 dark:bg-primary-950/40 dark:text-primary-400 mx-auto mb-3.5 flex h-12 w-12 items-center justify-center rounded-2xl border shadow-xs'>
							<FileText size={20} className='fill-primary-600/10' />
						</div>
						<p className='text-xs font-black text-zinc-900 dark:text-zinc-100'>
							No activity yet for this period.
						</p>
						<p className='mx-auto mt-1 max-w-[240px] text-[10px] leading-relaxed font-bold text-zinc-400 dark:text-zinc-500'>
							Your credit usage transactions and balance adjustments will appear here
							once executed.
						</p>
					</div>
				) : (
					<div className='overflow-hidden rounded-2xl border border-zinc-100 bg-white shadow-xs dark:border-zinc-800 dark:bg-zinc-950'>
						<div className='divide-y divide-zinc-100 dark:divide-zinc-800'>
							<AnimatePresence initial={false}>
								{filteredTx.map((tx) => {
									const cfg = SOURCE_TYPE_LABELS[tx.source_type] ?? {
										label: tx.source_type,
										color: 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400',
									};
									const isNegative = tx.credits < 0;
									return (
										<motion.div
											layout
											initial={{ opacity: 0, y: 4 }}
											animate={{ opacity: 1, y: 0 }}
											exit={{ opacity: 0, y: -4 }}
											key={tx.id}
											className='flex items-center gap-4 px-5 py-3.5 transition-all duration-200 hover:translate-x-0.5 hover:bg-zinc-50/45 dark:hover:bg-zinc-800/10'>
											<span
												className={`shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-bold tracking-wide ${cfg.color}`}>
												{cfg.label}
											</span>
											<span className='min-w-0 flex-1 truncate text-xs font-bold text-zinc-600 dark:text-zinc-400'>
												{tx.reason || '-'}
											</span>

											<div
												className={`flex shrink-0 items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-black ${
													isNegative
														? 'bg-rose-50/50 text-rose-600 dark:bg-rose-950/20 dark:text-rose-400'
														: 'bg-emerald-50/50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400'
												}`}>
												{isNegative ? (
													<ArrowDownRight
														size={12}
														className='stroke-[2.5]'
													/>
												) : (
													<ArrowUpRight
														size={12}
														className='stroke-[2.5]'
													/>
												)}
												<span>
													{isNegative ? '' : '+'}
													{tx.credits.toLocaleString()}
												</span>
											</div>

											<span className='shrink-0 text-[10px] font-bold text-zinc-400 dark:text-zinc-500'>
												{new Date(tx.created_at).toLocaleDateString(
													undefined,
													{
														month: 'short',
														day: 'numeric',
													},
												)}
											</span>
										</motion.div>
									);
								})}
							</AnimatePresence>
						</div>
					</div>
				)}

				{/* Pagination */}
				{lastPage > 1 && (
					<div className='mt-4 flex items-center justify-between'>
						<button
							type='button'
							onClick={() => setPage((p) => Math.max(1, p - 1))}
							disabled={page === 1}
							className='rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-bold text-zinc-700 shadow-sm transition hover:bg-zinc-50 disabled:opacity-40 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300'>
							← Previous
						</button>
						<span className='text-sm font-semibold text-zinc-400'>
							Page {page} of {lastPage}
						</span>
						<button
							type='button'
							onClick={() => setPage((p) => Math.min(lastPage, p + 1))}
							disabled={page === lastPage}
							className='rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-bold text-zinc-700 shadow-sm transition hover:bg-zinc-50 disabled:opacity-40 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300'>
							Next →
						</button>
					</div>
				)}
			</section>
		</div>
	);
};

export default UsagePage;
