import useAfterAuthRedirect from '@/hooks/useAfterAuthRedirect';
import pages from '@/Routes/pages';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Outlet, useNavigate } from 'react-router';
import { useQueryClient } from '@tanstack/react-query';
import { TOKEN_CHANGE_EVENT, authEvents, clearTokens, getAccessToken, hasValidToken } from '@/api/core';
import { useCurrentUser } from '@/api/modules/user';
import { useLogin, useLogout, useRegister } from '@/api/modules/auth';
import { isTwoFactorChallenge, type TRegisterDto, type TUser } from '@/types/auth.type';
import { WorkspaceProvider } from '@/context/workspaceContext';
import { RealtimeProvider } from '@/context/realtimeContext';

// ============================================================
// Auth Context Types
// ============================================================

export type TEnrichedUser = TUser & {
	firstName: string;
	lastName: string;
	role: string;
	isVerified: boolean;
	image: { org?: string };
};

export interface IAuthContextProps {
	isLoading: boolean;
	isLoginLoading: boolean;
	isRegisterLoading: boolean;
	isAuthenticated: boolean;
	userData: TEnrichedUser | null;
	tokenStorage: string | null;
	/** Resolves once the session is established. Accounts with 2FA are routed
	 *  to /two-factor with the challenge token instead of signing straight in. */
	onLogin: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
	onRegister: (data: TRegisterDto) => Promise<void>;
	onLogout: (isRedirect?: boolean) => Promise<void>;
	refreshCurrentUser: () => Promise<void>;
}

const AuthContext = createContext<IAuthContextProps>({} as IAuthContextProps);

export const AuthProvider = () => {
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const redirectAfterAuth = useAfterAuthRedirect();
	const [accessToken, setAccessToken] = useState<string | null>(() => getAccessToken());
	const hasActiveToken = !!accessToken && hasValidToken();
	const {
		data: userData,
		isLoading: isCurrentUserLoading,
		refetch: refetchCurrentUser,
	} = useCurrentUser(hasActiveToken);
	const loginMutation = useLogin();
	const registerMutation = useRegister();
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

	const onLogin = useCallback(
		async (email: string, password: string, rememberMe = false) => {
			const { res } = await loginMutation.mutateAsync({ email, password, rememberMe });

			// Accounts with 2FA never get a token here — the challenge is
			// exchanged for one on /two-factor.
			if (isTwoFactorChallenge(res.data)) {
				navigate(pages.auth.twoFactor.to, {
					replace: true,
					state: { challengeToken: res.data.two_factor_challenge, rememberMe },
				});
				return;
			}

			setAccessToken(getAccessToken());
			await redirectAfterAuth();
		},
		[loginMutation, navigate, redirectAfterAuth],
	);

	const onRegister = useCallback(
		async (data: TRegisterDto) => {
			await registerMutation.mutateAsync(data);
			setAccessToken(getAccessToken());
			navigate(pages.auth.verifyEmail.to, { replace: true });
		},
		[registerMutation, navigate],
	);

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
				if (isNavigate) navigate(pages.auth.login.to, { replace: true });
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
				navigate(pages.auth.login.to, { replace: true });
			}),
		[navigate, signOutLocally],
	);

	// Only a session actually being resolved counts as loading. Without a
	// token there is nothing to wait for, and gating on the query alone would
	// blank public pages (/login, /email-verified) the moment anything
	// refetched the current user.
	const isLoading = hasActiveToken && isCurrentUserLoading;
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
			isLoginLoading: loginMutation.isPending,
			isRegisterLoading: registerMutation.isPending,
			isAuthenticated,
			tokenStorage: accessToken,
			onLogin,
			onRegister,
			onLogout,
			refreshCurrentUser,
			userData: enrichedUserData,
		}),
		[
			isLoading,
			loginMutation.isPending,
			registerMutation.isPending,
			isAuthenticated,
			accessToken,
			onLogin,
			onRegister,
			onLogout,
			refreshCurrentUser,
			enrichedUserData,
		],
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

export const useAuth = () => useContext(AuthContext);

export default AuthContext;
