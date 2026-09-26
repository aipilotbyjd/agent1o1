import { FC, ReactNode } from 'react';
import { AlertTriangle, Trash2 } from 'lucide-react';
import Modal, { ModalBody, ModalFooter, ModalFooterChild, ModalHeader } from './Modal';
import Button from './Button';
import { TColors } from '@/types/colors.type';

// @start-snippet:: interface
export type TConfirmTone = 'danger' | 'primary';

export interface IConfirmDialogOptions {
	/** Heading shown in the modal header. */
	title?: string;
	/** Body content — plain text or rich nodes. */
	message?: ReactNode;
	/** Label for the confirm button. */
	confirmText?: string;
	/** Label for the cancel button. */
	cancelText?: string;
	/** Visual tone. `danger` (default) is used for destructive actions like delete. */
	tone?: TConfirmTone;
}

export interface IConfirmDialogProps extends IConfirmDialogOptions {
	isOpen: boolean;
	isLoading?: boolean;
	onConfirm: () => void;
	onCancel: () => void;
}
// @end-snippet:: interface

const DEFAULTS: Required<Pick<IConfirmDialogOptions, 'title' | 'confirmText' | 'cancelText' | 'tone'>> =
	{
		title: 'Are you sure?',
		confirmText: 'Delete',
		cancelText: 'Cancel',
		tone: 'danger',
	};

/**
 * A reusable confirmation modal. Primarily used to guard destructive actions
 * such as deletes. Prefer the imperative `useConfirm()` hook for one-off
 * confirmations; use this component directly only when you need to manage the
 * open state yourself.
 */
const ConfirmDialog: FC<IConfirmDialogProps> = (props) => {
	const {
		isOpen,
		isLoading = false,
		onConfirm,
		onCancel,
		title = DEFAULTS.title,
		message,
		confirmText = DEFAULTS.confirmText,
		cancelText = DEFAULTS.cancelText,
		tone = DEFAULTS.tone,
	} = props;

	const isDanger = tone === 'danger';
	const accentColor: TColors = isDanger ? 'red' : 'primary';

	return (
		<Modal
			isOpen={isOpen}
			setIsOpen={(open) => {
				if (!open) onCancel();
			}}
			isCentered
			size='sm'>
			<ModalHeader setIsOpen={() => onCancel()}>
				<div className='flex items-center gap-3'>
					<div
						className={
							isDanger
								? 'flex h-9 w-9 items-center justify-center rounded-xl bg-red-100 text-red-600 dark:bg-red-950/30 dark:text-red-400'
								: 'flex h-9 w-9 items-center justify-center rounded-xl bg-primary-100 text-primary-600 dark:bg-primary-950/30 dark:text-primary-400'
						}>
						{isDanger ? <Trash2 size={16} /> : <AlertTriangle size={16} />}
					</div>
					<span className='text-lg leading-none font-extrabold tracking-tight text-zinc-950 dark:text-white'>
						{title}
					</span>
				</div>
			</ModalHeader>
			<ModalBody>
				<div className='pt-2 text-sm leading-relaxed font-medium text-zinc-500 dark:text-zinc-400'>
					{message ?? 'This action cannot be undone.'}
				</div>
			</ModalBody>
			<ModalFooter>
				<ModalFooterChild className='flex w-full justify-end gap-3'>
					<Button variant='outline' color='zinc' onClick={onCancel} isDisable={isLoading}>
						{cancelText}
					</Button>
					<Button
						variant='solid'
						color={accentColor}
						onClick={onConfirm}
						isLoading={isLoading}
						isDisable={isLoading}>
						{confirmText}
					</Button>
				</ModalFooterChild>
			</ModalFooter>
		</Modal>
	);
};

export default ConfirmDialog;
