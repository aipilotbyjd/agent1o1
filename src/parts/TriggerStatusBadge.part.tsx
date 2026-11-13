import { Zap } from 'lucide-react';
import type { TTriggerState, TTriggerStatus } from '@/types/trigger.type';

const DOT: Record<TTriggerState, string> = {
	listening: 'bg-emerald-500',
	scheduled: 'bg-emerald-500',
	manual: 'bg-zinc-400',
	checking: 'bg-sky-500',
	connecting: 'bg-sky-500 animate-pulse',
	degraded: 'bg-amber-500',
	reconnect_needed: 'bg-amber-500',
	paused: 'bg-zinc-400',
	suspended: 'bg-zinc-400',
	off_failures: 'bg-rose-500',
	off_skips: 'bg-rose-500',
};

const TEXT: Record<TTriggerState, string> = {
	listening: 'text-emerald-700 dark:text-emerald-400',
	scheduled: 'text-emerald-700 dark:text-emerald-400',
	manual: 'text-zinc-500 dark:text-zinc-400',
	checking: 'text-sky-700 dark:text-sky-400',
	connecting: 'text-sky-700 dark:text-sky-400',
	degraded: 'text-amber-700 dark:text-amber-400',
	reconnect_needed: 'text-amber-700 dark:text-amber-400',
	paused: 'text-zinc-500 dark:text-zinc-400',
	suspended: 'text-zinc-500 dark:text-zinc-400',
	off_failures: 'text-rose-600 dark:text-rose-400',
	off_skips: 'text-rose-600 dark:text-rose-400',
};

type TProps = {
	status: TTriggerStatus;
	/** Just the state, without how events arrive. */
	compact?: boolean;
};

/**
 * What a trigger is doing, in one chip: its state, and whether events arrive
 * instantly or on a timer. The backend decides both (`TriggerStatus`), so the
 * editor and the settings page never disagree.
 */
const TriggerStatusBadge = ({ status, compact = false }: TProps) => {
	const isInstant = status.delivery.mode === 'instant';

	return (
		<span
			title={status.hint ?? undefined}
			className='inline-flex items-center gap-1.5 text-[10px] font-bold'>
			<span className={`size-1.5 shrink-0 rounded-full ${DOT[status.state]}`} />
			<span className={TEXT[status.state]}>{status.label}</span>
			{!compact && isInstant && (
				<span className='inline-flex items-center gap-0.5 rounded-full bg-emerald-50 px-1.5 py-px text-[9px] font-bold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'>
					<Zap size={8} fill='currentColor' strokeWidth={0} />
					Instant
				</span>
			)}
			{!compact && !isInstant && status.delivery.mode === 'polling' && (
				<span className='font-semibold text-zinc-400'>{status.delivery.label}</span>
			)}
		</span>
	);
};

export default TriggerStatusBadge;
