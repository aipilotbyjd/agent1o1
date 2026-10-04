// ============================================================
// Auth Context Types
// ============================================================
import type { TUser } from '@/types/auth.type';

export type TEnrichedUser = TUser & {
	firstName: string;
	lastName: string;
	role: string;
	isVerified: boolean;
	image: { org?: string };
};

export interface IAuthContextProps {
	isLoading: boolean;
	isAuthenticated: boolean;
	userData: TEnrichedUser | null;
	tokenStorage: string | null;
	onLogout: (isRedirect?: boolean) => Promise<void>;
	refreshCurrentUser: () => Promise<void>;
}
