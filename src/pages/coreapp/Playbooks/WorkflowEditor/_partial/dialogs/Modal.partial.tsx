import { X } from 'lucide-react';
import { motion } from 'framer-motion';
import type { ReactNode } from 'react';
import Portal from '@/components/layout/Portal/Portal';

const Modal = ({
	title,
	children,
	onClose,
	size = 'md',
}: {
	title: string;
	children: ReactNode;
	onClose: () => void;
	size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl';
}) => {
	const sizeClasses = {
		sm: 'max-w-md',
		md: 'max-w-2xl',
		lg: 'max-w-3xl',
		xl: 'max-w-4xl',
		'2xl': 'max-w-5xl',
		'3xl': 'max-w-6xl',
		'4xl': 'max-w-7xl',
		'5xl': 'max-w-full',
	};

	return (
		<Portal>
			<div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 dark:bg-black/65 p-2 sm:p-4 backdrop-blur-xs sm:backdrop-blur-sm'>
				<motion.div
					initial={{ opacity: 0, scale: 0.96, y: 10 }}
					animate={{ opacity: 1, scale: 1, y: 0 }}
					transition={{ duration: 0.16 }}
					className={`w-full ${sizeClasses[size] || 'max-w-2xl'} max-h-[calc(100dvh-1rem)] sm:max-h-[calc(100dvh-2rem)] flex flex-col overflow-hidden rounded-xl sm:rounded-2xl border border-zinc-200 bg-white text-zinc-900 shadow-2xl shadow-zinc-200/50 backdrop-blur-xl dark:border-white/10 dark:bg-zinc-950/96 dark:text-zinc-100 dark:shadow-black/50`}>
					<div className='flex shrink-0 items-center justify-between border-b border-zinc-200 px-5 py-4 dark:border-white/10'>
						<div className='text-xs font-semibold tracking-[0.16em] text-zinc-500 uppercase dark:text-zinc-400'>
							{title}
						</div>
						<button
							type='button'
							onClick={onClose}
							className='flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-200 text-zinc-400 hover:bg-zinc-50 hover:text-zinc-800 dark:border-white/10 dark:text-zinc-500 dark:hover:bg-white/[0.06] dark:hover:text-white transition'>
							<X size={14} />
						</button>
					</div>
					<div className='flex-1 overflow-y-auto p-5'>{children}</div>
				</motion.div>
			</div>
		</Portal>
	);
};

export default Modal;
