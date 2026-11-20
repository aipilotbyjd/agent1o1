import type { ReactNode } from 'react';
import { Check } from 'lucide-react';
import classNames from 'classnames';
import AppLogo from '@/components/AppLogo';
import type { TOnboardingStep, TOnboardingStepKey } from '@/types/onboarding.type';

type TProps = {
	steps: TOnboardingStep[];
	/** The step on screen; `null` once every step is behind the user. */
	currentKey: TOnboardingStepKey | null;
	onLeave?: () => void;
	isLeaving?: boolean;
	children: ReactNode;
};

/**
 * The wizard's frame: the mark, where the user is in the four steps, and a
 * way out. Each step renders its own content and actions in the middle.
 */
const WizardShell = ({ steps, currentKey, onLeave, isLeaving, children }: TProps) => (
	<main className='from-primary-50/70 flex min-h-screen w-full flex-col bg-gradient-to-b via-white to-white text-zinc-950 dark:from-zinc-950 dark:via-zinc-950 dark:to-zinc-900 dark:text-zinc-50'>
		<header className='border-b border-zinc-200/70 bg-white/80 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/80'>
			<div className='mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6'>
				<span className='flex items-center gap-2.5'>
					<AppLogo className='size-8' rounded='rounded-lg' alt='' />
					<span className='text-base font-black tracking-tight'>agent1o1</span>
				</span>

				<ol className='hidden items-center gap-2 md:flex' aria-label='Setup progress'>
					{steps.map((step, index) => {
						const isCurrent = step.key === currentKey;
						return (
							<li key={step.key} className='flex items-center gap-2'>
								{index > 0 && (
									<span
										className='h-px w-6 bg-zinc-200 dark:bg-zinc-700'
										aria-hidden='true'
									/>
								)}
								<span
									aria-current={isCurrent ? 'step' : undefined}
									className={classNames(
										'flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold',
										isCurrent &&
											'bg-zinc-950 text-white dark:bg-white dark:text-zinc-950',
										!isCurrent &&
											step.completed &&
											'bg-primary-100 text-primary-900 dark:bg-primary-900/30 dark:text-primary-200',
										!isCurrent &&
											!step.completed &&
											'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400',
									)}>
									{step.completed && !isCurrent ? (
										<Check className='size-3.5' strokeWidth={3} />
									) : (
										<span className='tabular-nums'>{index + 1}</span>
									)}
									{step.label}
								</span>
							</li>
						);
					})}
				</ol>

				{onLeave ? (
					<button
						type='button'
						onClick={onLeave}
						disabled={isLeaving}
						className='rounded-lg px-2 py-1 text-xs font-bold text-zinc-500 transition-colors hover:text-zinc-900 disabled:opacity-50 dark:text-zinc-400 dark:hover:text-zinc-100'>
						Skip setup
					</button>
				) : (
					<span className='w-16' />
				)}
			</div>
		</header>

		<section className='flex flex-1 justify-center px-4 py-10 sm:px-6 sm:py-14'>
			<div className='w-full max-w-5xl'>{children}</div>
		</section>
	</main>
);

export default WizardShell;
