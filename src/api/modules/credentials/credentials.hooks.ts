import { useMutation } from '@tanstack/react-query';

/**
 * Ported-frontend adapter.
 *
 * Old's "credentials" are this app's connector credentials, so the hooks map
 * one-to-one by name. The returned records carry the new `TConnectorCredential`
 * shape, not old's `ICredential` — reconciling those fields is the
 * backend-adaptation pass's job.
 */
export {
	useConnectorCredentials as useCredentials,
	useConnectorCredential as useCredential,
	useCreateConnectorCredential as useCreateCredential,
	useInitiateOAuthConnector as useConnectOAuthCredential,
} from '@/api/modules/connectors';

/** No token-refresh endpoint on this backend; OAuth is re-initiated instead. */
export const useRefreshCredentialToken = (_ws: string) =>
	useMutation({
		mutationFn: (_id: string): Promise<never> =>
			Promise.reject(new Error('Refreshing a credential token is not supported by this backend')),
		meta: { errorMessage: 'Token refresh is not supported yet' },
	});
