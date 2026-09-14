import { axiosClient } from '@/api/client';
import { unwrapKey } from '@/api/core';
import type { TApiResponse } from '@/api/core';
import type { TUser, TUpdateProfileDto, TSwitchWorkspaceDto } from '@/types/auth.type';
import type { TApiKey, TCreateApiKeyDto, TCreateApiKeyResult } from '@/types/auth.type';
import { UserEndpoints } from './user.endpoints';

export const UserService = {
	fetchMe: (signal?: AbortSignal) =>
		axiosClient
			.get<TApiResponse<{ user: TUser }>>(UserEndpoints.me, { signal })
			.then(unwrapKey<TUser>('user')),

	updateProfile: (payload: TUpdateProfileDto) =>
		axiosClient
			.patch<TApiResponse<{ user: TUser }>>(UserEndpoints.update, payload)
			.then(unwrapKey<TUser>('user')),

	switchWorkspace: (payload: TSwitchWorkspaceDto) =>
		axiosClient
			.post<TApiResponse<{ user: TUser }>>(UserEndpoints.switchWorkspace, payload)
			.then(unwrapKey<TUser>('user')),

	uploadAvatar: (file: File) => {
		const form = new FormData();
		form.append('avatar', file);
		return axiosClient
			.post<TApiResponse<{ user: TUser }>>(UserEndpoints.uploadAvatar, form)
			.then(unwrapKey<TUser>('user'));
	},

	deleteAvatar: () =>
		axiosClient
			.delete<TApiResponse<{ user: TUser }>>(UserEndpoints.deleteAvatar)
			.then(unwrapKey<TUser>('user')),

	destroy: () => axiosClient.delete(UserEndpoints.destroy).then(() => undefined),

	// ─── API keys ────────────────────────────────────────────

	listApiKeys: (ws: string, signal?: AbortSignal) =>
		axiosClient
			.get<TApiResponse<{ api_keys: TApiKey[] }>>(UserEndpoints.apiKeys(ws), { signal })
			.then(unwrapKey<TApiKey[]>('api_keys')),

	createApiKey: (ws: string, payload: TCreateApiKeyDto) =>
		axiosClient
			.post<TApiResponse<TCreateApiKeyResult>>(UserEndpoints.apiKeys(ws), payload)
			.then((r) => r.data.data),

	deleteApiKey: (ws: string, id: string) =>
		axiosClient.delete(UserEndpoints.apiKey(ws, id)).then(() => undefined),
};
