import { ReactNode, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, Plus, Search, X } from 'lucide-react';

type TProps = {
	isOpen: boolean;
	title: string;
	onClose: () => void;
	children: ReactNode;
	footer?: ReactNode;
	search?: {
		value: string;
		onChange: (value: string) => void;
		placeholder: string;
	};
};

/**
 * Layered drawer that opens over the agent settings panel, styled like the
 * "Add a tool" drawer. Portalled to <body> because the settings panel is
 * transformed, which would otherwise trap `position: fixed` inside it.
 */
const AgentSideDrawer = ({ isOpen, title, onClose, children, footer, search }: TProps) => {
	const drawerRef = useRef<HTMLDivElement | null>(null);
	const onCloseRef = useRef(onClose);
	onCloseRef.current = onClose;

	useEffect(() => {
		if (!isOpen) return;
		drawerRef.current?.focus();
		// Capture phase so Escape closes this drawer, not the settings panel under it.
		const closeOnEscape = (event: KeyboardEvent) => {
			if (event.key !== 'Escape') return;
			event.preventDefault();
			event.stopPropagation();
			onCloseRef.current();
		};
		window.addEventListener('keydown', closeOnEscape, true);
		return () => window.removeEventListener('keydown', closeOnEscape, true);
	}, [isOpen]);

	return createPortal(
		<AnimatePresence>
			{isOpen && (
				<>
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						onClick={onClose}
						className='fixed inset-0 z-60 bg-black/20 backdrop-blur-xs'
					/>
					<motion.div
						ref={drawerRef}
						tabIndex={-1}
						role='dialog'
						aria-modal='true'
						aria-label={title}
						initial={{ x: '100%' }}
						animate={{ x: 0 }}
						exit={{ x: '100%' }}
						transition={{ type: 'spring', damping: 25, stiffness: 220 }}
						className='shadow-3xl fixed top-0 right-0 bottom-0 z-65 flex w-full max-w-[440px] flex-col overflow-hidden border-l border-zinc-200 bg-white outline-none dark:border-white/10 dark:bg-zinc-900'>
						<div className='flex h-16 shrink-0 items-center justify-between border-b border-zinc-200 bg-white px-5 dark:border-white/10 dark:bg-zinc-900'>
							<h3 className='text-[16px] font-black text-zinc-900 dark:text-white'>
								{title}
							</h3>
							<button
								aria-label='Close'
								onClick={onClose}
								className='flex h-11 w-11 items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-100 hover:text-zinc-800 md:h-8 md:w-8 dark:text-zinc-500 dark:hover:bg-zinc-800 dark:hover:text-zinc-200'>
								<X size={18} />
							</button>
						</div>

						{search && (
							<div className='border-b border-zinc-100 p-4 dark:border-white/10 dark:bg-zinc-900'>
								<div className='focus-within:border-primary-500/50 focus-within:ring-primary-500/5 relative flex min-w-0 items-center rounded-xl border border-zinc-200 bg-zinc-50/50 p-2 focus-within:ring-4 dark:border-zinc-800 dark:bg-zinc-950/20'>
									<Search size={15} className='ml-1.5 shrink-0 text-zinc-400' />
									<input
										aria-label={search.placeholder}
										type='text'
										value={search.value}
										onChange={(e) => search.onChange(e.target.value)}
										placeholder={search.placeholder}
										className='min-w-0 flex-1 border-none bg-transparent px-2.5 text-base font-semibold text-zinc-900 outline-none placeholder:text-zinc-400 focus:ring-0 md:text-xs dark:text-zinc-100 dark:placeholder:text-zinc-500'
									/>
								</div>
							</div>
						)}

						<div className='flex-1 space-y-3 overflow-y-auto p-4 dark:bg-zinc-950/10'>
							{children}
						</div>

						{footer && (
							<div className='shrink-0 border-t border-zinc-200 bg-white p-4 dark:border-white/10 dark:bg-zinc-900'>
								{footer}
							</div>
						)}
					</motion.div>
				</>
			)}
		</AnimatePresence>,
		document.body,
	);
};

/** Row action in a picker drawer: "+" to attach, "✓ Added" (click to remove) once attached. */
export const AttachToggle = ({
	label,
	isAttached,
	disabled,
	onClick,
}: {
	label: string;
	isAttached: boolean;
	disabled?: boolean;
	onClick: () => void;
}) => (
	<button
		aria-label={isAttached ? `Remove ${label}` : `Add ${label}`}
		aria-pressed={isAttached}
		title={isAttached ? 'Click to remove' : 'Add'}
		onClick={onClick}
		disabled={disabled}
		className={`flex min-h-11 shrink-0 items-center justify-center gap-1 rounded-lg border px-2.5 text-[10px] font-black shadow-2xs transition active:scale-95 disabled:opacity-50 md:min-h-7 ${
			isAttached
				? 'border-primary-400 bg-primary-400 text-primary-950 hover:bg-primary-500'
				: 'border-zinc-200 bg-white text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-white'
		}`}>
		{isAttached ? <Check size={12} /> : <Plus size={12} />}
		<span>{isAttached ? 'Added' : 'Add'}</span>
	</button>
);

export default AgentSideDrawer;
