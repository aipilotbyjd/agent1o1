// ============================================================
// Connector Types
// ------------------------------------------------------------
// `Connector` is the global, read-only integration catalog (Slack,
// GitHub, ...). `ConnectorCredential` is a workspace's stored
// instance of one — `data` (the decrypted secret payload) is
// write-only and never comes back in a response.
// ============================================================

export type TConnectorAuthType = 'oauth2' | 'api_key' | 'bearer_token' | 'basic_auth';

export type TConnectorFieldType = 'string' | 'number' | 'boolean' | 'multiline';

/** One entry of a connector's `fields` form schema — the shape a manual
 *  (api_key / bearer_token / basic_auth) credential's `data` must satisfy.
 *  OAuth connectors ship an empty array. */
export type TConnectorField = {
	name: string;
	label: string;
	type: TConnectorFieldType;
	secret: boolean;
	required?: boolean;
	placeholder?: string;
	description?: string;
};

export type TConnector = {
	id: string;
	key: string;
	name: string;
	description: string | null;
	icon: string | null;
	color: string | null;
	auth_type: TConnectorAuthType;
	is_oauth: boolean;
	fields: TConnectorField[];
	is_active: boolean;
};

export type TConnectorCredentialScope = 'team' | 'personal';

export type TConnectorCredential = {
	id: string;
	connector_id: string;
	connector?: TConnector;
	scope: TConnectorCredentialScope;
	is_default: boolean;
	name: string;
	is_expired: boolean;
	last_used_at: string | null;
	expires_at: string | null;
	created_by: string;
	created_at: string;
	updated_at: string;
};

export type TCreateConnectorCredentialDto = {
	connector_id: string;
	name: string;
	data: Record<string, unknown>;
	expires_at?: string | null;
	scope?: TConnectorCredentialScope;
	is_default?: boolean;
};

export type TUpdateConnectorCredentialDto = {
	name?: string;
	data?: Record<string, unknown>;
	expires_at?: string | null;
};

export type TInitiateOAuthConnectorDto = {
	connector_id: string;
	name: string;
	redirect_uri: string;
	scope?: TConnectorCredentialScope;
};

/** `OAuthConnectorFlowService::initiate()` returns the provider's authorize
 *  URL plus the state it minted — the client redirects to the former. */
export type TInitiateOAuthConnectorResult = { authorize_url: string; state: string };
