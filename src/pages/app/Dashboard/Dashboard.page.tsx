import { useEffect, useState } from 'react';
import { useOutletContext, useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'framer-motion';
import {
	GitMerge,
	Bot,
	Activity,
	CheckCircle2,
	AlertTriangle,
	Timer,
	Clock,
	Zap,
	ArrowRight,
	ArrowUpRight,
	Check,
	Circle,
	X,
	Mail,
	User,
	Crown,
	Plus,
	FileText,
	History,
	Inbox,
	ShieldCheck,
} from 'lucide-react';
import { OutletContextType } from '@/pages/app/Dashboard/_layouts/Dashboard.layout';
import Breadcrumb from '@/components/layout/Breadcrumb';
import Container from '@/components/layout/Container';
import pages from '@/Routes/pages';
import { useAuth } from '@/context/auth';
import type { TOnboardingStepKey } from '@/types/auth.type';
import { useWorkspaceContext } from '@/context/workspace';
import { useWorkflowShellStore } from '@/store/workflowShell.store';
import { useDashboard } from '@/api/modules/dashboard';
import { STATUS_BADGE_COLORS, type TExecutionStatus } from '@/types/dashboard.type';

// ─── Helpers ────────────────────────────────────────────────────────────────
const formatRelativeTime = (value?: number) => {
	if (!value) return '—';
	const ms = value < 1_000_000_000_000 ? value * 1000 : value;
	const diff = Date.now() - ms;
	if (Number.isNaN(diff)) return '—';
	if (diff < 0) return 'just now';
	const minutes = Math.floor(diff / 60_000);
	if (minutes < 1) return 'just now';
	if (minutes < 60) return `${minutes} min${minutes === 1 ? '' : 's'} ago`;
	const hours = Math.floor(minutes / 60);
	if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
	const days = Math.floor(hours / 24);
	return `${days} day${days === 1 ? '' : 's'} ago`;
};

const formatDuration = (ms?: number) => {
	if (!ms || ms <= 0) return '—';
	if (ms < 1000) return `${Math.round(ms)}ms`;
	const s = ms / 1000;
	if (s < 60) return `${s.toFixed(s < 10 ? 1 : 0)}s`;
	const m = Math.floor(s / 60);
	const rem = Math.round(s % 60);
	return `${m}m ${rem}s`;
};

// Build an SVG line + area path from a series of values, normalised to a viewbox.
const buildSpark = (values: number[], w = 100, h = 30) => {
	if (values.length === 0) return { line: '', area: '' };
	const max = Math.max(...values, 1);
	const step = values.length > 1 ? w / (values.length - 1) : 0;
	const pts = values.map((v, i) => {
		const x = values.length > 1 ? i * step : w / 2;
		const y = h - (v / max) * (h - 4) - 2;
		return [Number(x.toFixed(2)), Number(y.toFixed(2))] as const;
	});
	const line = pts.map(([x, y], i) => `${i === 0 ? 'M' : 'L'} ${x} ${y}`).join(' ');
	const area = `${line} L ${pts[pts.length - 1][0]} ${h} L ${pts[0][0]} ${h} Z`;
	return { line, area };
};

const onboardingIcons: Record<TOnboardingStepKey, React.ComponentType<{ size?: number }>> = {
	verify_email: Mail,
	complete_profile: User,
	create_workspace: Bot,
	add_credential: GitMerge,
	create_workflow: GitMerge,
	activate_workflow: Zap,
};

// KPI tile tones
const TONES = {
	primary: 'bg-primary-50 text-primary-600 dark:bg-primary-400/10 dark:text-primary-400',
	emerald: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400',
	rose: 'bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400',
	blue: 'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400',
} as const;

const DashboardPage = () => {
	const { setHeaderLeft } = useOutletContext<OutletContextType>();
	const navigate = useNavigate();
	const { userData } = useAuth();
	const { workspaces: apiWorkspaces, activeWorkspaceId } = useWorkspaceContext();
	const { activeWorkspaceId: fallbackWorkspaceId } = useWorkflowShellStore();

	const currentWorkspaceId = activeWorkspaceId || fallbackWorkspaceId;

	const { data: dashboard, isLoading } = useDashboard(currentWorkspaceId);
	const summary = dashboard?.summary;

	// ─── Monitoring data ──────────────────────────────────────────────────────
	const runsToday = summary?.total_executions_today ?? 0;
	const runningNow = summary?.running_executions ?? 0;
	const successRate = summary?.success_rate ?? 0;
	const avgMs = summary?.avg_duration_ms ?? 0;
	const failures = dashboard?.recent_failures ?? [];
	const failedCount =
		dashboard?.executions_by_status?.find((s) => s.status === 'failed')?.count ??
		failures.length;
	const recentRuns = dashboard?.recent_executions ?? [];
	const byDay = dashboard?.executions_by_day ?? [];
	const trend = buildSpark(byDay.map((d) => d.total));
	const peakDay = Math.max(0, ...byDay.map((d) => d.total));

	const kpis = [
		{
			label: 'Runs (today)',
			value: runsToday.toLocaleString(),
			sub: runningNow > 0 ? `${runningNow} running now` : 'No active runs',
			icon: Activity,
			tone: TONES.primary,
		},
		{
			label: 'Success rate',
			value: `${successRate.toFixed(successRate % 1 === 0 ? 0 : 1)}%`,
			sub: 'Across recent runs',
			icon: CheckCircle2,
			tone: TONES.emerald,
		},
		{
			label: 'Failed',
			value: failedCount.toLocaleString(),
			sub: failedCount > 0 ? 'Needs attention' : 'All clear',
			icon: AlertTriangle,
			tone: TONES.rose,
		},
		{
			label: 'Avg run time',
			value: formatDuration(avgMs),
			sub: 'Per execution',
			icon: Timer,
			tone: TONES.blue,
		},
	];

	// ─── Onboarding (from the authenticated user) ──────────────────────────────
	const onboarding = userData?.onboarding;
	const [isOnboardingDismissed, setIsOnboardingDismissed] = useState(false);
	const showOnboarding =
		!!onboarding && !onboarding.is_complete && !onboarding.is_dismissed && !isOnboardingDismissed;
	const nextOnboardingStep = onboarding?.steps.find((item) => !item.done);

	const handleOnboardingAction = (key: TOnboardingStepKey) => {
		switch (key) {
			case 'verify_email':
				navigate('/verify-email');
				break;
			case 'complete_profile':
				navigate('/onboarding');
				break;
			case 'create_workspace':
				navigate('/onboarding/create-workspace');
				break;
			case 'add_credential':
				navigate('/integrations?connect=true');
				break;
			case 'create_workflow':
				navigate('/workflows?create=true');
				break;
			case 'activate_workflow':
				navigate('/workflows');
				break;
		}
	};

	// ─── Banner identity ───────────────────────────────────────────────────────
	const colorList = [
		'bg-primary-400',
		'bg-emerald-600',
		'bg-fuchsia-600',
		'bg-amber-600',
		'bg-rose-500',
		'bg-blue-600',
	];
	const workspaces = apiWorkspaces.map((ws, index) => ({
		...ws,
		color: colorList[index % colorList.length],
	}));
	const activeWorkspace = workspaces.find((w) => w.id === activeWorkspaceId) || workspaces[0];
	const userName = userData?.firstName || userData?.name?.split(' ')[0] || 'there';

	useEffect(() => {
		setHeaderLeft(<Breadcrumb list={[{ ...pages.app.subPages.dashboard }]} />);
		return () => setHeaderLeft(undefined);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const shortcuts = [
		{
			label: 'New Workflow',
			description: 'Build a new automation',
			icon: Plus,
			onClick: () => navigate(pages.editor.subPages.addWorkflow.to),
		},
		{
			label: 'Browse Templates',
			description: 'Start from a pre-built flow',
			icon: FileText,
			onClick: () => navigate(pages.app.subPages.templates.to),
		},
		{
			label: 'View Run History',
			description: 'See all past executions',
			icon: History,
			onClick: () => navigate(pages.app.subPages.history.to),
		},
	];

	return (
		<Container className='relative overflow-x-hidden overflow-y-auto !bg-bg-main !px-0 !pt-0 font-sans dark:!bg-bg-main'>
			<div className='pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(var(--color-border-main)_1.5px,transparent_1.5px)] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] [background-size:24px_24px] opacity-70' />

			<div className='mx-auto w-full max-w-7xl space-y-6 p-6 md:p-8'>
				{/* ─── Welcome banner ─────────────────────────────────────────── */}
				<motion.div
					initial={{ opacity: 0, y: -15 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.4 }}
					className='dark:border-zinc-800 relative overflow-hidden rounded-3xl border border-primary-500/20 bg-gradient-to-r from-primary-400 via-primary-500 to-primary-600 p-6 shadow-xl shadow-primary-500/20 md:p-8 dark:from-[#111315] dark:via-[#141619] dark:to-[#0d0e10] dark:border-zinc-800/80'>
					<div className='pointer-events-none absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.03)_1px,transparent_1px)] [background-size:16px_16px] opacity-60' />

					<div className='relative flex flex-col justify-between gap-6 md:flex-row md:items-center'>
						<div className='flex-1 space-y-4'>
							<h1 className='flex flex-wrap items-center gap-2 text-2xl font-black tracking-tight text-slate-900 md:text-3xl dark:text-white'>
								Welcome back,{' '}
								<span className='text-slate-955 dark:bg-gradient-to-r dark:from-primary-400 dark:to-primary-300 dark:bg-clip-text dark:text-transparent'>
									{userName}
								</span>
								<motion.span
									className='inline-block origin-[70%_70%] cursor-default text-2xl select-none md:text-3xl'
									animate={{ rotate: [0, 14, -8, 14, -4, 10, 0] }}
									transition={{
										duration: 2.5,
										ease: 'easeInOut',
										repeat: Infinity,
										repeatDelay: 3,
									}}>
									👋
								</motion.span>
							</h1>

							<p className='max-w-xl text-xs leading-relaxed font-semibold text-slate-700 md:text-sm dark:text-zinc-400'>
								<span className='font-bold text-[#101828] dark:text-white'>
									{runsToday.toLocaleString()} run{runsToday === 1 ? '' : 's'}
								</span>{' '}
								today at{' '}
								<span className='font-bold text-[#101828] dark:text-white'>
									{successRate.toFixed(successRate % 1 === 0 ? 0 : 1)}% success
								</span>
								{failedCount > 0 ? (
									<>
										{' '}
										·{' '}
										<span className='font-bold text-rose-700 dark:text-rose-300'>
											{failedCount} need{failedCount === 1 ? 's' : ''} attention
										</span>
									</>
								) : (
									<>
										{' '}
										· <span className='font-bold text-emerald-700 dark:text-emerald-300'>all healthy</span>
									</>
								)}
							</p>

							<div className='flex flex-wrap items-center gap-2.5 pt-1'>
								{/* Active Workspace */}
								<div className='flex items-center gap-1.5 rounded-full border border-white/20 bg-white/40 px-3 py-1 text-[11px] font-bold text-slate-900 shadow-xs dark:border-white/10 dark:bg-slate-900/60 dark:text-white/95'>
									<span className='text-[10px] font-extrabold tracking-wider text-slate-800/80 uppercase dark:text-zinc-400'>
										Workspace
									</span>
									<span className='text-slate-900/40 dark:text-zinc-500'>|</span>
									{activeWorkspace?.color && (
										<div
											className={`h-2 w-2 rounded-full ${activeWorkspace.color} ring-2 ring-white/10`}
										/>
									)}
									<span className='font-bold'>{activeWorkspace?.name || 'Workspace'}</span>
								</div>

								{/* Plan Badge */}
								<div className='flex items-center gap-1 rounded-full border border-purple-100 bg-white px-3 py-1 text-[11px] font-bold text-purple-700 shadow-xs dark:border-purple-500/30 dark:bg-purple-950/45 dark:text-purple-300'>
									<Crown size={11} className='text-purple-600 dark:text-purple-400' />
									<span>Pro Account</span>
								</div>

								{/* Status Badge */}
								<div
									className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-bold ${
										failedCount > 0
											? 'border-white/20 bg-white/40 text-rose-800 dark:border-rose-500/30 dark:bg-[#2a0e12]/85 dark:text-rose-300'
											: 'border-white/20 bg-white/40 text-emerald-800 dark:border-emerald-500/30 dark:bg-[#0e2a27]/85 dark:text-emerald-300'
									}`}>
									<span className='relative flex h-1.5 w-1.5'>
										<span
											className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-75 ${failedCount > 0 ? 'bg-rose-500 dark:bg-rose-400' : 'bg-emerald-500 dark:bg-emerald-400'}`}
										/>
										<span
											className={`relative inline-flex h-1.5 w-1.5 rounded-full ${failedCount > 0 ? 'bg-rose-600 dark:bg-rose-500' : 'bg-emerald-600 dark:bg-emerald-500'}`}
										/>
									</span>
									<span>{failedCount > 0 ? 'Attention needed' : 'Systems nominal'}</span>
								</div>
							</div>
						</div>

						{/* Center-Right: Floating Cards Illustration */}
						<div className='relative mr-4 hidden h-28 w-60 items-center justify-center select-none lg:flex'>
							{/* Left Floating Badge (Purple Lightning) */}
							<motion.div
								initial={{ y: 5, rotate: 12 }}
								animate={{ y: [-4, 4, -4] }}
								transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
								className='absolute top-0 left-2 z-20 flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary-400 to-primary-400 text-primary-950 shadow-lg shadow-primary-500/30'
								style={{
									transform: 'perspective(800px) rotateY(-20deg) rotateX(15deg)',
								}}>
								<Zap size={14} fill='currentColor' />
							</motion.div>

							{/* Main Analytics Card */}
							<div
								className='relative z-10 flex h-24 w-44 flex-col justify-between rounded-2xl border border-white/20 bg-white/95 p-3 shadow-2xl shadow-primary-500/40 dark:bg-zinc-900/90'
								style={{
									transform:
										'perspective(800px) rotateY(-20deg) rotateX(15deg) rotateZ(-2deg)',
								}}>
								<div className='flex items-center justify-between'>
									<div className='flex gap-1'>
										<div className='h-1.5 w-6 rounded-full bg-primary-200 dark:bg-primary-900' />
										<div className='h-1.5 w-3 rounded-full bg-slate-200 dark:bg-zinc-800' />
									</div>
									<div className='dark:bg-zinc-800 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-slate-100'>
										<div className='h-1 w-1 rounded-full bg-slate-400' />
									</div>
								</div>
								{/* SVG Line chart inside */}
								<div className='mt-2 flex-1'>
									<svg
										className='h-10 w-full overflow-visible'
										viewBox='0 0 100 30'
										preserveAspectRatio='none'>
										<defs>
											<linearGradient
												id='primary-glow-banner'
												x1='0'
												y1='0'
												x2='0'
												y2='1'>
												<stop
													offset='0%'
													stopColor='#C4EE3D'
													stopOpacity='0.4'
												/>
												<stop
													offset='100%'
													stopColor='#C4EE3D'
													stopOpacity='0.0'
												/>
											</linearGradient>
										</defs>
										<path
											d='M0,25 Q15,5 35,18 T75,8 T100,5'
											fill='none'
											stroke='#C4EE3D'
											strokeWidth='2.5'
											strokeLinecap='round'
										/>
										<path
											d='M0,25 Q15,5 35,18 T75,8 T100,5 L100,30 L0,30 Z'
											fill='url(#primary-glow-banner)'
										/>
										<circle cx='100' cy='5' r='2.5' fill='#C4EE3D' />
									</svg>
								</div>
							</div>

							{/* Right Floating Badge (Green Robot) */}
							<motion.div
								initial={{ y: -5, rotate: -8 }}
								animate={{ y: [4, -4, 4] }}
								transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
								className='absolute right-0 bottom-1 z-20 flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary-400 to-primary-500 text-primary-950 shadow-lg shadow-primary-500/30'
								style={{
									transform: 'perspective(800px) rotateY(-20deg) rotateX(15deg)',
								}}>
								<Bot size={14} />
							</motion.div>
						</div>

						<div className='z-10 shrink-0 self-start md:self-center'>
							<motion.button
								whileHover={{
									scale: 1.02,
									boxShadow: '0 0 20px rgba(15, 23, 42, 0.15)',
								}}
								whileTap={{ scale: 0.98 }}
								onClick={() => navigate(pages.editor.subPages.addWorkflow.to)}
								className='flex h-10.5 cursor-pointer items-center gap-2 rounded-xl bg-[#101828] px-6 text-xs font-bold text-white shadow-md shadow-slate-950/15 transition-all hover:bg-[#1e293b] active:scale-95 dark:bg-gradient-to-r dark:from-primary-400 dark:to-primary-400 dark:text-primary-950 dark:shadow-primary-500/10 dark:hover:brightness-110'>
								<Plus size={14} strokeWidth={3} />
								<span>New Workflow</span>
							</motion.button>
						</div>
					</div>
				</motion.div>

				{/* ─── Onboarding checklist ───────────────────────────────────── */}
				<AnimatePresence>
					{showOnboarding && onboarding && (
						<motion.div
							initial={{ opacity: 0, y: -10 }}
							animate={{ opacity: 1, y: 0 }}
							exit={{ opacity: 0, y: -10, height: 0 }}
							transition={{ duration: 0.3 }}
							className='overflow-hidden rounded-3xl border border-border-main bg-bg-card p-5 shadow-sm'>
							<div className='flex flex-wrap items-start justify-between gap-4'>
								<div>
									<p className='text-[10px] font-black tracking-[0.18em] text-primary-600 uppercase dark:text-primary-400'>
										Account setup
									</p>
									<h2 className='mt-1 text-sm font-black text-slate-950 dark:text-white'>
										{onboarding.progress} of {onboarding.total} milestones complete
									</h2>
								</div>
								<button
									type='button'
									onClick={() => setIsOnboardingDismissed(true)}
									className='flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-400 transition hover:bg-slate-50 hover:text-slate-650 dark:hover:bg-zinc-800 dark:hover:text-zinc-200'>
									<X className='h-3.5 w-3.5' />
									Dismiss
								</button>
							</div>

							<div className='mt-3 h-1.5 overflow-hidden rounded-full bg-primary-100/50 dark:bg-primary-900/20'>
								<div
									className='h-full rounded-full bg-gradient-to-r from-primary-400 to-primary-400 transition-all duration-500'
									style={{
										width: `${Math.min(100, (onboarding.progress / Math.max(onboarding.total, 1)) * 100)}%`,
									}}
								/>
							</div>

							<div className='mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-3'>
								{onboarding.steps.map((item) => {
									const isNext = nextOnboardingStep?.key === item.key;
									const IconComp = onboardingIcons[item.key] || Circle;
									const cardBorder =
										isNext && !item.done
											? 'border-primary-400 shadow-sm'
											: 'border-border-main';
									const iconStyle = item.done
										? 'bg-primary-100/50 text-primary-600 dark:bg-primary-950/20 dark:text-primary-400'
										: isNext
											? 'bg-primary-100/60 text-primary-600 dark:bg-primary-950/40 dark:text-primary-400'
											: 'bg-slate-50 text-slate-400 dark:bg-zinc-900 dark:text-zinc-600';
									return (
										<button
											key={item.key}
											type='button'
											onClick={() => handleOnboardingAction(item.key)}
											className={`flex items-center justify-between gap-3 rounded-2xl border bg-bg-card p-4 text-left transition-all duration-200 hover:border-primary-400 hover:shadow-md ${cardBorder}`}>
											<div className='flex min-w-0 flex-1 items-center gap-3.5'>
												<div
													className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${iconStyle}`}>
													<IconComp size={16} />
												</div>
												<div className='min-w-0 flex-1'>
													<span
														className={`block truncate text-xs font-black ${item.done ? 'text-slate-500 dark:text-zinc-400' : 'text-slate-805 dark:text-zinc-100'}`}>
														{item.label}
													</span>
													<span className='mt-0.5 block truncate text-[10px] leading-relaxed font-semibold text-slate-400 dark:text-zinc-500'>
														{item.description}
													</span>
												</div>
											</div>
											<div className='shrink-0 pl-1'>
												{item.done ? (
													<div className='flex h-4.5 w-4.5 items-center justify-center rounded-full bg-primary-400 text-primary-950'>
														<Check className='h-3 w-3 stroke-[3]' />
													</div>
												) : (
													<Circle
														className={`h-4.5 w-4.5 shrink-0 ${isNext ? 'text-primary-500' : 'text-slate-300 dark:text-zinc-600'}`}
													/>
												)}
											</div>
										</button>
									);
								})}
							</div>
						</motion.div>
					)}
				</AnimatePresence>

				{/* ─── KPI row ─────────────────────────────────────────────────── */}
				<section className='grid grid-cols-2 gap-4 lg:grid-cols-4'>
					{kpis.map((kpi, i) => {
						const IconComponent = kpi.icon;
						return (
							<motion.div
								key={kpi.label}
								initial={{ opacity: 0, y: 16 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ delay: i * 0.06, duration: 0.3 }}
								className='relative flex flex-col justify-between overflow-hidden rounded-3xl border border-border-main bg-bg-card p-5 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md'>
								<div className='flex items-center justify-between'>
									<span className='text-[10px] font-black tracking-wider text-slate-400 uppercase dark:text-zinc-500'>
										{kpi.label}
									</span>
									<div
										className={`flex h-9 w-9 items-center justify-center rounded-xl ${kpi.tone}`}>
										<IconComponent size={16} />
									</div>
								</div>
								<div className='mt-4'>
									<div className='text-3xl font-black tracking-tight text-slate-900 dark:text-white'>
										{isLoading ? '—' : kpi.value}
									</div>
									<div className='mt-0.5 text-[11px] font-semibold text-slate-400 dark:text-zinc-500'>
										{kpi.sub}
									</div>
								</div>
							</motion.div>
						);
					})}
				</section>

				{/* ─── Main monitoring grid ───────────────────────────────────── */}
				<div className='grid grid-cols-1 gap-6 lg:grid-cols-3'>
					{/* Left: needs attention + recent runs */}
					<div className='space-y-6 lg:col-span-2'>
						{/* Needs attention */}
						<div className='overflow-hidden rounded-3xl border border-border-main bg-bg-card shadow-sm'>
							<div className='flex items-center justify-between border-b border-border-main px-5 py-4.5'>
								<span className='flex items-center gap-2 text-xs font-black tracking-widest text-text-main uppercase'>
									<AlertTriangle size={13} className='text-rose-500' />
									Needs attention
								</span>
								{failures.length > 0 && (
									<span className='rounded-full bg-rose-500/10 px-2 py-0.5 text-[10px] font-black text-rose-600 dark:text-rose-400'>
										{failures.length}
									</span>
								)}
							</div>
							{failures.length === 0 ? (
								<div className='flex flex-col items-center gap-2 px-5 py-9 text-center'>
									<div className='flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'>
										<ShieldCheck size={20} />
									</div>
									<p className='text-xs font-bold text-text-main'>No failures — all clear</p>
									<p className='text-[11px] font-semibold text-text-muted'>
										Failed runs from your workflows will show up here.
									</p>
								</div>
							) : (
								<div className='divide-y divide-border-main'>
									{failures.slice(0, 4).map((f) => (
										<div
											key={f.id}
											className='flex items-center justify-between gap-3 px-5 py-3.5'>
											<div className='flex min-w-0 items-center gap-3'>
												<div className='flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-rose-500/10 text-rose-500'>
													<AlertTriangle size={15} />
												</div>
												<div className='min-w-0'>
													<p className='truncate text-xs font-bold text-text-main'>
														{f.workflow_name}
													</p>
													<p className='truncate text-[10px] font-semibold text-rose-500/90'>
														{f.error_message}
													</p>
												</div>
											</div>
											<div className='flex shrink-0 items-center gap-3'>
												<span className='hidden text-[10px] font-semibold text-text-muted sm:block'>
													{formatRelativeTime(f.failed_at)}
												</span>
												<button
													onClick={() =>
														navigate(
															`${pages.editor.subPages.editWorkflow.to}/${currentWorkspaceId}/${f.workflow_id}`,
														)
													}
													className='flex h-7.5 items-center gap-1 rounded-lg border border-rose-500/25 bg-rose-500/5 px-2.5 text-[10px] font-black text-rose-600 transition hover:bg-rose-500 hover:text-white dark:text-rose-400'>
													Fix <ArrowUpRight size={11} />
												</button>
											</div>
										</div>
									))}
								</div>
							)}
						</div>

						{/* Recent runs */}
						<div className='overflow-hidden rounded-3xl border border-border-main bg-bg-card shadow-sm'>
							<div className='flex items-center justify-between border-b border-border-main px-5 py-4.5'>
								<span className='flex items-center gap-2 text-xs font-black tracking-widest text-text-main uppercase'>
									<Activity size={13} className='text-primary-500' />
									Recent runs
								</span>
								<button
									onClick={() => navigate(pages.app.subPages.history.to)}
									className='flex cursor-pointer items-center gap-1 text-[11px] font-bold text-slate-500 transition-colors hover:text-slate-800 dark:text-zinc-400 dark:hover:text-white'>
									View all <ArrowRight size={11} />
								</button>
							</div>
							{isLoading && recentRuns.length === 0 ? (
								<div className='px-5 py-10 text-center text-xs font-semibold text-text-muted'>
									Loading recent runs…
								</div>
							) : recentRuns.length === 0 ? (
								<div className='flex flex-col items-center gap-3 px-5 py-10 text-center'>
									<div className='flex h-11 w-11 items-center justify-center rounded-2xl bg-primary-100/50 text-primary-600 dark:bg-primary-950/40 dark:text-primary-400'>
										<Inbox size={20} />
									</div>
									<p className='text-xs font-bold text-text-main'>No runs yet</p>
									<button
										onClick={() => navigate(pages.editor.subPages.addWorkflow.to)}
										className='mt-1 flex items-center gap-1.5 rounded-xl bg-primary-400 px-3.5 py-2 text-[11px] font-black text-primary-950 transition hover:brightness-110'>
										<Plus size={12} strokeWidth={3} /> Create Workflow
									</button>
								</div>
							) : (
								<div className='divide-y divide-border-main'>
									{recentRuns.slice(0, 6).map((run) => {
										const badge =
											STATUS_BADGE_COLORS[run.status as TExecutionStatus] ??
											STATUS_BADGE_COLORS.queued;
										return (
											<div
												key={run.id}
												onClick={() =>
													navigate(
														`${pages.editor.subPages.editWorkflow.to}/${currentWorkspaceId}/${run.workflow_id}`,
													)
												}
												className='group flex cursor-pointer items-center justify-between gap-3 px-5 py-3.5 transition-colors hover:bg-slate-50/50 dark:hover:bg-zinc-800/15'>
												<div className='flex min-w-0 items-center gap-3'>
													<div className='flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-primary-500/15 bg-primary-400/10 text-primary-500 dark:text-primary-400'>
														<GitMerge size={15} />
													</div>
													<div className='min-w-0'>
														<p className='truncate text-xs font-bold text-text-main transition-colors group-hover:text-primary-500 dark:group-hover:text-primary-400'>
															{run.workflow_name}
														</p>
														<p className='mt-0.5 flex items-center gap-1.5 text-[10px] font-semibold text-text-muted capitalize'>
															<Clock size={10} /> {formatRelativeTime(run.created_at)}
															<span className='text-slate-300 dark:text-zinc-700'>·</span>
															{run.trigger_type}
														</p>
													</div>
												</div>
												<div className='flex shrink-0 items-center gap-3'>
													{typeof run.duration_ms === 'number' && (
														<span className='hidden text-[10px] font-bold text-text-muted sm:block'>
															{formatDuration(run.duration_ms)}
														</span>
													)}
													<span
														className={`rounded-full px-2.5 py-0.5 text-[9px] font-black tracking-wider uppercase ${badge.bg} ${badge.text}`}>
														{run.status}
													</span>
												</div>
											</div>
										);
									})}
								</div>
							)}
						</div>
					</div>

					{/* Right: activity trend + shortcuts */}
					<div className='space-y-6'>
						{/* Activity trend */}
						<div className='overflow-hidden rounded-3xl border border-border-main bg-bg-card p-5 shadow-sm'>
							<div className='flex items-center justify-between'>
								<span className='text-xs font-black tracking-widest text-text-main uppercase'>
									Run activity
								</span>
								<span className='text-[10px] font-semibold text-text-muted'>
									peak {peakDay}
								</span>
							</div>
							<div className='mt-4 h-24 w-full'>
								{trend.line ? (
									<svg
										viewBox='0 0 100 30'
										preserveAspectRatio='none'
										className='h-full w-full overflow-visible'>
										<defs>
											<linearGradient id='dash-trend' x1='0' y1='0' x2='0' y2='1'>
												<stop offset='0%' stopColor='#CFF54A' stopOpacity='0.28' />
												<stop offset='100%' stopColor='#CFF54A' stopOpacity='0' />
											</linearGradient>
										</defs>
										<path d={trend.area} fill='url(#dash-trend)' />
										<path
											d={trend.line}
											fill='none'
											stroke='#CFF54A'
											strokeWidth='2'
											strokeLinecap='round'
											strokeLinejoin='round'
										/>
									</svg>
								) : (
									<div className='flex h-full items-center justify-center text-[11px] font-semibold text-text-muted'>
										No run data yet
									</div>
								)}
							</div>
							<div className='mt-3 flex items-center justify-between border-t border-border-main pt-3 text-[11px] font-bold'>
								<span className='text-text-muted'>This week</span>
								<span className='text-text-main'>
									{(summary?.total_executions_week ?? 0).toLocaleString()} runs
								</span>
							</div>
						</div>

						{/* Shortcuts */}
						<div className='overflow-hidden rounded-3xl border border-border-main bg-bg-card shadow-sm'>
							<div className='border-b border-border-main px-5 py-4.5'>
								<span className='text-xs font-black tracking-widest text-text-main uppercase'>
									Quick actions
								</span>
							</div>
							<div className='space-y-2.5 p-4'>
								{shortcuts.map((action) => {
									const ActionIcon = action.icon;
									return (
										<motion.button
											whileHover={{ scale: 1.015 }}
											whileTap={{ scale: 0.985 }}
											key={action.label}
											onClick={action.onClick}
											className='group flex w-full cursor-pointer items-center gap-3.5 rounded-2xl border border-border-main bg-bg-card p-3.5 text-left transition-all hover:border-primary-400 hover:bg-primary-50 dark:hover:border-primary-400/30 dark:hover:bg-primary-400/5'>
											<div className='flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-primary-100 bg-primary-50 text-primary-500 transition-transform group-hover:rotate-3 dark:border-primary-400/20 dark:bg-primary-400/10 dark:text-primary-400'>
												<ActionIcon size={15} />
											</div>
											<div className='min-w-0 flex-1'>
												<p className='text-xs font-bold text-slate-900 transition-colors group-hover:text-primary-500 dark:text-white dark:group-hover:text-primary-400'>
													{action.label}
												</p>
												<p className='mt-0.5 text-[10px] font-semibold text-slate-400 dark:text-zinc-500'>
													{action.description}
												</p>
											</div>
											<ArrowRight
												size={13}
												className='ml-auto text-slate-400 opacity-80 transition-all group-hover:translate-x-1 group-hover:text-primary-500'
											/>
										</motion.button>
									);
								})}
							</div>
						</div>
					</div>
				</div>
			</div>
		</Container>
	);
};

export default DashboardPage;
