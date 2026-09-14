// ============================================================
// Connectors helper
// ------------------------------------------------------------
// The Apps page speaks "credentials"; the API speaks "connectors"
// and "connector credentials". Everything below is a thin view over
// @/api/modules/connectors — no request is made that the internal
// API does not actually expose (routes/api/internal/connectors.php).
//
// Not available on the current API, and therefore not adapted:
//   * testing a credential  — no /test endpoint
//   * per-user sharing      — replaced by scope + set-default
// ============================================================
import { useMemo } from 'react';
import { apiConfig } from '@/api/core';
import {
	useConnectors,
	useConnectorCredentials,
	useConnectorCredential,
	useCreateConnectorCredential,
	useUpdateConnectorCredential,
	useDeleteConnectorCredential,
	useSetDefaultConnectorCredential,
	useInitiateOAuthConnector,
} from '@/api/modules/connectors';
import type { TConnector, TConnectorCredential } from '@/types/connector.type';
import type {
	ICredential,
	ICredentialDetail,
	ICreateCredentialDto,
	IUpdateCredentialDto,
	TCredentialData,
} from '../_types/credential.type';
import type {
	TCredentialFieldsSchema,
	TCredentialType,
} from '../_types/credentialType.type';

/** `fields` arrives as a flat list; the page reads it as required[] + a
 *  keyed properties map. */
const toFieldsSchema = (connector: TConnector): TCredentialFieldsSchema => ({
	required: (connector.fields ?? []).filter((f) => f.required).map((f) => f.name),
	properties: Object.fromEntries(
		(connector.fields ?? []).map((f) => [
			f.name,
			{
				type: f.type,
				label: f.label,
				secret: f.secret,
				placeholder: f.placeholder,
				description: f.description,
			},
		]),
	),
});

export const toCredentialType = (connector: TConnector): TCredentialType => ({
	id: String(connector.id),
	type: connector.key,
	name: connector.name,
	description: connector.description ?? '',
	icon: connector.icon ?? '',
	color: connector.color ?? '',
	auth_type: connector.is_oauth ? 'oauth' : connector.auth_type,
	fields_schema: toFieldsSchema(connector),
	oauth_config: connector.is_oauth ? { provider: connector.key } : null,
});

export const toCredential = (credential: TConnectorCredential): ICredential => ({
	id: credential.id,
	name: credential.name,
	type: credential.connector?.key ?? '',
	provider: credential.connector?.key,
	connector_id: String(credential.connector_id),
	scope: credential.scope,
	is_default: credential.is_default,
	is_expired: credential.is_expired,
	is_shared: credential.scope === 'team',
	created_by: credential.created_by,
	last_used_at: credential.last_used_at,
	expires_at: credential.expires_at,
	created_at: credential.created_at,
	updated_at: credential.updated_at,
});

// ─── Catalog ─────────────────────────────────────────────────

export const useCredentialTypes = () => {
	const query = useConnectors();
	const data = useMemo(
		() => query.data?.filter((c) => c.is_active).map(toCredentialType),
		[query.data],
	);
	return { ...query, data };
};

// ─── Stored credentials ──────────────────────────────────────

export const useCredentials = (ws: string) => {
	const query = useConnectorCredentials(ws);
	const data = useMemo(() => query.data?.map(toCredential), [query.data]);
	return { ...query, data };
};

export const useCredential = (ws: string, id: string) => {
	const query = useConnectorCredential(ws, id);
	const data = useMemo<ICredentialDetail | undefined>(
		// `data` stays empty on purpose — the API never returns stored secrets.
		() => (query.data ? { ...toCredential(query.data), data: {} as TCredentialData } : undefined),
		[query.data],
	);
	return { ...query, data };
};

export const useCreateCredential = (ws: string) => {
	const mutation = useCreateConnectorCredential(ws);
	return {
		...mutation,
		mutateAsync: (payload: ICreateCredentialDto) =>
			mutation.mutateAsync({
				connector_id: payload.credential_type_id ?? payload.type,
				name: payload.name,
				data: payload.data,
				expires_at: payload.expires_at,
				scope: payload.scope,
				is_default: payload.is_default,
			}),
	};
};

export const useUpdateCredential = (ws: string) => {
	const mutation = useUpdateConnectorCredential(ws);
	return {
		...mutation,
		mutateAsync: ({ id, body }: { id: string; body: IUpdateCredentialDto }) =>
			mutation.mutateAsync({ id, body }),
	};
};

export const useDeleteCredential = (ws: string) => useDeleteConnectorCredential(ws);

/** The API's stand-in for the old "share with workspace" toggle. */
export const useSetDefaultCredential = (ws: string) => useSetDefaultConnectorCredential(ws);

/**
 * The provider redirects the browser straight to `redirect_uri` with
 * `?state=&code=`, and it is the BACKEND that exchanges them — so the
 * redirect target is the API's own public callback
 * (GET /api/oauth/connectors/callback), not a page in this app. The
 * internal API base ends in /v1; the callback sits one level above it.
 */
const CONNECTOR_OAUTH_REDIRECT_URI = `${apiConfig.baseUrl.replace(/\/v1\/?$/, '')}/oauth/connectors/callback`;

/** Starts the connector OAuth round trip. The backend returns the provider's
 *  authorize URL; the caller performs a full-document navigation to it. */
export const useConnectOAuthCredential = (ws: string) => {
	const mutation = useInitiateOAuthConnector(ws);
	return {
		...mutation,
		mutateAsync: (payload: { connectorId: string; name: string; scope?: 'team' | 'personal' }) =>
			mutation.mutateAsync({
				connector_id: payload.connectorId,
				name: payload.name,
				redirect_uri: CONNECTOR_OAUTH_REDIRECT_URI,
				scope: payload.scope,
			}),
	};
};
