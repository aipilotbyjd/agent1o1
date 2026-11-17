import {
	Bell,
	Bot,
	CreditCard,
	Gift,
	Megaphone,
	Play,
	Plug,
	ShieldCheck,
	Sparkles,
	Users,
	Zap,
	type LucideIcon,
} from 'lucide-react';
import type {
	TNotification,
	TNotificationCategoryKey,
	TNotificationSeverity,
} from '@/types/notification.type';

// What a notification is (category, severity, link) comes from the API, so
// this file only maps those to the app's own look. A new event needs nothing
// here; a new category needs one icon.

export type TTone = 'danger' | 'warning' | 'success' | 'info' | 'agent' | 'neutral';

export const TONE_CLASSES: Record<TTone, string> = {
	danger: 'bg-rose-500/10 text-rose-600 dark:text-rose-400',
	warning: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
	success: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
	info: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
	agent: 'bg-primary-400/15 text-primary-600 dark:text-primary-400',
	neutral: 'bg-zinc-500/10 text-zinc-500 dark:text-zinc-400',
};

const SEVERITY_TONE: Record<TNotificationSeverity, TTone> = {
	critical: 'danger',
	warning: 'warning',
	success: 'success',
	info: 'info',
};

/** By category key, and by the catalog's icon key (the same names). */
export const CATEGORY_ICONS: Record<TNotificationCategoryKey, LucideIcon> = {
	workspace: Users,
	runs: Play,
	triggers: Zap,
	connections: Plug,
	agents: Bot,
	billing: CreditCard,
	assistant: Sparkles,
	referrals: Gift,
	security: ShieldCheck,
	product_updates: Megaphone,
};

export const categoryIcon = (category: string | null | undefined): LucideIcon =>
	(category && CATEGORY_ICONS[category as TNotificationCategoryKey]) || Bell;

/** A message the platform team sent from the admin panel (a broadcast campaign). */
export const ADMIN_MESSAGE_TYPE = 'admin.message';

export const isAdminMessage = (notification: TNotification): boolean =>
	notification.type === ADMIN_MESSAGE_TYPE;

/** Who an admin message is from, shown where a workspace name would be. */
export const ADMIN_MESSAGE_SENDER = 'From the Agent1o1 team';

export const isUnread = (notification: TNotification): boolean => !notification.read_at;

export type TNotificationMeta = {
	icon: LucideIcon;
	tone: TTone;
	/** What following the notification does, e.g. "View run". */
	action?: string;
};

export const notificationMeta = (notification: TNotification): TNotificationMeta => {
	const icon = categoryIcon(notification.category);
	const action = notification.action?.label ?? undefined;

	if (isAdminMessage(notification)) {
		return {
			icon,
			tone: notification.data?.category === 'marketing' ? 'agent' : 'info',
			action,
		};
	}

	return { icon, tone: SEVERITY_TONE[notification.severity] ?? 'neutral', action };
};

export type TNotificationTarget = {
	href: string;
	/** Another site: opened in a new tab rather than routed inside the app. */
	external: boolean;
};

/**
 * Where clicking a notification should go, or null when it has nowhere to
 * point. Only a path inside the app or an https address is followed, so a
 * stored value can never become a `javascript:` link. `:workspace` in a path
 * (written by the platform team, who can't know anyone's id) stands for the
 * member's current workspace.
 */
export const notificationTarget = (
	notification: TNotification,
	activeWorkspaceId: string | null = null,
): TNotificationTarget | null => {
	const url = notification.action?.url;
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

/** Whether a new notification is loud enough to interrupt with a toast. */
export const shouldToast = (notification: TNotification): boolean =>
	notification.severity === 'critical' || notification.severity === 'warning';
