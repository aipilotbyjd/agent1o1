import { useDraftStatus, type TDraftStatus } from '../../_hooks/useDraftStatus.hook';

const pillStyles: Record<TDraftStatus, { dot: string; className: string }> = {
	live: {
		dot: 'bg-emerald-500',
		className:
			'border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 dark:border-emerald-500/25 dark:bg-emerald-500/10 dark:text-emerald-300 dark:hover:bg-emerald-500/15',
	},
	changed: {
		dot: 'bg-amber-500',
		className:
			'border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100 dark:border-amber-500/25 dark:bg-amber-500/10 dark:text-amber-300 dark:hover:bg-amber-500/15',
	},
	unpublished: {
		dot: 'bg-zinc-400',
		className:
			'border-zinc-200 bg-zinc-50 text-zinc-700 hover:bg-zinc-100 dark:border-white/10 dark:bg-white/[0.04] dark:text-zinc-300 dark:hover:bg-white/[0.08]',
	},
	checking: {
		dot: 'bg-zinc-300 dark:bg-zinc-600',
		className:
			'border-zinc-200 bg-zinc-50 text-zinc-600 hover:bg-zinc-100 dark:border-white/10 dark:bg-white/[0.04] dark:text-zinc-400',
	},
};

/** Draft vs. live at a glance — "Live · v7" or "Unpublished changes". */
const DraftStatusPill = ({
	onClick,
	className = '',
}: {
	onClick: () => void;
	className?: string;
}) => {
	const { status, liveVersionNumber } = useDraftStatus();
	const version = liveVersionNumber ? `v${liveVersionNumber}` : '';
	const label = {
		live: `Live · ${version}`,
		changed: 'Unpublished changes',
		unpublished: 'Not published',
		checking: version ? `Live · ${version}` : 'Draft',
	}[status];
	const style = pillStyles[status];

	return (
		<button
			type='button'
			onClick={onClick}
			aria-label={`${label}. Open version history`}
			className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-semibold whitespace-nowrap transition ${style.className} ${className}`}>
			<span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
			{label}
		</button>
	);
};

export default DraftStatusPill;
