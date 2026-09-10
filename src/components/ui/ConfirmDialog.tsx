import { ReactNode } from 'react';
import { Trash2, TriangleAlert } from 'lucide-react';
import Button from '@/components/ui/Button';
import Modal, { ModalHeader, ModalBody, ModalFooter, ModalFooterChild } from '@/components/ui/Modal';

// @start-snippet:: interface
export interface IConfirmDialogOptions {
	title?: ReactNode;
	message?: ReactNode;
	confirmText?: string;
	cancelText?: string;
	tone?: 'danger' | 'default';
}
// @end-snippet:: interface

interface IConfirmDialogProps extends IConfirmDialogOptions {
	isOpen: boolean;
	onConfirm: () => void;
	onCancel: () => void;
}

const ConfirmDialog = ({
	isOpen,
	title = 'Are you sure?',
	message,
	confirmText = 'Confirm',
	cancelText = 'Cancel',
	tone = 'danger',
	onConfirm,
	onCancel,
}: IConfirmDialogProps) => {
	const isDanger = tone === 'danger';

	return (
		<Modal isOpen={isOpen} setIsOpen={(open) => !open && onCancel()} size='sm'>
			<ModalHeader setIsOpen={onCancel}>
				<div className='flex items-center gap-3'>
					<div
						className={
							isDanger
								? 'flex h-9 w-9 items-center justify-center rounded-xl bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
								: 'flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300'
						}>
						{isDanger ? <Trash2 size={18} /> : <TriangleAlert size={18} />}
					</div>
					<span className='text-xl font-extrabold tracking-tight text-zinc-950 dark:text-white'>
						{title}
					</span>
				</div>
			</ModalHeader>
			<ModalBody>
				{message && (
					<p className='text-base leading-relaxed font-semibold text-zinc-500 dark:text-zinc-400'>
						{message}
					</p>
				)}
			</ModalBody>
			<ModalFooter>
				<ModalFooterChild className='flex w-full justify-end gap-3'>
					<Button
						variant='outline'
						color='zinc'
						onClick={onCancel}
						className='h-11 border-zinc-200 font-bold text-zinc-500 hover:bg-zinc-50'>
						{cancelText}
					</Button>
					<Button
						variant='solid'
						color={isDanger ? 'red' : 'primary'}
						onClick={onConfirm}
						className='h-11 font-bold text-white shadow-md shadow-red-500/15'>
						{confirmText}
					</Button>
				</ModalFooterChild>
			</ModalFooter>
		</Modal>
	);
};

export default ConfirmDialog;
