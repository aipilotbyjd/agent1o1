import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notify, setToken, clearTokens } from '@/api/core';
import type {
	TLoginDto,
	TRegisterDto,
	TForgotPasswordDto,
	TResetPasswordDto,
	TUpdateProfileDto,
	TChangePasswordDto,
} from '@/types/auth.type';
import { AuthService, UserService } from './auth.service';
import { authKeys } from './auth.keys';
import type { TSocialProvider } from './auth.endpoints';

export const useCurrentUser = (enabled = true) =>
	useQuery({
		queryKey: authKeys.user(),
		queryFn: ({ signal }) => UserService.fetchMe(signal),
		enabled,
		staleTime: 5 * 60 * 1000,
		retry: false,
	});

export const useLogin = () => {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (payload: TLoginDto) => AuthService.login(payload),
		onSuccess: (res) => {
			setToken(res.data.tokens.access_token, res.data.tokens.expires_in);
			qc.setQueryData(authKeys.user(), res.data.user);
			notify.success('Welcome back!');
		},
		onError: notify.fromError('Login failed'),
	});
};

export const useRegister = () => {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (payload: TRegisterDto) => AuthService.register(payload),
		onSuccess: (res) => {
			setToken(res.data.tokens.access_token, res.data.tokens.expires_in);
			qc.setQueryData(authKeys.user(), res.data.user);
			notify.success('Account created!');
		},
		onError: notify.fromError('Registration failed'),
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
	});
};

export const useForgotPassword = () =>
	useMutation({
		mutationFn: (payload: TForgotPasswordDto) => AuthService.forgotPassword(payload),
		onSuccess: () => notify.success('Password reset link sent!'),
		onError: notify.fromError('Failed to send reset link'),
	});

export const useResetPassword = () =>
	useMutation({
		mutationFn: (payload: TResetPasswordDto) => AuthService.resetPassword(payload),
		onSuccess: () => notify.success('Password reset successfully!'),
		onError: notify.fromError('Failed to reset password'),
	});

export const useSocialRedirect = () =>
	useMutation({
		mutationFn: (provider: TSocialProvider) => AuthService.getSocialRedirectUrl(provider),
		onError: notify.fromError('Failed to start sign-in'),
	});

export const useExchangeSocialCode = () => {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (code: string) => AuthService.exchangeSocialCode(code),
		onSuccess: (res) => {
			setToken(res.data.tokens.access_token, res.data.tokens.expires_in);
			qc.setQueryData(authKeys.user(), res.data.user);
			notify.success('Welcome back!');
		},
		onError: notify.fromError('Sign-in failed'),
	});
};

export const useResendVerificationEmail = () =>
	useMutation({
		mutationFn: () => AuthService.resendVerification(),
		onSuccess: () => notify.success('Verification email sent'),
		onError: notify.fromError('Failed to send verification email'),
	});

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
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: authKeys.user() });
			notify.success('Email verified');
		},
		onError: notify.fromError('Email verification failed'),
	});
};

export const useUpdateProfile = () => {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (payload: TUpdateProfileDto) => UserService.updateProfile(payload),
		onSuccess: (user) => {
			qc.setQueryData(authKeys.user(), user);
			notify.success('Profile updated');
		},
		onError: notify.fromError('Failed to update profile'),
	});
};

export const useChangePassword = () =>
	useMutation({
		mutationFn: (payload: TChangePasswordDto) => AuthService.changePassword(payload),
		onSuccess: () => notify.success('Password changed'),
		onError: notify.fromError('Failed to change password'),
	});

export const useUploadAvatar = () => {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (file: File) => UserService.uploadAvatar(file),
		onSuccess: (user) => {
			qc.setQueryData(authKeys.user(), user);
			notify.success('Avatar updated');
		},
		onError: notify.fromError('Failed to upload avatar'),
	});
};

export const useDeleteAvatar = () => {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: () => UserService.deleteAvatar(),
		onSuccess: (user) => {
			qc.setQueryData(authKeys.user(), user);
			notify.success('Avatar removed');
		},
		onError: notify.fromError('Failed to delete avatar'),
	});
};

export const useDeleteAccount = () => {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: () => UserService.destroy(),
		onSuccess: () => {
			clearTokens();
			qc.clear();
			notify.success('Account deleted');
		},
		onError: notify.fromError('Failed to delete account'),
	});
};
