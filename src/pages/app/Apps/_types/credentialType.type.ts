// ============================================================
// Credential catalog — page-local view
// ------------------------------------------------------------
// The Apps page was written against the old `credential-types`
// resource. The current API exposes the same catalog as
// `GET /connectors` (TConnector), whose `fields` is a flat array
// rather than a JSON-schema-ish object. These types keep the
// page's vocabulary while `_helper/connectors.helper` does the
// translation — nothing here invents data the API does not return.
// ============================================================
import type { TConnectorFieldType } from '@/types/connector.type';

export type TCredentialFieldType = TConnectorFieldType;

export type TCredentialFieldSchema = {
	type: TCredentialFieldType;
	label: string;
	secret: boolean;
	placeholder?: string;
	description?: string;
};

export type TCredentialFieldsSchema = {
	required: string[];
	properties: Record<string, TCredentialFieldSchema>;
};

/** Only the authorize URL and scopes are exposed to the client; the token
 *  exchange stays server-side. Present iff the connector is OAuth. */
export type TOAuthConfig = {
	provider: string;
};

export type TCredentialAuthType = 'api_key' | 'oauth' | 'basic' | string;

export type TCredentialType = {
	/** Connector primary key — what create/OAuth calls send as connector_id. */
	id: string;
	/** Connector `key` (github, slack, …) — the old `type` discriminator. */
	type: string;
	name: string;
	description: string;
	icon: string;
	color: string;
	auth_type: TCredentialAuthType;
	fields_schema: TCredentialFieldsSchema;
	oauth_config: TOAuthConfig | null;
	docs_url?: string | null;
};
