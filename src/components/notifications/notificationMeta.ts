import {
	Bell,
	Coins,
	CreditCard,
	Gauge,
	Hand,
	PlugZap,
	Sparkles,
	Users,
	XCircle,
	type LucideIcon,
} from 'lucide-react';
import paths from '@/Routes/paths';
import type { TNotification } from '@/types/notification.type';

type TTone = 'danger' | 'warning' | 'success' | 'info' | 'agent' | 'neutral';

export const TONE_CLASSES: Record<TTone, string> = {
	danger: 'bg-rose-500/10 text-rose-600 dark:text-rose-400',
	warning: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
	success: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
	info: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
	agent: 'bg-primary-400/15 text-primary-600 dark:text-primary-400',
	neutral: 'bg-zinc-500/10 text-zinc-500 dark:text-zinc-400',
};

type TNotificationMeta = {
	icon: LucideIcon;
	tone: TTone;
	/** What following the notification does, e.g. "View run". */
	action?: string;
	href?: (workspaceId: string, data: Record<string, unknown>) => string | null;
};

const idFrom = (data: Record<string, unknown>, key: string): string | null =>
	typeof data[key] === 'string' ? (data[key] as string) : null;

const BY_TYPE: Record<string, TNotificationMeta> = {
	'run.failed': {
		icon: XCircle,
		tone: 'danger',
		action: 'View run',
		href: (ws, data) => paths.trail(ws, idFrom(data, 'run_id') ?? undefined),
	},
	'run.approval_requested': {
		icon: Hand,
		tone: 'warning',
		action: 'Review approval',
		href: (ws, data) => paths.trail(ws, idFrom(data, 'run_id') ?? undefined),
	},
	'agent.reflection_run_completed': {
		icon: Sparkles,
		tone: 'agent',
		action: 'Review suggestions',
		href: (ws, data) => {
			const agentId = idFrom(data, 'agent_id');
			return agentId ? paths.agentInsights(ws, agentId, 'reflections') : null;
		},
	},
	'agent.session_evaluation_notify': {
		icon: Gauge,
		tone: 'warning',
		action: 'Open grading',
		href: (ws, data) => {
			const agentId = idFrom(data, 'agent_id');
			return agentId ? paths.agentInsights(ws, agentId, 'grading') : null;
		},
	},
	'billing.credits_low': {
		icon: Coins,
		tone: 'warning',
		action: 'Top up credits',
		href: (ws) => paths.billingCredits(ws),
	},
	'billing.credits_exhausted': {
		icon: Coins,
		tone: 'danger',
		action: 'Top up credits',
		href: (ws) => paths.billingCredits(ws),
	},
	'billing.overage_cap_reached': {
		icon: Coins,
		tone: 'danger',
		action: 'Open credits',
		href: (ws) => paths.billingCredits(ws),
	},
	'billing.payment_failed': {
		icon: CreditCard,
		tone: 'danger',
		action: 'Update payment',
		href: (ws) => paths.billing(ws),
	},
	'billing.payment_recovered': {
		icon: CreditCard,
		tone: 'success',
		action: 'Open billing',
		href: (ws) => paths.billing(ws),
	},
	'billing.subscription_renewed': {
		icon: CreditCard,
		tone: 'success',
		action: 'Open billing',
		href: (ws) => paths.billing(ws),
	},
	'billing.subscription_canceled': {
		icon: CreditCard,
		tone: 'warning',
		action: 'View plans',
		href: (ws) => paths.billingPlans(ws),
	},
	'billing.trial_ending': {
		icon: CreditCard,
		tone: 'warning',
		action: 'View plans',
		href: (ws) => paths.billingPlans(ws),
	},
	'connector.credential_expired': {
		icon: PlugZap,
		tone: 'warning',
		action: 'Reconnect app',
		href: (ws) => paths.apps(ws),
	},
};

const MEMBER_EVENT: TNotificationMeta = {
	icon: Users,
	tone: 'info',
	action: 'Open members',
	href: (ws) => paths.members(ws),
};

const FALLBACK: TNotificationMeta = { icon: Bell, tone: 'neutral' };

export const notificationMeta = (type: string | null): TNotificationMeta => {
	if (type && BY_TYPE[type]) return BY_TYPE[type];
	if (type?.startsWith('workspace.member')) return MEMBER_EVENT;
	return FALLBACK;
};

/** Where clicking the notification should go, or null when it has nowhere to point. */
export const notificationHref = (notification: TNotification): string | null => {
	const meta = notificationMeta(notification.type);
	if (!meta.href || !notification.workspace_id) return null;
	return meta.href(notification.workspace_id, notification.data ?? {});
};
