import { axiosClient } from '@/api/client';
import { unwrapKey, ApiError } from '@/api/core';
import type { TApiResponse } from '@/api/core';
import type {
	TConnector,
	TConnectorCredential,
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
			.get<TApiResponse<{ connector_credentials: TConnectorCredential[] }>>(E.credentials(ws), {
				signal,
			})
			.then(unwrapKey<TConnectorCredential[]>('connector_credentials')),

	credential: (ws: string, id: string, signal?: AbortSignal) =>
		axiosClient
			.get<TApiResponse<{ connector_credential: TConnectorCredential }>>(E.credential(ws, id), {
				signal,
			})
			.then(unwrapKey<TConnectorCredential>('connector_credential')),

	createCredential: (ws: string, payload: TCreateConnectorCredentialDto) =>
		axiosClient
			.post<TApiResponse<{ connector_credential: TConnectorCredential }>>(
				E.credentials(ws),
				payload,
			)
			.then(unwrapKey<TConnectorCredential>('connector_credential')),

	updateCredential: (ws: string, id: string, payload: TUpdateConnectorCredentialDto) =>
		axiosClient
			.patch<TApiResponse<{ connector_credential: TConnectorCredential }>>(
				E.credential(ws, id),
				payload,
			)
			.then(unwrapKey<TConnectorCredential>('connector_credential')),

	deleteCredential: (ws: string, id: string) =>
		axiosClient.delete(E.credential(ws, id)).then(() => undefined),

	setDefaultCredential: (ws: string, id: string) =>
		axiosClient
			.post<TApiResponse<{ connector_credential: TConnectorCredential }>>(
				E.setDefaultCredential(ws, id),
			)
			.then(unwrapKey<TConnectorCredential>('connector_credential')),

	initiateOAuth: (ws: string, payload: TInitiateOAuthConnectorDto) =>
		axiosClient
			.post<TApiResponse<TInitiateOAuthConnectorResult>>(E.initiateOAuth(ws), payload)
			.then((r) => r.data.data),
};

// ============================================================
// OAuth popup driver
// ------------------------------------------------------------
// The backend's callback (`GET /api/oauth/connectors/callback`) answers with
// JSON rather than redirecting, so the browser has to finish the round trip
// itself. We open the consent screen in a popup pointed at our own
// `/oauth/connector-complete`, which calls that callback and posts the result
// back here. See `pages/coreapp/Apps/OAuthComplete.page.tsx` for the other half.
// ============================================================

const OAUTH_POPUP_FEATURES =
	'width=600,height=700,left=400,top=100,scrollbars=yes,resizable=yes';

/** Matches the state row's TTL in `OAuthConnectorFlowService`, with slack. */
const OAUTH_TIMEOUT_MS = 15 * 60 * 1000;

const OAUTH_POPUP_POLL_MS = 500;

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
export const connectOAuthConnector = async (
	ws: string,
	payload: Omit<TInitiateOAuthConnectorDto, 'redirect_uri'>,
): Promise<TOAuthCompleteMessage> => {
	const { authorize_url } = await ConnectorService.initiateOAuth(ws, {
		...payload,
		redirect_uri: `${window.location.origin}${CONNECTOR_OAUTH_REDIRECT_PATH}`,
	});

	const popup = window.open(authorize_url, 'oauth_connect', OAUTH_POPUP_FEATURES);

	if (!popup) {
		throw new ApiError(undefined, 'Popup blocked. Allow popups for this site and try again.');
	}

	return new Promise<TOAuthCompleteMessage>((resolve, reject) => {
		let settled = false;

		const cleanup = () => {
			settled = true;
			window.removeEventListener('message', onMessage);
			window.clearInterval(closedPoll);
			window.clearTimeout(timeout);
		};

		function onMessage(event: MessageEvent) {
			// Only ever trust our own origin — the popup navigates through the
			// provider's domain before landing back on us.
			if (event.origin !== window.location.origin) return;
			const data = event.data as TOAuthCompleteMessage | undefined;
			if (data?.type !== 'OAUTH_COMPLETE') return;

			cleanup();
			popup?.close();

			if (data.success) resolve(data);
			else reject(new ApiError(undefined, data.error || 'Authorization failed.'));
		}

		const closedPoll = window.setInterval(() => {
			if (settled || !popup.closed) return;
			cleanup();
			reject(new ApiError(undefined, 'Authorization window was closed before it finished.'));
		}, OAUTH_POPUP_POLL_MS);

		const timeout = window.setTimeout(() => {
			if (settled) return;
			cleanup();
			popup.close();
			reject(new ApiError(undefined, 'Authorization timed out. Please try again.'));
		}, OAUTH_TIMEOUT_MS);

		window.addEventListener('message', onMessage);
	});
};
