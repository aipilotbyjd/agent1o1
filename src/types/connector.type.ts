// ============================================================
// Connector Types
// ------------------------------------------------------------
// `Connector` is the global, read-only integration catalog (Slack,
// GitHub, ...). `ConnectorCredential` is a workspace's stored
// instance of one — `data` (the decrypted secret payload) is
// write-only and never comes back in a response.
// ============================================================

export type TConnector = {
	id: string;
	key: string;
	name: string;
	description: string | null;
	icon: string | null;
	color: string | null;
	auth_type: string;
	is_oauth: boolean;
	fields: unknown;
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

export type TInitiateOAuthConnectorResult = { url: string };
