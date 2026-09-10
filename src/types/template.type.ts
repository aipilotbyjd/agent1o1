// ============================================================
// Template Types
// ------------------------------------------------------------
// Workflow templates and agent templates are separate resources
// sharing the same shape of catalog fields; a template collection
// groups items from either kind via a polymorphic `templatable`.
// ============================================================

export type TTemplateVisibility = 'private' | 'public';

export type TWorkflowTemplate = {
	id: string;
	workspace_id: string;
	source_workflow_id: string | null;
	name: string;
	slug: string;
	description: string | null;
	category: string | null;
	icon: string | null;
	color: string | null;
	visibility: TTemplateVisibility;
	usage_count: number;
	graph: { nodes: unknown[]; edges: unknown[] };
	created_by: string;
	created_at: string;
	updated_at: string;
};

export type TCreateWorkflowTemplateDto = {
	name: string;
	slug?: string;
	description?: string | null;
	category?: string | null;
	icon?: string | null;
	color?: string | null;
	visibility?: TTemplateVisibility;
	graph: { nodes?: unknown[]; edges?: unknown[] };
};

export type TUpdateWorkflowTemplateDto = Partial<TCreateWorkflowTemplateDto>;

export type TUseWorkflowTemplateDto = {
	name?: string;
	folder_id?: string | null;
};

export type TSaveWorkflowAsTemplateDto = {
	name?: string;
	description?: string | null;
	category?: string | null;
	icon?: string | null;
	color?: string | null;
	visibility?: TTemplateVisibility;
};

export type TAgentTemplateConfig = {
	instructions: string;
	provider?: string | null;
	model?: string | null;
	temperature?: number | null;
	settings?: Record<string, unknown> | null;
	tool_bindings?: unknown[];
	workflow_ids?: string[];
	skill_ids?: string[];
};

export type TAgentTemplate = {
	id: string;
	workspace_id: string;
	source_agent_id: string | null;
	name: string;
	slug: string;
	description: string | null;
	category: string | null;
	icon: string | null;
	color: string | null;
	visibility: TTemplateVisibility;
	usage_count: number;
	config: TAgentTemplateConfig;
	created_by: string;
	created_at: string;
	updated_at: string;
};

export type TCreateAgentTemplateDto = {
	name: string;
	slug?: string;
	description?: string | null;
	category?: string | null;
	icon?: string | null;
	color?: string | null;
	visibility?: TTemplateVisibility;
	config: TAgentTemplateConfig;
};

export type TUpdateAgentTemplateDto = Partial<TCreateAgentTemplateDto>;

export type TUseAgentTemplateDto = {
	name?: string;
	folder_id?: string | null;
};

export type TSaveAgentAsTemplateDto = {
	name?: string;
	description?: string | null;
	category?: string | null;
	icon?: string | null;
	color?: string | null;
	visibility?: TTemplateVisibility;
};

// ─── Collections ─────────────────────────────────────────────

export type TTemplatableType = 'workflow_template' | 'agent_template';

export type TTemplateCollectionItem = {
	id: string;
	position: number;
	templatable_type: TTemplatableType;
	templatable_id: string;
	templatable?: TWorkflowTemplate | TAgentTemplate | null;
};

export type TTemplateCollection = {
	id: string;
	workspace_id: string;
	name: string;
	slug: string;
	description: string | null;
	category: string | null;
	icon: string | null;
	color: string | null;
	visibility: TTemplateVisibility;
	items?: TTemplateCollectionItem[];
	item_count?: number;
	created_by: string;
	created_at: string;
	updated_at: string;
};

export type TCreateTemplateCollectionDto = {
	name: string;
	slug?: string;
	description?: string | null;
	category?: string | null;
	icon?: string | null;
	color?: string | null;
	visibility?: TTemplateVisibility;
};

export type TUpdateTemplateCollectionDto = Partial<TCreateTemplateCollectionDto>;

export type TUseTemplateCollectionDto = {
	folder_id?: string | null;
};

export type TAddTemplateCollectionItemDto = {
	templatable_type: TTemplatableType;
	templatable_id: string;
	position?: number;
};

export type TReorderTemplateCollectionItemsDto = {
	items: Array<{ id: string; position: number }>;
};
