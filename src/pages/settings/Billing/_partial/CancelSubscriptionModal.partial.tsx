import { useState } from 'react';
import { Link } from 'react-router';
import { CheckCircle2, LifeBuoy, Percent, TrendingDown } from 'lucide-react';
import {
	useAcceptCancellationOffer,
	useCancelSubscription,
	useCancellationOptions,
} from '@/api/modules/billing';
import Button from '@/components/ui/Button';
import Spinner from '@/components/ui/Spinner';
import Modal, {
	ModalHeader,
	ModalBody,
	ModalFooter,
	ModalFooterChild,
} from '@/components/ui/Modal';
import type { TCancellationOffer, TCancellationReasonOption } from '@/types/billing.type';

interface ICancelSubscriptionModalProps {
	ws: string;
	isOpen: boolean;
	plansPath: string;
	onClose: () => void;
}

type TStep = 'reason' | 'offer' | 'confirm' | 'stayed';

const COMMENT_MAX = 2000;

const fmtDate = (value: string) =>
	new Date(value).toLocaleDateString(undefined, {
		month: 'short',
		day: 'numeric',
		year: 'numeric',
	});

const secondaryButton =
	'h-11 border-zinc-200 font-bold text-zinc-500 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800';

const offerCopy = (offer: TCancellationOffer) => {
	switch (offer.type) {
		case 'discount':
			return {
				icon: Percent,
				title: `Stay and get ${offer.percent_off}% off`,
				body: `We will take ${offer.percent_off}% off your next ${offer.months} monthly invoices. Nothing else about your plan changes.`,
				action: `Keep my plan with ${offer.percent_off}% off`,
			};
		case 'downgrade':
			return {
				icon: TrendingDown,
				title: 'A smaller plan might fit better',
				body: 'You can move to a cheaper plan and keep your workflows, agents and connected apps running.',
				action: 'See cheaper plans',
			};
		case 'help':
			return {
				icon: LifeBuoy,
				title: 'Let us help you fix it',
				body: 'Send us what went wrong and our team will get back to you by email. Your plan stays as it is.',
				action: 'Ask for help instead',
			};
	}
};

/**
 * Cancelling in three short steps: why, one alternative that fits the answer
 * (when there is one), then a plain confirmation. Every step has a way
 * straight on to cancelling; the offer is never a wall.
 */
const CancelSubscriptionModal = ({
	ws,
	isOpen,
	plansPath,
	onClose,
}: ICancelSubscriptionModalProps) => {
	const options = useCancellationOptions(ws, isOpen);
	const cancel = useCancelSubscription(ws);
	const accept = useAcceptCancellationOffer(ws);

	const [step, setStep] = useState<TStep>('reason');
	const [reason, setReason] = useState<TCancellationReasonOption | null>(null);
	const [comment, setComment] = useState('');
	const [stayedMessage, setStayedMessage] = useState('');

	const close = () => {
		onClose();
		setStep('reason');
		setReason(null);
		setComment('');
		setStayedMessage('');
	};

	const offer = reason?.offer ?? null;
	const trimmedComment = comment.trim();
	const endsAt = options.data?.ends_at ?? null;

	const confirmCancel = () =>
		cancel.mutate(
			{ reason: reason?.value, comment: trimmedComment || undefined },
			{ onSuccess: close },
		);

	const acceptOffer = () => {
		if (!reason || !offer || offer.type === 'downgrade') return;

		accept.mutate(
			{ offer: offer.type, reason: reason.value, comment: trimmedComment || undefined },
			{
				onSuccess: (result) => {
					setStayedMessage(
						result.outcome === 'discount_accepted'
							? `Done. ${result.percent_off}% comes off your next ${result.months} monthly invoices.`
							: 'Thanks. We have your message and will reply by email.',
					);
					setStep('stayed');
				},
			},
		);
	};

	const title =
		step === 'stayed'
			? 'Your plan is staying'
			: step === 'confirm'
				? 'Confirm cancellation'
				: step === 'offer'
					? 'Before you go'
					: 'Cancel your plan';

	const copy = offer ? offerCopy(offer) : null;

	return (
		<Modal isOpen={isOpen} setIsOpen={(open) => !open && close()} size='sm'>
			<ModalHeader setIsOpen={close}>
				<span className='text-xl font-extrabold tracking-tight text-zinc-950 dark:text-white'>
					{title}
				</span>
			</ModalHeader>
			<ModalBody>
				{options.isLoading ? (
					<div className='flex items-center gap-3 py-4 text-sm font-semibold text-zinc-500'>
						<Spinner color='primary' className='size-5' />
						Loading…
					</div>
				) : step === 'reason' ? (
					<div className='space-y-4'>
						<p className='text-sm font-semibold text-zinc-500 dark:text-zinc-400'>
							What is the main reason you are leaving?
						</p>
						{options.isError ? (
							<p className='text-sm font-semibold text-zinc-500 dark:text-zinc-400'>
								The reasons could not be loaded. You can still cancel.
							</p>
						) : (
							<div className='space-y-2' role='radiogroup'>
								{options.data?.reasons.map((option) => (
									<label
										key={option.value}
										className={`flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 text-sm font-semibold transition ${
											reason?.value === option.value
												? 'border-primary-400 bg-primary-50 dark:bg-primary-950/20 text-zinc-950 dark:text-zinc-50'
												: 'border-zinc-200 text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800'
										}`}>
										<input
											type='radio'
											name='cancellation-reason'
											className='accent-primary-500'
											checked={reason?.value === option.value}
											onChange={() => setReason(option)}
										/>
										{option.label}
									</label>
								))}
							</div>
						)}
						{reason && (
							<div className='space-y-1.5'>
								<label
									htmlFor='cancellation-comment'
									className='text-sm font-bold text-zinc-700 dark:text-zinc-300'>
									{reason.comment_prompt}{' '}
									<span className='font-semibold text-zinc-400'>(optional)</span>
								</label>
								<textarea
									id='cancellation-comment'
									rows={3}
									maxLength={COMMENT_MAX}
									value={comment}
									onChange={(event) => setComment(event.target.value)}
									className='focus:border-primary-400 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-900 outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100'
								/>
							</div>
						)}
					</div>
				) : step === 'offer' && copy ? (
					<div className='border-primary-200 bg-primary-50 dark:border-primary-900/40 dark:bg-primary-950/20 space-y-2 rounded-2xl border p-4'>
						<div className='flex items-center gap-2 text-base font-black text-zinc-950 dark:text-zinc-50'>
							<copy.icon size={18} />
							{copy.title}
						</div>
						<p className='text-sm font-semibold text-zinc-600 dark:text-zinc-300'>
							{copy.body}
						</p>
					</div>
				) : step === 'stayed' ? (
					<div className='flex items-start gap-3 text-sm font-semibold text-zinc-600 dark:text-zinc-300'>
						<CheckCircle2 size={18} className='mt-0.5 shrink-0 text-emerald-500' />
						{stayedMessage}
					</div>
				) : (
					<div className='space-y-3 text-sm font-semibold text-zinc-600 dark:text-zinc-300'>
						<p>
							Your plan stays active
							{endsAt
								? ` until ${fmtDate(endsAt)}`
								: ' until the end of the current billing period'}
							. After that the workspace moves to the free plan.
						</p>
						<ul className='list-disc space-y-1 pl-5'>
							<li>Your workflows, agents and data are kept.</li>
							<li>Paid plan limits and monthly credits stop.</li>
							<li>You can resume the plan any time before it ends.</li>
						</ul>
					</div>
				)}
			</ModalBody>
			<ModalFooter>
				<ModalFooterChild className='flex w-full flex-wrap justify-end gap-3'>
					{step === 'reason' && (
						<>
							<Button
								variant='outline'
								color='zinc'
								onClick={close}
								className={secondaryButton}>
								Keep my plan
							</Button>
							<Button
								variant='solid'
								color='red'
								isDisable={options.isLoading || (!reason && !options.isError)}
								onClick={() => setStep(offer ? 'offer' : 'confirm')}
								className='h-11 font-bold'>
								Continue
							</Button>
						</>
					)}
					{step === 'offer' && copy && offer && (
						<>
							<Button
								variant='outline'
								color='zinc'
								isDisable={accept.isPending}
								onClick={() => setStep('confirm')}
								className={secondaryButton}>
								No thanks, cancel
							</Button>
							{offer.type === 'downgrade' ? (
								<Link
									to={plansPath}
									onClick={close}
									className='bg-primary-400 text-primary-950 hover:bg-primary-500 flex h-11 items-center justify-center rounded-xl px-5 text-sm font-bold transition'>
									{copy.action}
								</Link>
							) : (
								<Button
									variant='solid'
									color='primary'
									isLoading={accept.isPending}
									onClick={acceptOffer}
									className='h-11 font-bold text-zinc-950'>
									{copy.action}
								</Button>
							)}
						</>
					)}
					{step === 'confirm' && (
						<>
							<Button
								variant='outline'
								color='zinc'
								isDisable={cancel.isPending}
								onClick={close}
								className={secondaryButton}>
								Keep my plan
							</Button>
							<Button
								variant='solid'
								color='red'
								isLoading={cancel.isPending}
								onClick={confirmCancel}
								className='h-11 font-bold'>
								Cancel plan
							</Button>
						</>
					)}
					{step === 'stayed' && (
						<Button
							variant='solid'
							color='primary'
							onClick={close}
							className='h-11 font-bold text-zinc-950'>
							Done
						</Button>
					)}
				</ModalFooterChild>
			</ModalFooter>
		</Modal>
	);
};

export default CancelSubscriptionModal;
