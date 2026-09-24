import { useEffect, useRef } from 'react';
import { Navigate, useSearchParams } from 'react-router';
import { notify } from '@/api/core';
import { useAuth } from '@/context/auth';
import { useWorkspaceContext } from '@/context/workspace';
import pages from '@/Routes/pages';

const OUTCOMES: Record<string, { tone: 'success' | 'error'; message: string }> = {
	confirmed: { tone: 'success', message: 'Your email address has been changed.' },
	expired: {
		tone: 'error',
		message: 'That email-change link has expired. Request the change again from your profile.',
	},
	invalid: { tone: 'error', message: 'That email-change link is not valid.' },
};

/**
 * `GET /auth/confirm-email-change/...` does the work server-side, then sends
 * the browser to `{frontend}/settings/account?email_change=<outcome>`. That
 * path has no workspace in it, so this reports the outcome and forwards to the
 * active workspace's Profile page (or sign-in, when opened on another device).
 */
const AccountReturnPage = () => {
	const [searchParams] = useSearchParams();
	const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
	const { activeWorkspaceId, isLoading: isWorkspaceLoading } = useWorkspaceContext();
	const reported = useRef(false);

	const outcome = OUTCOMES[searchParams.get('email_change') ?? ''];

	useEffect(() => {
		if (!outcome || reported.current) return;
		reported.current = true;
		notify[outcome.tone](outcome.message);
	}, [outcome]);

	if (isAuthLoading || (isAuthenticated && isWorkspaceLoading)) return null;

	if (!isAuthenticated) return <Navigate to={pages.identity.login.to} replace />;

	return (
		<Navigate
			to={
				activeWorkspaceId
					? pages.settings.subPages!.profile.to.replace(':workspaceId', activeWorkspaceId)
					: pages.choose.to
			}
			replace
		/>
	);
};

export default AccountReturnPage;
