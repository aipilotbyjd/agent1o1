import { axiosClient } from '@/api/client';
import { unwrap } from '@/api/core';
import type { TMessageResponse, TApiResponse } from '@/api/core';
import type {
	TLoginDto,
	TRegisterDto,
	TAuthResponse,
	TForgotPasswordDto,
	TResetPasswordDto,
	TUser,
	TUserEnvelope,
	TUpdateProfileDto,
	TChangePasswordDto,
} from '@/types/auth.type';
import { AuthEndpoints, UserEndpoints, type TSocialProvider } from './auth.endpoints';

export const normalizeUser = (user: TUser): TUser => {
	const [firstName, ...rest] = user.name.trim().split(/\s+/);
	return {
		...user,
		firstName,
		lastName: rest.join(' ') || undefined,
		isVerified: !!user.email_verified_at,
		image: { org: user.avatar },
	};
};

const normalizeAuthResponse = (response: TAuthResponse): TAuthResponse => ({
	...response,
	data: { ...response.data, user: normalizeUser(response.data.user) },
});

export const AuthService = {
	login: (payload: TLoginDto) =>
		axiosClient
			.post<TAuthResponse>(AuthEndpoints.login, payload)
			.then((r) => normalizeAuthResponse(r.data)),

	register: (payload: TRegisterDto) =>
		axiosClient
			.post<TAuthResponse>(AuthEndpoints.register, payload)
			.then((r) => normalizeAuthResponse(r.data)),

	refresh: () =>
		axiosClient
			.post<TApiResponse<{ tokens: { access_token: string; expires_in: number } }>>(
				AuthEndpoints.refresh,
			)
			.then(unwrap<{ tokens: { access_token: string; expires_in: number } }>)
			.then((r) => r.tokens),

	logout: () => axiosClient.post(AuthEndpoints.logout).then(() => undefined),

	logoutAll: () => axiosClient.post(AuthEndpoints.logoutAll).then(() => undefined),

	forgotPassword: (payload: TForgotPasswordDto) =>
		axiosClient
			.post<TMessageResponse>(AuthEndpoints.forgotPassword, payload)
			.then((r) => r.data),

	resetPassword: (payload: TResetPasswordDto) =>
		axiosClient
			.post<TMessageResponse>(AuthEndpoints.resetPassword, payload)
			.then((r) => r.data),

	changePassword: (payload: TChangePasswordDto) =>
		axiosClient.post(AuthEndpoints.changePassword, payload).then(() => undefined),

	resendVerification: () =>
		axiosClient.post<TMessageResponse>(AuthEndpoints.resendVerification).then((r) => r.data),

	verifyEmail: (id: string, hash: string, query?: Record<string, string>) =>
		axiosClient
			.get<TMessageResponse>(AuthEndpoints.verifyEmail(id, hash), { params: query })
			.then((r) => r.data),

	getSocialRedirectUrl: (provider: TSocialProvider) =>
		axiosClient
			.get<TApiResponse<{ url: string }>>(AuthEndpoints.socialRedirect(provider))
			.then(unwrap<{ url: string }>)
			.then((r) => r.url),

	exchangeSocialCode: (code: string) =>
		axiosClient
			.post<TAuthResponse>(AuthEndpoints.socialExchange, { code })
			.then((r) => normalizeAuthResponse(r.data)),
};

export const UserService = {
	fetchMe: (signal?: AbortSignal) =>
		axiosClient
			.get<TUserEnvelope>(UserEndpoints.me, { signal })
			.then(unwrap<{ user: TUser }>)
			.then((r) => normalizeUser(r.user)),

	updateProfile: (payload: TUpdateProfileDto) =>
		axiosClient
			.patch<TUserEnvelope>(UserEndpoints.update, payload)
			.then(unwrap<{ user: TUser }>)
			.then((r) => normalizeUser(r.user)),

	uploadAvatar: async (file: File): Promise<TUser> => {
		if (!file.type.startsWith('image/')) throw new Error('Avatar must be an image file');
		if (file.size > 2 * 1024 * 1024) throw new Error('Avatar must be 2MB or smaller');

		const formData = new FormData();
		formData.append('avatar', file);
		const { data } = await axiosClient.post<TUserEnvelope>(
			UserEndpoints.uploadAvatar,
			formData,
			{ headers: { 'Content-Type': 'multipart/form-data' } },
		);
		return normalizeUser(data.data.user);
	},

	deleteAvatar: () =>
		axiosClient
			.delete<TUserEnvelope>(UserEndpoints.deleteAvatar)
			.then(unwrap<{ user: TUser }>)
			.then((r) => normalizeUser(r.user)),

	destroy: () => axiosClient.delete(UserEndpoints.destroy).then(() => undefined),
};
