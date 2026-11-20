import { axiosClient } from '@/api/client';
import { unwrapKey } from '@/api/core';
import type { TApiResponse } from '@/api/core';
import type {
	TUser,
	TUpdateProfileDto,
	TSwitchWorkspaceDto,
	TDeleteAccountDto,
	TAccountDeletionCheck,
	TDataExport,
	TSignupAttribution,
} from '@/types/auth.type';
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

	/** Where a Google or GitHub signup came from; the server keeps only the first, for new accounts. */
	recordSignupAttribution: (attribution: TSignupAttribution) =>
		axiosClient.post(UserEndpoints.signupAttribution, { attribution }).then(() => undefined),

	uploadAvatar: (file: File) => {
		const form = new FormData();
		form.append('avatar', file);
		return axiosClient
			.post<TApiResponse<{ user: TUser }>>(UserEndpoints.uploadAvatar, form, {
				headers: { 'Content-Type': undefined },
			})
			.then(unwrapKey<TUser>('user'));
	},

	deleteAvatar: () =>
		axiosClient
			.delete<TApiResponse<{ user: TUser }>>(UserEndpoints.deleteAvatar)
			.then(unwrapKey<TUser>('user')),

	destroy: (payload: TDeleteAccountDto) =>
		axiosClient.delete(UserEndpoints.destroy, { data: payload }).then(() => undefined),

	fetchDeletionCheck: (signal?: AbortSignal) =>
		axiosClient
			.get<TApiResponse<TAccountDeletionCheck>>(UserEndpoints.deletionCheck, { signal })
			.then((r) => r.data.data),

	// ─── Data exports ────────────────────────────────────────

	listDataExports: (signal?: AbortSignal) =>
		axiosClient
			.get<TApiResponse<{ exports: TDataExport[] }>>(UserEndpoints.dataExports, { signal })
			.then(unwrapKey<TDataExport[]>('exports')),

	requestDataExport: () =>
		axiosClient
			.post<TApiResponse<{ export: TDataExport }>>(UserEndpoints.dataExports)
			.then(unwrapKey<TDataExport>('export')),

	/** Fetched with the API token, then saved: a plain link would carry no auth. */
	downloadDataExport: async (dataExport: Pick<TDataExport, 'id' | 'requested_at'>) => {
		const response = await axiosClient.get(UserEndpoints.dataExportDownload(dataExport.id), {
			responseType: 'blob',
		});
		const url = URL.createObjectURL(response.data as Blob);
		const link = document.createElement('a');
		link.href = url;
		link.download = `data-export-${dataExport.requested_at.slice(0, 10)}.zip`;
		document.body.appendChild(link);
		link.click();
		link.remove();
		URL.revokeObjectURL(url);
	},

	cancelEmailChange: () =>
		axiosClient
			.delete<TApiResponse<{ user: TUser }>>(UserEndpoints.cancelEmailChange)
			.then(unwrapKey<TUser>('user')),

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
