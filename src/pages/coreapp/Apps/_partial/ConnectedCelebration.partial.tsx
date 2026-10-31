import { useEffect, useRef, useState } from 'react';
import { Bot, Check, Workflow, X as CloseIcon } from 'lucide-react';
import { motion, useAnimationControls, useReducedMotion } from 'framer-motion';
import type { IAvailableApp } from '../_types/apps.type';

const CELEBRATION_DURATION_MS = 8000;
const CONFETTI_COLORS = ['#34d399', '#fbbf24', '#f472b6', '#60a5fa', '#a78bfa'];
const CONFETTI_PIECES = Array.from({ length: 28 }, (_, index) => {
	const angle = (index / 28) * Math.PI * 2;
	const distance = 110 + (index % 4) * 30;
	return {
		x: Math.cos(angle) * distance,
		y: Math.sin(angle) * distance,
		rotate: (index % 2 ? 1 : -1) * (180 + index * 25),
		color: CONFETTI_COLORS[index % CONFETTI_COLORS.length],
		round: index % 3 === 0,
	};
});

interface IConnectedCelebrationProps {
	app: IAvailableApp;
	accountName: string;
	onClose: () => void;
	onBuildWorkflow: () => void;
	onOpenAgents: () => void;
	onViewAccounts: () => void;
}

const ConnectedCelebration = ({
	app,
	accountName,
	onClose,
	onBuildWorkflow,
	onOpenAgents,
	onViewAccounts,
}: IConnectedCelebrationProps) => {
	const IconComponent = app.icon;
	const reduceMotion = useReducedMotion();
	const [isPaused, setIsPaused] = useState(false);
	const remainingRef = useRef(CELEBRATION_DURATION_MS);
	const progressControls = useAnimationControls();

	useEffect(() => {
		if (isPaused) return;
		const startedAt = Date.now();
		const timer = window.setTimeout(onClose, remainingRef.current);
		void progressControls.start({
			scaleX: 0,
			transition: { duration: remainingRef.current / 1000, ease: 'linear' },
		});
		return () => {
			window.clearTimeout(timer);
			progressControls.stop();
			remainingRef.current -= Date.now() - startedAt;
		};
	}, [isPaused, onClose, progressControls]);

	useEffect(() => {
		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key === 'Escape') onClose();
		};
		window.addEventListener('keydown', handleKeyDown);
		return () => window.removeEventListener('keydown', handleKeyDown);
	}, [onClose]);

	const nextSteps = [
		{
			icon: Workflow,
			title: 'Build a workflow',
			description: `Automate with ${app.name}`,
			onClick: onBuildWorkflow,
		},
		{
			icon: Bot,
			title: 'Give it to an agent',
			description: 'Let an agent use it',
			onClick: onOpenAgents,
		},
	];

	return (
		<motion.div
			initial={{ opacity: 0 }}
			animate={{ opacity: 1 }}
			exit={{ opacity: 0 }}
			onClick={onClose}
			className='fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 font-sans backdrop-blur-xs dark:bg-black/60'>
			<motion.div
				role='dialog'
				aria-modal='true'
				aria-labelledby='connected-celebration-title'
				initial={{ opacity: 0, scale: 0.9, y: 20 }}
				animate={{ opacity: 1, scale: 1, y: 0 }}
				exit={{ opacity: 0, scale: 0.95, y: 10 }}
				transition={{ type: 'spring', stiffness: 320, damping: 26 }}
				onClick={(event) => event.stopPropagation()}
				onMouseEnter={() => setIsPaused(true)}
				onMouseLeave={() => setIsPaused(false)}
				className='relative w-full max-w-xl overflow-hidden rounded-3xl border border-slate-200/80 bg-white px-6 pt-10 pb-6 text-center shadow-2xl dark:border-zinc-800/80 dark:bg-[#11131c]'>
				<div
					className='pointer-events-none absolute inset-x-0 top-0 h-48 opacity-20 dark:opacity-25'
					style={{
						background: `radial-gradient(circle at 50% 0%, ${app.color} 0%, transparent 70%)`,
					}}
				/>

				<button
					aria-label='Close'
					onClick={onClose}
					className='hover:text-slate-650 absolute top-4 right-4 cursor-pointer rounded-xl p-2 text-slate-400 hover:bg-slate-100 dark:text-zinc-500 dark:hover:bg-zinc-800 dark:hover:text-zinc-300'>
					<CloseIcon className='h-4.5 w-4.5' />
				</button>

				<div className='relative mx-auto flex h-20 w-20 items-center justify-center'>
					{!reduceMotion &&
						CONFETTI_PIECES.map((piece, index) => (
							<motion.span
								key={index}
								className={`absolute h-2 w-2 ${piece.round ? 'rounded-full' : 'rounded-[2px]'}`}
								style={{ backgroundColor: piece.color }}
								initial={{ x: 0, y: 0, opacity: 1, scale: 0.4, rotate: 0 }}
								animate={{
									x: piece.x,
									y: piece.y,
									opacity: 0,
									scale: 1,
									rotate: piece.rotate,
								}}
								transition={{ duration: 1.2, delay: 0.25, ease: 'easeOut' }}
							/>
						))}

					{!reduceMotion && (
						<motion.span
							className='absolute inset-0 rounded-3xl'
							style={{ backgroundColor: app.color }}
							initial={{ scale: 1, opacity: 0.35 }}
							animate={{ scale: 1.8, opacity: 0 }}
							transition={{ duration: 1.4, delay: 0.2, repeat: 1, ease: 'easeOut' }}
						/>
					)}

					<motion.div
						initial={reduceMotion ? false : { scale: 0, rotate: -15 }}
						animate={{ scale: 1, rotate: 0 }}
						transition={{ type: 'spring', stiffness: 260, damping: 15, delay: 0.1 }}
						className='relative flex h-20 w-20 items-center justify-center rounded-3xl text-white shadow-lg'
						style={{ backgroundColor: app.color }}>
						<IconComponent className='h-10 w-10' />
					</motion.div>

					<motion.div
						initial={reduceMotion ? false : { scale: 0 }}
						animate={{ scale: 1 }}
						transition={{ type: 'spring', stiffness: 400, damping: 14, delay: 0.45 }}
						className='absolute -right-2 -bottom-2 flex h-8 w-8 items-center justify-center rounded-full border-4 border-white bg-emerald-500 text-white dark:border-[#11131c]'>
						<Check className='h-4 w-4 stroke-[3px]' />
					</motion.div>
				</div>

				<motion.div
					initial={reduceMotion ? false : { opacity: 0, y: 8 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.35 }}
					className='relative mt-6'>
					<h2
						id='connected-celebration-title'
						className='text-xl font-black tracking-tight text-slate-900 dark:text-white'>
						{app.name} is connected!
					</h2>
					<p className='mx-auto mt-1.5 max-w-sm text-xs font-semibold text-slate-500 dark:text-zinc-400'>
						<span className='text-slate-800 dark:text-zinc-200'>{accountName}</span> is
						ready to use in your workflows and agents.
					</p>
				</motion.div>

				<motion.div
					initial={reduceMotion ? false : { opacity: 0, y: 8 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.5 }}
					className='relative mt-6 grid grid-cols-1 gap-3 text-left sm:grid-cols-2'>
					{nextSteps.map(({ icon: StepIcon, title, description, onClick }) => (
						<button
							key={title}
							type='button'
							onClick={onClick}
							className='group hover:border-primary-500/40 dark:hover:border-primary-500/40 flex cursor-pointer items-center gap-3 rounded-2xl border border-slate-200/70 bg-slate-50/50 p-3.5 transition-all hover:-translate-y-0.5 hover:bg-white hover:shadow-md dark:border-zinc-800 dark:bg-zinc-950/40 dark:hover:bg-zinc-900'>
							<div className='bg-primary-50 text-primary-600 dark:bg-primary-950/30 dark:text-primary-400 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl'>
								<StepIcon className='h-5 w-5' />
							</div>
							<div className='min-w-0'>
								<span className='block text-xs font-extrabold text-slate-900 dark:text-white'>
									{title}
								</span>
								<span className='block truncate text-[10px] font-semibold text-slate-400 dark:text-zinc-500'>
									{description}
								</span>
							</div>
						</button>
					))}
				</motion.div>

				<div className='relative mt-5 flex items-center justify-between gap-3'>
					<button
						type='button'
						onClick={onViewAccounts}
						className='hover:text-primary-600 dark:hover:text-primary-400 cursor-pointer text-[11px] font-bold text-slate-500 dark:text-zinc-400'>
						View {app.name} accounts
					</button>
					<button
						type='button'
						onClick={onClose}
						className='bg-primary-400 text-primary-950 hover:bg-primary-500 h-10 cursor-pointer rounded-xl px-6 text-xs font-extrabold transition-all active:scale-95'>
						Done
					</button>
				</div>

				<motion.div
					className='bg-primary-400 absolute bottom-0 left-0 h-1 w-full origin-left'
					initial={{ scaleX: 1 }}
					animate={progressControls}
				/>
			</motion.div>
		</motion.div>
	);
};

export default ConnectedCelebration;
