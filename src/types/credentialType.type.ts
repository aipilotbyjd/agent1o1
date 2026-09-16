import type { TListParams } from './api.type';

export type TCredentialFieldType = 'string' | 'number' | 'boolean' | 'multiline';

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

export type TOAuthConfig = {
	provider: string;
	authorization_url: string;
	token_url: string;
	scopes: string[];
	use_pkce: boolean;
	extra_params?: Record<string, string>;
};

export type TCredentialAuthType = 'api_key' | 'oauth' | 'basic' | string;

export type TCredentialType = {
	id: string;
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

export type TCredentialTypeFilters = TListParams & {
	type?: string;
};
