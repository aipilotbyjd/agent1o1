import type { TApiResponse } from './api.type';

// No global `role` on the backend — only per-workspace membership roles.
export type TUser = {
	id: string;
	name: string;
	email: string;
	email_verified_at: string | null;
	avatar: string | null;
	current_workspace_id: string | null;
	created_at: string;
	updated_at: string;

	// Derived client-side in normalizeUser, not sent by the backend.
	firstName?: string;
	lastName?: string;
	isVerified?: boolean;
	image?: { org: string | null };
};

export type TLoginDto = {
	email: string;
	password: string;
};

export type TRegisterDto = {
	name: string;
	email: string;
	password: string;
	password_confirmation: string;
};

export type TForgotPasswordDto = {
	email: string;
};

export type TResetPasswordDto = {
	email: string;
	token: string;
	password: string;
	password_confirmation: string;
};

export type TUpdateProfileDto = {
	name?: string;
	email?: string;
};

export type TChangePasswordDto = {
	current_password: string;
	password: string;
	password_confirmation: string;
	revoke_other_sessions?: boolean;
};

export type TAuthToken = {
	token_type: string;
	expires_in: number;
	access_token: string;
};

export type TAuthData = {
	user: TUser;
	tokens: TAuthToken;
};

export type TAuthResponse = TApiResponse<TAuthData>;

export type TUserEnvelope = TApiResponse<{ user: TUser }>;
