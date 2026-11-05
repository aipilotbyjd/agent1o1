import { axiosClient } from '@/api/client';
import { runOAuthPopup, unwrapKey } from '@/api/core';
import type { TApiResponse } from '@/api/core';
import type {
	TAiProviderCredential,
	TAiProviderCredentialCheck,
	TAiKeyPolicy,
	TAiProviderConnectStart,
	TAiKeyPolicyImpact,
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

	startConnect: (ws: string, provider: string) =>
		axiosClient
			.post<TApiResponse<TAiProviderConnectStart>>(E.connect(ws, provider))
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

	previewPolicy: (ws: string, payload: TUpdateAiKeyPolicyDto) =>
		axiosClient
			.post<TApiResponse<{ impact: TAiKeyPolicyImpact }>>(E.policyPreview(ws), payload)
			.then(unwrapKey<TAiKeyPolicyImpact>('impact')),

	restore: (ws: string, id: string) =>
		axiosClient
			.post<
				TApiResponse<{ ai_provider_credential: TAiProviderCredential }>
			>(E.restore(ws, id))
			.then(unwrapKey<TAiProviderCredential>('ai_provider_credential')),

	validate: (ws: string, id: string) =>
		axiosClient
			.post<TApiResponse<TAiProviderCredentialCheck>>(E.validate(ws, id))
			.then((r) => r.data.data),
};

// ============================================================
// One-click connect
// ------------------------------------------------------------
// The member signs in at the provider in a popup, which lands on our own
// `AI_PROVIDER_CONNECT_PATH` page. That page finishes the connection with
// the backend's public callback and posts the outcome back here. See
// `pages/settings/AiProviders/ConnectComplete.page.tsx` for the other half.
// ============================================================

/** Must match the backend's `byok.connect.redirect_path`. */
export const AI_PROVIDER_CONNECT_PATH = '/oauth/ai-provider-complete';

export type TAiProviderConnectMessage = {
	type: 'AI_PROVIDER_CONNECT_COMPLETE';
	success: boolean;
	provider?: string;
	providerLabel?: string;
	scope?: string;
	error?: string;
};

/**
 * Runs one-click connect for `provider` and resolves once the popup reports
 * back. Rejects if the popup is blocked, closed early, or the connection fails.
 */
export const connectAiProvider = (ws: string, provider: string) =>
	runOAuthPopup<TAiProviderConnectMessage>('AI_PROVIDER_CONNECT_COMPLETE', async () => {
		const { authorize_url } = await AiProviderService.startConnect(ws, provider);
		return authorize_url;
	});
