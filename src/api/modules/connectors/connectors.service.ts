import { axiosClient } from '@/api/client';
import { unwrapKey, runOAuthPopup } from '@/api/core';
import type { TApiResponse } from '@/api/core';
import type {
	TConnector,
	TConnectorCredential,
	TConnectorCredentialTestResult,
	TConnectorCredentialUsage,
	TCreateConnectorCredentialDto,
	TUpdateConnectorCredentialDto,
	TInitiateOAuthConnectorDto,
	TInitiateOAuthConnectorResult,
} from '@/types/connector.type';
import { ConnectorEndpoints as E } from './connectors.endpoints';

export const ConnectorService = {
	list: (signal?: AbortSignal) =>
		axiosClient
			.get<TApiResponse<{ connectors: TConnector[] }>>(E.list, { signal })
			.then(unwrapKey<TConnector[]>('connectors')),

	detail: (id: string, signal?: AbortSignal) =>
		axiosClient
			.get<TApiResponse<{ connector: TConnector }>>(E.detail(id), { signal })
			.then(unwrapKey<TConnector>('connector')),

	credentials: (ws: string, signal?: AbortSignal) =>
		axiosClient
			.get<TApiResponse<{ connector_credentials: TConnectorCredential[] }>>(
				E.credentials(ws),
				{
					signal,
				},
			)
			.then(unwrapKey<TConnectorCredential[]>('connector_credentials')),

	credential: (ws: string, id: string, signal?: AbortSignal) =>
		axiosClient
			.get<TApiResponse<{ connector_credential: TConnectorCredential }>>(
				E.credential(ws, id),
				{
					signal,
				},
			)
			.then(unwrapKey<TConnectorCredential>('connector_credential')),

	createCredential: (ws: string, payload: TCreateConnectorCredentialDto) =>
		axiosClient
			.post<
				TApiResponse<{ connector_credential: TConnectorCredential }>
			>(E.credentials(ws), payload)
			.then(unwrapKey<TConnectorCredential>('connector_credential')),

	updateCredential: (ws: string, id: string, payload: TUpdateConnectorCredentialDto) =>
		axiosClient
			.patch<
				TApiResponse<{ connector_credential: TConnectorCredential }>
			>(E.credential(ws, id), payload)
			.then(unwrapKey<TConnectorCredential>('connector_credential')),

	/** With `replaceWith`, everything pinned to this account moves there first. */
	deleteCredential: (ws: string, id: string, replaceWith?: string) =>
		axiosClient
			.delete(E.credential(ws, id), {
				data: replaceWith ? { replace_with: replaceWith } : undefined,
			})
			.then(() => undefined),

	setDefaultCredential: (ws: string, id: string) =>
		axiosClient
			.post<
				TApiResponse<{ connector_credential: TConnectorCredential }>
			>(E.setDefaultCredential(ws, id))
			.then(unwrapKey<TConnectorCredential>('connector_credential')),

	testCredential: (ws: string, id: string) =>
		axiosClient
			.post<
				TApiResponse<{
					result: TConnectorCredentialTestResult;
					connector_credential: TConnectorCredential;
				}>
			>(E.testCredential(ws, id))
			.then((r) => r.data.data),

	credentialUsage: (ws: string, id: string, signal?: AbortSignal) =>
		axiosClient
			.get<TApiResponse<{ usage: TConnectorCredentialUsage }>>(E.credentialUsage(ws, id), {
				signal,
			})
			.then(unwrapKey<TConnectorCredentialUsage>('usage')),

	initiateOAuth: (ws: string, payload: TInitiateOAuthConnectorDto) =>
		axiosClient
			.post<TApiResponse<TInitiateOAuthConnectorResult>>(E.initiateOAuth(ws), payload)
			.then((r) => r.data.data),

	/**
	 * Finishes the OAuth flow with what the provider sent back. Signed in:
	 * only the member who started it can finish it.
	 */
	completeOAuth: (state: string, code: string) =>
		axiosClient
			.post<
				TApiResponse<{ connector_credential: TConnectorCredential }>
			>(E.completeOAuth, { state, code })
			.then(unwrapKey<TConnectorCredential>('connector_credential')),
};

// ============================================================
// OAuth popup driver
// ------------------------------------------------------------
// The provider redirects the browser to our own page, which finishes the
// round trip itself with `completeOAuth`, signed in as the member who
// started it. We open the consent screen in a popup pointed at our own
// `/oauth/connector-complete`, which finishes the connection and posts the result
// back here. See `pages/coreapp/Apps/OAuthComplete.page.tsx` for the other half,
// and `runOAuthPopup` for the popup itself.
// ============================================================

export const CONNECTOR_OAUTH_REDIRECT_PATH = '/oauth/connector-complete';

export type TOAuthCompleteMessage = {
	type: 'OAUTH_COMPLETE';
	success: boolean;
	credentialId?: string;
	connectorKey?: string;
	error?: string;
};

/**
 * Starts the OAuth handshake and resolves once the popup reports back. Rejects
 * if the popup is blocked, closed before finishing, or never answers.
 */
export const connectOAuthConnector = (
	ws: string,
	payload: Omit<TInitiateOAuthConnectorDto, 'redirect_uri'>,
): Promise<TOAuthCompleteMessage> =>
	runOAuthPopup<TOAuthCompleteMessage>('OAUTH_COMPLETE', async () => {
		const result = await ConnectorService.initiateOAuth(ws, {
			...payload,
			redirect_uri: `${window.location.origin}${CONNECTOR_OAUTH_REDIRECT_PATH}`,
		});
		return result.authorize_url;
	});
