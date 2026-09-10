import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { useOnboardingStore } from '../../_context/OnboardingStore.context';
import { ROLES } from '../../_helper/onboarding.constants';
import { useOnboardingState } from '@/api/modules/onboarding';

const RoleSelectionStep = () => {
	const { state, dispatch } = useOnboardingStore();
	const { selectedJobRole } = state;
	const { data: onboardingData } = useOnboardingState(false); // fetch from react-query cache

	const rolesList = onboardingData?.meta?.job_roles || ROLES.map((r) => ({
		value: r.name.toLowerCase(),
		label: r.name,
		description: r.description,
	}));

	return (
		<>
			<div>
				<h1 className='text-3xl leading-tight font-extrabold tracking-tight text-slate-950 dark:text-zinc-50'>
					What does your day look like?
				</h1>
				<p className='mt-2 text-sm font-medium text-slate-500 dark:text-zinc-400'>
					Pick your role and we'll pre-load the integrations and templates that match how
					you actually work.
				</p>
			</div>

			<div className='no-scrollbar max-h-[300px] space-y-2 overflow-y-auto pr-1'>
				{rolesList.map((role, idx) => {
					const isSelected = selectedJobRole === role.value;
					return (
						<motion.button
							whileTap={{ scale: 0.98 }}
							key={role.value}
							onClick={() =>
								dispatch({
									type: 'SET_FIELD',
									payload: { selectedJobRole: role.value, selectedRoleIndex: idx },
								})
							}
							className={`flex w-full flex-col rounded-xl border p-3 px-4 text-left transition-all ${
								isSelected
									? 'border-primary-500 bg-primary-400/5 ring-1 ring-primary-500/20'
									: 'border-slate-150 bg-white/40 hover:bg-slate-50 dark:border-zinc-800/80 dark:bg-zinc-950/20 dark:hover:bg-zinc-800/30'
							}`}>
							<div className='flex items-center justify-between'>
								<span
									className={`text-sm font-bold ${isSelected ? 'text-primary-600 dark:text-primary-400' : 'text-slate-900 dark:text-zinc-100'}`}>
									{role.label}
								</span>
								{isSelected && (
									<span className='flex h-5 w-5 items-center justify-center rounded-full bg-primary-400 text-primary-950'>
										<Check className='h-3 w-3 stroke-[3]' />
									</span>
								)}
							</div>
							<p className='mt-0.5 text-xs text-slate-400'>{role.description}</p>
						</motion.button>
					);
				})}
			</div>
		</>
	);
};

export default RoleSelectionStep;
