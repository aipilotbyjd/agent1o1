import type { TListParams } from '@/types/api.type';

export type TCredentialAuthType = 'api_key' | 'oauth2' | 'basic' | 'bearer' | 'custom';

export type TCredentialField = {
	name: string;
	label: string;
	type: 'string' | 'password' | 'number' | 'boolean' | 'select' | 'json';
	required: boolean;
	default?: unknown;
	options?: { label: string; value: string }[];
	description?: string;
};

export type TCredentialType = {
	id: string;
	name: string;
	display_name: string;
	auth_type: TCredentialAuthType;
	provider?: string;
	icon: string | null;
	description: string;
	fields: TCredentialField[];
	test_endpoint?: string | null;
	docs_url?: string | null;
};

export type TCredentialTypeFilters = TListParams & {
	auth_type?: TCredentialAuthType;
	provider?: string;
};
