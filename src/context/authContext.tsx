import { createContext, useContext, useMemo, useState, useEffect, useCallback } from 'react';
import { Outlet, useNavigate } from 'react-router';
import {
	useLogin,
	useLogout,
	useRegister,
	useCurrentUser,
	getAccessToken,
	setToken,
	onCrossTabLogout,
	TOKEN_CHANGE_EVENT,
	AuthService,
} from '@/api';
import type { TUser, TRegisterDto } from '@/types/auth.type';
import { WorkspaceProvider } from '@/context/workspaceContext';

export interface IAuthContextProps {
	isLoading: boolean;
	isLoginLoading: boolean;
	isRegisterLoading: boolean;
	onLogin: (username: string, password: string, rememberMe: boolean) => Promise<void>;
	onRegister: (data: TRegisterDto) => Promise<void>;
	userData: TUser | null;
	usernameStorage: string | null;
	tokenStorage: string | null;
	onLogout: (isRedirect: boolean) => Promise<void>;
	refreshCurrentUser: () => Promise<void>;
}
const AuthContext = createContext<IAuthContextProps>({} as IAuthContextProps);

export const AuthProvider = () => {
	const [tokenStorage, setTokenStorage] = useState<string | null>(getAccessToken());
	const [isBootstrapping, setIsBootstrapping] = useState(true);

	useEffect(() => {
		const sync = () => setTokenStorage(getAccessToken());
		window.addEventListener(TOKEN_CHANGE_EVENT, sync);
		const unsubscribeCrossTab = onCrossTabLogout(sync);
		return () => {
			window.removeEventListener(TOKEN_CHANGE_EVENT, sync);
			unsubscribeCrossTab();
		};
	}, []);

	const { data: userData = null, refetch: refetchCurrentUser } = useCurrentUser(false);

	useEffect(() => {
		AuthService.refresh()
			.then((tokens) => {
				setToken(tokens.access_token, tokens.expires_in);
				return refetchCurrentUser();
			})
			.catch(() => undefined)
			.finally(() => setIsBootstrapping(false));
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const loginMutation = useLogin();
	const registerMutation = useRegister();
	const logoutMutation = useLogout();

	const navigate = useNavigate();

	const refreshCurrentUser = useCallback(async () => {
		await refetchCurrentUser();
	}, [refetchCurrentUser]);

	const onLogin = async (email: string, password: string) => {
		await loginMutation.mutateAsync({ email, password });
		navigate('/customer');
	};

	const onRegister = async (data: TRegisterDto) => {
		await registerMutation.mutateAsync(data);
		navigate('/customer');
	};

	const onLogout = async (isRedirect = true) => {
		await logoutMutation.mutateAsync().catch(() => undefined);
		if (isRedirect) navigate('../login', { replace: true });
	};

	const value: IAuthContextProps = useMemo(
		() => ({
			usernameStorage: userData?.email ?? null,
			tokenStorage,
			onLogin,
			onRegister,
			onLogout,
			refreshCurrentUser,
			userData,
			isLoading: isBootstrapping,
			isLoginLoading: loginMutation.isPending,
			isRegisterLoading: registerMutation.isPending,
		}),
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[
			userData,
			tokenStorage,
			isBootstrapping,
			refreshCurrentUser,
			loginMutation.isPending,
			registerMutation.isPending,
		],
	);
	return (
		<AuthContext.Provider value={value}>
			<WorkspaceProvider>
				<Outlet />
			</WorkspaceProvider>
		</AuthContext.Provider>
	);
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
	return useContext(AuthContext);
};
