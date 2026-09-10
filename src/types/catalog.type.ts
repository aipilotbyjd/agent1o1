// ============================================================
// Catalog Types
// ------------------------------------------------------------
// Global, read-only reference data — not workspace-scoped except
// where noted. `fields`/`capabilities` are backend-defined JSON
// blobs whose internal shape isn't pinned down by a resource class,
// so they're typed as `unknown` rather than guessed at.
// ============================================================

export type TNodeCategory = {
	id: string;
	name: string;
	slug: string;
	description: string | null;
	icon: string | null;
	color: string | null;
	sort_order: number;
	kind: string;
};

export type TTriggerMechanism = 'webhook' | 'schedule' | 'manual' | 'polling' | 'event';

export type TTriggerPreset = {
	id: string;
	category: string;
	key: string;
	name: string;
	description: string | null;
	type: TTriggerMechanism;
	signature_scheme: string | null;
	fields: unknown;
	is_active: boolean;
	sort_order: number;
};

export type TModelCatalogEntry = {
	id: string;
	slug: string;
	display_name: string;
	brand: string;
	capabilities: unknown;
};
