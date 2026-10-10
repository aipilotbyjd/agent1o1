import { axiosClient } from '@/api/client';
import { unwrapKey } from '@/api/core';
import type { TApiResponse } from '@/api/core';
import type {
	TAiProviderCredential,
	TAiProviderCredentialCheck,
	TAiKeyPolicy,
	TAiProvidersResult,
	TCreateAiProviderCredentialDto,
	TUpdateAiKeyPolicyDto,
	TUpdateAiProviderCredentialDto,
} from '@/types/ai-provider.type';
import { AiProviderEndpoints as E } from './ai-providers.endpoints';

export const AiProviderService = {
	providers: (ws: string, signal?: AbortSignal) =>
		axiosClient
			.get<TApiResponse<TAiProvidersResult>>(E.providers(ws), { signal })
			.then((r) => r.data.data),

	credentials: (ws: string, signal?: AbortSignal) =>
		axiosClient
			.get<
				TApiResponse<{ ai_provider_credentials: TAiProviderCredential[] }>
			>(E.credentials(ws), { signal })
			.then(unwrapKey<TAiProviderCredential[]>('ai_provider_credentials')),

	create: (ws: string, payload: TCreateAiProviderCredentialDto) =>
		axiosClient
			.post<
				TApiResponse<{ ai_provider_credential: TAiProviderCredential }>
			>(E.credentials(ws), payload)
			.then(unwrapKey<TAiProviderCredential>('ai_provider_credential')),

	update: (ws: string, id: string, payload: TUpdateAiProviderCredentialDto) =>
		axiosClient
			.patch<
				TApiResponse<{ ai_provider_credential: TAiProviderCredential }>
			>(E.credential(ws, id), payload)
			.then(unwrapKey<TAiProviderCredential>('ai_provider_credential')),

	remove: (ws: string, id: string) =>
		axiosClient.delete(E.credential(ws, id)).then(() => undefined),

	setDefault: (ws: string, id: string) =>
		axiosClient
			.post<
				TApiResponse<{ ai_provider_credential: TAiProviderCredential }>
			>(E.setDefault(ws, id))
			.then(unwrapKey<TAiProviderCredential>('ai_provider_credential')),

	policy: (ws: string, signal?: AbortSignal) =>
		axiosClient
			.get<TApiResponse<{ policy: TAiKeyPolicy }>>(E.policy(ws), { signal })
			.then(unwrapKey<TAiKeyPolicy>('policy')),

	updatePolicy: (ws: string, payload: TUpdateAiKeyPolicyDto) =>
		axiosClient
			.put<TApiResponse<{ policy: TAiKeyPolicy }>>(E.policy(ws), payload)
			.then(unwrapKey<TAiKeyPolicy>('policy')),

	validate: (ws: string, id: string) =>
		axiosClient
			.post<TApiResponse<TAiProviderCredentialCheck>>(E.validate(ws, id))
			.then((r) => r.data.data),
};
