import { axiosClient } from '@/api/client';
import { unwrap, unwrapKey } from '@/api/core';
import type { TMessageResponse, TApiResponse } from '@/api/core';
import type {
	TLoginDto,
	TRegisterDto,
	TLoginResponse,
	TRegisterResponse,
	TRefreshResponse,
	TForgotPasswordDto,
	TResetPasswordDto,
	TChangePasswordDto,
	TVerifyTwoFactorDto,
	TConfirmTwoFactorDto,
	TDisableTwoFactorDto,
	TTwoFactorEnableResult,
	TTwoFactorConfirmResult,
	TTwoFactorRecoveryCodes,
	TSocialProvider,
	TSocialRedirectResult,
	TExchangeSocialCodeDto,
	TAuthSession,
	TLoginSuccessData,
} from '@/types/auth.type';
import { AuthEndpoints } from './auth.endpoints';

export const AuthService = {
	login: (payload: TLoginDto) =>
		axiosClient.post<TLoginResponse>(AuthEndpoints.login, payload).then((r) => r.data),

	register: (payload: TRegisterDto) =>
		axiosClient
			.post<TRegisterResponse>(AuthEndpoints.register, payload)
			.then(unwrap<TLoginSuccessData>),

	verifyTwoFactor: (payload: TVerifyTwoFactorDto) =>
		axiosClient
			.post<TRegisterResponse>(AuthEndpoints.verifyTwoFactor, payload)
			.then(unwrap<TLoginSuccessData>),

	/** No body — the refresh token is read off the httpOnly cookie. */
	refresh: () =>
		axiosClient.post<TRefreshResponse>(AuthEndpoints.refresh).then((r) => r.data.data.tokens),

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
		axiosClient
			.post<TMessageResponse>(AuthEndpoints.changePassword, payload)
			.then((r) => r.data),

	resendVerification: () =>
		axiosClient.post<TMessageResponse>(AuthEndpoints.resendVerification).then((r) => r.data),

	/** Public, signed link — `query` carries the signature/expiry params
	 *  from the emailed verification URL, not a bearer token. */
	verifyEmail: (id: string, hash: string, query?: Record<string, string>) =>
		axiosClient
			.get<TMessageResponse>(AuthEndpoints.verifyEmail(id, hash), { params: query })
			.then((r) => r.data),

	sessions: () =>
		axiosClient
			.get<TApiResponse<{ sessions: TAuthSession[] }>>(AuthEndpoints.sessions)
			.then(unwrapKey<TAuthSession[]>('sessions')),

	revokeSession: (tokenId: string) =>
		axiosClient.delete(AuthEndpoints.revokeSession(tokenId)).then(() => undefined),

	twoFactorEnable: () =>
		axiosClient
			.post<TApiResponse<TTwoFactorEnableResult>>(AuthEndpoints.twoFactorEnable)
			.then(unwrap<TTwoFactorEnableResult>),

	twoFactorConfirm: (payload: TConfirmTwoFactorDto) =>
		axiosClient
			.post<TApiResponse<TTwoFactorConfirmResult>>(AuthEndpoints.twoFactorConfirm, payload)
			.then(unwrap<TTwoFactorConfirmResult>),

	twoFactorDisable: (payload: TDisableTwoFactorDto) =>
		axiosClient.post(AuthEndpoints.twoFactorDisable, payload).then(() => undefined),

	twoFactorRecoveryCodes: () =>
		axiosClient
			.get<TApiResponse<TTwoFactorRecoveryCodes>>(AuthEndpoints.twoFactorRecoveryCodes)
			.then(unwrap<TTwoFactorRecoveryCodes>),

	twoFactorRegenerateRecoveryCodes: () =>
		axiosClient
			.post<TApiResponse<TTwoFactorRecoveryCodes>>(
				AuthEndpoints.twoFactorRegenerateRecoveryCodes,
			)
			.then(unwrap<TTwoFactorRecoveryCodes>),

	socialRedirectUrl: (provider: TSocialProvider) =>
		axiosClient
			.get<TApiResponse<TSocialRedirectResult>>(AuthEndpoints.socialRedirect(provider))
			.then(unwrap<TSocialRedirectResult>),

	exchangeSocialCode: (payload: TExchangeSocialCodeDto) =>
		axiosClient
			.post<TRegisterResponse>(AuthEndpoints.exchangeSocialCode, payload)
			.then(unwrap<TLoginSuccessData>),
};
