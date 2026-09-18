import { useEffect, useState } from 'react';
import { AlertTriangle, CreditCard, Package, Sparkles } from 'lucide-react';
import { useWorkspaceContext } from '@/context/workspace';
import { useCreditBalance, useCreditPacks } from '@/api/modules/credits';
import { useBuyCredits, usePackCatalog } from '@/api/modules/billing';
import type { TCreditPack } from '@/types/credit.type';
import { primaryBtn } from '@/pages/settings/_shared/buttons';

const formatPrice = (cents: number) =>
	new Intl.NumberFormat('en-US', {
		style: 'currency',
		currency: 'USD',
		minimumFractionDigits: 0,
	}).format(cents / 100);

const packStatusBadge: Record<TCreditPack['status'], { bg: string; text: string; label: string }> =
	{
		pending: {
			bg: 'bg-zinc-100 dark:bg-zinc-800',
			text: 'text-zinc-600 dark:text-zinc-400',
			label: 'Pending',
		},
		active: {
			bg: 'bg-emerald-50 dark:bg-emerald-950',
			text: 'text-emerald-700 dark:text-emerald-400',
			label: 'Active',
		},
		exhausted: {
			bg: 'bg-zinc-100 dark:bg-zinc-800',
			text: 'text-zinc-500 dark:text-zinc-500',
			label: 'Exhausted',
		},
		expired: {
			bg: 'bg-red-50 dark:bg-red-950',
			text: 'text-red-600 dark:text-red-400',
			label: 'Expired',
		},
		refunded: {
			bg: 'bg-amber-50 dark:bg-amber-950',
			text: 'text-amber-700 dark:text-amber-400',
			label: 'Refunded',
		},
	};

const CreditsPage = () => {
	const { activeWorkspaceId } = useWorkspaceContext();
	const { data: balance, isLoading: balanceLoading } = useCreditBalance(activeWorkspaceId);
	const { data: activePacks, isLoading: packsLoading } = useCreditPacks(activeWorkspaceId);
	const { data: catalog, isLoading: catalogLoading } = usePackCatalog(activeWorkspaceId);
	const buyCredits = useBuyCredits(activeWorkspaceId);

	const [selected, setSelected] = useState<string | null>(null);

	useEffect(() => {
		if (!selected && catalog && catalog.length > 0) {
			setSelected(catalog[Math.min(1, catalog.length - 1)].key);
		}
	}, [catalog, selected]);

	const credits = balance?.credits;
	const remaining = credits?.remaining ?? 0;
	const limit = credits?.limit ?? 0;
	const fromPacks = credits?.from_packs ?? 0;
	const rolledOver = credits?.rolled_over ?? 0;
	const totalAvailable = limit + fromPacks + rolledOver;
	const usedPct =
		totalAvailable > 0
			? Math.min(100, Math.round(((totalAvailable - remaining) / totalAvailable) * 100))
			: 0;
	const barColor =
		usedPct >= 80 ? 'bg-red-500' : usedPct >= 60 ? 'bg-yellow-500' : 'bg-emerald-500';

	const packs = catalog ?? [];
	const selectedPack = packs.find((p) => p.key === selected);

	return (
		<div className='text-zinc-950 dark:text-zinc-50'>
			<div>
				<h1 className='text-3xl font-black tracking-tight text-zinc-950 dark:text-zinc-50'>Buy Credits</h1>
				<p className='mt-1 text-sm font-medium text-zinc-500 dark:text-zinc-400'>
					Top up your workspace with a one-time credit pack. Credits are added instantly.
				</p>
			</div>

			<div className='mt-8 grid gap-6 lg:grid-cols-[1fr_340px]'>
				{/* Pack selection */}
				<div>
					<h2 className='text-sm font-black tracking-widest text-zinc-400 uppercase dark:text-zinc-500'>
						Select a pack
					</h2>
					{catalogLoading ? (
						<div className='mt-3 grid gap-3 sm:grid-cols-2'>
							{[1, 2, 3, 4].map((i) => (
								<div
									key={i}
									className='h-24 animate-pulse rounded-2xl bg-zinc-100 dark:bg-zinc-800'
								/>
							))}
						</div>
					) : (
						<div className='mt-3 grid gap-3 sm:grid-cols-2'>
							{packs.map((pack) => (
								<button
									key={pack.key}
									type='button'
									disabled={!pack.available}
									onClick={() => setSelected(pack.key)}
									className={[
										'relative rounded-2xl border p-5 text-left transition disabled:cursor-not-allowed disabled:opacity-50',
										selected === pack.key
											? 'border-zinc-950 bg-zinc-950 text-zinc-50 dark:border-zinc-50 dark:bg-zinc-50 dark:text-zinc-950'
											: 'border-zinc-200 bg-white hover:border-zinc-300 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:border-zinc-600',
									].join(' ')}>
									<div className='flex items-start justify-between'>
										<div>
											<p className='text-xl font-black'>
												{pack.credits.toLocaleString()}
											</p>
											<p
												className={`text-xs font-semibold ${selected === pack.key ? 'text-zinc-300 dark:text-zinc-700' : 'text-zinc-400 dark:text-zinc-500'}`}>
												credits
											</p>
										</div>
										<p className='text-2xl font-black'>
											{formatPrice(pack.price_cents)}
										</p>
									</div>
									{!pack.available && (
										<div className='mt-3 flex items-center gap-1.5'>
											<Sparkles size={12} className='text-zinc-400' />
											<span className='text-xs font-bold text-zinc-400'>
												Not available on your plan
											</span>
										</div>
									)}
								</button>
							))}
						</div>
					)}

					{/* Checkout summary */}
					{selectedPack && (
					<div className='mt-4 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-700 dark:bg-zinc-900'>
						<div className='flex items-center justify-between'>
							<div>
								<p className='text-sm font-black'>Order summary</p>
								<p className='mt-1 text-sm text-zinc-500 dark:text-zinc-400'>
									<span className='font-bold text-zinc-800 dark:text-zinc-200'>
										{selectedPack.credits.toLocaleString()} credits
									</span>
								</p>
							</div>
							<div className='text-right'>
								<p className='text-2xl font-black'>
									{formatPrice(selectedPack.price_cents)}
								</p>
								<p className='text-xs text-zinc-400 dark:text-zinc-500'>one-time</p>
							</div>
						</div>
						<button
							type='button'
							disabled={buyCredits.isPending || !selectedPack.available}
							onClick={() => buyCredits.mutate({ pack_key: selectedPack.key })}
							className={`${primaryBtn} mt-4 w-full`}>
							<CreditCard size={16} />
							{buyCredits.isPending
								? 'Redirecting to checkout…'
								: `Buy ${selectedPack.credits.toLocaleString()} credits`}
						</button>
						<p className='mt-2 text-center text-xs text-zinc-400 dark:text-zinc-500'>
							Secure payment via Stripe. Credits activate instantly after payment.
						</p>
					</div>
					)}
				</div>

				{/* Sidebar */}
				<div className='flex flex-col gap-4'>
					{/* Current balance */}
					<div className='rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-700 dark:bg-zinc-900'>
						<p className='text-xs font-black tracking-widest text-zinc-400 uppercase dark:text-zinc-500'>
							Current balance
						</p>
						{balanceLoading ? (
							<div className='mt-3 h-16 animate-pulse rounded-xl bg-zinc-100 dark:bg-zinc-800' />
						) : (
							<>
								<p className='mt-2 text-3xl font-black'>
									{remaining.toLocaleString()}
								</p>
								<p className='text-sm text-zinc-400 dark:text-zinc-500'>
									credits remaining
								</p>
								<div className='mt-3 h-2 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-700'>
									<div
										className={`h-full rounded-full ${barColor}`}
										style={{ width: `${100 - usedPct}%` }}
									/>
								</div>
								<p className='mt-1.5 text-xs text-zinc-400 dark:text-zinc-500'>
									{usedPct}% used of {totalAvailable.toLocaleString()} total
								</p>
								{fromPacks > 0 && (
									<p className='mt-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400'>
										+{fromPacks.toLocaleString()} from packs
									</p>
								)}
								{rolledOver > 0 && (
									<p className='mt-0.5 text-xs font-semibold text-sky-600 dark:text-sky-400'>
										+{rolledOver.toLocaleString()} rolled over
									</p>
								)}
								{remaining <= 0 && (
									<div className='mt-3 flex items-center gap-2 rounded-xl bg-red-50 px-3 py-2 text-xs font-bold text-red-600 dark:bg-red-950 dark:text-red-400'>
										<AlertTriangle size={13} />
										Executions paused
									</div>
								)}
							</>
						)}
					</div>

					{/* Credit priority info */}
					<div className='rounded-2xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-800/50'>
						<p className='text-xs font-black text-zinc-600 dark:text-zinc-400'>
							Credit consumption order
						</p>
						<ol className='mt-2 space-y-1 text-xs text-zinc-500 dark:text-zinc-400'>
							<li>1. Plan credits (consumed first)</li>
							<li>2. Pack credits (oldest expiry first)</li>
						</ol>
					</div>
				</div>
			</div>

			{/* Active packs list */}
			<section className='mt-8 rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-700 dark:bg-zinc-900'>
				<div className='flex items-center gap-2 border-b border-zinc-200 px-5 py-4 dark:border-zinc-700'>
					<Package size={16} className='text-zinc-500 dark:text-zinc-400' />
					<h2 className='text-sm font-black text-zinc-700 dark:text-zinc-300'>
						Active packs
					</h2>
				</div>
				<div className='px-5'>
					{packsLoading ? (
						<div className='flex flex-col gap-3 py-6'>
							{[1, 2].map((i) => (
								<div
									key={i}
									className='h-14 animate-pulse rounded-xl bg-zinc-100 dark:bg-zinc-800'
								/>
							))}
						</div>
					) : !activePacks || activePacks.length === 0 ? (
						<div className='flex flex-col items-center gap-2 py-10 text-center'>
							<Package size={28} className='text-zinc-300 dark:text-zinc-600' />
							<p className='text-sm font-bold text-zinc-500 dark:text-zinc-400'>
								No credit packs
							</p>
							<p className='text-xs text-zinc-400 dark:text-zinc-500'>
								Purchased packs will appear here.
							</p>
						</div>
					) : (
						<table className='w-full'>
							<thead>
								<tr className='text-left text-xs font-black text-zinc-400 dark:text-zinc-500'>
									<th className='py-3 pr-4 font-black'>Pack</th>
									<th className='py-3 pr-4 font-black'>Status</th>
									<th className='py-3 pr-4 font-black'>Credits remaining</th>
									<th className='py-3 pr-4 font-black'>Expires</th>
									<th className='py-3 font-black'>Purchased</th>
								</tr>
							</thead>
							<tbody>
								{activePacks.map((pack) => {
									const badge = packStatusBadge[pack.status];
									const progressPct = Math.round(
										(pack.credits_remaining / pack.credits_amount) * 100,
									);
									return (
										<tr
											key={pack.id}
											className='border-b border-zinc-100 last:border-none dark:border-zinc-800'>
											<td className='py-3 pr-4'>
												<p className='text-sm font-bold'>
													{pack.credits_amount.toLocaleString()} credits
												</p>
												<p className='text-xs text-zinc-400 dark:text-zinc-500'>
													{formatPrice(pack.price_cents)} ·{' '}
													{pack.currency.toUpperCase()}
												</p>
											</td>
											<td className='py-3 pr-4'>
												<span
													className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-bold ${badge.bg} ${badge.text}`}>
													{badge.label}
												</span>
											</td>
											<td className='py-3 pr-4'>
												<div className='flex items-center gap-2'>
													<div className='h-1.5 w-20 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-700'>
														<div
															className='h-full rounded-full bg-emerald-500'
															style={{ width: `${progressPct}%` }}
														/>
													</div>
													<span className='text-xs font-bold text-zinc-700 dark:text-zinc-300'>
														{pack.credits_remaining.toLocaleString()} /{' '}
														{pack.credits_amount.toLocaleString()}
													</span>
												</div>
											</td>
											<td className='py-3 pr-4 text-xs text-zinc-500 dark:text-zinc-400'>
												{pack.expires_at
													? new Date(pack.expires_at).toLocaleDateString(
															undefined,
															{
																month: 'short',
																day: 'numeric',
																year: 'numeric',
															},
														)
													: '—'}
											</td>
											<td className='py-3 text-xs text-zinc-500 dark:text-zinc-400'>
												{new Date(pack.purchased_at).toLocaleDateString(
													undefined,
													{
														month: 'short',
														day: 'numeric',
														year: 'numeric',
													},
												)}
											</td>
										</tr>
									);
								})}
							</tbody>
						</table>
					)}
				</div>
			</section>
		</div>
	);
};

export default CreditsPage;
