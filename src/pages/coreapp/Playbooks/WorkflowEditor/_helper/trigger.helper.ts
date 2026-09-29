import { apiConfig } from '@/api/core/config';
import type { TTriggerMechanism, TTriggerPreset } from '@/types/catalog.type';
import type { TTrigger, TTriggerEventStatus } from '@/types/trigger.type';

// The public webhook route is `POST /api/hooks/{token}` — outside `/api/v1`,
// so it is derived from the API base URL rather than an endpoint constant.
// The trigger resource only carries `token`; it never sends a ready-made URL.
export const webhookUrlFor = (token: string) =>
	`${apiConfig.baseUrl.replace(/\/v1\/?$/, '')}/hooks/${token}`;

export const eventStatusDot: Record<TTriggerEventStatus, string> = {
	queued: 'bg-sky-500',
	running: 'bg-sky-500',
	fired: 'bg-emerald-500',
	ignored: 'bg-zinc-300 dark:bg-zinc-600',
	skipped: 'bg-zinc-300 dark:bg-zinc-600',
	duplicate: 'bg-zinc-300 dark:bg-zinc-600',
	rejected: 'bg-rose-500',
	failed: 'bg-rose-500',
};

/** The four mechanisms `TriggerType` accepts — `event` is a frontend-only value. */
export const WORKFLOW_TRIGGER_TYPES: {
	value: Exclude<TTriggerMechanism, 'event'>;
	label: string;
	hint: string;
}[] = [
	{ value: 'webhook', label: 'Webhook', hint: 'Runs when something POSTs to a private URL.' },
	{ value: 'schedule', label: 'Schedule', hint: 'Runs on a cron schedule.' },
	{
		value: 'polling',
		label: 'Polling',
		hint: 'Checks a URL on an interval and runs once per new item.',
	},
	{ value: 'manual', label: 'Manual', hint: 'Runs only when someone clicks Run now.' },
];

// The preset resource does not expose its `config`, and the scheduler reads
// `trigger.config.cron` only (never the preset's), so schedules always carry
// their own cron — these are client-side shortcuts, not presets.
export const CRON_SHORTCUTS = [
	{ label: 'Every 15 min', cron: '*/15 * * * *' },
	{ label: 'Every hour', cron: '0 * * * *' },
	{ label: 'Daily 9:00', cron: '0 9 * * *' },
	{ label: 'Weekdays 9:00', cron: '0 9 * * 1-5' },
	{ label: 'Mondays 9:00', cron: '0 9 * * 1' },
];

const CRON_FIELD = /^(\*|\d+(-\d+)?)(\/\d+)?(,(\*|\d+(-\d+)?)(\/\d+)?)*$/;

/**
 * The backend stores `config.cron` unchecked and the scheduler parses it every
 * minute, so a malformed value is only caught here. Five numeric fields only —
 * no `@daily` macros or month/day names.
 */
export const isValidCron = (cron: string) => {
	const fields = cron.trim().split(/\s+/);
	return fields.length === 5 && fields.every((field) => CRON_FIELD.test(field));
};

/** Human label for a trigger card: the preset name when it came from one. */
export const triggerTitle = (trigger: TTrigger, presets: TTriggerPreset[]) => {
	const preset = trigger.preset_id
		? presets.find((item) => String(item.id) === String(trigger.preset_id))
		: undefined;
	if (preset) return preset.name;
	return (
		WORKFLOW_TRIGGER_TYPES.find((type) => type.value === trigger.type)?.label ?? trigger.type
	);
};
