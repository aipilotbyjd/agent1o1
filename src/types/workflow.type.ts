// ============================================================
// Workflow Types
// ------------------------------------------------------------
// `nodes`/`edges`/`tags` are only present when the backend
// eager-loads them — the list endpoint omits all three; detail,
// duplicate, and the graph-replace endpoint include them. Node
// `config` is type-dependent and isn't pinned down to one shape
// here — narrow it at the call site by `type`.
// ============================================================
import type { TTag } from './tag.type';

export type TWorkflowStatus = 'draft' | 'published' | 'archived';

export type TWorkflowNode = {
	id: string;
	key: string;
	type: string;
	config: Record<string, unknown>;
	position: { x: number; y: number } | null;
	pinned_data: unknown;
	pinned_at: string | null;
	pinned_by: string | null;
};

export type TWorkflowEdge = {
	id: string;
	from_node_id: string;
	to_node_id: string;
	condition: string | null;
};

export type TWorkflow = {
	id: string;
	workspace_id: string;
	folder_id: string | null;
	name: string;
	slug: string;
	description: string | null;
	status: TWorkflowStatus;
	current_version_id: string | null;
	has_unpublished_changes: boolean;
	is_published: boolean;
	nodes?: TWorkflowNode[];
	edges?: TWorkflowEdge[];
	tags?: TTag[];
	created_by: string;
	created_at: string;
	updated_at: string;
};

// ─── Request DTOs ────────────────────────────────────────────

export type TCreateWorkflowDto = {
	name: string;
	slug?: string;
	description?: string | null;
	folder_id?: string | null;
};

export type TUpdateWorkflowDto = Partial<TCreateWorkflowDto>;

export type TReplaceGraphNodeDto = {
	key: string;
	type: string;
	config?: Record<string, unknown> | null;
	position?: { x: number; y: number } | null;
};

export type TReplaceGraphEdgeDto = {
	from: string;
	to: string;
	condition?: string | null;
};

export type TReplaceGraphDto = {
	nodes: TReplaceGraphNodeDto[];
	edges: TReplaceGraphEdgeDto[];
};

export type TPublishWorkflowDto = {
	notes?: string | null;
};

export type TStartRunDto = {
	input?: Record<string, unknown>;
};

export type TSyncWorkflowTagsDto = {
	tag_ids: string[];
};

export type TPinWorkflowNodeDto = { data: unknown; node_run_id?: never } | { node_run_id: string; data?: never };
