import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router';
import { ArrowUpRight, Loader2, Sparkles } from 'lucide-react';
import { upgradeEvents } from '@/api/core';
import { useBillingOverview, useCheckoutSubscription, usePlans } from '@/api/modules/billing';
import { useWorkspaceContext } from '@/context/workspace';
import usePermission from '@/hooks/usePermission';
import paths from '@/Routes/paths';
import type { TPlan } from '@/types/billing.type';
import { formatPlanLimit, formatPlanPrice } from '@/utils/planFormat.util';
import Modal, { ModalBody, ModalHeader } from '@/components/ui/Modal';

/** How many plans the prompt offers: the next step up and the one after. */
const PLANS_OFFERED = 2;

const planHighlights = (plan: TPlan): string[] =>
	[
		`${plan.credits_monthly.toLocaleString()} credits / month`,
		plan.limits?.workflows !== undefined &&
			`${formatPlanLimit(plan.limits.workflows)} workflows`,
		plan.limits?.active_triggers !== undefined &&
			`${formatPlanLimit(plan.limits.active_triggers)} automations running`,
		plan.limits?.members !== undefined && `${formatPlanLimit(plan.limits.members)} members`,
	].filter((line): line is string => typeof line === 'string');

/**
 * What a plan limit or an empty credit balance (HTTP 402) shows instead of an
 * error: the reason, and the plans above the current one with one click to
 * checkout, trial first where the plan has one. Mounted once in the app
 * shell; opened by `upgradeEvents`.
 */
const UpgradePrompt = () => {
	const { activeWorkspaceId: ws } = useWorkspaceContext();
	const [reason, setReason] = useState<string | null>(null);
	const isOpen = reason !== null;
	const { can } = usePermission();
	const canManage = can('billing.manage');

	const { data: plans, isLoading } = usePlans(isOpen ? ws : '');
	const { data: overview } = useBillingOverview(isOpen ? ws : '');
	const checkout = useCheckoutSubscription(ws);

	useEffect(() => upgradeEvents.subscribe(({ message }) => setReason(message)), []);

	const offered = useMemo(() => {
		const currentPrice = overview?.current_plan?.price_monthly ?? 0;
		return (plans ?? [])
			.filter((plan) => plan.is_active && plan.price_monthly > currentPrice)
			.sort((a, b) => a.price_monthly - b.price_monthly)
			.slice(0, PLANS_OFFERED);
	}, [plans, overview]);

	const close = () => setReason(null);

	const startCheckout = (plan: TPlan) =>
		checkout.mutate(
			{ plan_id: plan.id, interval: 'monthly' },
			{
				onSuccess: (result) => {
					if ('checkout_url' in result) {
						window.location.href = result.checkout_url;
						return;
					}
					// An existing subscription was swapped in place: the new plan is live.
					close();
				},
			},
		);

	if (!ws) return null;

	return (
		<Modal isOpen={isOpen} setIsOpen={(open) => !open && close()} size='lg'>
			<ModalHeader setIsOpen={close}>
				<div className='flex items-center gap-3'>
					<span className='bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300 flex h-9 w-9 items-center justify-center rounded-xl'>
						<Sparkles size={18} />
					</span>
					<span className='text-xl font-extrabold tracking-tight text-zinc-950 dark:text-white'>
						Upgrade to keep going
					</span>
				</div>
			</ModalHeader>
			<ModalBody>
				<div className='flex flex-col gap-5 pt-1'>
					<p className='text-sm font-semibold text-zinc-600 dark:text-zinc-400'>
						{reason}
					</p>

					{isLoading ? (
						<p className='flex items-center gap-2 text-sm text-zinc-500'>
							<Loader2 className='size-4 animate-spin' />
							Loading plans…
						</p>
					) : offered.length === 0 ? (
						<p className='text-sm text-zinc-600 dark:text-zinc-400'>
							You are on our largest plan. Add credits from the billing page to keep
							going.
						</p>
					) : (
						<div className='grid gap-3 sm:grid-cols-2'>
							{offered.map((plan, index) => (
								<div
									key={plan.id}
									className={`flex flex-col gap-3 rounded-2xl border p-4 ${index === 0 ? 'border-zinc-950 dark:border-zinc-200' : 'border-zinc-200 dark:border-zinc-700'}`}>
									<div>
										<p className='text-base font-extrabold'>{plan.name}</p>
										<p className='text-sm font-bold text-zinc-600 dark:text-zinc-400'>
											${formatPlanPrice(plan.price_monthly)} / month
										</p>
									</div>
									<ul className='flex flex-col gap-1 text-xs font-medium text-zinc-600 dark:text-zinc-400'>
										{planHighlights(plan).map((line) => (
											<li key={line}>{line}</li>
										))}
									</ul>
									{canManage && (
										<button
											type='button'
											onClick={() => startCheckout(plan)}
											disabled={checkout.isPending}
											className={`mt-auto flex h-10 items-center justify-center gap-2 rounded-xl text-sm font-extrabold transition disabled:opacity-60 ${index === 0 ? 'bg-primary-500 text-primary-foreground hover:bg-primary-600' : 'bg-zinc-950 text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-950'}`}>
											{checkout.isPending &&
												checkout.variables?.plan_id === plan.id && (
													<Loader2 className='size-4 animate-spin' />
												)}
											{plan.trial_days > 0
												? `Start ${plan.trial_days}-day free trial`
												: `Upgrade to ${plan.name}`}
										</button>
									)}
								</div>
							))}
						</div>
					)}

					{!canManage && (
						<p className='text-xs font-medium text-zinc-500 dark:text-zinc-400'>
							Only your workspace's billing admins can change the plan. Ask one of
							them to upgrade.
						</p>
					)}

					<Link
						to={paths.billingPlans(ws)}
						onClick={close}
						className='flex items-center gap-1 self-start text-xs font-bold text-zinc-600 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-white'>
						Compare all plans and credit packs
						<ArrowUpRight className='size-3.5' />
					</Link>
				</div>
			</ModalBody>
		</Modal>
	);
};

export default UpgradePrompt;
