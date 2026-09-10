import { axiosClient } from '@/api/client';
import { unwrapKey } from '@/api/core';
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
