import {
	Bell,
	Coins,
	CreditCard,
	FileCheck2,
	Gauge,
	Gift,
	Hand,
	Megaphone,
	PlugZap,
	Sparkles,
	TrendingDown,
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

const publishRequestHref = (ws: string, data: Record<string, unknown>) => {
	const workflowId = idFrom(data, 'workflow_id');
	const requestId = idFrom(data, 'publish_request_id');
	if (!workflowId) return null;
	const editor = paths.editPlaybook(ws, workflowId);
	return requestId ? `${editor}?publish_request=${requestId}` : editor;
};

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
	'workflow.publish_review_requested': {
		icon: FileCheck2,
		tone: 'warning',
		action: 'Review changes',
		href: publishRequestHref,
	},
	'workflow.publish_request_decided': {
		icon: FileCheck2,
		tone: 'info',
		action: 'Open workflow',
		href: publishRequestHref,
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
	'agent.eval_regressed': {
		icon: TrendingDown,
		tone: 'danger',
		action: 'Open evals',
		href: (ws, data) => {
			const agentId = idFrom(data, 'agent_id');
			return agentId ? paths.agentInsights(ws, agentId, 'evals') : null;
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
	'referral.signed_up': {
		icon: Gift,
		tone: 'info',
		action: 'View referrals',
		href: (ws) => paths.referrals(ws),
	},
	'referral.reward_granted': {
		icon: Gift,
		tone: 'success',
		action: 'View rewards',
		href: (ws) => paths.referrals(ws),
	},
	'referral.milestone_reached': {
		icon: Gift,
		tone: 'success',
		action: 'View referrals',
		href: (ws) => paths.referrals(ws),
	},
	'referral.plan_time_ending': {
		icon: Gift,
		tone: 'warning',
		action: 'View plans',
		href: (ws) => paths.billingPlans(ws),
	},
	'connector.credential_expired': {
		icon: PlugZap,
		tone: 'warning',
		action: 'Reconnect app',
		href: (ws, data) => {
			const credentialId = idFrom(data, 'connector_credential_id');
			return credentialId ? `${paths.apps(ws)}?account=${credentialId}` : paths.apps(ws);
		},
	},
};

const MEMBER_EVENT: TNotificationMeta = {
	icon: Users,
	tone: 'info',
	action: 'Open members',
	href: (ws) => paths.members(ws),
};

const FALLBACK: TNotificationMeta = { icon: Bell, tone: 'neutral' };

/** A message the platform team sent from the admin panel (a broadcast campaign). */
export const ADMIN_MESSAGE_TYPE = 'admin.message';

const ADMIN_MESSAGE: TNotificationMeta = { icon: Megaphone, tone: 'info' };

export const isAdminMessage = (notification: TNotification): boolean =>
	notification.type === ADMIN_MESSAGE_TYPE;

export const notificationMeta = (notification: TNotification): TNotificationMeta => {
	const { type } = notification;
	if (type === ADMIN_MESSAGE_TYPE) {
		const label = notification.data?.action_label;
		return {
			...ADMIN_MESSAGE,
			tone: notification.data?.category === 'marketing' ? 'agent' : 'info',
			action: typeof label === 'string' && label ? label : undefined,
		};
	}
	if (type && BY_TYPE[type]) return BY_TYPE[type];
	if (type?.startsWith('workspace.member')) return MEMBER_EVENT;
	return FALLBACK;
};

export type TNotificationTarget = {
	href: string;
	/** Another site: opened in a new tab rather than routed inside the app. */
	external: boolean;
};

/**
 * An admin message's button link. The API only accepts a path inside the app
 * or an https address; anything else is ignored here too, so a stored value
 * can never become a `javascript:` link. `:workspace` in a path stands for the
 * member's current workspace, since the sender can't know anyone's id.
 */
const adminMessageTarget = (
	data: Record<string, unknown>,
	activeWorkspaceId: string | null,
): TNotificationTarget | null => {
	const url = idFrom(data, 'action_url');
	if (!url) return null;

	if (/^https:\/\/[^\s/?#]+/i.test(url)) return { href: url, external: true };

	if (!url.startsWith('/') || url.startsWith('//') || url.startsWith('/\\')) return null;
	if (!url.includes(':workspace')) return { href: url, external: false };
	if (!activeWorkspaceId) return null;
	return {
		href: url.replace(/:workspace/g, encodeURIComponent(activeWorkspaceId)),
		external: false,
	};
};

/** Where clicking the notification should go, or null when it has nowhere to point. */
export const notificationTarget = (
	notification: TNotification,
	activeWorkspaceId: string | null = null,
): TNotificationTarget | null => {
	if (isAdminMessage(notification)) {
		return adminMessageTarget(notification.data ?? {}, activeWorkspaceId);
	}

	const meta = notificationMeta(notification);
	if (!meta.href || !notification.workspace_id) return null;
	const href = meta.href(notification.workspace_id, notification.data ?? {});
	return href ? { href, external: false } : null;
};
