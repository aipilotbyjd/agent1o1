import { FC, useState } from 'react';
import { useSelectOnboardingRole } from '@/api/modules/onboarding';
import OptionCard from '../_parts/OptionCard.part';
import StepFooter from '../_parts/StepFooter.part';
import { TOnboardingStepProps } from '../onboarding.types';

const RoleSelectionStep: FC<TOnboardingStepProps> = ({ state, onNext, onBack }) => {
	const selectRole = useSelectOnboardingRole();
	const [selected, setSelected] = useState<string | null>(null);

	const roles = state.meta.job_roles ?? [];

	const handleSubmit = () => {
		if (!selected) return;
		selectRole.mutate({ job_role: selected }, { onSuccess: () => onNext() });
	};

	return (
		<div>
			<h2 className='text-xl font-bold text-zinc-800 dark:text-white'>What do you work on?</h2>
			<p className='mt-1 text-sm text-zinc-500 dark:text-zinc-400'>
				We use this to suggest the agents and connectors your team actually needs.
			</p>

			<div className='mt-6 grid gap-3 sm:grid-cols-2'>
				{roles.map((role) => (
					<OptionCard
						key={role.value}
						title={role.label}
						description={role.description}
						isSelected={selected === role.value}
						onSelect={() => setSelected(role.value)}
					/>
				))}
			</div>

			<StepFooter
				onBack={onBack}
				onSkip={onNext}
				submitLabel='Continue'
				onSubmit={handleSubmit}
				isLoading={selectRole.isPending}
				isDisabled={!selected}
			/>
		</div>
	);
};

export default RoleSelectionStep;
