import { useEffect } from 'react';
import { useAuth } from '@/context/auth';
import { Sentry } from '@/utils/sentry.util';

/**
 * Keeps error reports tied to the signed-in user and active workspace, and
 * clears both on sign-out. Only ids are sent, never the email or name.
 * Renders nothing.
 */
export const SentrySync = () => {
	const { isAuthenticated, userData } = useAuth();

	const userId = userData?.id;
	const workspaceId = userData?.current_workspace_id;

	useEffect(() => {
		Sentry.setUser(isAuthenticated && userId ? { id: userId } : null);
	}, [isAuthenticated, userId]);

	useEffect(() => {
		Sentry.setTag('workspace_id', isAuthenticated && workspaceId ? workspaceId : undefined);
	}, [isAuthenticated, workspaceId]);

	return null;
};
