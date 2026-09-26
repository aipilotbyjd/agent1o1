// Node type category
export type TNodeCategory =
	| 'trigger'
	| 'action'
	| 'logic'
	| 'transform'
	| 'integration'
	| 'ai'
	| 'utility'
	| 'interaction';

// Node parameter types
export type TNodeParameterType =
	| 'string'
	| 'number'
	| 'boolean'
	| 'options' // API uses 'options'
	| 'select' // Legacy/Frontend
	| 'code'
	| 'json'
	| 'credential' // API uses 'credential'
	| 'expression';

// Node parameter definition from API
export interface INodeParameter {
	name: string;
	display_name?: string; // API uses display_name
	label?: string; // Frontend uses label
	type: TNodeParameterType;
	required?: boolean;
	description?: string;
	default?: unknown;
	placeholder?: string;
	options?: Array<{ name: string; value: string; description?: string }>; // API options
	show_if?: string; // API uses show_if condition
}

// Node input/output definition
export interface INodeIO {
	name: string;
	type: string;
	description?: string;
}

// Schema field definition from backend
export interface INodeSchemaField {
	name: string;
	type: string;
	label: string;
	description?: string;
	required?: boolean;
	default?: unknown;
	options?: Array<{ value: string; label: string }>;
}

// Node schema from backend
export interface INodeSchema {
	type?: string;
	properties?: Record<string, INodeSchemaProperty>;
	required?: string[];
	inputs?: INodeSchemaField[];
	outputs?: INodeSchemaField[];
}

export interface INodeSchemaProperty {
	type?: string;
	label?: string;
	description?: string;
	default?: unknown;
	enum?: string[];
	items?: INodeSchemaProperty;
	properties?: Record<string, INodeSchemaProperty>;
}

// Node type definition from API
export interface INodeType {
	id?: string;
	type: string;
	name: string;
	description: string;
	category?: INodeCategory | TNodeCategory;
	version?: string | number;
	icon?: string;
	color?: string;
	node_kind?: string;
	tags?: string[];
	inputs?: INodeIO[];
	outputs?: INodeIO[];
	parameters?: INodeParameter[];
	credentials?: string[];
	schema?: INodeSchema;
	config_schema?: INodeSchema;
	input_schema?: INodeSchema;
	output_schema?: INodeSchema;
	credential_type?: string | null;
	connected?: boolean;
	cost_hint_usd?: number | null;
	latency_hint_ms?: number | null;
	is_active?: boolean;
	is_premium?: boolean;
	is_custom?: boolean;
	docs_url?: string | null;
}

// Node category kind: `core` = system category, `app` = third-party integration
export type TNodeCategoryKind = 'core' | 'app';

// Node category from API
export interface INodeCategory {
	id: string;
	name: string;
	slug: string;
	description: string;
	icon: string;
	color: string;
	kind?: TNodeCategoryKind;
	sort_order: number;
	nodes_count?: number;
	nodes?: INodeType[];
}

export interface INodeCategoryFilters {
	include_nodes?: boolean;
	kind?: TNodeCategoryKind;
	workspace_id?: string;
}

export interface IRecentlyUsedNodes {
	nodes: INodeType[];
	is_default: boolean;
}

export interface ICustomNodes {
	nodes: INodeType[];
	total: number;
}

export interface INodeTypeFilters {
	search?: string;
	category_id?: string;
	node_kind?: string;
	is_premium?: boolean;
	workspace_id?: string;
	sort_by?: 'name' | 'node_kind' | 'created_at';
	sort_direction?: 'asc' | 'desc';
	per_page?: number;
	page?: number;
}
