import { FC, useState } from 'react';
import { useSubmitOnboardingDiscovery } from '@/api/modules/onboarding';
import OptionCard from '../_parts/OptionCard.part';
import StepFooter from '../_parts/StepFooter.part';
import { TOnboardingStepProps } from '../onboarding.types';

const DiscoverySurveyStep: FC<TOnboardingStepProps> = ({ state, onNext, onBack }) => {
	const submitDiscovery = useSubmitOnboardingDiscovery();
	const [selected, setSelected] = useState<string | null>(null);

	const sources = state.meta.discovery_sources ?? [];

	const handleSubmit = () => {
		if (!selected) return;
		submitDiscovery.mutate({ discovery_source: selected }, { onSuccess: () => onNext() });
	};

	return (
		<div>
			<h2 className='text-xl font-bold text-zinc-800 dark:text-white'>
				How did you hear about us?
			</h2>
			<p className='mt-1 text-sm text-zinc-500 dark:text-zinc-400'>
				Last one — it genuinely helps us know where to show up.
			</p>

			<div className='mt-6 grid gap-3 sm:grid-cols-2'>
				{sources.map((source) => (
					<OptionCard
						key={source.value}
						title={source.label}
						isSelected={selected === source.value}
						onSelect={() => setSelected(source.value)}
					/>
				))}
			</div>

			<StepFooter
				onBack={onBack}
				onSkip={onNext}
				submitLabel='Continue'
				onSubmit={handleSubmit}
				isLoading={submitDiscovery.isPending}
				isDisabled={!selected}
			/>
		</div>
	);
};

export default DiscoverySurveyStep;
