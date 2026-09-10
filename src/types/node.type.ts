// ============================================================
// Node Types
// ------------------------------------------------------------
// Two distinct shapes share the "node" name. A built-in node has no
// database row — `NodeRegistry::catalog()` renders its metadata as
// a plain array (`TBuiltinNode`), keyed by `type`, not `id`. A
// custom node is a workspace-owned `CustomNode` row (`TCustomNode`)
// — only these can be created, updated, or deleted.
// ============================================================
export type TBuiltinNode = {
	type: string;
	category: string;
	name: string;
	description: string;
	config_schema: Record<string, unknown>;
	icon: string | null;
	color: string | null;
	requires_connector: boolean;
};

export type TCustomNode = {
	id: string;
	type: string;
	category: string | null;
	name: string;
	description: string | null;
	icon: string | null;
	color: string | null;
	config_schema: unknown;
	input_schema: unknown;
	output_schema: unknown;
	credential_type: string | null;
	is_active: boolean;
	is_custom: true;
	created_by: string;
	created_at: string;
	updated_at: string;
};

export type TNode = TBuiltinNode | TCustomNode;

// ─── Request DTOs ────────────────────────────────────────────

export type TCreateCustomNodeDto = {
	category_id: string;
	name: string;
	description?: string | null;
	icon?: string | null;
	color?: string | null;
	config_schema: Record<string, unknown>;
	input_schema?: unknown;
	output_schema?: unknown;
	credential_type?: string | null;
	is_active?: boolean;
};

export type TUpdateCustomNodeDto = Partial<TCreateCustomNodeDto>;
