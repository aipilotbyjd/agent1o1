import { ArrowRight } from 'lucide-react';
import classNames from 'classnames';
import type { TOnboardingStateMeta } from '@/types/onboarding.type';
import StepHeading from '../shared/StepHeading.partial';
import WizardButton from '../shared/WizardButton.partial';

type TProps = {
	firstName: string;
	roles: TOnboardingStateMeta['job_roles'];
	selectedRole: string;
	onSelectRole: (role: string) => void;
	description: string;
	onDescriptionChange: (value: string) => void;
	onContinue: () => void;
	isSaving: boolean;
};

const DESCRIPTION_EXAMPLE =
	'When someone fills my contact form, research their company and email me a 3-line summary';

/**
 * "What do you want to automate?": the one question before anything is
 * built. The description is offered to the AI builder on the template step;
 * the team picks which templates come first. Both are optional.
 */
const DescribeStep = ({
	firstName,
	roles,
	selectedRole,
	onSelectRole,
	description,
	onDescriptionChange,
	onContinue,
	isSaving,
}: TProps) => (
	<div className='flex flex-col items-center gap-10'>
		<StepHeading
			align='center'
			title={
				firstName
					? `Hi ${firstName}, what do you want to automate?`
					: 'What do you want to automate?'
			}
			description="Describe it in plain words. We'll build the workflow and run it on example data, so you see the result before anything is sent."
		/>

		<form
			className='w-full max-w-3xl'
			onSubmit={(event) => {
				event.preventDefault();
				onContinue();
			}}>
			<div className='focus-within:ring-primary-500/40 rounded-2xl border-2 border-zinc-950 bg-white p-5 shadow-[0_16px_40px_-20px_rgb(0_0_0/0.25)] focus-within:ring-4 dark:border-zinc-200 dark:bg-zinc-900'>
				<label
					htmlFor='onboarding-description'
					className='text-xs font-black tracking-wider text-zinc-500 uppercase dark:text-zinc-400'>
					Your task
				</label>
				<textarea
					id='onboarding-description'
					rows={3}
					value={description}
					onChange={(event) => onDescriptionChange(event.target.value)}
					placeholder={DESCRIPTION_EXAMPLE}
					className='mt-2 w-full resize-none border-0 bg-transparent p-0 text-lg font-semibold text-zinc-950 placeholder:text-zinc-400 focus:ring-0 focus:outline-none dark:text-zinc-50 dark:placeholder:text-zinc-500'
				/>
				<div className='mt-3 flex flex-wrap items-center justify-between gap-3'>
					<span className='text-xs font-medium text-zinc-500 dark:text-zinc-400'>
						Optional. You can also start from a template on the next steps.
					</span>
					<WizardButton
						type='submit'
						isLoading={isSaving}
						icon={!isSaving ? <ArrowRight className='size-4' /> : undefined}>
						Continue
					</WizardButton>
				</div>
			</div>
		</form>

		<fieldset className='flex w-full max-w-3xl flex-col items-center gap-3'>
			<legend className='mb-3 w-full text-center text-sm font-bold text-zinc-600 dark:text-zinc-400'>
				Which team are you on? We'll suggest what to automate first.
			</legend>
			<div className='flex flex-wrap justify-center gap-2'>
				{roles.map((role) => {
					const isSelected = role.value === selectedRole;
					return (
						<button
							key={role.value}
							type='button'
							aria-pressed={isSelected}
							title={role.description}
							onClick={() => onSelectRole(isSelected ? '' : role.value)}
							className={classNames(
								'focus-visible:ring-primary-500 h-10 rounded-full border px-4 text-sm font-bold transition-colors focus-visible:ring-2 focus-visible:outline-none',
								isSelected
									? 'border-zinc-950 bg-zinc-950 text-white dark:border-white dark:bg-white dark:text-zinc-950'
									: 'border-zinc-200 bg-white text-zinc-700 hover:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:border-zinc-500',
							)}>
							{role.label}
						</button>
					);
				})}
			</div>
		</fieldset>
	</div>
);

export default DescribeStep;
