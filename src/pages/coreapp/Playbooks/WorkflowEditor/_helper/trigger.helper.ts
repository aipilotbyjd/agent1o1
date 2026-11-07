import { apiConfig } from '@/api/core/config';
import { notify } from '@/api/core';
import type { TTriggerMechanism, TTriggerPreset } from '@/types/catalog.type';
import type { TTrigger, TTriggerEventStatus } from '@/types/trigger.type';

// The public webhook route is `POST /api/hooks/{token}`: outside `/api/v1`,
// so it is derived from the API base URL rather than an endpoint constant.
// The trigger resource only carries `token`; it never sends a ready-made URL.
export const webhookUrlFor = (token: string) =>
	`${apiConfig.baseUrl.replace(/\/v1\/?$/, '')}/hooks/${token}`;

/** Copy text to the clipboard and say so, or say it failed. */
export const copyWithNotice = async (text: string, what: string) => {
	try {
		await navigator.clipboard.writeText(text);
		notify.success(`${what} copied`);
	} catch {
		notify.error(`Could not copy the ${what.toLowerCase()}`);
	}
};

const SAMPLE_BODY = '{"message": "Hello from curl"}';

/**
 * A ready-to-run curl command for a webhook trigger, matching its
 * Authentication setting. The secret is write-only (the API never returns
 * it), so it appears as a placeholder for the person to fill in.
 */
export const webhookCurlFor = (trigger: TTrigger): string => {
	const url = webhookUrlFor(trigger.token ?? '');
	const config = trigger.config ?? {};
	const authentication = String(config.authentication ?? '');
	const header = String(config.header_name || 'X-Webhook-Token');

	if (authentication === 'header_token') {
		return [
			`curl -X POST '${url}' \\`,
			`  -H 'Content-Type: application/json' \\`,
			`  -H '${header}: <your token>' \\`,
			`  -d '${SAMPLE_BODY}'`,
		].join('\n');
	}

	if (authentication === 'signature') {
		return [
			`SECRET='<your signing secret>'`,
			`BODY='${SAMPLE_BODY}'`,
			`SIG=$(printf '%s' "$BODY" | openssl dgst -sha256 -hmac "$SECRET" | sed 's/^.* //')`,
			`curl -X POST '${url}' \\`,
			`  -H 'Content-Type: application/json' \\`,
			`  -H "X-Signature-256: sha256=$SIG" \\`,
			`  -d "$BODY"`,
		].join('\n');
	}

	return [
		`curl -X POST '${url}' \\`,
		`  -H 'Content-Type: application/json' \\`,
		`  -d '${SAMPLE_BODY}'`,
	].join('\n');
};

export const eventStatusDot: Record<TTriggerEventStatus, string> = {
	queued: 'bg-sky-500',
	running: 'bg-sky-500',
	held: 'bg-amber-400',
	batched: 'bg-zinc-300 dark:bg-zinc-600',
	fired: 'bg-emerald-500',
	ignored: 'bg-zinc-300 dark:bg-zinc-600',
	skipped: 'bg-zinc-300 dark:bg-zinc-600',
	duplicate: 'bg-zinc-300 dark:bg-zinc-600',
	rejected: 'bg-rose-500',
	failed: 'bg-rose-500',
};

/** The four mechanisms `TriggerType` accepts: `event` is a frontend-only value. */
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
// their own cron: these are client-side shortcuts, not presets.
export const CRON_SHORTCUTS = [
	{ label: 'Every 15 min', cron: '*/15 * * * *' },
	{ label: 'Every hour', cron: '0 * * * *' },
	{ label: 'Daily 9:00', cron: '0 9 * * *' },
	{ label: 'Weekdays 9:00', cron: '0 9 * * 1-5' },
	{ label: 'Mondays 9:00', cron: '0 9 * * 1' },
];

const CRON_FIELD = /^(\*|\d+(-\d+)?)(\/\d+)?(,(\*|\d+(-\d+)?)(\/\d+)?)*$/;

const CRON_MACROS = new Set([
	'@yearly',
	'@annually',
	'@monthly',
	'@weekly',
	'@daily',
	'@midnight',
	'@hourly',
]);

// Month and weekday names the scheduler accepts, as the numbers they stand for.
const CRON_NAMES: Record<string, string> = {
	jan: '1',
	feb: '2',
	mar: '3',
	apr: '4',
	may: '5',
	jun: '6',
	jul: '7',
	aug: '8',
	sep: '9',
	oct: '10',
	nov: '11',
	dec: '12',
	sun: '0',
	mon: '1',
	tue: '2',
	wed: '3',
	thu: '4',
	fri: '5',
	sat: '6',
};

/**
 * A quick check before saving; the backend still validates the expression
 * properly. Five fields of numbers, ranges, lists and steps, with month and
 * weekday names (`mon-fri`, `jan`) and the `@daily`-style macros.
 */
export const isValidCron = (cron: string) => {
	const trimmed = cron.trim().toLowerCase();
	if (CRON_MACROS.has(trimmed)) return true;
	const fields = trimmed.replace(/[a-z]{3}/g, (name) => CRON_NAMES[name] ?? name).split(/\s+/);
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
