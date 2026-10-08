import { FC } from 'react';
import { motion } from 'framer-motion';
import Modal, { ModalBody, ModalFooter, ModalFooterChild } from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Icon from '@/components/icon/Icon';

export type TTrashOutcome = {
	kind: 'restored' | 'deleted';
	/** `workflow` or `agent` — used in the copy. */
	singular: string;
	name: string;
	/** Items of this kind still in the trash after the action. */
	remaining: number;
};

interface ITrashOutcomeModalProps {
	outcome: TTrashOutcome | null;
	onClose: () => void;
	/** Restored only: jump straight to the item. */
	onOpen?: () => void;
}

const VARIANTS = {
	restored: {
		icon: 'DeletePutBack',
		title: 'Restored successfully',
		halo: 'bg-primary-400/15 dark:bg-primary-400/10',
		ring: 'border-primary-400/40',
		tile: 'border-primary-300/70 bg-white text-zinc-800 dark:border-primary-800/60 dark:bg-zinc-900 dark:text-zinc-100',
	},
	deleted: {
		icon: 'Delete02',
		title: 'Permanently deleted',
		halo: 'bg-zinc-400/10 dark:bg-zinc-400/10',
		ring: 'border-zinc-300 dark:border-zinc-700',
		tile: 'border-zinc-200 bg-white text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200',
	},
} as const;

const fadeUp = (delay: number) => ({
	initial: { opacity: 0, y: 6 },
	animate: { opacity: 1, y: 0 },
	transition: { delay, duration: 0.3, ease: 'easeOut' as const },
});

const TrashOutcomeModal: FC<ITrashOutcomeModalProps> = ({ outcome, onClose, onOpen }) => {
	const kind = outcome?.kind ?? 'restored';
	const variant = VARIANTS[kind];
	const animationKey = `${kind}-${outcome?.name}`;

	const message =
		kind === 'restored'
			? `is back in your ${outcome?.singular}s, with everything just as you left it.`
			: 'has been removed for good. Your workspace is a little tidier now.';
	const remainingNote =
		outcome && outcome.remaining > 0
			? `${outcome.remaining} ${outcome.singular}${outcome.remaining === 1 ? '' : 's'} left in the trash`
			: `No ${outcome?.singular}s left in the trash`;

	return (
		<Modal
			isOpen={!!outcome}
			setIsOpen={(open) => {
				if (!open) onClose();
			}}
			isCentered
			size='sm'>
			<ModalBody>
				<div className='flex flex-col items-center px-2 pt-6 text-center'>
					<div className='relative flex h-24 w-24 items-center justify-center'>
						<motion.div
							key={`halo-${animationKey}`}
							className={`absolute inset-0 rounded-full ${variant.halo}`}
							initial={{ scale: 0.6, opacity: 0 }}
							animate={{ scale: 1, opacity: 1 }}
							transition={{ duration: 0.4, ease: 'easeOut' }}
						/>
						<motion.div
							key={`ring-${animationKey}`}
							className={`absolute inset-3 rounded-full border ${variant.ring}`}
							initial={{ scale: 0.8, opacity: 0.9 }}
							animate={{ scale: 1.45, opacity: 0 }}
							transition={{ duration: 1.4, ease: 'easeOut', delay: 0.25 }}
						/>
						<motion.div
							key={`tile-${animationKey}`}
							className={`relative flex h-14 w-14 items-center justify-center rounded-2xl border shadow-sm ${variant.tile}`}
							initial={{ scale: 0.5, opacity: 0 }}
							animate={{ scale: 1, opacity: 1 }}
							transition={{ type: 'spring', stiffness: 420, damping: 22 }}>
							<Icon icon={variant.icon} className='text-[26px]' />
							<motion.span
								key={`badge-${animationKey}`}
								className='absolute -right-2 -bottom-2 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-white shadow-sm ring-[3px] ring-white dark:ring-zinc-900'
								initial={{ scale: 0 }}
								animate={{ scale: 1 }}
								transition={{
									type: 'spring',
									stiffness: 500,
									damping: 18,
									delay: 0.3,
								}}>
								<Icon icon='Tick02' className='text-[14px]' />
							</motion.span>
						</motion.div>
					</div>

					<motion.h2
						className='mt-4 text-lg font-bold tracking-tight text-zinc-950 dark:text-white'
						{...fadeUp(0.15)}>
						{variant.title}
					</motion.h2>
					<motion.p
						className='mt-1.5 max-w-xs text-sm leading-relaxed text-zinc-500 dark:text-zinc-400'
						{...fadeUp(0.22)}>
						<span className='font-semibold break-words text-zinc-800 dark:text-zinc-200'>
							{outcome?.name}
						</span>{' '}
						{message}
					</motion.p>
					<motion.p
						className='mt-4 text-[11px] font-medium tracking-wide text-zinc-400 uppercase dark:text-zinc-500'
						{...fadeUp(0.3)}>
						{remainingNote}
					</motion.p>
				</div>
			</ModalBody>
			<ModalFooter>
				<ModalFooterChild className='grid w-full grid-cols-1 gap-2 sm:flex sm:justify-center'>
					{kind === 'restored' && onOpen ? (
						<>
							<Button
								variant='solid'
								color='primary'
								onClick={onOpen}
								className='sm:order-2'>
								<span className='flex items-center justify-center gap-1.5'>
									Open {outcome?.singular}
									<Icon icon='ArrowRight02' className='text-base' />
								</span>
							</Button>
							<Button
								variant='outline'
								color='zinc'
								onClick={onClose}
								className='sm:order-1'>
								Back to trash
							</Button>
						</>
					) : (
						<Button variant='solid' color='primary' onClick={onClose}>
							Done
						</Button>
					)}
				</ModalFooterChild>
			</ModalFooter>
		</Modal>
	);
};

export default TrashOutcomeModal;
