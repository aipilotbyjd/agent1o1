import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { setToken, clearTokens } from '@/api/core';
import { userKeys } from '../user/user.keys';
import {
	isTwoFactorChallenge,
	type TLoginDto,
	type TRegisterDto,
	type TForgotPasswordDto,
	type TResetPasswordDto,
	type TChangePasswordDto,
	type TVerifyTwoFactorDto,
	type TConfirmTwoFactorDto,
	type TDisableTwoFactorDto,
	type TExchangeSocialCodeDto,
	type TSocialProvider,
} from '@/types/auth.type';
import { AuthService } from './auth.service';

// ============================================================
// Auth Hooks
// ------------------------------------------------------------
// Auth owns no query cache of its own — every mutation here either
// writes the access token or updates the `user` module's cache
// directly. These stay hand-written rather than going through the
// CRUD resource factory, which targets workspace-scoped
// collections, not session lifecycle actions like these.
// ============================================================

const applySuccessfulLogin = (
	qc: ReturnType<typeof useQueryClient>,
	data: { user: unknown; tokens: { access_token: string; expires_in: number } },
	rememberMe?: boolean,
) => {
	setToken(data.tokens.access_token, data.tokens.expires_in, !!rememberMe);
	qc.setQueryData(userKeys.current(), data.user);
};

export const useLogin = () => {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (payload: TLoginDto & { rememberMe?: boolean }) => {
			const { rememberMe, ...body } = payload;
			return AuthService.login(body).then((res) => ({ res, rememberMe }));
		},
		onSuccess: ({ res, rememberMe }) => {
			if (isTwoFactorChallenge(res.data)) return;
			applySuccessfulLogin(qc, res.data, rememberMe);
		},
		meta: { errorMessage: 'Login failed' },
	});
};

export const useVerifyTwoFactor = () => {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (payload: TVerifyTwoFactorDto & { rememberMe?: boolean }) => {
			const { rememberMe, ...body } = payload;
			return AuthService.verifyTwoFactor(body).then((data) => ({ data, rememberMe }));
		},
		onSuccess: ({ data, rememberMe }) => applySuccessfulLogin(qc, data, rememberMe),
		meta: { errorMessage: 'Two-factor verification failed' },
	});
};

export const useRegister = () => {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (payload: TRegisterDto) => AuthService.register(payload),
		onSuccess: (data) => applySuccessfulLogin(qc, data),
		meta: { errorMessage: 'Registration failed' },
	});
};

export const useLogout = () => {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: () => AuthService.logout(),
		onSettled: () => {
			clearTokens();
			qc.clear();
		},
		meta: { silent: true },
	});
};

export const useLogoutAll = () => {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: () => AuthService.logoutAll(),
		onSettled: () => {
			clearTokens();
			qc.clear();
		},
		meta: { errorMessage: 'Failed to sign out of all devices' },
	});
};

export const useForgotPassword = () =>
	useMutation({
		mutationFn: (payload: TForgotPasswordDto) => AuthService.forgotPassword(payload),
		meta: { errorMessage: 'Failed to send reset link' },
	});

export const useResetPassword = () =>
	useMutation({
		mutationFn: (payload: TResetPasswordDto) => AuthService.resetPassword(payload),
		meta: { errorMessage: 'Failed to reset password' },
	});

export const useChangePassword = () =>
	useMutation({
		mutationFn: (payload: TChangePasswordDto) => AuthService.changePassword(payload),
		meta: { errorMessage: 'Failed to change password' },
	});

export const useResendVerificationEmail = () => {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: () => AuthService.resendVerification(),
		onSuccess: () => qc.invalidateQueries({ queryKey: userKeys.current() }),
		meta: { errorMessage: 'Failed to send verification email' },
	});
};

export const useVerifyEmail = () => {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: ({
			id,
			hash,
			query,
		}: {
			id: string;
			hash: string;
			query?: Record<string, string>;
		}) => AuthService.verifyEmail(id, hash, query),
		onSuccess: () => qc.invalidateQueries({ queryKey: userKeys.current() }),
		meta: { errorMessage: 'Email verification failed' },
	});
};

// ─── Sessions (issued tokens) ────────────────────────────────

export const useAuthSessions = () =>
	useQuery({ queryKey: ['auth-sessions'], queryFn: () => AuthService.sessions() });

export const useRevokeSession = () => {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (tokenId: string) => AuthService.revokeSession(tokenId),
		onSuccess: () => qc.invalidateQueries({ queryKey: ['auth-sessions'] }),
		meta: { errorMessage: 'Failed to revoke session' },
	});
};

// ─── Two-factor ──────────────────────────────────────────────

export const useEnableTwoFactor = () =>
	useMutation({
		mutationFn: () => AuthService.twoFactorEnable(),
		meta: { errorMessage: 'Failed to start two-factor setup' },
	});

export const useConfirmTwoFactor = () => {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (payload: TConfirmTwoFactorDto) => AuthService.twoFactorConfirm(payload),
		onSuccess: () => qc.invalidateQueries({ queryKey: userKeys.current() }),
		meta: { errorMessage: 'Invalid verification code' },
	});
};

export const useDisableTwoFactor = () => {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (payload: TDisableTwoFactorDto) => AuthService.twoFactorDisable(payload),
		onSuccess: () => qc.invalidateQueries({ queryKey: userKeys.current() }),
		meta: { errorMessage: 'Failed to disable two-factor authentication' },
	});
};

export const useTwoFactorRecoveryCodes = () =>
	useQuery({
		queryKey: ['auth-2fa-recovery-codes'],
		queryFn: () => AuthService.twoFactorRecoveryCodes(),
	});

export const useRegenerateRecoveryCodes = () =>
	useMutation({
		mutationFn: () => AuthService.twoFactorRegenerateRecoveryCodes(),
		meta: { errorMessage: 'Failed to regenerate recovery codes' },
	});

// ─── Social login ────────────────────────────────────────────

export const useSocialRedirectUrl = () =>
	useMutation({
		mutationFn: (provider: TSocialProvider) => AuthService.socialRedirectUrl(provider),
		meta: { errorMessage: 'Failed to start social sign-in' },
	});

export const useExchangeSocialCode = () => {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (payload: TExchangeSocialCodeDto) => AuthService.exchangeSocialCode(payload),
		onSuccess: (data) => applySuccessfulLogin(qc, data),
		meta: { errorMessage: 'Social sign-in failed' },
	});
};
