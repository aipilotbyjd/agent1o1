import { useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { toast } from 'react-toastify';
import {
	AlertTriangle,
	ArrowRight,
	Package,
	Wallet,
	Settings,
	Star,
	Sparkles,
	CreditCard,
	FileText,
} from 'lucide-react';
import { useWorkspaceContext } from '@/context/workspaceContext';
import { useCreditBalance, useCreditPacks, useCreditTransactions } from '@/api/modules/credits';
import { useBillingPortal, useBuyCredits, usePackCatalog } from '@/api/modules/billing';
import { useSubscription } from '@/api/modules/plans';
import pages from '@/Routes/pages';
import type { TCreditPack } from '@/types/credit.type';

// ── helpers ──────────────────────────────────────────────────────────────────

const PACK_ICONS = [Sparkles, Star, Star, Star];
const PACK_ICON_BG = [
	'bg-primary-100 text-primary-600 dark:bg-primary-950/40 dark:text-primary-400',
	'bg-amber-100 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400',
	'bg-sky-100 text-sky-600 dark:bg-sky-950/40 dark:text-sky-450',
	'bg-rose-100 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400',
];

const packStatusCfg: Record<TCreditPack['status'], { label: string; color: string }> = {
	pending: {
		label: 'Pending',
		color: 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400',
	},
	active: {
		label: 'Active',
		color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400',
	},
	exhausted: {
		label: 'Exhausted',
		color: 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-500',
	},
	expired: {
		label: 'Expired',
		color: 'bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-400',
	},
	refunded: {
		label: 'Refunded',
		color: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400',
	},
};

const fmt = (n: number) =>
	new Intl.NumberFormat('en-US', {
		style: 'currency',
		currency: 'USD',
		minimumFractionDigits: 0,
	}).format(n / 100);

// ── component ─────────────────────────────────────────────────────────────────

const BillingOverviewPage = () => {
	const { activeWorkspaceId, role } = useWorkspaceContext();
	const { data: balance, refetch: refetchBalance } = useCreditBalance(activeWorkspaceId);
	const { refetch: refetchSubscription } = useSubscription(activeWorkspaceId);
	const { data: packs, isLoading: packsLoading } = useCreditPacks(activeWorkspaceId);
	const { data: catalog, isLoading: catalogLoading } = usePackCatalog(activeWorkspaceId);
	const { data: txData } = useCreditTransactions(activeWorkspaceId, { per_page: 5 });
	const portal = useBillingPortal(activeWorkspaceId);
	const buyCredits = useBuyCredits(activeWorkspaceId);
	const [searchParams] = useSearchParams();
	const navigate = useNavigate();

	useEffect(() => {
		if (searchParams.get('success') === '1') {
			toast.success('Payment successful! Your plan has been activated.');
			refetchBalance();
			refetchSubscription();
		} else if (searchParams.get('cancel') === '1') {
			toast.error('Payment cancelled.');
		}
		if (searchParams.get('success') || searchParams.get('cancel')) {
			navigate(location.pathname, { replace: true });
		}
	}, []); // eslint-disable-line react-hooks/exhaustive-deps

	const canManage = role === 'admin' || role === 'owner';

	if (!canManage) {
		return (
			<div className='flex min-h-[40vh] flex-col items-center justify-center gap-3 text-center'>
				<p className='text-sm font-semibold text-zinc-400'>
					Only workspace admins and owners can view billing.
				</p>
			</div>
		);
	}

	const remaining = balance?.credits?.remaining ?? 1000;
	const total =
		(balance?.credits?.limit ?? 1000) +
		(balance?.credits?.from_packs ?? 0) +
		(balance?.credits?.rolled_over ?? 0);
	const usedPct = total > 0 ? Math.min(100, Math.round(((total - remaining) / total) * 100)) : 0;
	const barColor =
		usedPct >= 80 ? 'bg-red-500' : usedPct >= 60 ? 'bg-amber-500' : 'bg-emerald-500';

	const recentTx = txData?.data ?? [];
	const allPacks = packs ?? [];

	return (
		<div className='space-y-8 text-zinc-950 dark:text-zinc-50'>
			{/* Current Balance card */}
			<div className='dark:border-zinc-800 flex flex-wrap items-center justify-between gap-6 rounded-2xl border border-zinc-100 bg-white p-5 shadow-sm dark:bg-zinc-950'>
				<div className='flex items-center gap-4'>
					{/* Wallet Icon circle */}
					<div className='flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary-50 text-primary-600 dark:bg-primary-950/40 dark:text-primary-400'>
						<Wallet size={22} className='fill-primary-600/10' />
					</div>

					{/* Balance details & progress bar */}
					<div>
						<div className='text-xs font-semibold text-zinc-400 dark:text-zinc-500'>
							Current Balance
						</div>
						<div className='mt-1 flex flex-wrap items-center gap-3.5'>
							<span className='text-2xl leading-none font-black text-zinc-900 dark:text-zinc-100'>
								{remaining.toLocaleString()} credits
							</span>

							{/* Progress bar */}
							<div className='flex items-center gap-3'>
								<div className='h-2 w-32 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800'>
									<div
										className={`h-full rounded-full ${barColor}`}
										style={{ width: `${100 - usedPct}%` }}
									/>
								</div>
								<Link
									to={pages.settings.subPages.usage.to}
									className='flex items-center gap-0.5 text-xs font-bold text-primary-600 transition hover:text-primary-700 dark:text-primary-400'>
									<span>View usage</span>
									<ArrowRight size={12} />
								</Link>
							</div>
						</div>
					</div>
				</div>

				<button
					type='button'
					onClick={() => portal.mutate()}
					disabled={portal.isPending}
					className='dark:border-primary-800 dark:hover:bg-zinc-800 flex h-10 items-center gap-2 rounded-xl border border-primary-200 bg-white px-4 text-xs font-bold text-primary-600 shadow-xs transition hover:bg-primary-50/50 disabled:opacity-60 dark:bg-zinc-900 dark:text-primary-400'>
					<Settings size={14} />
					<span>{portal.isPending ? 'Opening…' : 'Manage billing'}</span>
				</button>
			</div>

			{/* Low credits warning */}
			{usedPct >= 80 && (
				<div className='flex items-center gap-3 rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3 shadow-xs dark:border-amber-950/20 dark:bg-amber-950/10'>
					<AlertTriangle size={16} className='shrink-0 text-amber-500' />
					<p className='text-xs font-semibold text-amber-700 dark:text-amber-400'>
						You've used {usedPct}% of your credits. Top up to avoid interruptions.
					</p>
					<Link
						to={pages.settings.subPages.billing.subPages.credits.to}
						className='ml-auto shrink-0 rounded-xl bg-amber-500 px-3.5 py-1.5 text-xs font-bold text-white shadow-md shadow-amber-500/10 transition hover:bg-amber-600 active:scale-95'>
						Buy credits
					</Link>
				</div>
			)}

			{/* Credit packs */}
			<section>
				<div className='mb-4 flex items-center justify-between'>
					<div className='flex items-center gap-2'>
						<Sparkles size={16} className='text-primary-500' />
						<h3 className='text-sm font-black text-zinc-900 dark:text-zinc-100'>
							Your Credit Packs
						</h3>
					</div>
					<Link
						to={pages.settings.subPages.billing.subPages.credits.to}
						className='flex items-center gap-1 text-xs font-bold text-primary-600 transition hover:text-primary-700 dark:text-primary-400'>
						<span>Buy more</span>
						<ArrowRight size={12} />
					</Link>
				</div>

				{packsLoading ? (
					<div className='h-20 animate-pulse rounded-2xl bg-zinc-100 dark:bg-zinc-800' />
				) : allPacks.length === 0 ? (
					<div className='rounded-2xl border border-dashed border-zinc-200 bg-zinc-50/35 px-6 py-8 text-center dark:border-zinc-800 dark:bg-zinc-950/20'>
						<div className='mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-primary-50 text-primary-600 shadow-xs dark:bg-primary-950/40 dark:text-primary-400'>
							<Package size={20} className='fill-primary-600/10' />
						</div>
						<p className='text-xs font-semibold text-zinc-400 dark:text-zinc-500'>
							No credit packs purchased yet.
						</p>
						<Link
							to={pages.settings.subPages.billing.subPages.credits.to}
							className='mt-4 inline-flex items-center gap-1.5 rounded-xl bg-primary-400 px-5 py-2.5 text-xs font-bold text-primary-950 shadow-md shadow-primary-500/10 transition hover:bg-primary-500 active:scale-95'>
							<Sparkles size={12} />
							<span>Buy your first pack</span>
						</Link>
					</div>
				) : (
					<div className='overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-700 dark:bg-zinc-900'>
						<div className='grid grid-cols-[1fr_auto_auto_auto_auto] gap-4 border-b border-zinc-100 px-5 py-3 dark:border-zinc-800'>
							{['Pack', 'Remaining', 'Purchased', 'Expires', 'Status'].map((h) => (
								<span
									key={h}
									className='text-xs font-bold tracking-widest text-zinc-400 uppercase'>
									{h}
								</span>
							))}
						</div>
						{allPacks.map((pack, i) => {
							const cfg = packStatusCfg[pack.status];
							const usedInPack = pack.credits_amount - pack.credits_remaining;
							const packPct =
								pack.credits_amount > 0
									? Math.round((usedInPack / pack.credits_amount) * 100)
									: 0;
							return (
								<div
									key={pack.id}
									className={`grid grid-cols-[1fr_auto_auto_auto_auto] items-center gap-4 px-5 py-3.5 ${i > 0 ? 'border-t border-zinc-100 dark:border-zinc-800' : ''}`}>
									<div>
										<p className='text-sm font-black'>
											{pack.credits_amount.toLocaleString()} credits
										</p>
										<p className='text-xs text-zinc-400'>
											{fmt(pack.price_cents)}
										</p>
									</div>
									<div className='text-right'>
										<p className='text-sm font-bold'>
											{pack.credits_remaining.toLocaleString()}
										</p>
										<div className='mt-1 h-1 w-16 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-700'>
											<div
												className='h-full rounded-full bg-emerald-400'
												style={{ width: `${100 - packPct}%` }}
											/>
										</div>
									</div>
									<p className='text-xs text-zinc-400'>
										{new Date(pack.purchased_at).toLocaleDateString(undefined, {
											month: 'short',
											day: 'numeric',
											year: 'numeric',
										})}
									</p>
									<p className='text-xs text-zinc-400'>
										{pack.expires_at
											? new Date(pack.expires_at).toLocaleDateString(
													undefined,
													{
														month: 'short',
														day: 'numeric',
														year: 'numeric',
													},
												)
											: 'Never'}
									</p>
									<span
										className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${cfg.color}`}>
										{cfg.label}
									</span>
								</div>
							);
						})}
					</div>
				)}
			</section>

			{/* Buy Credits Options */}
			<section>
				<div className='mb-4 flex items-center gap-2'>
					<CreditCard size={16} className='text-primary-500' />
					<h3 className='text-sm font-black text-zinc-900 dark:text-zinc-100'>
						Buy Credits
					</h3>
				</div>
				<div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
					{catalogLoading ? (
						[1, 2, 3, 4].map((i) => (
							<div
								key={i}
								className='h-40 animate-pulse rounded-2xl bg-zinc-100 dark:bg-zinc-800'
							/>
						))
					) : (
					(catalog ?? []).map((pack, i) => {
						const Icon = PACK_ICONS[i % PACK_ICONS.length];
						const iconBg = PACK_ICON_BG[i % PACK_ICON_BG.length];
						return (
						<div
							key={pack.key}
							className='dark:border-zinc-800 flex flex-col justify-between rounded-2xl border border-zinc-100 bg-white p-5 shadow-sm dark:bg-zinc-950'>
							<div>
								<div className='flex items-center justify-between'>
									<div className='flex items-center gap-2.5'>
										<div
											className={`flex h-8 w-8 items-center justify-center rounded-xl ${iconBg}`}>
											<Icon size={16} />
										</div>
										<div>
											<span className='dark:text-zinc-150 text-sm font-black text-zinc-900'>
												{pack.credits.toLocaleString()}
											</span>
											<p className='mt-0.5 text-[10px] leading-none font-semibold text-zinc-400'>
												credits
											</p>
										</div>
									</div>

									{!pack.available && (
										<span className='rounded-md bg-zinc-100 px-1.5 py-0.5 text-[9px] font-bold text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400'>
											Unavailable
										</span>
									)}
								</div>
								<p className='mt-5 text-xl font-black text-zinc-950 dark:text-zinc-100'>
									{fmt(pack.price_cents)}
								</p>
							</div>

							<button
								type='button'
								onClick={() => buyCredits.mutate({ pack_key: pack.key })}
								disabled={buyCredits.isPending || !pack.available}
								className='mt-4 w-full rounded-xl bg-primary-400 py-2.5 text-center text-xs font-bold text-primary-950 shadow-md shadow-primary-500/10 transition hover:bg-primary-500 active:scale-95 disabled:opacity-60'>
								Buy now
							</button>
						</div>
						);
					})
					)}
				</div>
			</section>

			{/* Recent transactions */}
			<section>
				<div className='mb-4 flex items-center justify-between'>
					<div className='flex items-center gap-2'>
						<FileText size={16} className='text-primary-500' />
						<h3 className='text-sm font-black text-zinc-900 dark:text-zinc-100'>
							Recent Transactions
						</h3>
					</div>
					<Link
						to={pages.settings.subPages.billing.subPages.history.to}
						className='flex items-center gap-1 text-xs font-bold text-primary-600 transition hover:text-primary-700 dark:text-primary-400'>
						<span>View all</span>
						<ArrowRight size={12} />
					</Link>
				</div>
				{recentTx.length === 0 ? (
					<p className='text-xs font-semibold text-zinc-400 dark:text-zinc-500'>
						No transactions yet.
					</p>
				) : (
					<div className='overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-700 dark:bg-zinc-900'>
						{recentTx.map((tx, i) => {
							const isNeg = tx.credits < 0;
							return (
								<div
									key={tx.id}
									className={`flex items-center gap-4 px-5 py-3.5 ${i > 0 ? 'border-t border-zinc-100 dark:border-zinc-800' : ''}`}>
									<span className='min-w-0 flex-1 truncate text-sm text-zinc-700 dark:text-zinc-300'>
										{tx.description || tx.type}
									</span>
									<span
										className={`shrink-0 text-sm font-black ${isNeg ? 'text-red-500' : 'text-emerald-500'}`}>
										{isNeg ? '' : '+'}
										{tx.credits.toLocaleString()}
									</span>
									<span className='shrink-0 text-xs text-zinc-400'>
										{new Date(tx.created_at).toLocaleDateString(undefined, {
											month: 'short',
											day: 'numeric',
										})}
									</span>
								</div>
							);
						})}
					</div>
				)}
			</section>
		</div>
	);
};

export default BillingOverviewPage;
