import { useState } from 'react';
import { Link } from 'react-router';
import {
	AlertTriangle,
	ArrowRight,
	CreditCard,
	TrendingDown,
	Wallet,
	Sparkles,
	Code,
	FileText,
	ChevronDown,
	Calendar,
	GitBranch,
	ArrowUpRight,
	ArrowDownRight,
	Activity,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useWorkspaceContext } from '@/context/workspaceContext';
import { useCreditBalance, useCreditTransactions } from '@/api/modules/credits';
import { useUsageSnapshots } from '@/api/modules/plans';
import pages from '@/Routes/pages';
import type { TCreditTransactionType } from '@/types/credit.type';

// ── helpers ──────────────────────────────────────────────────────────────────

const TX_LABELS: Record<TCreditTransactionType, { label: string; color: string; border: string }> = {
	execution: {
		label: 'Workflow Run',
		color: 'bg-blue-50/70 text-blue-700 dark:bg-blue-950/30 dark:text-blue-300',
		border: 'border-blue-200/50 dark:border-blue-800/40',
	},
	ai_execution: {
		label: 'AI Run',
		color: 'bg-primary-50/70 text-primary-700 dark:bg-primary-950/30 dark:text-primary-300',
		border: 'border-primary-200/50 dark:border-primary-800/40',
	},
	code_execution: {
		label: 'Code Run',
		color: 'bg-amber-50/70 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300',
		border: 'border-amber-200/50 dark:border-amber-800/40',
	},
	refund: {
		label: 'Refund',
		color: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300',
		border: 'border-emerald-200/50 dark:border-emerald-800/40',
	},
	adjustment: {
		label: 'Adjustment',
		color: 'bg-zinc-50 text-zinc-700 dark:bg-zinc-800/60 dark:text-zinc-300',
		border: 'border-zinc-200/80 dark:border-zinc-700/50',
	},
	pack_purchase: {
		label: 'Pack Purchase',
		color: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300',
		border: 'border-emerald-200/50 dark:border-emerald-800/40',
	},
	bonus: {
		label: 'Bonus',
		color: 'bg-sky-50 text-sky-700 dark:bg-sky-950/30 dark:text-sky-305',
		border: 'border-sky-200/50 dark:border-sky-800/40',
	},
	rollover: {
		label: 'Rollover',
		color: 'bg-primary-50 text-primary-700 dark:bg-primary-950/30 dark:text-primary-300',
		border: 'border-primary-200/50 dark:border-primary-800/40',
	},
};

// ── component ─────────────────────────────────────────────────────────────────

const UsagePage = ({ hideHeader = false }: { hideHeader?: boolean }) => {
	const { activeWorkspaceId } = useWorkspaceContext();
	const { data: balance, isLoading: balanceLoading } = useCreditBalance(activeWorkspaceId);
	const { data: txData, isLoading: txLoading } = useCreditTransactions(activeWorkspaceId, {
		per_page: 20,
	});
	const { data: snapshots } = useUsageSnapshots(activeWorkspaceId, {
		from: balance?.period?.start ?? undefined,
		to: balance?.period?.end ?? undefined,
	});

	const [txType, setTxType] = useState<TCreditTransactionType | 'all'>('all');

	// ── credit maths ──────────────────────────────────────────────────────────
	const credits = balance?.credits;
	const period = balance?.period;
	const used = credits?.used ?? 0;
	const limit = credits?.limit ?? 1000;
	const fromPacks = credits?.from_packs ?? 0;
	const rolledOver = credits?.rolled_over ?? 0;
	const total = limit + fromPacks + rolledOver;
	const remaining = credits?.remaining ?? 1000;
	const usedPct = total > 0 ? Math.min(100, Math.round((used / total) * 100)) : 0;

	// burn rate: used / days elapsed → projected days remaining
	let projectionText = '';
	if (period?.start && used > 0 && remaining > 0) {
		const elapsed = Math.max(
			1,
			Math.ceil((Date.now() - new Date(period.start).getTime()) / 86_400_000),
		);
		const burnPerDay = used / elapsed;
		const daysLeft = burnPerDay > 0 ? Math.floor(remaining / burnPerDay) : null;
		if (daysLeft !== null) {
			const depletionDate = new Date(Date.now() + daysLeft * 86_400_000);
			const periodEndDate = period.end ? new Date(period.end) : null;
			if (periodEndDate && depletionDate < periodEndDate) {
				projectionText = `At current rate, credits run out around ${depletionDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`;
			} else {
				projectionText = `At current rate, credits last through this period`;
			}
		}
	}

	// ── breakdown from transactions ───────────────────────────────────────────
	const txList = txData?.data ?? [];
	const workflowCredits = txList
		.filter((t) => t.type === 'execution')
		.reduce((s, t) => s + Math.abs(t.credits), 0);
	const aiCredits = txList
		.filter((t) => t.type === 'ai_execution')
		.reduce((s, t) => s + Math.abs(t.credits), 0);
	const codeCredits = txList
		.filter((t) => t.type === 'code_execution')
		.reduce((s, t) => s + Math.abs(t.credits), 0);

	const snapshotList = snapshots?.snapshots ?? [];
	const filteredTx = txType === 'all' ? txList : txList.filter((t) => t.type === txType);

	// ── sparkline maths ───────────────────────────────────────────────────────
	const sortedSnapshots = [...snapshotList].sort(
		(a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
	);
	const hasSnapshots = sortedSnapshots.length > 0;

	// Fallback to simulated data if no real snapshots exist (to keep dashboard visual)
	const displaySnapshots = hasSnapshots
		? sortedSnapshots
		: [
				{ date: '1', credits_used: 80 },
				{ date: '2', credits_used: 160 },
				{ date: '3', credits_used: 120 },
				{ date: '4', credits_used: 280 },
				{ date: '5', credits_used: 210 },
				{ date: '6', credits_used: 390 },
				{ date: '7', credits_used: 320 },
				{ date: '8', credits_used: 480 },
				{ date: '9', credits_used: 410 },
				{ date: '10', credits_used: 560 },
			];

	const maxVal = Math.max(...displaySnapshots.map((s) => s.credits_used), 10);
	const minVal = 0;
	const valRange = maxVal - minVal;
	const chartWidth = 240;
	const chartHeight = 110;

	const chartPoints = displaySnapshots.map((snap, idx) => {
		const x = (idx / (displaySnapshots.length - 1)) * chartWidth;
		const y = chartHeight - ((snap.credits_used - minVal) / valRange) * (chartHeight - 24) - 12;
		return { x, y, snap };
	});

	// Smooth cubic Bezier path calculations
	let linePath = '';
	if (chartPoints.length > 0) {
		linePath = `M ${chartPoints[0].x} ${chartPoints[0].y}`;
		for (let i = 0; i < chartPoints.length - 1; i++) {
			const p0 = chartPoints[i];
			const p1 = chartPoints[i + 1];
			const cpX1 = p0.x + (p1.x - p0.x) / 2;
			const cpY1 = p0.y;
			const cpX2 = p0.x + (p1.x - p0.x) / 2;
			const cpY2 = p1.y;
			linePath += ` C ${cpX1.toFixed(1)} ${cpY1.toFixed(1)}, ${cpX2.toFixed(1)} ${cpY2.toFixed(1)}, ${p1.x.toFixed(1)} ${p1.y.toFixed(1)}`;
		}
	}

	const areaPath = chartPoints.length > 0 ? `${linePath} L ${chartWidth} ${chartHeight} L 0 ${chartHeight} Z` : '';

	const [hoveredPoint, setHoveredPoint] = useState<{
		x: number;
		y: number;
		snap: typeof displaySnapshots[0];
	} | null>(null);

	return (
		<div className='space-y-8 text-zinc-950 dark:text-zinc-50'>
			{/* Header */}
			{!hideHeader && (
				<div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-2'>
					<div>
						<div className="flex items-center gap-2.5">
							<h1 className='text-3xl font-black tracking-tight text-zinc-950 dark:text-zinc-50'>
								Usage
							</h1>
							{balance?.plan?.name && (
								<span className="rounded-full bg-primary-50 px-2.5 py-0.5 text-xs font-bold text-primary-600 dark:bg-primary-950/40 dark:text-primary-400 border border-primary-100/50 dark:border-primary-900/30">
									{balance.plan.name} Plan
								</span>
							)}
						</div>
						{period?.start && period?.end ? (
							<div className='mt-2 flex items-center gap-1.5 text-xs font-bold text-zinc-400 dark:text-zinc-500'>
								<Calendar size={13.5} className='text-zinc-400' />
								<span>
									Billing period:{' '}
									{new Date(period.start).toLocaleDateString(undefined, {
										month: 'short',
										day: 'numeric',
									})}
									{' – '}
									{new Date(period.end).toLocaleDateString(undefined, {
										month: 'short',
										day: 'numeric',
										year: 'numeric',
									})}
								</span>
							</div>
						) : (
							<div className='mt-2 flex items-center gap-1.5 text-xs font-bold text-zinc-400 dark:text-zinc-500'>
								<Calendar size={13.5} className='text-zinc-400' />
								<span>Billing period: Jun 9 – Jul 9, 2026</span>
							</div>
						)}
					</div>

					<motion.div
						whileHover={{ scale: 1.02, translateY: -1 }}
						whileTap={{ scale: 0.98 }}
					>
						<Link
							to={pages.settings.subPages.billing.subPages.credits.to}
							className='flex h-10 items-center gap-2 rounded-xl bg-gradient-to-r from-primary-400 to-primary-400 px-5 text-sm font-bold text-primary-950 shadow-md shadow-primary-500/15 hover:shadow-primary-500/25 transition-all duration-200 border border-primary-500/20'>
							<CreditCard size={15} />
							<span>Buy credits</span>
						</Link>
					</motion.div>
				</div>
			)}

			{/* Credit health card */}
			{balanceLoading ? (
				<div className='h-40 animate-pulse rounded-2xl bg-zinc-100 dark:bg-zinc-800/60' />
			) : (
				<div className='relative overflow-hidden rounded-2xl border border-zinc-100 bg-white p-6 shadow-xs dark:border-zinc-800 dark:bg-zinc-950/60 backdrop-blur-md'>
					{/* Decorative blur elements */}
					<div className="absolute -right-10 -top-10 -z-10 h-40 w-40 rounded-full bg-primary-400/10 blur-3xl dark:bg-primary-400/5" />
					<div className="absolute -left-10 -bottom-10 -z-10 h-40 w-40 rounded-full bg-primary-400/10 blur-3xl dark:bg-primary-400/5" />

					<div className='grid gap-6 md:grid-cols-[1fr_auto] md:items-center'>
						<div>
							<div className='flex items-center gap-4.5'>
								{/* Wallet Icon squircle */}
								<div className='flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary-50 text-primary-600 shadow-xs dark:bg-primary-950/40 dark:text-primary-400 border border-primary-100/30 dark:border-primary-900/30'>
									<Wallet size={20} className='fill-primary-600/10' />
								</div>

								<div>
									<div className='text-[10px] font-black tracking-wider text-zinc-400 uppercase dark:text-zinc-500'>
										Credits remaining
									</div>
									<div className='mt-0.5 flex items-baseline gap-2'>
										<span className='text-3xl font-black text-zinc-950 dark:text-zinc-50 tracking-tight'>
											{remaining.toLocaleString()}
										</span>
										<span className='text-xs font-bold text-zinc-400 dark:text-zinc-500'>
											/ {total.toLocaleString()} total
										</span>
									</div>
								</div>
							</div>

							{/* Progress bar */}
							<div className='mt-6'>
								<div className='h-2.5 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800/60 p-[1px] border border-zinc-200/10'>
									<motion.div
										initial={{ width: 0 }}
										animate={{ width: `${100 - usedPct}%` }}
										transition={{ duration: 1, ease: 'easeOut' }}
										className='h-full rounded-full bg-gradient-to-r from-primary-400 via-primary-400 to-primary-400 relative'
									>
										<div className="absolute right-0 top-0 bottom-0 w-2 bg-white/30 rounded-full animate-pulse" />
									</motion.div>
								</div>
								<div className='mt-2 flex items-center justify-between text-[10px] font-bold text-zinc-400 dark:text-zinc-500'>
									<span>{usedPct}% used</span>
									{projectionText && (
										<span className='text-zinc-450 dark:text-zinc-500 flex items-center gap-1 font-bold'>
											<TrendingDown size={11} />
											{projectionText}
										</span>
									)}
								</div>
							</div>

							{/* Limit badges */}
							<div className='mt-5 flex flex-wrap gap-2'>
								<span className='rounded-full border border-primary-100/50 bg-primary-50/50 px-3 py-1 text-[10px] font-bold text-primary-600 dark:border-primary-900/30 dark:bg-primary-950/10 dark:text-primary-400'>
									Plan credits: {limit.toLocaleString()}
								</span>
								{fromPacks > 0 && (
									<span className='rounded-full border border-emerald-100/40 bg-emerald-50 px-3 py-1 text-[10px] font-bold text-emerald-700 dark:border-emerald-900/30 dark:bg-emerald-950/10 dark:text-emerald-400'>
										From packs: +{fromPacks.toLocaleString()}
									</span>
								)}
								{rolledOver > 0 && (
									<span className='rounded-full border border-primary-100/40 bg-primary-50 px-3 py-1 text-[10px] font-bold text-primary-700 dark:border-primary-900/30 dark:bg-primary-950/10 dark:text-primary-400'>
										Rolled over: +{rolledOver.toLocaleString()}
									</span>
								)}
							</div>
						</div>

						{/* Dynamic SVG chart */}
						<div className='hidden md:block pr-2 relative'>
							{/* Hover Tooltip display */}
							{hoveredPoint && (
								<div className="absolute -top-12 right-2 p-2 bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 rounded-lg shadow-md text-[9px] font-bold z-10 select-none pointer-events-none">
									<div className="text-zinc-400 uppercase text-[8px]">
										{hasSnapshots
											? new Date(hoveredPoint.snap.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
											: `Day ${hoveredPoint.snap.date}`}
									</div>
									<div className="text-primary-600 dark:text-primary-400 mt-0.5">
										{hoveredPoint.snap.credits_used.toLocaleString()} credits used
									</div>
								</div>
							)}

							<div className="bg-zinc-50/50 dark:bg-zinc-900/40 rounded-xl p-3.5 border border-zinc-150/45 dark:border-zinc-800/60 relative">
								{!hasSnapshots && (
									<div className="absolute top-2 left-2 flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 border border-zinc-200/40 dark:border-zinc-700/40 text-[8px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider select-none z-10 pointer-events-none">
										<Activity size={10} className="text-primary-500" />
										<span>Simulated trend</span>
									</div>
								)}
								<svg
									className='h-28 w-60 overflow-visible'
									viewBox='0 0 240 110'
									fill='none'
									xmlns='http://www.w3.org/2000/svg'>
									{/* Horizontal grid lines */}
									<line x1='0' y1='10' x2='240' y2='10' stroke='currentColor' strokeWidth='1' className='text-zinc-100 dark:text-zinc-800/40' strokeDasharray='4 4' />
									<line x1='0' y1='55' x2='240' y2='55' stroke='currentColor' strokeWidth='1' className='text-zinc-100 dark:text-zinc-800/40' strokeDasharray='4 4' />
									<line x1='0' y1='100' x2='240' y2='100' stroke='currentColor' strokeWidth='1' className='text-zinc-100 dark:text-zinc-800/40' strokeDasharray='4 4' />

									{/* Gradient area under line */}
									<path
										d={areaPath}
										fill='url(#paint_linear_usage_new)'
										className='transition-all duration-300'
									/>
									
									{/* Line path */}
									<path
										d={linePath}
										stroke='url(#paint_line_gradient)'
										strokeWidth='2.5'
										strokeLinecap='round'
										strokeLinejoin='round'
										className='transition-all duration-300'
									/>

									{/* Vertical tracking line on hover */}
									{hoveredPoint && (
										<line
											x1={hoveredPoint.x}
											y1='0'
											x2={hoveredPoint.x}
											y2='110'
											stroke='currentColor'
											strokeWidth='1'
											className='text-primary-400/55 dark:text-primary-500/30'
											strokeDasharray='2 2'
										/>
									)}

									{/* Interactive points & hot zones */}
									{chartPoints.map((pt, idx) => (
										<g key={idx}>
											{/* Highlight active dot on hover */}
											{hoveredPoint?.snap.date === pt.snap.date && (
												<>
													<circle
														cx={pt.x}
														cy={pt.y}
														r='7'
														fill='currentColor'
														className='text-primary-500/20 dark:text-primary-400/20 animate-ping'
													/>
													<circle
														cx={pt.x}
														cy={pt.y}
														r='3.5'
														fill='currentColor'
														className='text-primary-600 dark:text-primary-400 stroke-white dark:stroke-zinc-950 stroke-2 shadow-xs'
													/>
												</>
											)}

											{/* Invisible rect for easy mouse hover detection */}
											<rect
												x={idx === 0 ? 0 : pt.x - 240 / (chartPoints.length - 1) / 2}
												y='0'
												width={240 / (chartPoints.length - 1)}
												height='110'
												fill='transparent'
												className='cursor-crosshair'
												onMouseEnter={() => setHoveredPoint(pt)}
												onMouseLeave={() => setHoveredPoint(null)}
											/>
										</g>
									))}

									<defs>
										<linearGradient id='paint_linear_usage_new' x1='120' y1='0' x2='120' y2='110' gradientUnits='userSpaceOnUse'>
											<stop stopColor='#6366f1' stopOpacity='0.22' />
											<stop offset='1' stopColor='#6366f1' stopOpacity='0' />
										</linearGradient>
										<linearGradient id='paint_line_gradient' x1='0' y1='0' x2='240' y2='0' gradientUnits='userSpaceOnUse'>
											<stop stopColor='#6366f1' />
											<stop offset='0.55' stopColor='#8b5cf6' />
											<stop offset='1' stopColor='#ec4899' />
										</linearGradient>
									</defs>
								</svg>
							</div>
						</div>
					</div>
				</div>
			)}

			{/* Breakdown by type */}
			<section>
				<h3 className='mb-4 text-xs font-black tracking-wider text-zinc-400 dark:text-zinc-500 uppercase'>Usage Breakdown</h3>
				<div className='grid gap-4 sm:grid-cols-3'>
					{[
						{
							label: 'Workflow Runs',
							type: 'execution' as const,
							credits: workflowCredits,
							icon: GitBranch,
							iconBg: 'bg-primary-50 text-primary-600 dark:bg-primary-950/40 dark:text-primary-400',
							color: 'border-primary-300 dark:border-primary-700 shadow-primary-500/5 dark:shadow-primary-500/10',
							glow: 'ring-2 ring-primary-500/15',
							hoverBg: 'hover:bg-primary-50/5 dark:hover:bg-primary-950/5',
							iconVariants: {
								hovered: { y: [0, -3, 2, 0], rotate: [0, 5, -5, 0], transition: { duration: 0.5 } }
							}
						},
						{
							label: 'AI Runs',
							type: 'ai_execution' as const,
							credits: aiCredits,
							icon: Sparkles,
							iconBg: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400',
							color: 'border-emerald-300 dark:border-emerald-700 shadow-emerald-500/5 dark:shadow-emerald-500/10',
							glow: 'ring-2 ring-emerald-500/15',
							hoverBg: 'hover:bg-emerald-50/5 dark:hover:bg-emerald-950/5',
							iconVariants: {
								hovered: { rotate: [0, 15, -15, 0], scale: 1.15, transition: { duration: 0.5 } }
							}
						},
						{
							label: 'Code Runs',
							type: 'code_execution' as const,
							credits: codeCredits,
							icon: Code,
							iconBg: 'bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400',
							color: 'border-blue-300 dark:border-blue-700 shadow-blue-500/5 dark:shadow-blue-500/10',
							glow: 'ring-2 ring-blue-500/15',
							hoverBg: 'hover:bg-blue-50/5 dark:hover:bg-blue-950/5',
							iconVariants: {
								hovered: { scale: 1.1, x: [0, -2, 2, 0], transition: { duration: 0.4 } }
							}
						},
					].map((item) => {
						const isSelected = txType === item.type;
						const totalCreditsUsed = workflowCredits + aiCredits + codeCredits;
						const categoryPct = totalCreditsUsed > 0 ? Math.round((item.credits / totalCreditsUsed) * 100) : 0;

						return (
							<motion.button
								key={item.type}
								type='button'
								whileHover="hovered"
								whileTap={{ scale: 0.98 }}
								onClick={() =>
									setTxType((prev) => (prev === item.type ? 'all' : item.type))
								}
								className={[
									'relative rounded-2xl border bg-white p-5 text-left shadow-xs transition-all duration-350 cursor-pointer dark:bg-zinc-950 overflow-hidden flex flex-col justify-between h-32',
									item.hoverBg,
									isSelected
										? `${item.color} ${item.glow} border-primary-500/80 dark:border-primary-400/80 shadow-md`
										: 'border-zinc-100 dark:border-zinc-800 hover:border-zinc-350/80 dark:hover:border-zinc-700/80 hover:shadow-sm',
								].join(' ')}>
								{/* Card Selection background highlight */}
								{isSelected && (
									<div className="absolute inset-0 bg-gradient-to-tr from-primary-400/5 to-primary-400/5 -z-10 dark:from-primary-950/5 dark:to-primary-950/5" />
								)}

								<div className='flex items-start justify-between w-full'>
									<div className='flex items-center gap-3.5'>
										<motion.div
											variants={item.iconVariants}
											className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${item.iconBg} shadow-xs border border-zinc-150/15`}>
											<item.icon size={18} />
										</motion.div>
										<div>
											<div className='text-[10px] font-black tracking-wider text-zinc-400 dark:text-zinc-500 uppercase'>
												{item.label}
											</div>
											<div className='mt-0.5 flex items-baseline gap-1'>
												<span className='text-2xl font-black text-zinc-950 dark:text-zinc-50 tracking-tight'>
													{item.credits.toLocaleString()}
												</span>
											</div>
										</div>
									</div>

									{/* Category breakdown badge */}
									<span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${item.iconBg} border border-zinc-150/15`}>
										{categoryPct}%
									</span>
								</div>

								{/* Contribution progress bar */}
								<div className="w-full mt-4">
									<div className="h-1 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
										<motion.div
											initial={{ width: 0 }}
											animate={{ width: `${categoryPct}%` }}
											transition={{ duration: 0.8, ease: 'easeOut' }}
											className={`h-full rounded-full ${
												item.type === 'execution'
													? 'bg-primary-400'
													: item.type === 'ai_execution'
														? 'bg-emerald-500'
														: 'bg-blue-500'
											}`}
										/>
									</div>
									<div className="flex justify-between items-center mt-1 text-[9px] font-bold text-zinc-400 dark:text-zinc-500">
										<span>credits used</span>
										{isSelected && <span className="text-primary-600 dark:text-primary-400 animate-pulse">Filter active</span>}
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
					<h3 className='text-xs font-black tracking-wider text-zinc-400 dark:text-zinc-500 uppercase'>Activity Log</h3>
					<div className='flex items-center gap-2'>
						<div className='relative'>
							<select
								value={txType}
								onChange={(e) =>
									setTxType(e.target.value as TCreditTransactionType | 'all')
								}
								className='rounded-xl border border-zinc-200 bg-white pl-3 pr-8 py-1.5 text-xs font-bold text-zinc-700 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300 appearance-none shadow-xs hover:border-zinc-300 focus:outline-hidden transition cursor-pointer'>
								<option value='all'>All types</option>
								{(Object.keys(TX_LABELS) as TCreditTransactionType[]).map((t) => (
									<option key={t} value={t}>
										{TX_LABELS[t].label}
									</option>
								))}
							</select>
							<ChevronDown
								size={14}
								className='pointer-events-none absolute top-1/2 right-2.5 -translate-y-1/2 text-zinc-400'
							/>
						</div>
						<Link
							to={pages.settings.subPages.billing.subPages.history.to}
							className='flex items-center gap-1 text-xs font-bold text-primary-600 dark:text-primary-400 hover:text-primary-700 transition px-2.5 py-1.5 rounded-xl hover:bg-primary-50/50 dark:hover:bg-primary-950/15'>
							<span>View all</span>
							<ArrowRight size={12} />
						</Link>
					</div>
				</div>

				{txLoading ? (
					<div className='space-y-3'>
						{[...Array(5)].map((_, i) => (
							<div
								key={i}
								className='h-14 animate-pulse rounded-xl bg-zinc-55 dark:bg-zinc-800/60'
							/>
						))}
					</div>
				) : filteredTx.length === 0 ? (
					<motion.div
						initial={{ opacity: 0, scale: 0.98 }}
						animate={{ opacity: 1, scale: 1 }}
						className='rounded-2xl border border-dashed border-zinc-200 bg-zinc-50/20 px-6 py-12 text-center dark:border-zinc-800 dark:bg-zinc-950/10 backdrop-blur-xs'>
						<div className='mx-auto mb-3.5 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-50 text-primary-600 dark:bg-primary-950/40 dark:text-primary-400 shadow-xs border border-primary-100/30'>
							<FileText size={20} className='fill-primary-600/10' />
						</div>
						<p className='text-xs font-black text-zinc-900 dark:text-zinc-100'>No activity yet for this period.</p>
						<p className='text-[10px] font-bold text-zinc-400 dark:text-zinc-500 mt-1 max-w-[240px] mx-auto leading-relaxed'>
							Your credit usage transactions and balance adjustments will appear here once executed.
						</p>
					</motion.div>
				) : (
					<div className='overflow-hidden rounded-2xl border border-zinc-100 bg-white shadow-xs dark:border-zinc-800 dark:bg-zinc-950'>
						<div className="divide-y divide-zinc-100 dark:divide-zinc-800">
							<AnimatePresence initial={false}>
								{filteredTx.map((tx) => {
									const cfg = TX_LABELS[tx.type] || {
										label: tx.type,
										color: 'bg-zinc-50 text-zinc-650 dark:bg-zinc-800 dark:text-zinc-400',
										border: 'border-zinc-200 dark:border-zinc-700',
									};
									const isNegative = tx.credits < 0;
									return (
										<motion.div
											layout
											initial={{ opacity: 0, y: 4 }}
											animate={{ opacity: 1, y: 0 }}
											exit={{ opacity: 0, y: -4 }}
											key={tx.id}
											className="flex items-center gap-4 px-5 py-3.5 hover:bg-zinc-50/45 dark:hover:bg-zinc-800/10 hover:translate-x-0.5 transition-all duration-200">
											<span
												className={`shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-bold border ${cfg.color} ${cfg.border} tracking-wide`}>
												{cfg.label}
											</span>
											<span className='min-w-0 flex-1 truncate text-xs font-bold text-zinc-650 dark:text-zinc-400'>
												{tx.description || '—'}
											</span>
											
											{/* Dynamic Credit Value Badge with Arrow Icon */}
											<div className={`shrink-0 flex items-center gap-1 font-black text-xs px-2.5 py-1 rounded-lg ${
												isNegative
													? 'text-rose-600 bg-rose-50/50 dark:text-rose-455 dark:bg-rose-950/20'
													: 'text-emerald-600 bg-emerald-50/50 dark:text-emerald-450 dark:bg-emerald-950/20'
											}`}>
												{isNegative ? (
													<ArrowDownRight size={12} className="stroke-[2.5]" />
												) : (
													<ArrowUpRight size={12} className="stroke-[2.5]" />
												)}
												<span>
													{isNegative ? '' : '+'}
													{tx.credits.toLocaleString()}
												</span>
											</div>

											<span className='shrink-0 text-[10px] font-bold text-zinc-400 dark:text-zinc-500'>
												{new Date(tx.created_at).toLocaleDateString(undefined, {
													month: 'short',
													day: 'numeric',
												})}
											</span>
										</motion.div>
									);
								})}
							</AnimatePresence>
						</div>
					</div>
				)}
			</section>
		</div>
	);
};

export default UsagePage;
