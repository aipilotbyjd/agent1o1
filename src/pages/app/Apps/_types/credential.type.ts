// ============================================================
// Stored credential — page-local view
// ------------------------------------------------------------
// Maps `TConnectorCredential` onto the vocabulary the Apps page was
// written in. Two deliberate gaps versus the old model:
//   * `data` never comes back from the API (secrets are write-only),
//     so edit forms start blank and only send what the user retypes.
//   * per-user sharing is gone; the API models reach as
//     `scope: 'team' | 'personal'` plus `is_default`.
// ============================================================
import type { TConnectorCredentialScope } from '@/types/connector.type';

/** Sentinel the edit form uses for "leave this secret as it is" — such a
 *  field is simply omitted from the PATCH body rather than sent. */
export const MASKED_CREDENTIAL_VALUE = '___MASKED___' as const;

export type TCredentialDataValue = string | number | boolean | null;
export type TCredentialData = Record<string, TCredentialDataValue>;

export type TSharingScope = TConnectorCredentialScope;

export interface ICredential {
	id: string;
	name: string;
	/** Connector key (github, slack, …), read off the embedded connector. */
	type: string;
	provider?: string;
	connector_id: string;
	scope: TSharingScope;
	is_default: boolean;
	is_expired: boolean;
	is_shared: boolean;
	created_by?: string;
	last_used_at?: string | null;
	expires_at?: string | null;
	created_at: string;
	updated_at: string;
}

/** The detail endpoint returns the same record — `data` stays empty because
 *  the server never re-exposes a stored secret. */
export interface ICredentialDetail extends ICredential {
	data: TCredentialData;
}

export type ICreateCredentialDto = {
	name: string;
	/** Connector key; the helper resolves it to connector_id. */
	type: string;
	credential_type_id?: string;
	data: TCredentialData;
	expires_at?: string | null;
	scope?: TSharingScope;
	is_default?: boolean;
};

export interface IUpdateCredentialDto {
	name?: string;
	data?: TCredentialData;
	expires_at?: string | null;
}
