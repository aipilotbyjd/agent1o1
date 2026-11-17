import { useCallback, useMemo } from 'react';
import { isToday, isYesterday } from 'date-fns';
import { useNavigate } from 'react-router';
import { useMarkNotificationRead } from '@/api/modules/notifications';
import { useWorkspaceContext } from '@/context/workspace';
import type { TNotification } from '@/types/notification.type';
import { isUnread, notificationTarget } from './notificationMeta';

/**
 * Following a notification: marks it read, switches to its workspace when it
 * is about another one, then opens its link (in a new tab for another site).
 * `onLeave` runs before navigating, e.g. to close the bell.
 */
export const useOpenNotification = (onLeave?: () => void) => {
	const navigate = useNavigate();
	const { activeWorkspaceId, switchWorkspace } = useWorkspaceContext();
	const markRead = useMarkNotificationRead();

	return useCallback(
		async (notification: TNotification) => {
			if (isUnread(notification)) markRead.mutate(notification.id);

			const target = notificationTarget(notification, activeWorkspaceId || null);
			if (!target) return;

			onLeave?.();
			if (target.external) {
				window.open(target.href, '_blank', 'noopener,noreferrer');
				return;
			}
			if (notification.workspace_id && notification.workspace_id !== activeWorkspaceId) {
				try {
					await switchWorkspace(notification.workspace_id);
				} catch {
					return;
				}
			}
			navigate(target.href);
		},
		[activeWorkspaceId, markRead, navigate, onLeave, switchWorkspace],
	);
};

/** Workspace names by id, only when there is more than one it could be. */
export const useWorkspaceNames = (): Map<string, string> | null => {
	const { workspaces } = useWorkspaceContext();

	return useMemo(
		() =>
			workspaces.length > 1
				? new Map(workspaces.map((workspace) => [workspace.id, workspace.name]))
				: null,
		[workspaces],
	);
};

const dayGroup = (iso: string): string => {
	const date = new Date(iso);
	if (isToday(date)) return 'Today';
	if (isYesterday(date)) return 'Yesterday';
	return 'Earlier';
};

/** Notifications under Today / Yesterday / Earlier, by their latest occurrence. */
export const groupByDay = (notifications: TNotification[]): [string, TNotification[]][] => {
	const byDay = new Map<string, TNotification[]>();
	notifications.forEach((notification) => {
		const day = dayGroup(notification.occurred_at ?? notification.created_at);
		byDay.set(day, [...(byDay.get(day) ?? []), notification]);
	});
	return Array.from(byDay.entries());
};
