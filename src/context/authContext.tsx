import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Outlet, useNavigate } from 'react-router';
import { useQueryClient } from '@tanstack/react-query';
import { authEvents, clearTokens, getAccessToken, TOKEN_CHANGE_EVENT } from '@/api/core';
import { AuthService } from '@/api/modules/auth';
import { useCurrentUser } from '@/api/modules/user';
import { TUser } from '@/types/auth.type';
import pages from '@/Routes/pages';

// ============================================================
// Auth Context
// ------------------------------------------------------------
// The session's single source of truth for the app shell. It owns
// no user state of its own — the signed-in user lives in the
// `user` module's query cache, which every auth mutation already
// writes to, so this only mirrors it plus the token presence.
// ============================================================

export interface IAuthContextProps {
	/** True only while an existing token is being exchanged for a user. */
	isLoading: boolean;
	isAuthenticated: boolean;
	user: TUser | null;
	/** Alias of `user`, kept so template components keep compiling. */
	userData: TUser | null;
	tokenStorage: string | null;
	onLogout: (isRedirect?: boolean) => Promise<void>;
}

const AuthContext = createContext<IAuthContextProps>({} as IAuthContextProps);

export const AuthProvider = () => {
	const navigate = useNavigate();
	const queryClient = useQueryClient();

	// Token lives in web storage, which React can't observe — mirror it into
	// state and resync on the token-manager's own event (same tab) and the
	// `storage` event (other tabs signing in or out).
	const [tokenStorage, setTokenStorage] = useState<string | null>(() => getAccessToken());

	useEffect(() => {
		const sync = () => setTokenStorage(getAccessToken());
		window.addEventListener(TOKEN_CHANGE_EVENT, sync);
		window.addEventListener('storage', sync);
		return () => {
			window.removeEventListener(TOKEN_CHANGE_EVENT, sync);
			window.removeEventListener('storage', sync);
		};
	}, []);

	const { data: user, isLoading: isUserLoading } = useCurrentUser(!!tokenStorage);

	const signOutLocally = useCallback(() => {
		clearTokens();
		queryClient.clear();
	}, [queryClient]);

	const onLogout = useCallback(
		async (isRedirect = true) => {
			try {
				await AuthService.logout();
			} catch {
				// The token may already be revoked or expired server-side —
				// either way the local session has to go.
			}
			signOutLocally();
			if (isRedirect) navigate(pages.pagesExamples.login.to, { replace: true });
		},
		[navigate, signOutLocally],
	);

	// The API layer never navigates itself (see `api/core/auth-events.ts`) —
	// it announces a dead session and the shell decides where to send the user.
	useEffect(
		() =>
			authEvents.subscribe((event) => {
				if (event !== 'session-expired' && event !== 'signed-out') return;
				signOutLocally();
				navigate(pages.pagesExamples.login.to, { replace: true });
			}),
		[navigate, signOutLocally],
	);

	const value: IAuthContextProps = useMemo(
		() => ({
			isLoading: !!tokenStorage && isUserLoading,
			isAuthenticated: !!tokenStorage && !!user,
			user: user ?? null,
			userData: user ?? null,
			tokenStorage,
			onLogout,
		}),
		[tokenStorage, isUserLoading, user, onLogout],
	);

	return (
		<AuthContext.Provider value={value}>
			<Outlet />
		</AuthContext.Provider>
	);
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
	return useContext(AuthContext);
};
