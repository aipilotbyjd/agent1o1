// ============================================================
// AI Provider Key Types (bring your own key)
// ------------------------------------------------------------
// A workspace's own API key for an AI provider. The key itself never
// comes back — only `key_hint`, its masked form. A `personal` key is
// visible to (and used for) only the member who added it; a `team`
// key is used for everyone in the workspace who has no personal key
// for that provider. Only a `valid` key is ever used.
// ============================================================

export type TAiProviderCredentialScope = 'team' | 'personal';

export type TAiProviderCredentialStatus = 'unvalidated' | 'valid' | 'invalid';

export type TAiProvider = {
	key: string;
	label: string;
	key_url: string;
	key_placeholder: string | null;
	/** What a key for this provider starts with, when it has a fixed shape. */
	key_prefix: string | null;
	/** Short "where do I find my key" steps. */
	key_guide: string[];
	/** Display names of the catalog models a key for this provider runs. */
	models: string[];
	/** A key for this provider also embeds knowledge-base documents and searches. */
	covers_knowledge_base: boolean;
};

export type TAiProvidersResult = {
	providers: TAiProvider[];
	can_add_team: boolean;
	can_add_personal: boolean;
};

export type TAiProviderCredential = {
	id: string;
	execution_provider: string;
	provider_label: string;
	scope: TAiProviderCredentialScope;
	is_default: boolean;
	name: string | null;
	key_hint: string | null;
	validation_status: TAiProviderCredentialStatus;
	validation_message: string | null;
	last_validated_at: string | null;
	last_used_at: string | null;
	/** A personal key kept while the workspace has personal keys turned off — never used. */
	ignored_by_policy: boolean;
	can_manage: boolean;
	created_by: string | null;
	created_at: string;
	updated_at: string;
};

export type TCreateAiProviderCredentialDto = {
	execution_provider: string;
	api_key: string;
	name?: string | null;
	scope?: TAiProviderCredentialScope;
	is_default?: boolean;
};

export type TUpdateAiProviderCredentialDto = {
	name?: string | null;
	api_key?: string;
};

export type TAiProviderCredentialCheck = {
	result: { ok: boolean; message: string };
	ai_provider_credential: TAiProviderCredential;
};

/**
 * When AI calls may still run on the platform's keys (and cost token credits):
 * `fallback` — the workspace's key first, the platform's as backup;
 * `when_no_key` — the platform's only for models no workspace key covers;
 * `never` — only the workspace's own keys.
 */
export type TPlatformKeyUsage = 'fallback' | 'when_no_key' | 'never';

export type TAiKeyPolicy = {
	platform_usage: TPlatformKeyUsage;
	allow_personal_keys: boolean;
	can_manage: boolean;
	updated_at: string | null;
};

export type TUpdateAiKeyPolicyDto = {
	platform_usage?: TPlatformKeyUsage;
	allow_personal_keys?: boolean;
};

type TCatalogModelSummary = { id: string; display_name: string };

/** What saving a proposed key policy would change — judged on the workspace's team keys. */
export type TAiKeyPolicyImpact = {
	unavailable_models: TCatalogModelSummary[];
	affected_agents: { id: string; name: string; model: string }[];
	models_losing_backup: TCatalogModelSummary[];
	ignored_personal_keys: number;
};
