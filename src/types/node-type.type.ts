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

/** `x-widget` values a built-in node's config schema can ask the editor for. */
export type TNodeSchemaWidget =
	| 'text'
	| 'textarea'
	| 'number'
	| 'toggle'
	| 'select'
	| 'datetime'
	| 'emails'
	| 'json'
	| 'key-value'
	| 'list'
	| 'credential';

/** A dropdown filled live from `POST /workspaces/{ws}/nodes/options`. */
export interface INodeSchemaOptions {
	source: string;
	/** Fields that must be set before this one can load (e.g. a spreadsheet before its tabs). */
	depends_on: string[];
	/** Fields that narrow the list when set, but aren't required (e.g. which calendar). */
	uses?: string[];
	/** Several values: an array for `type: array`, comma-joined otherwise. */
	multiple: boolean;
	searchable: boolean;
	/** Keep a free-text / `{{variable}}` escape hatch next to the list. */
	allow_custom: boolean;
}

export interface INodeSchemaProperty {
	type?: string | string[];
	title?: string;
	label?: string;
	description?: string;
	default?: unknown;
	enum?: string[];
	format?: string;
	minimum?: number;
	maximum?: number;
	items?: INodeSchemaProperty;
	properties?: Record<string, INodeSchemaProperty>;
	'x-widget'?: TNodeSchemaWidget;
	'x-placeholder'?: string;
	'x-enum-labels'?: Record<string, string>;
	'x-options'?: INodeSchemaOptions;
	'x-connector'?: string;
	'x-hidden'?: boolean;
	'x-advanced'?: boolean;
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
	/** A reader node that can be switched on as a flow trigger (Gumloop's "Activate as flow trigger"). */
	supports_trigger?: boolean;
	/** Listed under Triggers & Events: added with "Activate as flow trigger" already on. */
	trigger_mode?: boolean;
	/** False for a retired node: still described so saved workflows render, but not offered. */
	listed?: boolean;
	/** An admin's flag on the node: still offered while `beta` or `deprecated`. */
	status?: 'beta' | 'deprecated' | 'hidden' | null;
	status_note?: string | null;
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
export interface INodeCategoryFunction {
	slug: string;
	label: string;
	order: number;
}

export interface INodeCategoryVendor {
	slug: string;
	label: string;
}

export interface INodeCategory {
	id: string;
	name: string;
	slug: string;
	description: string;
	icon: string;
	color: string;
	kind?: TNodeCategoryKind;
	/** What an app category is used for, primary first; empty for core categories. */
	functions?: INodeCategoryFunction[];
	/** `degraded` or `maintenance` when an admin says the app has a problem. */
	status?: 'operational' | 'degraded' | 'maintenance';
	status_note?: string | null;
	/** Whether the signed-in user pinned this app to their "Your apps". */
	is_pinned?: boolean;
	/** The primary of `functions`. */
	function?: string | null;
	/** Who makes the app, when it belongs to a suite. */
	vendor?: INodeCategoryVendor | null;
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
