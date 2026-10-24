import { useDraftStatus, type TDraftStatus } from '../../_hooks/useDraftStatus.hook';

const pillStyles: Record<TDraftStatus, { dot: string; ring: string }> = {
	live: {
		dot: 'bg-emerald-500',
		ring: 'ring-emerald-500/15',
	},
	changed: {
		dot: 'bg-amber-500',
		ring: 'ring-amber-500/20',
	},
	unpublished: {
		dot: 'bg-zinc-400',
		ring: 'ring-zinc-400/20',
	},
	checking: {
		dot: 'bg-zinc-300 dark:bg-zinc-600',
		ring: 'ring-zinc-300/20 dark:ring-zinc-600/20',
	},
};

/** Draft vs. live at a glance: a coloured dot; the label lives in the tooltip. */
const DraftStatusPill = ({
	onClick,
	className = '',
}: {
	onClick: () => void;
	className?: string;
}) => {
	const { status, label } = useDraftStatus();
	const style = pillStyles[status];

	return (
		<button
			type='button'
			onClick={onClick}
			aria-label={`${label}. Open version history`}
			className={`h-7 w-7 items-center justify-center rounded-lg transition hover:bg-zinc-100 dark:hover:bg-white/[0.06] ${className}`}>
			<span className={`h-2.5 w-2.5 rounded-full ring-4 ${style.dot} ${style.ring}`} />
		</button>
	);
};

export default DraftStatusPill;
