import { Link, useSearchParams } from 'react-router';
import {
	AlertTriangle,
	ArrowRight,
	Check,
	CheckCircle2,
	Crown,
	ExternalLink,
	Minus,
	ShieldCheck,
	X,
	Zap,
	Coins,
	GitBranch,
	Users,
	Clock,
	Timer,
	Database,
	Calendar,
	XCircle,
	RotateCcw,
	CreditCard,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useWorkspaceContext } from '@/context/workspace';
import {
	useSubscription,
	useCancelSubscription,
	useResumeSubscription,
} from '@/api/modules/plans';
import { useCreditBalance } from '@/api/modules/credits';
import { useBillingPortal } from '@/api/modules/billing';
import pages from '@/Routes/pages';
import type { TPlanFeatures, TPlanLimits, TSubscriptionStatus } from '@/types/billing.type';
import UsagePage from '../Usage/Usage.page';
import BillingOverviewPage from '../Billing/index.page';

// ── helpers ─────────────────────────────────────────────────────────────────

const statusConfig: Record<TSubscriptionStatus, { label: string; bg: string; text: string }> = {
	active: {
		label: 'Active',
		bg: 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border-emerald-100/50 dark:border-emerald-900/30',
		text: 'text-emerald-700 dark:text-emerald-400',
	},
	trialing: {
		label: 'Trial',
		bg: 'bg-sky-50 dark:bg-sky-950/20 text-sky-700 dark:text-sky-400 border-sky-100/50 dark:border-sky-900/30',
		text: 'text-sky-700 dark:text-sky-400',
	},
	past_due: {
		label: 'Past Due',
		bg: 'bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 border-amber-100/50 dark:border-amber-900/30',
		text: 'text-amber-700 dark:text-amber-400',
	},
	canceled: {
		label: 'Canceled',
		bg: 'bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400 border-red-100/50 dark:border-red-900/30',
		text: 'text-red-700 dark:text-red-400',
	},
	expired: {
		label: 'Expired',
		bg: 'bg-zinc-100 dark:bg-zinc-800/20 text-zinc-600 dark:text-zinc-400 border-zinc-200/50 dark:border-zinc-800/30',
		text: 'text-zinc-600 dark:text-zinc-400',
	},
};

function fmt(n: number | null | undefined, unit = ''): string {
	if (n === null || n === undefined || n === -1) return 'Unlimited';
	return `${n.toLocaleString()}${unit ? ` ${unit}` : ''}`;
}

function fmtPrice(cents: number): string {
	if (cents === 0) return 'Free';
	return `$${(cents / 100).toFixed(0)}/mo`;
}

const FEATURE_LABELS: Record<keyof TPlanFeatures, string> = {
	webhook_triggers: 'Webhook triggers',
	schedule_triggers: 'Schedule triggers',
	import_export: 'Import & export',
	custom_variables: 'Custom variables',
	ai_generation: 'AI generation',
	ai_autofix: 'AI autofix',
	deterministic_replay: 'Deterministic replay',
	execution_debugger: 'Execution debugger',
	priority_execution: 'Priority execution',
	environments: 'Environments',
	approval_workflows: 'Approval workflows',
	connector_metrics: 'Connector metrics',
	overage_protection: 'Overage protection',
	audit_logs: 'Audit logs',
	sso_saml: 'SSO / SAML',
	annual_rollover: 'Annual credit rollover',
	credit_packs: 'Credit pack top-ups',
};

// ── motion animations ─────────────────────────────────────────────────────────

const containerVariants = {
	hidden: { opacity: 0 },
	show: {
		opacity: 1,
		transition: {
			staggerChildren: 0.05
		}
	}
} as const;

const itemVariants = {
	hidden: { opacity: 0, y: 10 },
	show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 100, damping: 15 } }
} as const;

// ── component ────────────────────────────────────────────────────────────────

const PlanPage = () => {
	const { activeWorkspaceId, role } = useWorkspaceContext();
	const { data: subscription, isLoading: subLoading } = useSubscription(activeWorkspaceId);
	const { data: balance, isLoading: balanceLoading } = useCreditBalance(activeWorkspaceId);
	const portal = useBillingPortal(activeWorkspaceId);
	const cancelSubscription = useCancelSubscription(activeWorkspaceId);
	const resumeSubscription = useResumeSubscription(activeWorkspaceId);

	const canManage = role === 'admin' || role === 'owner';

	if (!canManage) {
		return (
			<div className='flex min-h-[50vh] flex-col items-center justify-center gap-4 text-center'>
				<ShieldCheck size={40} className='text-zinc-300 dark:text-zinc-600' />
				<h2 className='text-xl font-black text-zinc-950 dark:text-zinc-50'>
					Access Restricted
				</h2>
				<p className='max-w-sm text-sm text-zinc-500 dark:text-zinc-400'>
					Only workspace admins and owners can view plan settings.
				</p>
			</div>
		);
	}

	const [searchParams, setSearchParams] = useSearchParams();
	const activeTab = (searchParams.get('tab') as 'overview' | 'usage' | 'billing') || 'overview';

	const setActiveTab = (tab: 'overview' | 'usage' | 'billing') => {
		setSearchParams({ tab });
	};

	const plan = subscription?.plan;
	const status = subscription?.status ?? 'active';
	const statusCfg = statusConfig[status] || statusConfig.active;
	const limits: TPlanLimits | undefined = plan?.limits;
	const features: TPlanFeatures | undefined = plan?.features;
	const isLifetime = subscription?.is_lifetime ?? false;

	const used = balance?.credits?.used ?? 0;
	const limit = balance?.credits?.limit ?? 0;
	const creditsUsedPct = limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 0;

	const periodEnd = subscription?.current_period_end;
	const trialEnd = subscription?.trial_ends_at;
	const canceledAt = subscription?.canceled_at;
	const billingInterval = subscription?.billing_interval;

	const periodEndInFuture = periodEnd ? new Date(periodEnd).getTime() > Date.now() : false;
	const isPaidPlan = !!plan && plan.slug !== 'free';
	// Cancel is available on a usable, paid, non-lifetime plan that isn't already canceled.
	const canCancel =
		isPaidPlan && !isLifetime && (status === 'active' || status === 'trialing');
	// Resume is available while a canceled subscription is still within its paid period.
	const canResume = status === 'canceled' && periodEndInFuture;

	const handleCancel = () => {
		if (
			window.confirm(
				'Cancel your subscription? You will keep access until the end of the current billing period.',
			)
		) {
			cancelSubscription.mutate();
		}
	};

	const handleResume = () => resumeSubscription.mutate();

	const isLoading = subLoading || balanceLoading;

	const limitCards = [
		{
			title: 'Monthly Credits',
			value: fmt(limits?.credits_monthly),
			icon: Coins,
			iconBg: 'bg-amber-50/70 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400',
			link: pages.settings.subPages.usage.to,
			linkLabel: 'View usage',
			isCredits: true,
		},
		{
			title: 'Active Workflows',
			value: fmt(limits?.active_workflows),
			icon: GitBranch,
			iconBg: 'bg-primary-50/70 text-primary-600 dark:bg-primary-950/30 dark:text-primary-400',
			link: pages.app.subPages.workflows.to,
			linkLabel: 'View workflows',
		},
		{
			title: 'Team Members',
			value: fmt(limits?.members),
			icon: Users,
			iconBg: 'bg-emerald-50/70 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400',
			link: pages.settings.subPages.members.to,
			linkLabel: 'Manage members',
		},
		{
			title: 'Min Schedule Interval',
			value: limits?.min_schedule_interval_minutes == null || limits?.min_schedule_interval_minutes === -1
				? 'Unlimited'
				: `${limits.min_schedule_interval_minutes} min`,
			icon: Clock,
			iconBg: 'bg-blue-50/70 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400',
		},
		{
			title: 'Max Execution Time',
			value: fmt(limits?.max_execution_time_seconds, 'sec'),
			icon: Timer,
			iconBg: 'bg-primary-50/70 text-primary-600 dark:bg-primary-950/30 dark:text-primary-400',
		},
		{
			title: 'Log Retention',
			value: fmt(limits?.execution_log_retention_days, 'days'),
			icon: Database,
			iconBg: 'bg-primary-50/70 text-primary-600 dark:bg-primary-950/30 dark:text-primary-400',
		},
	];

	let subtitle = 'Your current plan, limits, and included features.';
	if (activeTab === 'usage') {
		subtitle = 'Detailed credit consumption and usage trends for this billing period.';
	} else if (activeTab === 'billing') {
		subtitle = 'Workspace credit packs, transaction logs, and billing settings.';
	}

	return (
		<motion.div
			variants={containerVariants}
			initial="hidden"
			animate="show"
			className='space-y-8 text-zinc-950 dark:text-zinc-50'
		>
			{/* Status banners */}
			{status === 'past_due' && (
				<motion.div
					variants={itemVariants}
					className='flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-800/40 dark:bg-amber-950/20 backdrop-blur-md'
				>
					<AlertTriangle size={18} className='shrink-0 text-amber-600 dark:text-amber-400' />
					<p className='text-sm font-semibold text-amber-700 dark:text-amber-300'>
						Your payment is past due. Update your payment method to keep your workspace active.
					</p>
					<motion.button
						whileHover={{ scale: 1.02 }}
						whileTap={{ scale: 0.98 }}
						type='button'
						onClick={() => portal.mutate()}
						className='ml-auto shrink-0 rounded-lg bg-amber-500 hover:bg-amber-600 px-3 py-1.5 text-xs font-bold text-white transition-all shadow-md shadow-amber-500/10'
					>
						Fix payment
					</motion.button>
				</motion.div>
			)}
			{(status === 'expired' || (status === 'canceled' && !periodEndInFuture)) && (
				<motion.div
					variants={itemVariants}
					className='flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 dark:border-red-800/40 dark:bg-red-950/20 backdrop-blur-md'
				>
					<AlertTriangle size={18} className='shrink-0 text-red-600 dark:text-red-400' />
					<p className='text-sm font-semibold text-red-700 dark:text-red-300'>
						Your subscription has ended. Upgrade to re-enable all features.
					</p>
					<motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="ml-auto shrink-0">
						<Link
							to={pages.settings.subPages.plan.subPages.upgrade.to}
							className='rounded-lg bg-red-500 hover:bg-red-600 px-3 py-1.5 text-xs font-bold text-white transition-all shadow-md shadow-red-500/10'
						>
							Upgrade now
						</Link>
					</motion.div>
				</motion.div>
			)}
			{canResume && (
				<motion.div
					variants={itemVariants}
					className='flex flex-wrap items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-800/40 dark:bg-amber-950/20 backdrop-blur-md'
				>
					<AlertTriangle size={18} className='shrink-0 text-amber-600 dark:text-amber-400' />
					<p className='text-sm font-semibold text-amber-700 dark:text-amber-300'>
						Your subscription is scheduled to cancel
						{periodEnd
							? ` on ${new Date(periodEnd).toLocaleDateString(undefined, {
									month: 'short',
									day: 'numeric',
									year: 'numeric',
								})}`
							: ''}
						. Resume to keep your plan active.
					</p>
					<motion.button
						whileHover={{ scale: 1.02 }}
						whileTap={{ scale: 0.98 }}
						type='button'
						onClick={handleResume}
						disabled={resumeSubscription.isPending}
						className='ml-auto flex shrink-0 items-center gap-1.5 rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-bold text-white shadow-md shadow-amber-500/10 transition-all hover:bg-amber-600 disabled:opacity-60'
					>
						<RotateCcw size={13} />
						{resumeSubscription.isPending ? 'Resuming…' : 'Resume subscription'}
					</motion.button>
				</motion.div>
			)}

			{/* Header */}
			<motion.div variants={itemVariants} className='flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between'>
				<div>
					<div className="flex items-center gap-2.5">
						<h1 className='text-3xl font-black tracking-tight text-zinc-950 dark:text-zinc-50'>Plan</h1>
						<span className="rounded-full bg-primary-50 px-2.5 py-0.5 text-xs font-bold text-primary-600 dark:bg-primary-950/40 dark:text-primary-400 border border-primary-100/50 dark:border-primary-900/30">
							Settings
						</span>
					</div>
					<p className='mt-1 text-sm font-medium text-zinc-500 dark:text-zinc-400'>
						{subtitle}
					</p>
				</div>
				<div className='flex flex-wrap items-center gap-3'>
					{activeTab === 'overview' && (
						<>
							<motion.button
								whileHover={{ scale: 1.02, translateY: -1 }}
								whileTap={{ scale: 0.98 }}
								type='button'
								onClick={() => portal.mutate()}
								disabled={portal.isPending}
								className='flex h-10 items-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 text-sm font-bold text-zinc-700 shadow-sm transition hover:bg-zinc-50 disabled:opacity-60 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300 dark:hover:bg-zinc-900'
							>
								<ExternalLink size={14} />
								{portal.isPending ? 'Opening…' : 'Manage billing'}
							</motion.button>
							<motion.div
								whileHover={{ scale: 1.02, translateY: -1 }}
								whileTap={{ scale: 0.98 }}
							>
								<Link
									to={pages.settings.subPages.plan.subPages.upgrade.to}
									className='flex h-10 items-center gap-2 rounded-xl bg-gradient-to-r from-primary-400 to-primary-400 px-5 text-sm font-bold text-primary-950 shadow-md shadow-primary-500/15 hover:shadow-primary-500/25 transition-all duration-200 border border-primary-500/20'
								>
									<Zap size={14} className="fill-white/10" />
									Upgrade plan
								</Link>
							</motion.div>
							{canCancel && (
								<motion.button
									whileHover={{ scale: 1.02, translateY: -1 }}
									whileTap={{ scale: 0.98 }}
									type='button'
									onClick={handleCancel}
									disabled={cancelSubscription.isPending}
									className='flex h-10 items-center gap-2 rounded-xl border border-red-200 bg-white px-4 text-sm font-bold text-red-600 shadow-sm transition hover:bg-red-50 disabled:opacity-60 dark:border-red-900/40 dark:bg-zinc-950 dark:text-red-400 dark:hover:bg-red-950/20'
								>
									<XCircle size={14} />
									{cancelSubscription.isPending ? 'Canceling…' : 'Cancel plan'}
								</motion.button>
							)}
						</>
					)}
					{activeTab === 'usage' && (
						<>
							<motion.button
								whileHover={{ scale: 1.02, translateY: -1 }}
								whileTap={{ scale: 0.98 }}
								type='button'
								onClick={() => portal.mutate()}
								disabled={portal.isPending}
								className='flex h-10 items-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 text-sm font-bold text-zinc-700 shadow-sm transition hover:bg-zinc-50 disabled:opacity-60 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300 dark:hover:bg-zinc-900'
							>
								<ExternalLink size={14} />
								{portal.isPending ? 'Opening…' : 'Manage billing'}
							</motion.button>
							<motion.button
								whileHover={{ scale: 1.02, translateY: -1 }}
								whileTap={{ scale: 0.98 }}
								type='button'
								onClick={() => setActiveTab('billing')}
								className='flex h-10 items-center gap-2 rounded-xl bg-gradient-to-r from-primary-400 to-primary-400 px-5 text-sm font-bold text-primary-950 shadow-md shadow-primary-500/15 hover:shadow-primary-500/25 transition-all duration-200 border border-primary-500/20'
							>
								<CreditCard size={14} />
								<span>Buy credits</span>
							</motion.button>
						</>
					)}
					{activeTab === 'billing' && (
						<>
							<motion.button
								whileHover={{ scale: 1.02, translateY: -1 }}
								whileTap={{ scale: 0.98 }}
								type='button'
								onClick={() => portal.mutate()}
								disabled={portal.isPending}
								className='flex h-10 items-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 text-sm font-bold text-zinc-700 shadow-sm transition hover:bg-zinc-50 disabled:opacity-60 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300 dark:hover:bg-zinc-900'
							>
								<ExternalLink size={14} />
								{portal.isPending ? 'Opening…' : 'Manage billing'}
							</motion.button>
						</>
					)}
				</div>
			</motion.div>

			{/* Tabs Header */}
			<motion.div variants={itemVariants} className='flex'>
				<div className='inline-flex items-center gap-1.5 rounded-2xl bg-zinc-100/80 p-1.5 border border-zinc-200/60 dark:bg-zinc-900/60 dark:border-zinc-800/80 backdrop-blur-xs'>
					<button
						type='button'
						onClick={() => setActiveTab('overview')}
						className={`px-4.5 py-2.5 text-xs font-black transition rounded-xl relative cursor-pointer outline-hidden select-none ${activeTab === 'overview' ? 'text-zinc-950 dark:text-white' : 'text-zinc-400 hover:text-zinc-850 dark:text-zinc-500 dark:hover:text-zinc-300'}`}
					>
						<span className="relative z-10">Plan Overview</span>
						{activeTab === 'overview' && (
							<motion.div
								layoutId="activeTabPill"
								transition={{ type: 'spring', stiffness: 350, damping: 26 }}
								className="absolute inset-0 bg-white dark:bg-zinc-800 shadow-sm border border-zinc-200/10 dark:border-zinc-700/30 rounded-xl"
							/>
						)}
					</button>
					<button
						type='button'
						onClick={() => setActiveTab('usage')}
						className={`px-4.5 py-2.5 text-xs font-black transition rounded-xl relative cursor-pointer outline-hidden select-none ${activeTab === 'usage' ? 'text-zinc-950 dark:text-white' : 'text-zinc-400 hover:text-zinc-850 dark:text-zinc-500 dark:hover:text-zinc-300'}`}
					>
						<span className="relative z-10">Usage & Trends</span>
						{activeTab === 'usage' && (
							<motion.div
								layoutId="activeTabPill"
								transition={{ type: 'spring', stiffness: 350, damping: 26 }}
								className="absolute inset-0 bg-white dark:bg-zinc-800 shadow-sm border border-zinc-200/10 dark:border-zinc-700/30 rounded-xl"
							/>
						)}
					</button>
					<button
						type='button'
						onClick={() => setActiveTab('billing')}
						className={`px-4.5 py-2.5 text-xs font-black transition rounded-xl relative cursor-pointer outline-hidden select-none ${activeTab === 'billing' ? 'text-zinc-950 dark:text-white' : 'text-zinc-400 hover:text-zinc-850 dark:text-zinc-500 dark:hover:text-zinc-300'}`}
					>
						<span className="relative z-10">Billing & Top-ups</span>
						{activeTab === 'billing' && (
							<motion.div
								layoutId="activeTabPill"
								transition={{ type: 'spring', stiffness: 350, damping: 26 }}
								className="absolute inset-0 bg-white dark:bg-zinc-800 shadow-sm border border-zinc-200/10 dark:border-zinc-700/30 rounded-xl"
							/>
						)}
					</button>
				</div>
			</motion.div>

			{activeTab === 'overview' && (
				<>
					{/* Current plan card */}
					{isLoading ? (
						<div className='h-36 animate-pulse rounded-2xl bg-zinc-100 dark:bg-zinc-900' />
					) : (
						<motion.div
							variants={itemVariants}
							className='relative overflow-hidden rounded-2xl border border-zinc-100 bg-white p-6 shadow-xs dark:border-zinc-800 dark:bg-zinc-950/60 backdrop-blur-md'
						>
							{/* Decorative glows */}
							<div className="absolute -right-10 -top-10 -z-10 h-36 w-36 rounded-full bg-primary-400/10 blur-3xl dark:bg-primary-400/5" />
							<div className="absolute -left-10 -bottom-10 -z-10 h-36 w-36 rounded-full bg-primary-400/10 blur-3xl dark:bg-primary-400/5" />

							<div className='flex flex-wrap items-start justify-between gap-4'>
								<div className="flex items-start gap-4">
									<div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-50 to-primary-50 text-primary-600 shadow-xs dark:from-primary-950/30 dark:to-primary-950/30 dark:text-primary-400 border border-primary-100/30 dark:border-primary-900/30">
										<Crown size={26} className="text-primary-600 dark:text-primary-400 fill-primary-600/5" />
									</div>
									<div>
										<p className='text-[10px] font-black tracking-wider text-zinc-400 uppercase dark:text-zinc-500'>
											Current plan
										</p>
										<div className='mt-1 flex items-center gap-2'>
											<h2 className='text-3xl font-black text-zinc-950 dark:text-zinc-50 tracking-tight'>{plan?.name ?? 'Free'}</h2>
											{isLifetime && (
												<span className='inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-[10px] font-black text-amber-700 dark:bg-amber-950 dark:text-amber-300 border border-amber-200/20'>
													<Crown size={11} className="fill-amber-700/10" />
													Lifetime
												</span>
											)}
										</div>
										{billingInterval && !isLifetime && (
											<p className='mt-1 text-xs font-semibold text-zinc-500 capitalize dark:text-zinc-400'>
												Billed {billingInterval === 'yearly' ? 'yearly' : 'monthly'} ·{' '}
												{fmtPrice(
													billingInterval === 'yearly'
														? (plan?.price_yearly ?? 0)
														: (plan?.price_monthly ?? 0),
												)}
											</p>
										)}
										{isLifetime && (
											<p className='mt-1 text-xs font-semibold text-amber-600 dark:text-amber-400'>
												One-time purchase · Never expires
											</p>
										)}
									</div>
								</div>
								<span
									className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold border border-zinc-100/30 dark:border-zinc-800/30 ${statusCfg.bg} ${statusCfg.text}`}
								>
									<CheckCircle2 size={12} />
									{statusCfg.label}
								</span>
							</div>
							<div className='mt-5 flex flex-wrap gap-4 border-t border-zinc-100 pt-4 text-xs text-zinc-400 dark:border-zinc-800 dark:text-zinc-500 font-semibold'>
								{isLifetime ? (
									<span className='text-amber-600 dark:text-amber-400'>
										Lifetime access — no renewal required
									</span>
								) : (
									<div className="flex items-center gap-4">
										{periodEnd && (
											<span className="flex items-center gap-1">
												<Calendar size={12} className="text-zinc-400 dark:text-zinc-500" />
												Renews{' '}
												{new Date(periodEnd).toLocaleDateString(undefined, {
													month: 'short',
													day: 'numeric',
													year: 'numeric',
												})}
											</span>
										)}
										{trialEnd && (
											<span className='font-bold text-sky-600 dark:text-sky-400'>
												Trial ends{' '}
												{new Date(trialEnd).toLocaleDateString(undefined, {
													month: 'short',
													day: 'numeric',
													year: 'numeric',
												})}
											</span>
										)}
										{canceledAt && (
											<span className='font-bold text-red-500 dark:text-red-400'>
												Cancels{' '}
												{new Date(canceledAt).toLocaleDateString(undefined, {
													month: 'short',
													day: 'numeric',
													year: 'numeric',
												})}
											</span>
										)}
									</div>
								)}
							</div>
						</motion.div>
					)}

					{/* Limits */}
					<motion.section variants={itemVariants}>
						<h3 className='mb-4 mt-8 text-xs font-black tracking-wider text-zinc-400 dark:text-zinc-500 uppercase'>Your Limits</h3>
						<div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
							{limitCards.map((card, idx) => (
								<motion.div
									key={idx}
									whileHover={{ y: -2, scale: 1.01 }}
									whileTap={{ scale: 0.99 }}
									transition={{ duration: 0.25, ease: 'easeOut' }}
									className='relative overflow-hidden rounded-2xl border border-zinc-100 bg-white p-5 shadow-xs dark:border-zinc-800 dark:bg-zinc-950/40 backdrop-blur-xs flex flex-col justify-between min-h-[140px] hover:border-zinc-300 dark:hover:border-zinc-700/80 transition-all duration-200'
								>
									<div className="w-full">
										<div className="flex items-center gap-3">
											<div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${card.iconBg} border border-zinc-100/15`}>
												<card.icon size={16} />
											</div>
											<p className='text-[10px] font-black tracking-wider text-zinc-400 dark:text-zinc-500 uppercase'>
												{card.title}
											</p>
										</div>

										<p className='mt-3.5 text-2xl font-black text-zinc-950 dark:text-zinc-50 tracking-tight'>
											{card.value}
										</p>

										{card.isCredits && limits?.credits_monthly && limits.credits_monthly > 0 && (
											<div className="w-full mt-3">
												<div className='h-2 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800 p-[1px] border border-zinc-200/10'>
													<motion.div
														initial={{ width: 0 }}
														animate={{ width: `${creditsUsedPct}%` }}
														transition={{ duration: 0.8, ease: 'easeOut' }}
														className={`h-full rounded-full ${creditsUsedPct >= 80 ? 'bg-rose-500' : 'bg-gradient-to-r from-primary-400 via-primary-400 to-primary-400'}`}
													/>
												</div>
												<p className='mt-1.5 text-[10px] font-bold text-zinc-400 dark:text-zinc-500'>
													{creditsUsedPct}% used ({used.toLocaleString()} / {limit.toLocaleString()})
												</p>
											</div>
										)}
									</div>

									{card.link && (
										<div className="mt-4 pt-3 border-t border-zinc-50 dark:border-zinc-800/50">
											<Link
												to={card.link}
												className='inline-flex items-center gap-1 text-xs font-bold text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors'
											>
												<span>{card.linkLabel}</span>
												<ArrowRight size={11} className="transition-transform group-hover:translate-x-0.5" />
											</Link>
										</div>
									)}
								</motion.div>
							))}
						</div>
					</motion.section>

					{/* Features */}
					<motion.section variants={itemVariants}>
						<h3 className='mb-4 mt-8 text-xs font-black tracking-wider text-zinc-400 dark:text-zinc-500 uppercase'>Included Features</h3>
						<div className='rounded-2xl border border-zinc-100 bg-white/50 dark:border-zinc-800 dark:bg-zinc-950/20 backdrop-blur-xs p-5'>
							<div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
								{features &&
									(Object.keys(FEATURE_LABELS) as (keyof TPlanFeatures)[]).map(
										(key) => {
											const enabled = features[key];
											return (
												<div
													key={key}
													className={`flex items-center gap-3 rounded-xl border p-3 transition-all ${
														enabled
															? 'border-emerald-100/50 bg-emerald-50/10 dark:border-emerald-950/25 dark:bg-emerald-950/5'
															: 'border-zinc-100/40 bg-zinc-50/10 dark:border-zinc-800/20 opacity-50'
													}`}
												>
													<div
														className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border ${
															enabled
																? 'border-emerald-200 bg-emerald-50 text-emerald-600 dark:border-emerald-800/40 dark:bg-emerald-950/40 dark:text-emerald-400'
																: 'border-zinc-200 bg-zinc-100 text-zinc-400 dark:border-zinc-800 dark:bg-zinc-900'
														}`}
													>
														{enabled ? (
															<Check size={11} className="stroke-[3]" />
														) : (
															<X size={11} className="stroke-[2.5]" />
														)}
													</div>
													<span
														className={`text-xs font-bold ${
															enabled
																? 'text-zinc-900 dark:text-zinc-100'
																: 'text-zinc-400 dark:text-zinc-600'
														}`}
													>
														{FEATURE_LABELS[key]}
													</span>
												</div>
											);
										},
									)}
							</div>
						</div>
					</motion.section>

					{/* Compare plans */}
					<motion.section variants={itemVariants}>
						<div className='mb-4 mt-8 flex items-center justify-between'>
							<h3 className='text-xs font-black tracking-wider text-zinc-400 dark:text-zinc-500 uppercase'>Other Plans</h3>
							<Link
								to={pages.settings.subPages.plan.subPages.upgrade.to}
								className='flex items-center gap-1 text-xs font-bold text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors'
							>
								<span>See full comparison</span>
								<ArrowRight size={12} />
							</Link>
						</div>
						<ComparePlanCards currentSlug={plan?.slug} />
					</motion.section>
				</>
			)}

			{activeTab === 'usage' && (
				<UsagePage hideHeader />
			)}

			{activeTab === 'billing' && (
				<BillingOverviewPage />
			)}
		</motion.div>
	);
};

// ── ComparePlanCards ─────────────────────────────────────────────────────────

const STATIC_PLANS = [
	{ name: 'Free', slug: 'free', price_monthly: 0, credits: 1000, workflows: 5 },
	{ name: 'Starter', slug: 'starter', price_monthly: 1200, credits: 10000, workflows: 20 },
	{ name: 'Pro', slug: 'pro', price_monthly: 2900, credits: 50000, workflows: 100 },
	{ name: 'Teams', slug: 'teams', price_monthly: 7900, credits: 200000, workflows: -1 },
	{ name: 'Enterprise', slug: 'enterprise', price_monthly: 0, credits: -1, workflows: -1 },
];

const ComparePlanCards = ({ currentSlug }: { currentSlug?: string }) => (
	<div className='flex gap-4 overflow-x-auto pb-4 pt-1'>
		{STATIC_PLANS.map((p) => {
			const isCurrent = p.slug === currentSlug;
			return (
				<motion.div
					key={p.slug}
					whileHover={{ y: -4, scale: 1.02 }}
					whileTap={{ scale: 0.98 }}
					transition={{ duration: 0.2 }}
					className={`flex min-w-[200px] flex-1 flex-col justify-between rounded-2xl border p-5 shadow-xs transition-all relative ${
						isCurrent
							? 'border-primary-600 bg-zinc-950 text-white dark:border-primary-400 dark:bg-zinc-900 ring-2 ring-primary-500/25'
							: 'border-zinc-100 bg-white dark:border-zinc-800 dark:bg-zinc-950/40 hover:border-zinc-300 dark:hover:border-zinc-700'
					}`}
				>
					{isCurrent && (
						<div className="absolute -top-2.5 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-primary-400 to-primary-400 px-3 py-0.5 text-[9px] font-black text-primary-950 shadow-md shadow-primary-500/15 uppercase tracking-wider border border-primary-400/20">
							Active
						</div>
					)}

					<div>
						<div className='flex items-center justify-between'>
							<span className={`text-xs font-black tracking-wide uppercase ${isCurrent ? 'text-white' : 'text-zinc-400 dark:text-zinc-500'}`}>
								{p.name}
							</span>
							{isCurrent && (
								<Crown size={12} className="text-primary-400 dark:text-primary-600" />
							)}
						</div>

						<p className={`mt-3.5 text-2xl font-black tracking-tight ${isCurrent ? 'text-white' : 'text-zinc-950 dark:text-zinc-50'}`}>
							{p.price_monthly === 0
								? p.slug === 'enterprise'
									? 'Custom'
									: 'Free'
								: `$${p.price_monthly / 100}`}
							{p.price_monthly > 0 && (
								<span className={`text-xs font-bold ml-1 ${isCurrent ? 'text-white/60' : 'text-zinc-400'}`}>
									/mo
								</span>
							)}
						</p>

						<div className={`mt-4 space-y-1.5 border-t pt-4 text-xs font-semibold ${isCurrent ? 'border-white/10' : 'border-zinc-100 dark:border-zinc-800'}`}>
							<p className={isCurrent ? 'text-white/80' : 'text-zinc-500 dark:text-zinc-400'}>
								{p.credits === -1 ? 'Unlimited' : `${(p.credits / 1000).toFixed(0)}k`} credits
							</p>
							<p className={isCurrent ? 'text-white/80' : 'text-zinc-500 dark:text-zinc-400'}>
								{p.workflows === -1 ? 'Unlimited' : p.workflows} workflows
							</p>
						</div>
					</div>

					<div className="mt-5 w-full">
						{!isCurrent && p.slug !== 'enterprise' && (
							<Link
								to={pages.settings.subPages.plan.subPages.upgrade.to}
								className='flex items-center justify-center gap-1 rounded-xl border border-zinc-200/80 bg-white py-2 text-xs font-bold text-zinc-700 shadow-xs transition hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300 dark:hover:bg-zinc-900 w-full'
							>
								<Zap size={11} className="text-zinc-400" />
								Switch
							</Link>
						)}
						{p.slug === 'enterprise' && !isCurrent && (
							<a
								href='mailto:sales@agent1o1.com'
								className='flex items-center justify-center gap-1 rounded-xl border border-zinc-200/80 bg-white py-2 text-xs font-bold text-zinc-700 shadow-xs transition hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300 dark:hover:bg-zinc-900 w-full'
							>
								Contact us
							</a>
						)}
						{isCurrent && (
							<div className="flex items-center justify-center py-2 text-xs font-bold text-primary-400 dark:text-primary-600 w-full">
								Current Plan
							</div>
						)}
					</div>
				</motion.div>
			);
		})}
	</div>
);

export default PlanPage;
