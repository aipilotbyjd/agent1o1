import { useParams } from 'react-router';
import { Link } from 'react-router';
import {
	AlertTriangle,
	ArrowRight,
	Check,
	CheckCircle2,
	Coins,
	Crown,
	ExternalLink,
	GitBranch,
	RotateCcw,
	ShieldCheck,
	Users,
	X,
	XCircle,
	Zap,
} from 'lucide-react';
import { useWorkspace } from '@/api/modules/workspaces';
import {
	useBillingOverview,
	useCancelSubscription,
	useCreateBillingPortalSession,
	useResumeSubscription,
} from '@/api/modules/billing';
import pages from '@/Routes/pages';
import { withWorkspace } from '@/Routes/paths';
import type { TSubscription } from '@/types/billing.type';

const billingPages = pages.settings.subPages!.billing.subPages!;

const statusConfig: Record<TSubscription['stripe_status'], { label: string; className: string }> = {
	active: {
		label: 'Active',
		className:
			'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border-emerald-100/50 dark:border-emerald-900/30',
	},
	trialing: {
		label: 'Trial',
		className:
			'bg-sky-50 dark:bg-sky-950/20 text-sky-700 dark:text-sky-400 border-sky-100/50 dark:border-sky-900/30',
	},
	past_due: {
		label: 'Past Due',
		className:
			'bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 border-amber-100/50 dark:border-amber-900/30',
	},
	canceled: {
		label: 'Canceled',
		className:
			'bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400 border-red-100/50 dark:border-red-900/30',
	},
	incomplete: {
		label: 'Incomplete',
		className:
			'bg-zinc-100 dark:bg-zinc-800/20 text-zinc-600 dark:text-zinc-400 border-zinc-200/50 dark:border-zinc-800/30',
	},
	incomplete_expired: {
		label: 'Expired',
		className:
			'bg-zinc-100 dark:bg-zinc-800/20 text-zinc-600 dark:text-zinc-400 border-zinc-200/50 dark:border-zinc-800/30',
	},
	unpaid: {
		label: 'Unpaid',
		className:
			'bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400 border-red-100/50 dark:border-red-900/30',
	},
};

const FEATURE_LABELS: Record<string, string> = {
	credit_packs: 'Credit pack top-ups',
	credit_overage: 'Overage protection',
	git_sync: 'Git sync',
	workflow_approvals: 'Approval workflows',
	custom_nodes: 'Custom nodes',
	priority_support: 'Priority support',
};

const LIMIT_CONFIG: Record<string, { title: string; icon: typeof GitBranch; iconBg: string }> = {
	workflows: {
		title: 'Workflows',
		icon: GitBranch,
		iconBg: 'bg-primary-50/70 text-primary-600 dark:bg-primary-950/30 dark:text-primary-400',
	},
	agents: {
		title: 'Agents',
		icon: Zap,
		iconBg: 'bg-amber-50/70 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400',
	},
	members: {
		title: 'Team Members',
		icon: Users,
		iconBg: 'bg-emerald-50/70 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400',
	},
};

const fmtLimit = (n: number | null) => (n === null || n < 0 ? 'Unlimited' : n.toLocaleString());

const fmtDate = (value: string) =>
	new Date(value).toLocaleDateString(undefined, {
		month: 'short',
		day: 'numeric',
		year: 'numeric',
	});

const BillingOverviewPage = () => {
	const { workspaceId } = useParams<{ workspaceId: string }>();
	const { data: workspace } = useWorkspace(workspaceId!);
	const { data: overview, isLoading } = useBillingOverview(workspaceId!);
	const portal = useCreateBillingPortalSession(workspaceId!);
	const cancelSubscription = useCancelSubscription(workspaceId!);
	const resumeSubscription = useResumeSubscription(workspaceId!);

	const toWorkspacePath = (to: string) => withWorkspace(to, workspaceId!);

	const role = workspace?.role;
	const canManage = role === 'admin' || role === 'owner';

	if (!canManage) {
		return (
			<div className='flex min-h-[50vh] flex-col items-center justify-center gap-4 text-center'>
				<ShieldCheck size={40} className='text-zinc-300 dark:text-zinc-600' />
				<h2 className='text-xl font-black text-zinc-950 dark:text-zinc-50'>
					Access Restricted
				</h2>
				<p className='max-w-sm text-sm text-zinc-500 dark:text-zinc-400'>
					Only workspace admins and owners can view billing.
				</p>
			</div>
		);
	}

	if (isLoading || !overview) {
		return (
			<div className='space-y-4'>
				<div className='h-36 animate-pulse rounded-2xl bg-zinc-100 dark:bg-zinc-900' />
				<div className='grid gap-4 sm:grid-cols-3'>
					{[1, 2, 3].map((i) => (
						<div
							key={i}
							className='h-32 animate-pulse rounded-2xl bg-zinc-100 dark:bg-zinc-900'
						/>
					))}
				</div>
			</div>
		);
	}

	const {
		subscription,
		plan_grant: grant,
		current_plan: plan,
		usage_period: usage,
		dunning,
	} = overview;
	const isLifetime = !!grant;
	const status = subscription?.stripe_status;
	const statusCfg = status ? statusConfig[status] : null;

	const cancelsAt = subscription?.ends_at;
	const cancelsAtInFuture = cancelsAt ? new Date(cancelsAt).getTime() > Date.now() : false;
	const canCancel =
		!!subscription &&
		!isLifetime &&
		!cancelsAt &&
		(status === 'active' || status === 'trialing');
	const canResume = !!subscription && !!cancelsAt && cancelsAtInFuture;

	const total =
		usage.credits_limit === null ? null : usage.credits_limit + overview.topup_credits;
	const remaining = overview.credits_available ?? total ?? 0;
	const creditsUsedPct =
		total && total > 0 ? Math.min(100, Math.round(((total - remaining) / total) * 100)) : 0;

	const handleCancel = () => {
		if (
			window.confirm(
				'Cancel your subscription? You will keep access until the end of the current billing period.',
			)
		) {
			cancelSubscription.mutate();
		}
	};

	return (
		<div className='space-y-8 text-zinc-950 dark:text-zinc-50'>
			{dunning && (
				<div className='flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-800/40 dark:bg-amber-950/20'>
					<AlertTriangle
						size={18}
						className='shrink-0 text-amber-600 dark:text-amber-400'
					/>
					<p className='text-sm font-semibold text-amber-700 dark:text-amber-300'>
						Your payment is past due. Update your payment method to keep your workspace
						active.
					</p>
					<button
						type='button'
						onClick={() => portal.mutate()}
						disabled={portal.isPending}
						className='ml-auto shrink-0 rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-bold text-white shadow-md shadow-amber-500/10 transition hover:bg-amber-600 disabled:opacity-60'>
						{portal.isPending ? 'Opening…' : 'Fix payment'}
					</button>
				</div>
			)}
			{canResume && (
				<div className='flex flex-wrap items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-800/40 dark:bg-amber-950/20'>
					<AlertTriangle
						size={18}
						className='shrink-0 text-amber-600 dark:text-amber-400'
					/>
					<p className='text-sm font-semibold text-amber-700 dark:text-amber-300'>
						Your subscription is scheduled to cancel
						{cancelsAt ? ` on ${fmtDate(cancelsAt)}` : ''}. Resume to keep your plan
						active.
					</p>
					<button
						type='button'
						onClick={() => resumeSubscription.mutate()}
						disabled={resumeSubscription.isPending}
						className='ml-auto flex shrink-0 items-center gap-1.5 rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-bold text-white shadow-md shadow-amber-500/10 transition hover:bg-amber-600 disabled:opacity-60'>
						<RotateCcw size={13} />
						{resumeSubscription.isPending ? 'Resuming…' : 'Resume subscription'}
					</button>
				</div>
			)}

			{/* Header */}
			<div className='flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between'>
				<div>
					<h1 className='text-3xl font-black tracking-tight text-zinc-950 dark:text-zinc-50'>
						Billing
					</h1>
					<p className='mt-1 text-sm font-medium text-zinc-500 dark:text-zinc-400'>
						Your plan, credits, and payment settings — all in one place.
					</p>
				</div>
				<div className='flex flex-wrap items-center gap-3'>
					<button
						type='button'
						onClick={() => portal.mutate()}
						disabled={portal.isPending}
						className='flex h-10 items-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 text-sm font-bold text-zinc-700 shadow-sm transition hover:bg-zinc-50 disabled:opacity-60 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300 dark:hover:bg-zinc-900'>
						<ExternalLink size={14} />
						{portal.isPending ? 'Opening…' : 'Manage billing'}
					</button>
					<Link
						to={toWorkspacePath(billingPages.plans.to)}
						className='bg-primary-400 text-primary-950 shadow-primary-500/15 hover:bg-primary-500 flex h-10 items-center gap-2 rounded-xl px-5 text-sm font-bold shadow-md transition'>
						<Zap size={14} />
						Upgrade plan
					</Link>
					{canCancel && (
						<button
							type='button'
							onClick={handleCancel}
							disabled={cancelSubscription.isPending}
							className='flex h-10 items-center gap-2 rounded-xl border border-red-200 bg-white px-4 text-sm font-bold text-red-600 shadow-sm transition hover:bg-red-50 disabled:opacity-60 dark:border-red-900/40 dark:bg-zinc-950 dark:text-red-400 dark:hover:bg-red-950/20'>
							<XCircle size={14} />
							{cancelSubscription.isPending ? 'Canceling…' : 'Cancel plan'}
						</button>
					)}
				</div>
			</div>

			{/* Current plan + credits */}
			<div className='grid gap-4 lg:grid-cols-2'>
				{/* Current plan card */}
				<div className='relative overflow-hidden rounded-2xl border border-zinc-100 bg-white p-6 shadow-xs dark:border-zinc-800 dark:bg-zinc-950/60'>
					<div className='flex flex-wrap items-start justify-between gap-4'>
						<div className='flex items-start gap-4'>
							<div className='border-primary-100/30 from-primary-50 to-primary-50 text-primary-600 dark:border-primary-900/30 dark:from-primary-950/30 dark:to-primary-950/30 dark:text-primary-400 flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border bg-gradient-to-br shadow-xs'>
								<Crown size={26} />
							</div>
							<div>
								<p className='text-[10px] font-black tracking-wider text-zinc-400 uppercase dark:text-zinc-500'>
									Current plan
								</p>
								<div className='mt-1 flex items-center gap-2'>
									<h2 className='text-3xl font-black tracking-tight text-zinc-950 dark:text-zinc-50'>
										{plan?.name ?? 'Free'}
									</h2>
									{isLifetime && (
										<span className='inline-flex items-center gap-1 rounded-full border border-amber-200/20 bg-amber-100 px-2.5 py-0.5 text-[10px] font-black text-amber-700 dark:bg-amber-950 dark:text-amber-300'>
											<Crown size={11} />
											Lifetime
										</span>
									)}
								</div>
								{isLifetime && (
									<p className='mt-1 text-xs font-semibold text-amber-600 dark:text-amber-400'>
										One-time purchase · Never expires
									</p>
								)}
							</div>
						</div>
						{statusCfg && (
							<span
								className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold ${statusCfg.className}`}>
								<CheckCircle2 size={12} />
								{statusCfg.label}
							</span>
						)}
					</div>
					{(cancelsAt || subscription?.trial_ends_at) && (
						<div className='mt-5 flex flex-wrap gap-4 border-t border-zinc-100 pt-4 text-xs font-semibold text-zinc-400 dark:border-zinc-800 dark:text-zinc-500'>
							{subscription?.trial_ends_at && (
								<span className='font-bold text-sky-600 dark:text-sky-400'>
									Trial ends {fmtDate(subscription.trial_ends_at)}
								</span>
							)}
							{cancelsAt && (
								<span className='font-bold text-red-500 dark:text-red-400'>
									Cancels {fmtDate(cancelsAt)}
								</span>
							)}
						</div>
					)}
				</div>

				{/* Credits card */}
				<div className='rounded-2xl border border-zinc-100 bg-white p-6 shadow-xs dark:border-zinc-800 dark:bg-zinc-950/60'>
					<div className='flex items-start justify-between'>
						<div className='flex items-center gap-3'>
							<div className='flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-50/70 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400'>
								<Coins size={16} />
							</div>
							<p className='text-[10px] font-black tracking-wider text-zinc-400 uppercase dark:text-zinc-500'>
								Credits this period
							</p>
						</div>
						<Link
							to={toWorkspacePath(billingPages.usage.to)}
							className='text-primary-600 dark:text-primary-400 text-xs font-bold hover:underline'>
							View usage
						</Link>
					</div>
					<p className='mt-3.5 text-3xl font-black tracking-tight text-zinc-950 dark:text-zinc-50'>
						{remaining.toLocaleString()}
						<span className='ml-1 text-sm font-bold text-zinc-400'>
							/ {fmtLimit(total)} left
						</span>
					</p>
					{!!total && total > 0 && (
						<div className='mt-3 h-2 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800'>
							<div
								className={`h-full rounded-full ${creditsUsedPct >= 80 ? 'bg-rose-500' : 'bg-primary-400'}`}
								style={{ width: `${100 - creditsUsedPct}%` }}
							/>
						</div>
					)}
					<Link
						to={toWorkspacePath(billingPages.credits.to)}
						className='text-primary-600 dark:text-primary-400 mt-3 inline-flex items-center gap-1 text-xs font-bold'>
						<span>Buy more credits</span>
						<ArrowRight size={12} />
					</Link>
				</div>
			</div>

			{/* Limits */}
			<section>
				<h3 className='mt-8 mb-4 text-xs font-black tracking-wider text-zinc-400 uppercase dark:text-zinc-500'>
					Your Limits
				</h3>
				<div className='grid gap-4 sm:grid-cols-3'>
					{Object.entries(overview.limits).map(([key, { used, max }]) => {
						const cfg = LIMIT_CONFIG[key];
						if (!cfg) return null;
						return (
							<div
								key={key}
								className='rounded-2xl border border-zinc-100 bg-white p-5 shadow-xs dark:border-zinc-800 dark:bg-zinc-950/40'>
								<div className='flex items-center gap-3'>
									<div
										className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${cfg.iconBg}`}>
										<cfg.icon size={16} />
									</div>
									<p className='text-[10px] font-black tracking-wider text-zinc-400 uppercase dark:text-zinc-500'>
										{cfg.title}
									</p>
								</div>
								<p className='mt-3.5 text-2xl font-black tracking-tight text-zinc-950 dark:text-zinc-50'>
									{used.toLocaleString()} / {fmtLimit(max)}
								</p>
							</div>
						);
					})}
				</div>
			</section>

			{/* Features */}
			<section>
				<h3 className='mt-8 mb-4 text-xs font-black tracking-wider text-zinc-400 uppercase dark:text-zinc-500'>
					Included Features
				</h3>
				<div className='rounded-2xl border border-zinc-100 bg-white/50 p-5 dark:border-zinc-800 dark:bg-zinc-950/20'>
					<div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
						{Object.entries(FEATURE_LABELS).map(([key, label]) => {
							const enabled = !!plan?.features?.[key];
							return (
								<div
									key={key}
									className={`flex items-center gap-3 rounded-xl border p-3 transition-all ${
										enabled
											? 'border-emerald-100/50 bg-emerald-50/10 dark:border-emerald-950/25 dark:bg-emerald-950/5'
											: 'border-zinc-100/40 bg-zinc-50/10 opacity-50 dark:border-zinc-800/20'
									}`}>
									<div
										className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border ${
											enabled
												? 'border-emerald-200 bg-emerald-50 text-emerald-600 dark:border-emerald-800/40 dark:bg-emerald-950/40 dark:text-emerald-400'
												: 'border-zinc-200 bg-zinc-100 text-zinc-400 dark:border-zinc-800 dark:bg-zinc-900'
										}`}>
										{enabled ? (
											<Check size={11} className='stroke-[3]' />
										) : (
											<X size={11} className='stroke-[2.5]' />
										)}
									</div>
									<span
										className={`text-xs font-bold ${enabled ? 'text-zinc-900 dark:text-zinc-100' : 'text-zinc-400 dark:text-zinc-600'}`}>
										{label}
									</span>
								</div>
							);
						})}
					</div>
				</div>
			</section>
		</div>
	);
};

export default BillingOverviewPage;
