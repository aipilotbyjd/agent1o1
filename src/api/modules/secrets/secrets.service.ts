import { axiosClient } from '@/api/client';
import { unwrapKey } from '@/api/core';
import type { TApiResponse, TListParams } from '@/api/core';
import type { TSecret, TCreateSecretDto, TUpdateSecretDto } from '@/types/secret.type';
import { SecretEndpoints as E } from './secrets.endpoints';

export const SecretService = {
	// The backend takes no list filters — `params` is accepted only to
	// match `createResource()`'s service contract.
	list: (ws: string, _params?: TListParams, signal?: AbortSignal) =>
		axiosClient
			.get<TApiResponse<{ secrets: TSecret[] }>>(E.list(ws), { signal })
			.then(unwrapKey<TSecret[]>('secrets')),

	detail: (ws: string, id: string, signal?: AbortSignal) =>
		axiosClient
			.get<TApiResponse<{ secret: TSecret }>>(E.detail(ws, id), { signal })
			.then(unwrapKey<TSecret>('secret')),

	create: (ws: string, payload: TCreateSecretDto) =>
		axiosClient
			.post<TApiResponse<{ secret: TSecret }>>(E.create(ws), payload)
			.then(unwrapKey<TSecret>('secret')),

	update: (ws: string, id: string, payload: TUpdateSecretDto) =>
		axiosClient
			.patch<TApiResponse<{ secret: TSecret }>>(E.update(ws, id), payload)
			.then(unwrapKey<TSecret>('secret')),

	remove: (ws: string, id: string) => axiosClient.delete(E.delete(ws, id)).then(() => undefined),
};
