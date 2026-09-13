import { FC } from 'react';
import Button from '@/components/ui/Button';

type TStepFooterProps = {
	onBack: (() => void) | null;
	/** Omit to make the step mandatory — no skip link is rendered. */
	onSkip?: () => void;
	skipLabel?: string;
	submitLabel: string;
	onSubmit: () => void;
	isLoading?: boolean;
	isDisabled?: boolean;
};

const StepFooter: FC<TStepFooterProps> = ({
	onBack,
	onSkip,
	skipLabel = 'Skip for now',
	submitLabel,
	onSubmit,
	isLoading = false,
	isDisabled = false,
}) => (
	<div className='mt-8 flex items-center justify-between gap-3 border-t border-zinc-200 pt-6 dark:border-zinc-800'>
		<div>
			{onBack && (
				<Button aria-label='Back' variant='link' color='zinc' icon='ArrowLeft01' onClick={onBack}>
					Back
				</Button>
			)}
		</div>
		<div className='flex items-center gap-2'>
			{onSkip && (
				<Button aria-label={skipLabel} variant='link' color='zinc' onClick={onSkip}>
					{skipLabel}
				</Button>
			)}
			<Button
				aria-label={submitLabel}
				variant='solid'
				className='font-bold'
				rightIcon='ArrowRight01'
				isLoading={isLoading}
				isDisable={isDisabled || isLoading}
				onClick={onSubmit}>
				{submitLabel}
			</Button>
		</div>
	</div>
);

export default StepFooter;
