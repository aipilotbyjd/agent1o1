export type TCredentialType = 'api_key' | 'oauth2' | 'basic' | 'bearer' | 'custom';
export type TSharingScope = 'private' | 'workspace' | 'specific';

export interface IUserSummary {
	id: string;
	email: string;
	first_name: string;
	last_name: string;
}

export interface ICredentialShare {
	id: string;
	user_id: string;
	user?: IUserSummary;
	permission: 'use';
	shared_by: string;
	created_at: number;
}

export interface ICredential {
	id: string;
	workspace_id?: string;
	created_by?: string;
	name: string;
	type: TCredentialType;
	description?: string;
	provider?: string;
	provider_account_id?: string;
	token_expires_at?: number;
	sharing_scope: TSharingScope;
	is_owner: boolean;
	can_edit: boolean;
	can_share: boolean;
	shares?: ICredentialShare[];
	last_used_at?: number;
	created_at: number;
	updated_at: number;
}

export interface ICredentialDetail extends ICredential {
	data: Record<string, unknown>;
}

export interface ICreateCredentialDto {
	name: string;
	type: TCredentialType;
	description?: string;
	data: Record<string, unknown>;
	sharing_scope?: TSharingScope;
}

export interface IUpdateCredentialDto {
	name?: string;
	description?: string;
	data?: Record<string, unknown>;
}

export interface IShareCredentialDto {
	user_ids: string[];
}

export interface IUpdateSharingScopeDto {
	sharing_scope: TSharingScope;
}

export interface IOAuthProvider {
	id: string;
	name: string;
	configured: boolean;
	scopes: string[];
}

export interface IOAuthAuthResponse {
	url: string;
	state?: string;
}

export interface IStartOAuthDto {
	workspaceId?: string;
	provider: string;
	credentialName?: string;
	redirectUrl?: string;
	sharingScope?: TSharingScope;
	userIds?: string[];
}

export type TCredentialSortBy = 'name' | 'created_at' | 'type' | 'last_used_at';
export type TSortOrder = 'asc' | 'desc';

export interface ICredentialFilters {
	type?: TCredentialType;
	search?: string;
	sort_by?: TCredentialSortBy;
	order?: TSortOrder;
	page?: number;
	per_page?: number;
}
