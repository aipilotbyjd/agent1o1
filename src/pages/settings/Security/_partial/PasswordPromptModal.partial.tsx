import { useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import { KeyRound } from 'lucide-react';
import { ApiError } from '@/api/core';
import Button from '@/components/ui/Button';
import Modal, {
	ModalHeader,
	ModalBody,
	ModalFooter,
	ModalFooterChild,
} from '@/components/ui/Modal';
import { errorClass, inputClass } from '../_helper/security.helper';

interface IPasswordPromptModalProps {
	isOpen: boolean;
	onClose: () => void;
	title: string;
	description: ReactNode;
	confirmLabel: string;
	danger?: boolean;
	isPending: boolean;
	/** Rejects with the API error on failure; the modal shows its password message. */
	onConfirm: (currentPassword: string) => Promise<unknown>;
}

/**
 * Re-asks for the current password before a sensitive 2FA change. The
 * backend validates it (`current_password:api`), so a wrong password comes
 * back as a field error and is shown here rather than closing the dialog.
 */
const PasswordPromptModal = ({
	isOpen,
	onClose,
	title,
	description,
	confirmLabel,
	danger = false,
	isPending,
	onConfirm,
}: IPasswordPromptModalProps) => {
	const [password, setPassword] = useState('');
	const [error, setError] = useState<string | null>(null);

	const close = () => {
		setPassword('');
		setError(null);
		onClose();
	};

	const handleSubmit = async (e: FormEvent) => {
		e.preventDefault();
		if (!password) {
			setError('Enter your current password');
			return;
		}
		try {
			await onConfirm(password);
			setPassword('');
			setError(null);
		} catch (err) {
			setError(ApiError.is(err) ? (err.field('current_password') ?? null) : null);
		}
	};

	return (
		<Modal isOpen={isOpen} setIsOpen={(open) => !open && close()} size='sm'>
			<ModalHeader setIsOpen={close}>
				<div className='flex items-center gap-3'>
					<div
						className={`flex h-9 w-9 items-center justify-center rounded-xl ${
							danger
								? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
								: 'bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400'
						}`}>
						<KeyRound size={18} />
					</div>
					<span className='text-xl font-extrabold tracking-tight text-zinc-950 dark:text-white'>
						{title}
					</span>
				</div>
			</ModalHeader>
			<form onSubmit={handleSubmit}>
				<ModalBody>
					<div className='space-y-4 pt-1'>
						<div className='text-sm font-semibold text-zinc-500 dark:text-zinc-400'>
							{description}
						</div>
						<div>
							<label
								htmlFor='security-current-password'
								className='mb-1.5 block text-sm font-bold text-zinc-700 dark:text-zinc-300'>
								Current password
							</label>
							<input
								id='security-current-password'
								aria-label='Current password'
								type='password'
								autoComplete='current-password'
								className={inputClass}
								value={password}
								onChange={(e) => {
									setPassword(e.target.value);
									setError(null);
								}}
							/>
							{error && <p className={errorClass}>{error}</p>}
						</div>
					</div>
				</ModalBody>
				<ModalFooter>
					<ModalFooterChild className='flex w-full justify-end gap-3'>
						<Button
							variant='outline'
							color='zinc'
							onClick={close}
							className='h-11 border-zinc-200 font-bold text-zinc-500 hover:bg-zinc-50'>
							Cancel
						</Button>
						<Button
							type='submit'
							variant='solid'
							color={danger ? 'red' : 'primary'}
							isLoading={isPending}
							className={`h-11 font-bold shadow-md ${danger ? 'text-white shadow-red-500/15' : 'shadow-primary-500/10 text-zinc-950'}`}>
							{confirmLabel}
						</Button>
					</ModalFooterChild>
				</ModalFooter>
			</form>
		</Modal>
	);
};

export default PasswordPromptModal;
