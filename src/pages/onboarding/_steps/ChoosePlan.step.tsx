import { FC, useState } from 'react';
import { useSelectOnboardingPlan } from '@/api/modules/onboarding';
import priceFormat from '@/utils/priceFormat.util';
import Badge from '@/components/ui/Badge';
import OptionCard from '../_parts/OptionCard.part';
import StepFooter from '../_parts/StepFooter.part';
import { TOnboardingStepProps } from '../onboarding.types';

const ChoosePlanStep: FC<TOnboardingStepProps> = ({ state, onNext, onBack }) => {
	const selectPlan = useSelectOnboardingPlan();
	const plans = state.meta.plans ?? [];

	const [selected, setSelected] = useState<string | null>(
		plans.find((plan) => plan.price_monthly === 0)?.slug ?? null,
	);

	const handleSubmit = () => {
		if (!selected) return;
		selectPlan.mutate({ plan_slug: selected }, { onSuccess: () => onNext() });
	};

	return (
		<div>
			<h2 className='text-xl font-bold text-zinc-800 dark:text-white'>Pick a plan</h2>
			<p className='mt-1 text-sm text-zinc-500 dark:text-zinc-400'>
				Start free and upgrade whenever you need more. Paid plans are charged from Billing,
				not here.
			</p>

			<div className='mt-6 grid gap-3'>
				{plans.map((plan) => (
					<OptionCard
						key={plan.slug}
						title={plan.name}
						description={
							<>
								{plan.description}
								{plan.credits_monthly > 0 && (
									<span className='mt-1 block text-xs'>
										{plan.credits_monthly.toLocaleString('en-US')} credits per
										month
									</span>
								)}
							</>
						}
						aside={
							plan.price_monthly === 0 ? (
								<Badge color='emerald' variant='outline'>
									Free
								</Badge>
							) : (
								<span className='text-sm font-semibold text-zinc-800 dark:text-white'>
									{/* `price_*` are unsigned integers in the currency's
									    minor unit (2900 = $29.00), Stripe-style. */}
									{priceFormat(plan.price_monthly / 100)}
									<span className='text-xs font-normal text-zinc-500'>/mo</span>
								</span>
							)
						}
						isSelected={selected === plan.slug}
						onSelect={() => setSelected(plan.slug)}
					/>
				))}

				{plans.length === 0 && (
					<p className='rounded-xl border border-dashed border-zinc-300 p-6 text-center text-sm text-zinc-500 dark:border-zinc-700'>
						No plans are published yet. You can skip this and pick one later from
						Billing.
					</p>
				)}
			</div>

			<StepFooter
				onBack={onBack}
				onSkip={onNext}
				submitLabel='Continue'
				onSubmit={handleSubmit}
				isLoading={selectPlan.isPending}
				isDisabled={!selected}
			/>
		</div>
	);
};

export default ChoosePlanStep;
