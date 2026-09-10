import { ArrowLeft, ArrowRight, Loader2 } from 'lucide-react';
import { TOTAL_STEPS, PLANS } from '../../_helper/onboarding.constants';

interface INavigationBarProps {
	step: number;
	isLastStep: boolean;
	isContinueDisabled: boolean;
	isWorkspaceLoading: boolean;
	sendInvitationPending: boolean;
	hasValidEmails: boolean;
	invitesSent: boolean;
	selectedPlan: string;
	onPrev: () => void;
	onSkip: () => void;
	onNext: () => void;
}

const NavigationBar = ({
	step,
	isLastStep,
	isContinueDisabled,
	isWorkspaceLoading,
	sendInvitationPending,
	hasValidEmails,
	invitesSent,
	selectedPlan,
	onPrev,
	onSkip,
	onNext,
}: INavigationBarProps) => {
	const continueLabel = () => {
		if (isLastStep) return 'Finish Setup';
		if (step === 1 && isWorkspaceLoading) return null; // show spinner
		if (step === 2 && hasValidEmails && !invitesSent) return 'Send & Continue';
		if (step === 4 && selectedPlan === 'free') return 'Continue with Free';
		if (step === 4 && selectedPlan !== 'free')
			return `Upgrade to ${PLANS.find((p) => p.id === selectedPlan)?.name}`;
		return 'Continue';
	};

	return (
		<div className='mt-8 flex items-center justify-between border-t border-slate-100 pt-4 dark:border-zinc-800/80'>
			{step > 0 ? (
				<button
					onClick={onPrev}
					className='flex h-11 items-center gap-2 rounded-xl px-4 text-xs font-black text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100'>
					<ArrowLeft className='h-4 w-4' />
					Back
				</button>
			) : (
				<div />
			)}

			{/* Step dots */}
			<div className='flex items-center gap-1.5'>
				{Array.from({ length: TOTAL_STEPS }, (_, i) => (
					<div
						key={i}
						className={`h-1.5 rounded-full transition-all duration-300 ${step === i ? 'w-4 bg-primary-400 dark:bg-primary-400' : 'w-1.5 bg-slate-200 dark:bg-zinc-800'}`}
					/>
				))}
			</div>

			{/* Actions */}
			<div className='flex items-center gap-3'>
				{/* Skip — available on all steps except the first 2 steps */}
				{step > 1 && (
					<button
						onClick={onSkip}
						className='h-11 rounded-xl px-4 text-xs font-black text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300'>
						Skip
					</button>
				)}

				<button
					disabled={isContinueDisabled || sendInvitationPending}
					onClick={onNext}
					className='flex h-11 items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 text-xs font-black text-white transition-all hover:opacity-90 active:scale-95 disabled:pointer-events-none disabled:opacity-40 dark:bg-zinc-50 dark:text-slate-950'>
					{isWorkspaceLoading && step === 1 ? (
						<>
							<Loader2 className='h-3.5 w-3.5 animate-spin' />
							Creating...
						</>
					) : sendInvitationPending ? (
						<>
							<Loader2 className='h-3.5 w-3.5 animate-spin' />
							Sending...
						</>
					) : (
						<>
							{continueLabel()}
							<ArrowRight className='h-3.5 w-3.5 stroke-[3]' />
						</>
					)}
				</button>
			</div>
		</div>
	);
};

export default NavigationBar;
