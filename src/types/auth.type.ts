// ============================================================
// Auth Types
// ------------------------------------------------------------
// The refresh token is never in a response body — it's set as an
// httpOnly, secure, sameSite=none cookie by every endpoint that
// issues tokens, and `POST /auth/refresh` reads it back the same
// way. `TAuthTokens` reflects exactly what the client can see.
// ============================================================
import type { TApiResponse } from './api.type';
import type { TWorkspace } from './workspace.type';

export type TUser = {
	id: string;
	name: string;
	email: string;
	email_verified_at: string | null;
	two_factor_enabled: boolean;
	avatar: string | null;
	current_workspace_id: string | null;
	current_workspace: TWorkspace | null;
	created_at: string;
	updated_at: string;
};

// ─── Request DTOs ────────────────────────────────────────────

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
};

export type TChangePasswordDto = {
	current_password: string;
	password: string;
	password_confirmation: string;
	revoke_other_sessions?: boolean;
};

export type TSwitchWorkspaceDto = {
	workspace_id: string;
};

// ─── Two-factor ──────────────────────────────────────────────

export type TVerifyTwoFactorDto = {
	challenge_token: string;
	code: string;
};

export type TConfirmTwoFactorDto = {
	code: string;
};

export type TDisableTwoFactorDto = {
	current_password: string;
};

/** `POST /auth/2fa/enable` mints the secret and the otpauth:// URI for it.
 *  No QR image is sent — the client renders one from `otpauth_url`, which
 *  keeps the secret off any third-party image service. */
export type TTwoFactorEnableResult = { secret: string; otpauth_url: string };
/** Confirm and regenerate are the only two moments the plaintext codes exist
 *  — they are hashed at rest and never shown again. */
export type TTwoFactorConfirmResult = { recovery_codes: string[] };
export type TTwoFactorRegenerateResult = { recovery_codes: string[] };

/** `GET /auth/2fa/recovery-codes` therefore reports only how many are left. */
export type TTwoFactorRecoveryCodes = { recovery_codes_remaining: number };

// ─── Social login ────────────────────────────────────────────

export type TSocialProvider = 'google' | 'github';

export type TSocialRedirectResult = { url: string };

export type TExchangeSocialCodeDto = {
	code: string;
};

// ─── Sessions (issued tokens) ────────────────────────────────

export type TAuthSession = {
	id: string;
	name: string | null;
	scopes: string[];
	revoked: boolean;
	expires_at: string | null;
	created_at: string;
};

export type TAuthEvent = {
	id: string;
	event: string;
	label: string;
	ip_address: string | null;
	user_agent: string | null;
	context: Record<string, unknown> | null;
	created_at: string;
};

// ─── API keys (workspace-scoped) ─────────────────────────────

export type TApiKeyAbility =
	| 'workflows:read'
	| 'workflows:write'
	| 'runs:read'
	| 'agents:invoke'
	| 'connectors:manage';

export type TApiKey = {
	id: string;
	workspace_id: string;
	name: string;
	abilities: TApiKeyAbility[];
	last_used_at: string | null;
	expires_at: string | null;
	created_at: string;
};

export type TCreateApiKeyDto = {
	name: string;
	abilities: TApiKeyAbility[];
	expires_at?: string | null;
};

/** The plaintext key is returned once, on creation only — it is never
 *  readable again afterward. */
export type TCreateApiKeyResult = { api_key: TApiKey; plain_text_key: string };

// ─── Response types ──────────────────────────────────────────

/** Tokens as the client can actually see them — the refresh token itself
 *  never leaves the `refresh_token` cookie. */
export type TAuthTokens = {
	access_token: string;
	expires_in: number;
	token_type: string;
};

export type TLoginSuccessData = { user: TUser; tokens: TAuthTokens };

/** Login short-circuits into this shape for accounts with 2FA enabled —
 *  exchange `two_factor_challenge` + the emailed code via
 *  `POST /auth/2fa/verify` to get `TLoginSuccessData` instead. */
export type TTwoFactorChallengeData = { two_factor_challenge: string };

export type TLoginResponse = TApiResponse<TLoginSuccessData | TTwoFactorChallengeData>;

export const isTwoFactorChallenge = (
	data: TLoginSuccessData | TTwoFactorChallengeData,
): data is TTwoFactorChallengeData => 'two_factor_challenge' in data;

/** Registration returns the created user and tokens — no email
 *  verification gate on login, only on actions that require it. */
export type TRegisterResponse = TApiResponse<TLoginSuccessData>;

/** Refresh returns a fresh access token only — the rotated refresh token
 *  is queued as a new `refresh_token` cookie, not returned in the body. */
export type TRefreshResponse = TApiResponse<{ tokens: TAuthTokens }>;
