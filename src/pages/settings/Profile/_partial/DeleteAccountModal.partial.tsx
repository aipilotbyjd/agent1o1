import { useState } from 'react';
import type { FormEvent } from 'react';
import { AlertTriangle, Trash2 } from 'lucide-react';
import { ApiError } from '@/api/core';
import { useAccountDeletionCheck } from '@/api/modules/user';
import Button from '@/components/ui/Button';
import Modal, {
	ModalHeader,
	ModalBody,
	ModalFooter,
	ModalFooterChild,
} from '@/components/ui/Modal';
import type { TAccountDeletionBlockerReason, TDeleteAccountDto } from '@/types/auth.type';

interface IDeleteAccountModalProps {
	isOpen: boolean;
	onClose: () => void;
	email: string;
	isPending: boolean;
	/** Rejects with the API error on failure; field errors are shown inline. */
	onConfirm: (payload: TDeleteAccountDto) => Promise<unknown>;
}

const inputClass =
	'h-11 w-full rounded-xl border border-zinc-200 bg-white px-4 text-sm font-semibold text-zinc-800 shadow-xs outline-none placeholder:text-zinc-400 focus:border-red-400 focus:ring-4 focus:ring-red-200 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:ring-red-500/25';

const errorClass = 'mt-2 text-xs font-semibold text-red-500';

const blockerLabel: Record<TAccountDeletionBlockerReason, string> = {
	has_other_members: 'other people still belong to it',
	active_subscription: 'it has an active subscription',
};

/**
 * Confirms a permanent account deletion. The backend refuses while the
 * account owns a shared or still-subscribed workspace, so those are fetched
 * up front and listed instead of the form; otherwise the person retypes
 * their email (and their password, unless they sign in with Google/GitHub).
 */
const DeleteAccountModal = ({
	isOpen,
	onClose,
	email,
	isPending,
	onConfirm,
}: IDeleteAccountModalProps) => {
	const check = useAccountDeletionCheck(isOpen);
	const [confirmEmail, setConfirmEmail] = useState('');
	const [password, setPassword] = useState('');
	const [errors, setErrors] = useState<Record<string, string>>({});

	const blockers = check.data?.workspaces ?? [];
	const requiresPassword = check.data?.requires_password ?? true;
	const isBlocked = blockers.length > 0;
	const emailMatches = confirmEmail.trim().toLowerCase() === email.toLowerCase();

	const close = () => {
		setConfirmEmail('');
		setPassword('');
		setErrors({});
		onClose();
	};

	const handleSubmit = async (e: FormEvent) => {
		e.preventDefault();
		if (check.isLoading || isBlocked) return;
		if (!emailMatches) {
			setErrors({ confirm_email: 'Type your account email address exactly to confirm.' });
			return;
		}
		if (requiresPassword && !password) {
			setErrors({ current_password: 'Enter your current password' });
			return;
		}
		try {
			await onConfirm({
				confirm_email: confirmEmail.trim(),
				...(requiresPassword ? { current_password: password } : {}),
			});
		} catch (err) {
			if (ApiError.is(err)) {
				setErrors(err.fieldErrors());
				if (err.status === 409) void check.refetch();
			}
		}
	};

	return (
		<Modal isOpen={isOpen} setIsOpen={(open) => !open && close()} size='md'>
			<ModalHeader setIsOpen={close}>
				<div className='flex items-center gap-3'>
					<div className='flex h-9 w-9 items-center justify-center rounded-xl bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'>
						<Trash2 size={18} />
					</div>
					<span className='text-xl font-extrabold tracking-tight text-zinc-950 dark:text-white'>
						Delete account
					</span>
				</div>
			</ModalHeader>
			<form onSubmit={handleSubmit}>
				<ModalBody>
					<div className='space-y-4 pt-1'>
						{check.isLoading ? (
							<p className='text-sm font-semibold text-zinc-500 dark:text-zinc-400'>
								Checking your workspaces…
							</p>
						) : isBlocked ? (
							<div className='rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-900/50 dark:bg-amber-950/20'>
								<div className='flex items-center gap-2 text-sm font-bold text-amber-700 dark:text-amber-400'>
									<AlertTriangle size={16} />
									<span>Resolve these workspaces first</span>
								</div>
								<ul className='mt-2 space-y-1 text-xs leading-normal font-semibold text-amber-700 dark:text-amber-300'>
									{blockers.map((workspace) => (
										<li key={workspace.id}>
											<span className='font-bold'>{workspace.name}</span>:{' '}
											{workspace.reasons
												.map((r) => blockerLabel[r])
												.join(' and ')}
										</li>
									))}
								</ul>
								<p className='mt-2 text-xs font-semibold text-amber-700/80 dark:text-amber-300/80'>
									Remove the other members or delete the workspace, and cancel its
									subscription, then come back here.
								</p>
							</div>
						) : (
							<>
								<p className='text-sm font-semibold text-zinc-500 dark:text-zinc-400'>
									This permanently deletes your account, your sign-in history and
									every workspace you own on your own. It cannot be undone.
									Download your data first if you want to keep a copy.
								</p>
								<div>
									<label
										htmlFor='delete-account-email'
										className='mb-1.5 block text-sm font-bold text-zinc-700 dark:text-zinc-300'>
										Type <span className='font-extrabold'>{email}</span> to
										confirm
									</label>
									<input
										id='delete-account-email'
										type='email'
										autoComplete='off'
										className={inputClass}
										value={confirmEmail}
										onChange={(e) => {
											setConfirmEmail(e.target.value);
											setErrors({});
										}}
									/>
									{errors.confirm_email && (
										<p className={errorClass}>{errors.confirm_email}</p>
									)}
								</div>
								{requiresPassword && (
									<div>
										<label
											htmlFor='delete-account-password'
											className='mb-1.5 block text-sm font-bold text-zinc-700 dark:text-zinc-300'>
											Current password
										</label>
										<input
											id='delete-account-password'
											type='password'
											autoComplete='current-password'
											className={inputClass}
											value={password}
											onChange={(e) => {
												setPassword(e.target.value);
												setErrors({});
											}}
										/>
										{errors.current_password && (
											<p className={errorClass}>{errors.current_password}</p>
										)}
									</div>
								)}
							</>
						)}
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
							color='red'
							isLoading={isPending}
							isDisable={check.isLoading || isBlocked || !emailMatches}
							className='h-11 font-bold text-white shadow-md shadow-red-500/15'>
							Delete my account
						</Button>
					</ModalFooterChild>
				</ModalFooter>
			</form>
		</Modal>
	);
};

export default DeleteAccountModal;
