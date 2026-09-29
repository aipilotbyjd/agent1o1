import { useState } from 'react';
import type { FC, FormEvent } from 'react';
import Modal, {
	ModalBody,
	ModalFooter,
	ModalFooterChild,
	ModalHeader,
} from '@/components/ui/Modal';
import { Field, fieldClass } from '../../Referrals/_partial/ReferralUi.partial';
import { dangerBtn, secondaryBtn } from '../../_shared/buttons';

/**
 * Asks for the reason the backend requires on rejecting a referral or
 * revoking a reward. It is stored with the change and in the audit log.
 */
const ReasonModal: FC<{
	title: string;
	description: string;
	confirmText: string;
	isOpen: boolean;
	isPending?: boolean;
	onClose: () => void;
	onConfirm: (reason: string) => void;
}> = ({ title, description, confirmText, isOpen, isPending, onClose, onConfirm }) => {
	const [reason, setReason] = useState('');

	const submit = (e: FormEvent) => {
		e.preventDefault();
		if (reason.trim()) onConfirm(reason.trim());
	};

	return (
		<Modal
			isOpen={isOpen}
			setIsOpen={(open) => {
				if (!open) {
					setReason('');
					onClose();
				}
			}}
			size='sm'>
			<ModalHeader setIsOpen={onClose}>
				<span className='text-xl font-extrabold tracking-tight text-zinc-950 dark:text-white'>
					{title}
				</span>
			</ModalHeader>
			<form onSubmit={submit}>
				<ModalBody>
					<div className='space-y-3 pt-2'>
						<p className='text-sm text-zinc-500 dark:text-zinc-400'>{description}</p>
						<Field label='Reason'>
							<input
								autoFocus
								required
								maxLength={255}
								value={reason}
								onChange={(e) => setReason(e.target.value)}
								className={fieldClass}
							/>
						</Field>
					</div>
				</ModalBody>
				<ModalFooter>
					<ModalFooterChild className='flex w-full justify-end gap-3'>
						<button type='button' onClick={onClose} className={secondaryBtn}>
							Cancel
						</button>
						<button
							type='submit'
							disabled={isPending || !reason.trim()}
							className={dangerBtn}>
							{isPending ? 'Working…' : confirmText}
						</button>
					</ModalFooterChild>
				</ModalFooter>
			</form>
		</Modal>
	);
};

export default ReasonModal;
