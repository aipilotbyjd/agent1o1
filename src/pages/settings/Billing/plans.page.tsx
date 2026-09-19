import { useState } from 'react';
import { useParams } from 'react-router';
import { Check, X, Zap } from 'lucide-react';
import { useBillingOverview, useCheckoutSubscription, usePlans } from '@/api/modules/billing';
import type { TBillingInterval } from '@/types/billing.type';

const FEATURE_LABELS: Record<string, string> = {
	credit_packs: 'Credit pack top-ups',
	credit_overage: 'Overage protection',
	git_sync: 'Git sync',
	workflow_approvals: 'Approval workflows',
	custom_nodes: 'Custom nodes',
	priority_support: 'Priority support',
};

const INTERVAL_LABELS: Record<TBillingInterval, string> = {
	monthly: 'Monthly',
	quarterly: 'Quarterly',
	yearly: 'Yearly',
	lifetime: 'Lifetime',
};

const fmtLimit = (val: number | null | undefined) =>
	val === null || val === undefined || val < 0 ? '∞' : val.toLocaleString();

const priceForInterval = (
	plan: {
		price_monthly: number;
		price_quarterly: number;
		price_yearly: number;
		price_lifetime: number;
	},
	interval: TBillingInterval,
) =>
	({
		monthly: plan.price_monthly,
		quarterly: plan.price_quarterly,
		yearly: plan.price_yearly,
		lifetime: plan.price_lifetime,
	})[interval];

const BillingPlansPage = () => {
	const { workspaceId } = useParams<{ workspaceId: string }>();
	const { data: plans, isLoading } = usePlans(workspaceId!);
	const { data: overview } = useBillingOverview(workspaceId!);
	const checkout = useCheckoutSubscription(workspaceId!);
	const [interval, setInterval] = useState<TBillingInterval>('monthly');

	const currentSlug = overview?.current_plan?.slug;

	const handleCheckout = async (planId: string) => {
		const result = await checkout.mutateAsync({ plan_id: planId, interval });
		if ('checkout_url' in result) {
			window.location.href = result.checkout_url;
		}
	};

	if (isLoading) {
		return (
			<div className='space-y-4'>
				{[1, 2, 3].map((i) => (
					<div
						key={i}
						className='h-24 animate-pulse rounded-2xl bg-zinc-100 dark:bg-zinc-800'
					/>
				))}
			</div>
		);
	}

	return (
		<div className='space-y-8 text-zinc-950 dark:text-zinc-50'>
			<div className='text-center'>
				<h1 className='text-3xl font-black tracking-tight text-zinc-950 dark:text-zinc-50'>
					Choose a Plan
				</h1>
				<p className='mt-1 text-sm font-medium text-zinc-500 dark:text-zinc-400'>
					Upgrade or downgrade at any time. Cancel anytime.
				</p>

				<div className='mt-6 inline-flex flex-wrap items-center gap-1 rounded-2xl border border-zinc-200 bg-zinc-50 p-1 dark:border-zinc-700 dark:bg-zinc-800'>
					{(Object.keys(INTERVAL_LABELS) as TBillingInterval[]).map((opt) => (
						<button
							key={opt}
							type='button'
							onClick={() => setInterval(opt)}
							className={[
								'rounded-xl px-5 py-2 text-sm font-bold transition-all',
								interval === opt
									? 'bg-white text-zinc-950 shadow-sm dark:bg-zinc-900 dark:text-zinc-50'
									: 'text-zinc-500 hover:text-zinc-700',
							].join(' ')}>
							{INTERVAL_LABELS[opt]}
						</button>
					))}
				</div>
			</div>

			<div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
				{plans?.map((plan) => {
					const isCurrent = plan.slug === currentSlug;
					const price = priceForInterval(plan, interval);
					const soldOnInterval = plan.available_intervals.includes(interval);

					return (
						<div
							key={plan.id}
							className={[
								'relative flex flex-col rounded-2xl border p-6 shadow-sm transition',
								isCurrent
									? 'border-zinc-900 bg-zinc-950 text-white dark:border-zinc-200 dark:bg-white dark:text-zinc-950'
									: 'border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900',
							].join(' ')}>
							{isCurrent && (
								<span className='absolute top-4 right-4 rounded-full bg-white/20 px-2.5 py-1 text-[10px] font-black dark:bg-black/20'>
									Current plan
								</span>
							)}

							<p
								className={`text-xs font-bold tracking-widest uppercase ${isCurrent ? 'text-white/60 dark:text-black/60' : 'text-zinc-400'}`}>
								{plan.description}
							</p>
							<h3 className='mt-1 text-xl font-black'>{plan.name}</h3>
							<div className='mt-3'>
								{price === 0 ? (
									<span className='text-3xl font-black'>Free</span>
								) : (
									<>
										<span className='text-3xl font-black'>
											${(price / 100).toFixed(0)}
										</span>
										<span
											className={`ml-1 text-sm ${isCurrent ? 'text-white/60 dark:text-black/60' : 'text-zinc-400'}`}>
											{interval === 'lifetime'
												? ' once'
												: ` /${interval === 'monthly' ? 'mo' : interval === 'quarterly' ? '3mo' : 'yr'}`}
										</span>
									</>
								)}
							</div>

							<ul
								className={`mt-4 space-y-1.5 border-t pt-4 text-sm ${isCurrent ? 'border-white/20 dark:border-black/20' : 'border-zinc-100 dark:border-zinc-800'}`}>
								<li className='flex items-center gap-2'>
									<Check
										size={14}
										className={
											isCurrent
												? 'text-white dark:text-zinc-950'
												: 'text-emerald-500'
										}
									/>
									{fmtLimit(plan.credits_monthly)} credits/mo
								</li>
								<li className='flex items-center gap-2'>
									<Check
										size={14}
										className={
											isCurrent
												? 'text-white dark:text-zinc-950'
												: 'text-emerald-500'
										}
									/>
									{fmtLimit(plan.limits?.workflows)} workflows
								</li>
								<li className='flex items-center gap-2'>
									<Check
										size={14}
										className={
											isCurrent
												? 'text-white dark:text-zinc-950'
												: 'text-emerald-500'
										}
									/>
									{fmtLimit(plan.limits?.agents)} agents
								</li>
								<li className='flex items-center gap-2'>
									<Check
										size={14}
										className={
											isCurrent
												? 'text-white dark:text-zinc-950'
												: 'text-emerald-500'
										}
									/>
									{fmtLimit(plan.limits?.members)} team members
								</li>
							</ul>

							<div className='mt-6'>
								{isCurrent ? (
									<div className='flex w-full items-center justify-center rounded-xl border border-white/20 py-2.5 text-sm font-bold dark:border-black/20'>
										Current plan
									</div>
								) : !soldOnInterval ? (
									<div className='flex w-full items-center justify-center rounded-xl border border-zinc-200 py-2.5 text-sm font-bold text-zinc-400 dark:border-zinc-700'>
										Not available on {INTERVAL_LABELS[interval].toLowerCase()}
									</div>
								) : (
									<button
										type='button'
										onClick={() => handleCheckout(plan.id)}
										disabled={checkout.isPending}
										className='flex w-full items-center justify-center gap-2 rounded-xl bg-zinc-950 py-2.5 text-sm font-black text-white transition hover:bg-zinc-800 disabled:opacity-60 dark:bg-zinc-50 dark:text-zinc-950 dark:hover:bg-zinc-200'>
										<Zap size={14} />
										{checkout.isPending
											? 'Processing…'
											: price === 0
												? 'Downgrade'
												: 'Upgrade'}
									</button>
								)}
							</div>
						</div>
					);
				})}
			</div>

			{plans && plans.length > 0 && (
				<section>
					<h3 className='mb-4 text-lg font-black'>Full Feature Comparison</h3>
					<div className='overflow-x-auto rounded-2xl border border-zinc-200 dark:border-zinc-700'>
						<table className='w-full min-w-[640px] text-sm'>
							<thead>
								<tr className='border-b border-zinc-100 dark:border-zinc-800'>
									<th className='px-5 py-3.5 text-left text-xs font-bold tracking-widest text-zinc-400 uppercase'>
										Feature
									</th>
									{plans.map((p) => (
										<th
											key={p.id}
											className={`px-4 py-3.5 text-center text-xs font-black tracking-widest uppercase ${p.slug === currentSlug ? 'text-zinc-950 dark:text-zinc-50' : 'text-zinc-400'}`}>
											{p.name}
										</th>
									))}
								</tr>
							</thead>
							<tbody>
								{Object.entries(FEATURE_LABELS).map(([key, label]) => (
									<tr
										key={key}
										className='border-b border-zinc-100 last:border-0 dark:border-zinc-800'>
										<td className='px-5 py-3 font-medium text-zinc-700 dark:text-zinc-300'>
											{label}
										</td>
										{plans.map((p) => (
											<td key={p.id} className='px-4 py-3 text-center'>
												{p.features?.[key] ? (
													<Check
														size={16}
														className='mx-auto text-emerald-500'
													/>
												) : (
													<X
														size={16}
														className='mx-auto text-zinc-300 dark:text-zinc-600'
													/>
												)}
											</td>
										))}
									</tr>
								))}
							</tbody>
						</table>
					</div>
				</section>
			)}
		</div>
	);
};

export default BillingPlansPage;
