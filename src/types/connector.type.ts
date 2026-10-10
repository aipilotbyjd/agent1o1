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
	/** A name from the backend's icon set (`github`, `mail`, `sheets`, ...), not a URL. */
	icon: string | null;
	color: string | null;
	/** Mirrors `App\Enums\Connectors\ConnectorCategory`. */
	category: string;
	category_label: string;
	/** A name from the icon set, like `icon`, chosen by the backend per category. */
	category_icon: string;
	/** Suggested to workspaces that haven't connected it yet. */
	is_featured: boolean;
	sort_order: number;
	auth_type: TConnectorAuthType;
	is_oauth: boolean;
	/** `false` when the server has no OAuth client credentials for it, so it
	 *  can't be connected yet. */
	is_configured: boolean;
	fields: TConnectorField[];
	is_active: boolean;
};

/** Shown in the catalog but can't be connected until the server is set up. */
export const isConnectorUnavailable = (connector?: Pick<TConnector, 'is_configured'> | null) =>
	connector?.is_configured === false;

export const CONNECTOR_UNAVAILABLE_LABEL = 'Not set up';

export type TConnectorCredentialScope = 'team' | 'personal';

export type TConnectorCredential = {
	id: string;
	connector_id: string;
	connector?: TConnector;
	scope: TConnectorCredentialScope;
	is_default: boolean;
	name: string;
	/** Whose account the provider says this is (an email, a username), once checked. */
	account_label: string | null;
	is_expired: boolean;
	last_used_at: string | null;
	/** Set by a manual Test and by the hourly background check. */
	last_tested_at: string | null;
	last_test_ok: boolean | null;
	last_test_message: string | null;
	expires_at: string | null;
	created_by: string;
	created_at: string;
	updated_at: string;
};

/** Mirrors `ConnectorCredentialTester::test()`. A failed check is still a 200. */
export type TConnectorCredentialTestResult = {
	ok: boolean;
	message: string;
	/** Who the provider says the token belongs to, when it says. */
	account: string | null;
	tested_at: string;
};

/** `pinned` = the node names this account; `default` = it names none and falls back to it. */
export type TConnectorCredentialUsageVia = 'pinned' | 'default';

/** Mirrors `ConnectorCredentialUsage::for()`. */
export type TConnectorCredentialUsage = {
	is_default_for_unpinned: boolean;
	workflows: {
		id: string;
		name: string;
		nodes_count: number;
		via: TConnectorCredentialUsageVia;
	}[];
	agents: { id: string; name: string; tools_count: number; via: TConnectorCredentialUsageVia }[];
	knowledge_sources: { id: string; name: string }[];
	total: number;
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
	/** Reconnect this existing account in place instead of adding a new one. */
	credential_id?: string;
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
