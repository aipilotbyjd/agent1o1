import { useState } from 'react';
import { Check, X, Zap } from 'lucide-react';
import { useWorkspaceContext } from '@/context/workspaceContext';
import { usePlans, useSubscription } from '@/api/modules/plans';
import { useBillingCheckout } from '@/api/modules/billing';
import type { TBillingInterval, TPlanFeatures } from '@/types/billing.type';

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

function fmtLimit(val: number | null | undefined): string {
	if (val === null || val === undefined || val === -1) return '∞';
	return val.toLocaleString();
}

const PlanUpgradePage = () => {
	const { activeWorkspaceId } = useWorkspaceContext();
	const { data: plans, isLoading } = usePlans();
	const { data: subscription } = useSubscription(activeWorkspaceId);
	const switchPlan = useBillingCheckout(activeWorkspaceId);
	const [interval, setInterval] = useState<TBillingInterval>('monthly');

	const currentSlug = subscription?.plan?.slug;
	const currentInterval = subscription?.billing_interval;
	const isCurrentLifetime = subscription?.is_lifetime ?? false;

	if (isLoading) {
		return (
			<div className='space-y-4'>
				{[...Array(3)].map((_, i) => (
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
			{/* Header */}
			<div className='text-center'>
				<h1 className='text-3xl font-black tracking-tight text-zinc-950 dark:text-zinc-50'>Choose a Plan</h1>
				<p className='mt-1 text-sm font-medium text-zinc-500 dark:text-zinc-400'>
					Upgrade or downgrade at any time. Cancel anytime.
				</p>

				{/* Interval toggle */}
				<div className='mt-6 inline-flex items-center gap-1 rounded-2xl border border-zinc-200 bg-zinc-50 p-1 dark:border-zinc-700 dark:bg-zinc-800'>
					{(['monthly', 'yearly'] as const).map((opt) => (
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
							{opt === 'monthly' ? 'Monthly' : 'Yearly'}
							{opt === 'yearly' && (
								<span className='ml-1.5 rounded-full bg-emerald-100 px-1.5 py-0.5 text-[10px] font-black text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300'>
									Save 30%
								</span>
							)}
						</button>
					))}
				</div>
			</div>

			{/* Plan cards */}
			<div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
				{plans?.map((plan) => {
					const isCurrent =
						plan.slug === currentSlug &&
						!isCurrentLifetime &&
						currentInterval === interval;
					const price = interval === 'yearly' ? plan.price_yearly : plan.price_monthly;
					const isEnterprise = plan.slug === 'enterprise';

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
								{isEnterprise ? (
									<span className='text-3xl font-black'>Custom</span>
								) : price === 0 ? (
									<span className='text-3xl font-black'>Free</span>
								) : (
									<>
										<span className='text-3xl font-black'>${price / 100}</span>
										<span
											className={`ml-1 text-sm ${isCurrent ? 'text-white/60 dark:text-black/60' : 'text-zinc-400'}`}>
											/mo
										</span>
									</>
								)}
							</div>

							{/* Key limits */}
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
									{fmtLimit(plan.limits.credits_monthly)} credits/mo
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
									{fmtLimit(plan.limits.active_workflows)} active workflows
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
									{fmtLimit(plan.limits.members)} team members
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
									{fmtLimit(plan.limits.execution_log_retention_days)}-day log
									retention
								</li>
							</ul>

							{/* CTA */}
							<div className='mt-6'>
								{isEnterprise ? (
									<a
										href='mailto:sales@agent1o1.com'
										className='flex w-full items-center justify-center rounded-xl border border-zinc-200 py-2.5 text-sm font-bold transition hover:bg-zinc-50 dark:border-zinc-600 dark:hover:bg-zinc-800'>
										Contact sales
									</a>
								) : isCurrent ? (
									<div className='flex w-full items-center justify-center rounded-xl border border-white/20 py-2.5 text-sm font-bold dark:border-black/20'>
										Current plan
									</div>
								) : (
									<button
										type='button'
										onClick={() =>
											switchPlan.mutate({
												plan_id: plan.id,
												interval,
											})
										}
										disabled={switchPlan.isPending}
										className='flex w-full items-center justify-center gap-2 rounded-xl bg-zinc-950 py-2.5 text-sm font-black text-white transition hover:bg-zinc-800 disabled:opacity-60 dark:bg-zinc-50 dark:text-zinc-950 dark:hover:bg-zinc-200'>
										<Zap size={14} />
										{switchPlan.isPending
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

			{/* Full feature comparison table */}
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
								{(Object.keys(FEATURE_LABELS) as (keyof TPlanFeatures)[]).map(
									(key) => (
										<tr
											key={key}
											className='border-b border-zinc-100 last:border-0 dark:border-zinc-800'>
											<td className='px-5 py-3 font-medium text-zinc-700 dark:text-zinc-300'>
												{FEATURE_LABELS[key]}
											</td>
											{plans.map((p) => (
												<td key={p.id} className='px-4 py-3 text-center'>
													{p.features[key] ? (
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
									),
								)}
							</tbody>
						</table>
					</div>
				</section>
			)}
		</div>
	);
};

export default PlanUpgradePage;
