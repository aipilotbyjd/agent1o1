import { useEffect, useRef } from 'react';
import { usePostHog } from '@posthog/react';
import { useAuth } from '@/context/auth';

/**
 * Keeps PostHog's identity in step with the signed-in user: identifies the
 * user, attaches the active workspace as the `workspace` group (so usage can
 * be read per workspace), and resets on sign-out so the next person on this
 * browser does not inherit the previous identity. Renders nothing.
 */
export const PostHogSync = () => {
	const posthog = usePostHog();
	const { isAuthenticated, userData } = useAuth();
	const wasIdentified = useRef(false);

	const userId = userData?.id;
	const userEmail = userData?.email;
	const userName = userData?.name;
	const isVerified = userData?.isVerified;
	const workspaceId = userData?.current_workspace_id;
	const workspaceName = userData?.current_workspace?.name;

	useEffect(() => {
		if (!posthog) return;

		if (!isAuthenticated || !userId) {
			if (wasIdentified.current) {
				posthog.reset();
				wasIdentified.current = false;
			}
			return;
		}

		posthog.identify(userId, {
			email: userEmail,
			name: userName,
			email_verified: isVerified,
		});
		wasIdentified.current = true;
	}, [posthog, isAuthenticated, userId, userEmail, userName, isVerified]);

	useEffect(() => {
		if (!posthog || !isAuthenticated || !workspaceId) return;

		posthog.group('workspace', workspaceId, { name: workspaceName });
	}, [posthog, isAuthenticated, workspaceId, workspaceName]);

	return null;
};
