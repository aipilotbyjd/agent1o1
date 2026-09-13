import { useCallback, useEffect, useMemo, useState } from 'react';
import { Outlet, useNavigate } from 'react-router';
import { useQueryClient } from '@tanstack/react-query';
import {
	authEvents,
	clearTokens,
	getAccessToken,
	hasValidToken,
	TOKEN_CHANGE_EVENT,
} from '@/api/core';
import { useCurrentUser } from '@/api/modules/user';
import { useLogout } from '@/api/modules/auth';
import { WorkspaceProvider } from '@/context/workspace';
import { RealtimeProvider } from '@/context/realtime';
import pages from '@/Routes/pages';
import AuthContext from './AuthContext';
import type { IAuthContextProps } from './auth.types';

export const AuthProvider = () => {
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const [accessToken, setAccessToken] = useState<string | null>(() => getAccessToken());
	const hasActiveToken = !!accessToken && hasValidToken();
	const {
		data: userData,
		isLoading: isCurrentUserLoading,
		refetch: refetchCurrentUser,
	} = useCurrentUser(hasActiveToken);
	const logoutMutation = useLogout();

	useEffect(() => {
		const syncToken = () => setAccessToken(getAccessToken());

		window.addEventListener(TOKEN_CHANGE_EVENT, syncToken);
		window.addEventListener('storage', syncToken);

		return () => {
			window.removeEventListener(TOKEN_CHANGE_EVENT, syncToken);
			window.removeEventListener('storage', syncToken);
		};
	}, []);

	const signOutLocally = useCallback(() => {
		clearTokens();
		queryClient.clear();
		setAccessToken(getAccessToken());
	}, [queryClient]);

	const onLogout = useCallback(
		async (isNavigate = true) => {
			try {
				if (accessToken) await logoutMutation.mutateAsync();
			} finally {
				signOutLocally();
				if (isNavigate) navigate(pages.identity.login.to, { replace: true });
			}
		},
		[accessToken, logoutMutation, navigate, signOutLocally],
	);

	const refreshCurrentUser = useCallback(async () => {
		await refetchCurrentUser();
	}, [refetchCurrentUser]);

	useEffect(
		() =>
			authEvents.subscribe((event) => {
				if (event !== 'session-expired' && event !== 'signed-out') return;
				signOutLocally();
				navigate(pages.identity.login.to, { replace: true });
			}),
		[navigate, signOutLocally],
	);

	const isLoading = isCurrentUserLoading;
	const isAuthenticated = hasActiveToken && !!userData;

	const enrichedUserData = useMemo(() => {
		if (!userData) return null;
		const nameParts = userData.name.trim().split(/\s+/).filter(Boolean);
		const firstName = nameParts[0] || '';
		const lastName = nameParts.slice(1).join(' ') || '';
		return {
			...userData,
			firstName,
			lastName,
			role: userData.current_workspace?.role ?? 'Member',
			isVerified: !!userData.email_verified_at,
			image: { org: userData.avatar ?? undefined },
		};
	}, [userData]);

	const value: IAuthContextProps = useMemo(
		() => ({
			isLoading,
			isAuthenticated,
			tokenStorage: accessToken,
			onLogout,
			refreshCurrentUser,
			userData: enrichedUserData,
		}),
		[isLoading, isAuthenticated, accessToken, onLogout, refreshCurrentUser, enrichedUserData],
	);

	return (
		<AuthContext.Provider value={value}>
			<WorkspaceProvider>
				<RealtimeProvider>
					<Outlet />
				</RealtimeProvider>
			</WorkspaceProvider>
		</AuthContext.Provider>
	);
};
