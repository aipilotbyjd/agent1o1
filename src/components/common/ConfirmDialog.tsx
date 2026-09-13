import { Dispatch, FC, ReactNode, SetStateAction } from 'react';
import Modal, { ModalBody, ModalFooter, ModalFooterChild, ModalHeader } from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { TColors } from '@/types/colors.type';

// ============================================================
// Confirm Dialog
// ------------------------------------------------------------
// The one "are you sure" for destructive actions. Centralised so
// every delete in the app reads the same and so none of them can
// quietly ship without a confirmation step.
//
// The confirm button carries the pending state: a delete that hits
// a slow API would otherwise look ignored and get clicked twice.
// ============================================================

interface IConfirmDialogProps {
	isOpen: boolean;
	onClose: () => void;
	title: string;
	description?: ReactNode;
	confirmLabel?: string;
	cancelLabel?: string;
	confirmColor?: TColors;
	isPending?: boolean;
	onConfirm: () => void;
}

const ConfirmDialog: FC<IConfirmDialogProps> = ({
	isOpen,
	onClose,
	title,
	description,
	confirmLabel = 'Delete',
	cancelLabel = 'Cancel',
	confirmColor = 'red',
	isPending = false,
	onConfirm,
}) => {
	// Modal drives its own open state through a `useState` setter, but this
	// dialog is opened by whatever row the caller is acting on — so the
	// setter is adapted into the one signal that matters here: it closed.
	const setIsOpen: Dispatch<SetStateAction<boolean>> = (next) => {
		const open = typeof next === 'function' ? next(isOpen) : next;
		if (!open) onClose();
	};

	return (
		<Modal isOpen={isOpen} setIsOpen={setIsOpen} rounded='rounded-2xl'>
			<ModalHeader>{title}</ModalHeader>
			<ModalBody>{description}</ModalBody>
			<ModalFooter>
				<ModalFooterChild>
					<Button
						variant='outline'
						color='zinc'
						isDisable={isPending}
						onClick={onClose}>
						{cancelLabel}
					</Button>
					<Button
						variant='solid'
						color={confirmColor}
						isLoading={isPending}
						isDisable={isPending}
						onClick={onConfirm}>
						{confirmLabel}
					</Button>
				</ModalFooterChild>
			</ModalFooter>
		</Modal>
	);
};

export default ConfirmDialog;
