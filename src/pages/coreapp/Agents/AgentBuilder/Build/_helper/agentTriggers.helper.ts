import type { TTrigger } from '@/types/trigger.type';
import type { TNodeDefinition } from '@/pages/coreapp/Playbooks/WorkflowEditor/_types/node.type';

export type TScheduleFrequency = 'minutes' | 'hourly' | 'daily' | 'weekdays' | 'weekly' | 'monthly' | 'custom';

export type TSchedule = {
	frequency: TScheduleFrequency;
	/** minutes: every this many minutes. */
	every: number;
	/** hourly: past the hour; otherwise with `hour`. */
	minute: number;
	hour: number;
	/** weekly: 0 = Sunday. */
	weekday: number;
	/** monthly: day of the month. */
	day: number;
	cron: string;
};

export const MINUTE_STEPS = [5, 10, 15, 30];

export const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export const FREQUENCIES: { value: TScheduleFrequency; label: string }[] = [
	{ value: 'minutes', label: 'Every few minutes' },
	{ value: 'hourly', label: 'Every hour' },
	{ value: 'daily', label: 'Every day' },
	{ value: 'weekdays', label: 'Every weekday' },
	{ value: 'weekly', label: 'Every week' },
	{ value: 'monthly', label: 'Every month' },
	{ value: 'custom', label: 'Custom (cron)' },
];

export const DEFAULT_SCHEDULE: TSchedule = {
	frequency: 'daily',
	every: 15,
	minute: 0,
	hour: 9,
	weekday: 1,
	day: 1,
	cron: '0 9 * * *',
};

const int = (value: string) => (/^\d+$/.test(value) ? Number(value) : null);

export const scheduleToCron = (schedule: TSchedule): string => {
	const { minute, hour } = schedule;
	switch (schedule.frequency) {
		case 'minutes':
			return `*/${schedule.every} * * * *`;
		case 'hourly':
			return `${minute} * * * *`;
		case 'daily':
			return `${minute} ${hour} * * *`;
		case 'weekdays':
			return `${minute} ${hour} * * 1-5`;
		case 'weekly':
			return `${minute} ${hour} * * ${schedule.weekday}`;
		case 'monthly':
			return `${minute} ${hour} ${schedule.day} * *`;
		default:
			return schedule.cron.trim();
	}
};

/** The friendly form of a cron expression, or `custom` when it isn't one of them. */
export const cronToSchedule = (cron: string): TSchedule => {
	const base = { ...DEFAULT_SCHEDULE, cron };
	const [m, h, dom, mon, dow, ...rest] = cron.trim().split(/\s+/);
	if (rest.length || mon !== '*') return { ...base, frequency: 'custom' };

	const step = m?.match(/^\*\/(\d+)$/);
	if (step && h === '*' && dom === '*' && dow === '*' && MINUTE_STEPS.includes(Number(step[1])))
		return { ...base, frequency: 'minutes', every: Number(step[1]) };

	const minute = int(m ?? '');
	if (minute === null) return { ...base, frequency: 'custom' };
	if (h === '*' && dom === '*' && dow === '*') return { ...base, frequency: 'hourly', minute };

	const hour = int(h ?? '');
	if (hour === null) return { ...base, frequency: 'custom' };
	const timed = { ...base, minute, hour };
	if (dom === '*' && dow === '*') return { ...timed, frequency: 'daily' };
	if (dom === '*' && dow === '1-5') return { ...timed, frequency: 'weekdays' };
	const weekday = int(dow ?? '');
	if (dom === '*' && weekday !== null && weekday <= 6) return { ...timed, frequency: 'weekly', weekday };
	const day = int(dom ?? '');
	if (dow === '*' && day !== null && day >= 1 && day <= 31) return { ...timed, frequency: 'monthly', day };
	return { ...timed, frequency: 'custom' };
};

export const formatTime = (hour: number, minute: number) => {
	const suffix = hour < 12 ? 'AM' : 'PM';
	return `${hour % 12 || 12}:${String(minute).padStart(2, '0')} ${suffix}`;
};

const ordinal = (n: number) => {
	const tail = n % 100 >= 11 && n % 100 <= 13 ? 'th' : (['th', 'st', 'nd', 'rd'][n % 10] ?? 'th');
	return `${n}${tail}`;
};

export const describeCron = (cron: string) => {
	const schedule = cronToSchedule(cron);
	const at = formatTime(schedule.hour, schedule.minute);
	switch (schedule.frequency) {
		case 'minutes':
			return `Every ${schedule.every} minutes`;
		case 'hourly':
			return schedule.minute ? `Every hour at :${String(schedule.minute).padStart(2, '0')}` : 'Every hour';
		case 'daily':
			return `Every day at ${at}`;
		case 'weekdays':
			return `Weekdays at ${at}`;
		case 'weekly':
			return `Every ${WEEKDAYS[schedule.weekday]} at ${at}`;
		case 'monthly':
			return `Monthly on the ${ordinal(schedule.day)} at ${at}`;
		default:
			return `Cron ${cron}`;
	}
};

/** "Gmail: New email" → app "Gmail", event "New email". */
export const splitEventName = (name: string) => {
	const index = name.indexOf(':');
	return index === -1
		? { app: name, event: name }
		: { app: name.slice(0, index).trim(), event: name.slice(index + 1).trim() };
};

/** Settings PollTrigger and FireTriggerEvent read off the trigger, not the reader's own config. */
export const APP_TRIGGER_KEYS = ['activate', 'poll_interval_minutes', 'if_already_running', 'max_failures'];

export const WEBHOOK_AUTH: { value: string; label: string; hint: string }[] = [
	{ value: 'none', label: 'None', hint: 'Anyone with the URL can start the agent.' },
	{ value: 'header_token', label: 'Header token', hint: 'The sender puts a shared token in a header.' },
	{ value: 'signature', label: 'Signature', hint: 'The sender signs the body with HMAC-SHA256.' },
];

export const appEventFor = (trigger: TTrigger, appEvents: TNodeDefinition[]) =>
	trigger.type === 'polling'
		? appEvents.find((event) => event.key === trigger.config?.node_type)
		: undefined;

export const triggerTitle = (trigger: TTrigger, appEvents: TNodeDefinition[]) => {
	const event = appEventFor(trigger, appEvents);
	if (event) return event.label;
	if (trigger.type === 'schedule') return 'Schedule';
	if (trigger.type === 'webhook') return 'Webhook';
	if (trigger.type === 'polling') return 'Polling';
	return 'Manual';
};

export const triggerSummary = (trigger: TTrigger, appEvents: TNodeDefinition[]) => {
	const config = trigger.config ?? {};
	if (trigger.type === 'schedule') {
		const timezone = typeof config.timezone === 'string' && config.timezone ? ` (${config.timezone})` : '';
		return `${describeCron(String(config.cron ?? ''))}${timezone}`;
	}
	if (trigger.type === 'webhook') {
		const auth = WEBHOOK_AUTH.find((item) => item.value === config.authentication);
		return auth && auth.value !== 'none'
			? `When a request arrives · ${auth.label.toLowerCase()}`
			: 'When a request arrives at its URL';
	}
	if (trigger.type === 'polling') {
		const minutes = Number(config.poll_interval_minutes ?? 0);
		const event = appEventFor(trigger, appEvents);
		const what = event ? `Each ${splitEventName(event.label).event.toLowerCase()}` : 'Each new item';
		return minutes ? `${what} · checked every ${minutes} min` : what;
	}
	return 'Only when run by hand';
};

/** Switched off by the circuit breaker rather than by a person. */
export const isTripped = (trigger: TTrigger) =>
	!trigger.is_active &&
	trigger.max_failures !== undefined &&
	trigger.consecutive_failure_count >= trigger.max_failures;
