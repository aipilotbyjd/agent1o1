import { useCallback, useEffect, useMemo, useState } from 'react';
import { Outlet, useNavigate } from 'react-router';
import { clearTokens, getAccessToken, hasValidToken, TOKEN_CHANGE_EVENT } from '@/api/core';
import { useLogin, useLogout, useRegister } from '@/api/modules/auth';
import { useCurrentUser } from '@/api/modules/user';
import type { TLoginDto, TRegisterDto } from '@/types/auth.type';
import { WorkspaceProvider } from '@/context/workspace';
import { RealtimeProvider } from '@/context/realtime';
import AuthContext from './AuthContext';
import type { IAuthContextProps } from './auth.types';

const LOGIN_REDIRECT_PATH = '/workspaces';
const REGISTER_REDIRECT_PATH = '/verify-email';

export const AuthProvider = () => {
	const navigate = useNavigate();
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
		async (email: string, password: string, rememberMe: boolean) => {
			const credentials: TLoginDto = { email, password };
			await loginMutation.mutateAsync({ ...credentials, rememberMe });
			setAccessToken(getAccessToken());
			navigate(LOGIN_REDIRECT_PATH, { replace: true });
		},
		[loginMutation, navigate],
	);

	const onRegister = useCallback(
		async (data: TRegisterDto) => {
			await registerMutation.mutateAsync(data);
			setAccessToken(getAccessToken());
			navigate(REGISTER_REDIRECT_PATH, { replace: true });
		},
		[registerMutation, navigate],
	);

	const onLogout = useCallback(
		async (isNavigate = true) => {
			try {
				if (accessToken) await logoutMutation.mutateAsync();
				else clearTokens();
			} finally {
				setAccessToken(getAccessToken());
				if (isNavigate) navigate('/login', { replace: true });
			}
		},
		[accessToken, logoutMutation, navigate],
	);

	const refreshCurrentUser = useCallback(async () => {
		await refetchCurrentUser();
	}, [refetchCurrentUser]);

	const isLoading = isCurrentUserLoading;
	const isLoginLoading = loginMutation.isPending;
	const isRegisterLoading = registerMutation.isPending;
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
			isLoginLoading,
			isRegisterLoading,
			isAuthenticated,
			onLogout,
			onLogin,
			onRegister,
			refreshCurrentUser,
			userData: enrichedUserData,
		}),
		[
			isLoading,
			isLoginLoading,
			isRegisterLoading,
			isAuthenticated,
			onLogout,
			onLogin,
			onRegister,
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
