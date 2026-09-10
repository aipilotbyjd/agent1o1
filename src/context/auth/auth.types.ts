// ============================================================
// Auth Context Types
// ============================================================
import type { TUser, TRegisterDto } from '@/types/auth.type';

export interface IAuthContextProps {
	isLoading: boolean;
	isLoginLoading: boolean;
	isRegisterLoading: boolean;
	isAuthenticated: boolean;
	userData: TUser | null;
	onLogin: (email: string, password: string, rememberMe: boolean) => Promise<void>;
	onRegister: (data: TRegisterDto, rememberMe?: boolean) => Promise<void>;
	onLogout: (isRedirect: boolean) => Promise<void>;
	refreshCurrentUser: () => Promise<void>;
}
