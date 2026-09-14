import { motion } from 'framer-motion';
import { useOnboardingStore } from '../../_context/OnboardingStore.context';
import { SURVEY_OPTIONS } from '../../_helper/onboarding.constants';

const DiscoveryStep = () => {
	const { state, dispatch } = useOnboardingStore();
	const { selectedSurvey } = state;

	return (
		<>
			<div>
				<h1 className='text-3xl leading-tight font-extrabold tracking-tight text-slate-950 dark:text-zinc-50'>
					You're almost there
				</h1>
				<p className='mt-2 text-sm font-medium text-slate-500 dark:text-zinc-400'>
					One quick question — how did you find us? It helps us reach more builders like
					you.
				</p>
			</div>

			<div className='no-scrollbar max-h-[300px] space-y-2 overflow-y-auto pr-1'>
				{SURVEY_OPTIONS.map((option) => {
					const isSelected = selectedSurvey === option;
					return (
						<motion.button
							whileTap={{ scale: 0.98 }}
							key={option}
							onClick={() =>
								dispatch({ type: 'SET_FIELD', payload: { selectedSurvey: option } })
							}
							className={`flex w-full items-center justify-between rounded-xl border p-3.5 text-left font-semibold transition-all ${
								isSelected
									? 'border-primary-500 bg-primary-400/5 text-primary-600 ring-1 ring-primary-500/20 dark:text-primary-400'
									: 'border-slate-100 bg-white/40 hover:bg-slate-50 dark:border-zinc-800/80 dark:bg-zinc-950/20 dark:hover:bg-zinc-800/30'
							}`}>
							<span className='text-xs text-slate-700 dark:text-zinc-200'>
								{option}
							</span>
							<div
								className={`flex h-4 w-4 items-center justify-center rounded-full border transition-colors ${isSelected ? 'border-primary-500 bg-primary-400' : 'border-slate-300 dark:border-zinc-700'}`}>
								{isSelected && (
									<div className='h-1.5 w-1.5 rounded-full bg-white' />
								)}
							</div>
						</motion.button>
					);
				})}
			</div>
		</>
	);
};

export default DiscoveryStep;
