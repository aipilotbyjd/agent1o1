import { Check, Zap, Sparkles, Crown } from 'lucide-react';
import { useOnboardingStore } from '../../_context/OnboardingStore.context';
import { PLANS } from '../../_helper/onboarding.constants';
import { useOnboardingState } from '@/api/modules/onboarding';

const PlanSelectionStep = () => {
	const { state, dispatch } = useOnboardingStore();
	const { selectedPlan } = state;
	const { data: onboardingData } = useOnboardingState(false); // fetch from react-query cache

	const backendPlans = onboardingData?.meta?.plans || PLANS.map(p => ({
		id: p.id,
		name: p.name,
		slug: p.id,
		price_monthly: p.id === 'free' ? 0 : p.id === 'pro' ? 2900 : 7900,
	}));

	return (
		<>
			<div>
				<h1 className='text-3xl leading-tight font-extrabold tracking-tight text-slate-950 dark:text-zinc-50'>
					Pick your pace
				</h1>
				<p className='mt-2 text-sm font-medium text-slate-500 dark:text-zinc-400'>
					Every plan includes full access to agents and workflows. Upgrade or downgrade
					whenever you're ready.
				</p>
			</div>

			<div className='space-y-3'>
				{backendPlans.map((plan) => {
					const isSelected = selectedPlan === plan.slug;
					const PlanIcon =
						plan.slug === 'free' ? Zap : plan.slug === 'pro' ? Sparkles : Crown;
					
					// Match with local PLANS to get rich descriptions/features
					const localPlan = PLANS.find((p) => p.id === plan.slug);
					const features = localPlan?.features || [];
					const badge = localPlan?.badge;
					const highlighted = localPlan?.highlighted;
					const priceDisplay = plan.price_monthly === 0 ? '$0' : `$${plan.price_monthly / 100}`;
					const periodDisplay = plan.price_monthly === 0 ? 'forever' : '/ month';

					return (
						<button
							key={plan.slug}
							type='button'
							onClick={() =>
								dispatch({ type: 'SET_FIELD', payload: { selectedPlan: plan.slug } })
							}
							className={`relative flex w-full items-start gap-3.5 rounded-2xl border p-4 text-left transition-all ${
								isSelected
									? 'border-primary-500 bg-primary-400/5 ring-1 ring-primary-500/20'
									: highlighted
										? 'border-primary-200 bg-white/40 hover:bg-slate-50 dark:border-primary-900/50 dark:bg-zinc-950/20 dark:hover:bg-zinc-800/30'
										: 'border-slate-200 bg-white/40 hover:bg-slate-50 dark:border-zinc-800/80 dark:bg-zinc-950/20 dark:hover:bg-zinc-800/30'
							}`}>
							{badge && (
								<span className='absolute -top-2.5 left-4 rounded-full bg-primary-400 px-2.5 py-0.5 text-[10px] font-black text-primary-950'>
									{badge}
								</span>
							)}

							{/* Radio */}
							<div
								className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${isSelected ? 'border-primary-500 bg-primary-400' : 'border-slate-300 dark:border-zinc-600'}`}>
								{isSelected && (
									<div className='h-1.5 w-1.5 rounded-full bg-white' />
								)}
							</div>

							{/* Icon */}
							<div
								className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border transition-colors ${isSelected ? 'border-primary-300 bg-primary-400/10 text-primary-600 dark:border-primary-800 dark:text-primary-400' : 'border-slate-200 text-slate-400 dark:border-zinc-800'}`}>
								<PlanIcon className='h-4 w-4' />
							</div>

							{/* Content */}
							<div className='min-w-0 flex-1'>
								<div className='flex items-baseline gap-1.5'>
									<span
										className={`text-sm font-black ${isSelected ? 'text-primary-600 dark:text-primary-400' : 'text-slate-900 dark:text-zinc-100'}`}>
										{plan.name}
									</span>
									<span className='text-base font-black text-slate-900 dark:text-zinc-100'>
										{priceDisplay}
									</span>
									<span className='text-[10px] text-slate-400'>
										{periodDisplay}
									</span>
								</div>
								<ul className='mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5'>
									{features.map((f) => (
										<li
											key={f}
											className='flex items-center gap-1 text-[10px] text-slate-500 dark:text-zinc-400'>
											<Check className='h-2.5 w-2.5 shrink-0 text-emerald-500' />
											{f}
										</li>
									))}
								</ul>
							</div>
						</button>
					);
				})}
			</div>

			<p className='text-[10px] text-slate-400'>
				No credit card required to get started. Switch plans any time from your settings.
			</p>
		</>
	);
};

export default PlanSelectionStep;
