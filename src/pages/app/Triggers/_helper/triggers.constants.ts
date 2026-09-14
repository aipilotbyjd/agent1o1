import { Clock, Globe, Hand, Radio, RefreshCw, type LucideIcon } from 'lucide-react';
import type { TTriggerMechanism } from '@/types/catalog.type';
import type { TTriggerEventStatus } from '@/types/trigger.type';

// ============================================================
// Trigger constants
// ------------------------------------------------------------
// The five mechanisms `TriggerType` defines on the backend, and
// the four delivery states a trigger event can be in.
// ============================================================

export const TRIGGER_MECHANISMS: TTriggerMechanism[] = [
	'schedule',
	'webhook',
	'manual',
	'polling',
	'event',
];

export const MECHANISM_META: Record<
	TTriggerMechanism,
	{ label: string; description: string; icon: LucideIcon; color: string }
> = {
	schedule: {
		label: 'Schedule',
		description: 'Runs on a cron expression in the workspace timezone.',
		icon: Clock,
		color: '#6366F1',
	},
	webhook: {
		label: 'Webhook',
		description: 'Runs when an external service posts to a generated URL.',
		icon: Globe,
		color: '#0EA5E9',
	},
	manual: {
		label: 'Manual',
		description: 'Only runs when someone starts it by hand.',
		icon: Hand,
		color: '#64748B',
	},
	polling: {
		label: 'Polling',
		description: 'Checks a source on an interval and runs on new data.',
		icon: RefreshCw,
		color: '#F59E0B',
	},
	event: {
		label: 'Event',
		description: 'Runs when another part of the platform emits an event.',
		icon: Radio,
		color: '#A855F7',
	},
};

/** Only webhook triggers carry a token — see `TriggerType::usesToken()`. */
export const usesToken = (type: TTriggerMechanism) => type === 'webhook';

export const EVENT_STATUS_META: Record<TTriggerEventStatus, { label: string; className: string }> =
	{
		accepted: {
			label: 'Accepted',
			className: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400',
		},
		processed: {
			label: 'Processed',
			className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400',
		},
		skipped: {
			label: 'Skipped',
			className: 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400',
		},
		failed: {
			label: 'Failed',
			className: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400',
		},
	};

export const formatDateTime = (value?: string | null) => {
	if (!value) return '—';
	const date = new Date(value);
	return Number.isNaN(date.getTime())
		? '—'
		: date.toLocaleDateString(undefined, {
				month: 'short',
				day: 'numeric',
				year: 'numeric',
				hour: '2-digit',
				minute: '2-digit',
			});
};
