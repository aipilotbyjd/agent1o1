import { usePreviewSubscriptionSwap } from '@/api/modules/billing';
import Button from '@/components/ui/Button';
import Spinner from '@/components/ui/Spinner';
import Modal, {
	ModalHeader,
	ModalBody,
	ModalFooter,
	ModalFooterChild,
} from '@/components/ui/Modal';
import type { TBillingInterval } from '@/types/billing.type';

interface ISwapPlanModalProps {
	ws: string;
	plan: { id: string; name: string } | null;
	interval: TBillingInterval;
	isPending: boolean;
	onClose: () => void;
	onConfirm: () => void;
}

/**
 * With a subscription already on file, choosing a plan swaps it in place and
 * Stripe prorates the difference straight away - there is no checkout page
 * to back out of. So this shows the prorated invoice first and asks.
 */
const SwapPlanModal = ({
	ws,
	plan,
	interval,
	isPending,
	onClose,
	onConfirm,
}: ISwapPlanModalProps) => {
	const preview = usePreviewSubscriptionSwap(ws, { plan_id: plan?.id ?? '', interval });
	const invoice = preview.data;

	return (
		<Modal isOpen={!!plan} setIsOpen={(open) => !open && onClose()} size='sm'>
			<ModalHeader setIsOpen={onClose}>
				<span className='text-xl font-extrabold tracking-tight text-zinc-950 dark:text-white'>
					Switch to {plan?.name}
				</span>
			</ModalHeader>
			<ModalBody>
				{preview.isLoading ? (
					<div className='flex items-center gap-3 py-4 text-sm font-semibold text-zinc-500'>
						<Spinner color='primary' className='size-5' />
						Calculating the change…
					</div>
				) : preview.isError ? (
					<p className='text-sm font-semibold text-zinc-500 dark:text-zinc-400'>
						The price change could not be previewed. You can still switch; Stripe
						prorates the difference on your next invoice.
					</p>
				) : invoice ? (
					<div className='space-y-3'>
						<p className='text-sm font-semibold text-zinc-500 dark:text-zinc-400'>
							Your plan changes right away and the difference is prorated.
						</p>
						<div className='rounded-2xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-800'>
							<div className='flex items-center justify-between text-sm font-semibold text-zinc-500 dark:text-zinc-400'>
								<span>Subtotal</span>
								<span>{invoice.subtotal}</span>
							</div>
							{invoice.tax && (
								<div className='mt-1 flex items-center justify-between text-sm font-semibold text-zinc-500 dark:text-zinc-400'>
									<span>Tax</span>
									<span>{invoice.tax}</span>
								</div>
							)}
							<div className='mt-2 flex items-center justify-between border-t border-zinc-200 pt-2 text-base font-black text-zinc-950 dark:border-zinc-700 dark:text-zinc-50'>
								<span>Due now</span>
								<span>{invoice.amount_due}</span>
							</div>
						</div>
					</div>
				) : (
					<p className='text-sm font-semibold text-zinc-500 dark:text-zinc-400'>
						Your plan changes right away. Nothing is due today.
					</p>
				)}
			</ModalBody>
			<ModalFooter>
				<ModalFooterChild className='flex w-full justify-end gap-3'>
					<Button
						variant='outline'
						color='zinc'
						onClick={onClose}
						className='h-11 border-zinc-200 font-bold text-zinc-500 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800'>
						Cancel
					</Button>
					<Button
						variant='solid'
						color='primary'
						isLoading={isPending}
						isDisable={preview.isLoading}
						onClick={onConfirm}
						className='shadow-primary-500/10 h-11 font-bold text-zinc-950 shadow-md'>
						Switch plan
					</Button>
				</ModalFooterChild>
			</ModalFooter>
		</Modal>
	);
};

export default SwapPlanModal;
