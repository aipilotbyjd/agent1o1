// ============================================================
// Catalog Types
// ------------------------------------------------------------
// Global, read-only reference data, not workspace-scoped except
// where noted. `fields`/`capabilities` are backend-defined JSON
// blobs whose internal shape isn't pinned down by a resource class,
// so they're typed as `unknown` rather than guessed at.
// ============================================================

import type { TBuiltinNode } from './node.type';

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

export type TNodeCategoryWithCount = TNodeCategory & {
	nodes_count: number;
	nodes?: TBuiltinNode[];
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

export type TModelSpeed = 'fast' | 'balanced' | 'thorough';

/**
 * Why a model can't run for this member: an admin hasn't allowed it, it
 * needs a key the workspace hasn't added (`connect_providers` lists which),
 * the key policy only allows the workspace's own keys and none covers it,
 * or nothing can serve it right now.
 */
export type TModelUnavailableReason =
	| 'not_allowed'
	| 'needs_key'
	| 'policy_needs_key'
	| 'unavailable';

export type TModelCapabilities = {
	context_window?: number;
	vision?: boolean;
	tool_use?: boolean;
};

export type TModelCatalogEntry = {
	id: string;
	slug: string;
	display_name: string;
	brand: string;
	description: string | null;
	strengths: string[];
	speed: TModelSpeed | null;
	/** 1 (cheapest) – 3, relative to the rest of the catalog. */
	cost_tier: number | null;
	capabilities: TModelCapabilities | null;
	retires_at: string | null;
	replacement_slug: string | null;
	is_available: boolean;
	unavailable_reason: TModelUnavailableReason | null;
	connect_providers: { key: string; label: string }[];
	/** Set when this member's calls on the model run on a workspace key. */
	own_key: { provider: string; label: string } | null;
	is_allowed: boolean;
	is_default: boolean;
	/** Rough credits for one typical chat message; null when it can't run. */
	credits_per_message: number | null;
};
