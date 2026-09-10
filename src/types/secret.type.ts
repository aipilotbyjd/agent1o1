// ============================================================
// Secret Types
// ------------------------------------------------------------
// One resource covers both secrets and plain variables — `is_secret`
// is what makes `value` write-only. A non-secret's `value` comes
// back readable; a secret's never does, no matter who's asking.
// `reference` is the `{{ secrets.KEY }}` template string a node
// config uses to address it.
// ============================================================

export type TSecret = {
	id: string;
	key: string;
	description: string | null;
	is_secret: boolean;
	/** Only present when `is_secret` is false. */
	value: string | null;
	reference: string;
	last_used_at: string | null;
	created_by: string;
	created_at: string;
	updated_at: string;
};

export type TCreateSecretDto = {
	key: string;
	value: string;
	description?: string | null;
	is_secret?: boolean;
};

export type TUpdateSecretDto = {
	key?: string;
	value?: string;
	description?: string | null;
	is_secret?: boolean;
};
