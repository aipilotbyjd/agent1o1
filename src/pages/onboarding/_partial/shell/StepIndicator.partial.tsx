import { STEP_LABELS, TOTAL_STEPS } from '../../_helper/onboarding.constants';

interface IStepIndicatorProps {
	step: number;
}

const StepIndicator = ({ step }: IStepIndicatorProps) => (
	<div className='mb-6 flex items-center gap-2 text-[10px] font-black tracking-widest text-primary-600 uppercase dark:text-primary-400'>
		<span>
			Step {step + 1} of {TOTAL_STEPS}
		</span>
		<span className='h-1 w-1 rounded-full bg-slate-300 dark:bg-zinc-700' />
		<span>{STEP_LABELS[step]}</span>
	</div>
);

export default StepIndicator;
