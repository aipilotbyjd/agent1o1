import { CheckCircle2, Cloud, Menu, Moon, Play, Rocket, Settings2, Sun } from 'lucide-react';
import { motion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import DARK_MODE from '@/constants/darkMode.constant';
import useDarkMode from '@/hooks/useDarkMode';
import { useWorkflowShellStore } from '@/store/workflowShell.store';
import useAsideStatus from '@/hooks/useAsideStatus';

export const MainAppBarIconButton = ({
	title,
	children,
	onClick,
	active,
	className,
}: {
	title: string;
	children: ReactNode;
	onClick?: () => void;
	active?: boolean;
	className?: string;
}) => (
	<button
		type='button'
		title={title}
		aria-label={title}
		onClick={onClick}
		className={[
			'flex h-9 w-9 items-center justify-center rounded-lg border text-sm transition',
			active
				? 'border-emerald-300/40 bg-emerald-50 text-emerald-700 dark:border-emerald-300/30 dark:bg-emerald-400/15 dark:text-emerald-200'
				: 'border-zinc-200 bg-white text-zinc-500 hover:bg-zinc-100 hover:text-zinc-950 dark:border-white/10 dark:bg-white/[0.03] dark:text-zinc-400 dark:hover:bg-white/[0.07] dark:hover:text-white',
			className,
		].filter(Boolean).join(' ')}>
		{children}
	</button>
);

export const MainAppBarPillButton = ({
	children,
	onClick,
	variant = 'ghost',
	className,
}: {
	children: ReactNode;
	onClick?: () => void;
	variant?: 'ghost' | 'primary' | 'publish';
	className?: string;
}) => (
	<button
		type='button'
		onClick={onClick}
		className={[
			'flex h-9 items-center gap-2 rounded-lg px-3 text-xs font-semibold transition',
			variant === 'primary'
				? 'border border-emerald-200 bg-emerald-50 text-emerald-700 shadow-lg shadow-emerald-100/50 hover:bg-emerald-100 dark:border-emerald-300/25 dark:bg-emerald-400/15 dark:text-emerald-100 dark:shadow-emerald-950/20 dark:hover:bg-emerald-400/20'
				: variant === 'publish'
					? 'border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:border-emerald-300/20 dark:bg-emerald-400/15 dark:text-emerald-100 dark:hover:bg-emerald-400/20'
					: 'border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-100 hover:text-zinc-950 dark:border-white/10 dark:bg-white/[0.03] dark:text-zinc-300 dark:hover:bg-white/[0.07] dark:hover:text-white',
			className,
		].filter(Boolean).join(' ')}>
		{children}
	</button>
);

const MainAppBar = ({
	title,
	status = 'Ready',
	meta,
	primaryActionLabel = 'Run',
	primaryActionIcon: PrimaryActionIcon = Play,
	onPrimaryAction,
	children,
	showWorkspaceActions = true,
	primaryActionColor = 'emerald',
	showThemeToggle = true,
	toggleClassName = 'lg:hidden',
}: {
	title: string;
	status?: string;
	meta?: string;
	primaryActionLabel?: string;
	primaryActionIcon?: LucideIcon;
	onPrimaryAction?: () => void;
	children?: ReactNode;
	showWorkspaceActions?: boolean;
	primaryActionColor?: 'emerald' | 'purple';
	showThemeToggle?: boolean;
	toggleClassName?: string;
}) => {
	const { toggleAside } = useAsideStatus();
	const { isDarkTheme, setDarkModeStatus } = useDarkMode();

	return (
		<header className='flex h-16 shrink-0 items-center gap-3 border-b border-zinc-200 bg-white/95 px-4 backdrop-blur-xl dark:border-white/10 dark:bg-zinc-950/92'>
			<MainAppBarIconButton title='Open workspace sidebar' onClick={toggleAside} className={toggleClassName}>
				<Menu size={16} />
			</MainAppBarIconButton>

			<div className='min-w-0 flex-1'>
				<div className='flex items-center gap-3'>
					<div className='max-w-xl min-w-0 flex-1 truncate rounded-lg border border-transparent bg-transparent px-1 py-1 text-[15px] font-semibold tracking-tight text-zinc-950 dark:text-white'>
						{title}
					</div>
					<span className='rounded-full border border-amber-200 bg-amber-50 px-2 py-1 text-[11px] font-semibold text-amber-700 dark:border-amber-300/20 dark:bg-amber-300/10 dark:text-amber-100'>
						Draft
					</span>
				</div>
				<div className='mt-0.5 flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-500'>
					<Cloud size={13} />
					<span>{status}</span>
					<span className='h-1 w-1 rounded-full bg-zinc-300 dark:bg-zinc-700' />
					<span>{meta ?? 'Updated just now'}</span>
				</div>
			</div>

			<div className='hidden items-center gap-2 md:flex'>
				{children}
				{showWorkspaceActions && (
					<MainAppBarIconButton title='Workspace settings'>
						<Settings2 size={16} />
					</MainAppBarIconButton>
				)}
				{showThemeToggle && (
					<MainAppBarIconButton
						title={isDarkTheme ? 'Switch to light mode' : 'Switch to dark mode'}
						onClick={() =>
							setDarkModeStatus(isDarkTheme ? DARK_MODE.LIGHT : DARK_MODE.DARK)
						}>
						{isDarkTheme ? <Sun size={16} /> : <Moon size={16} />}
					</MainAppBarIconButton>
				)}
				{showWorkspaceActions && (
					<>
						<MainAppBarPillButton>
							<CheckCircle2 size={15} />
							Save
						</MainAppBarPillButton>
						<MainAppBarPillButton variant='publish'>
							<Rocket size={15} />
							Publish
						</MainAppBarPillButton>
					</>
				)}
				<motion.button
					whileTap={{ scale: 0.98 }}
					type='button'
					onClick={onPrimaryAction}
					className={
						primaryActionColor === 'purple'
							? 'flex h-9 items-center gap-2 rounded-lg bg-primary-400 px-4 text-xs font-semibold text-primary-950 shadow-lg shadow-primary-500/20 transition hover:bg-primary-500 active:scale-95'
							: 'flex h-9 items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 text-xs font-semibold text-emerald-700 shadow-lg shadow-emerald-100/50 transition hover:bg-emerald-100 dark:border-emerald-300/25 dark:bg-emerald-400/15 dark:text-emerald-100 dark:shadow-emerald-950/20 dark:hover:bg-emerald-400/20'
					}>
					<PrimaryActionIcon size={14} fill={primaryActionColor === 'purple' ? 'none' : 'currentColor'} />
					{primaryActionLabel}
				</motion.button>
			</div>
		</header>
	);
};

export default MainAppBar;
