// ============================================================
// Connector Types
// ------------------------------------------------------------
// `Connector` is the global, read-only integration catalog (Slack,
// GitHub, ...). `ConnectorCredential` is a workspace's stored
// instance of one — `data` (the decrypted secret payload) is
// write-only and never comes back in a response.
// ============================================================

/** Mirrors `App\Enums\Connectors\ConnectorAuthType`. */
export type TConnectorAuthType = 'oauth2' | 'api_key' | 'bearer_token' | 'basic_auth';

/**
 * One entry of `connectors.fields` — the form schema for a manually entered
 * credential. The backend stores this as a JSON *array* (see
 * `ConnectorFactory`), not the keyed object the old frontend assumed.
 */
export type TConnectorField = {
	name: string;
	label?: string;
	type?: 'string' | 'number' | 'boolean' | 'multiline';
	secret?: boolean;
	required?: boolean;
	placeholder?: string;
	description?: string;
};

export type TConnectorDataValue = string | number | boolean;

/** The write-only secret payload sent on create/update. Never comes back. */
export type TConnectorData = Record<string, TConnectorDataValue>;

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
	data: TConnectorData;
	expires_at?: string | null;
	scope?: TConnectorCredentialScope;
	is_default?: boolean;
};

export type TUpdateConnectorCredentialDto = {
	name?: string;
	data?: TConnectorData;
	expires_at?: string | null;
};

export type TInitiateOAuthConnectorDto = {
	connector_id: string;
	name: string;
	redirect_uri: string;
	scope?: TConnectorCredentialScope;
};

/**
 * What `OAuthConnectorFlowService::initiate()` actually returns. `state` is the
 * opaque, 10-minute token the provider echoes back to the callback; `scope` on
 * the request DTO above is the credential's visibility (team/personal), NOT the
 * OAuth scopes — those come from the connector row server-side.
 */
export type TInitiateOAuthConnectorResult = {
	authorize_url: string;
	state: string;
};
