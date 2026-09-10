/**
 * Workflow Types
 * Matches Laravel backend from docs/frontend/modules/04-workflow-management.md
 */

// Workflow status
export type TWorkflowStatus = 'draft' | 'active' | 'inactive' | 'archived';

// Sort options
export type TWorkflowSortBy =
	| 'name'
	| 'created_at'
	| 'updated_at'
	| 'execution_count'
	| 'last_executed_at';
export type TSortOrder = 'asc' | 'desc';

// Workflow node position
export interface INodePosition {
	x: number;
	y: number;
}

// Workflow node
export interface IWorkflowNode {
	id: string;
	type: string;
	name: string;
	position: INodePosition;
	parameters: Record<string, unknown>;
}

// Workflow connection
export interface IWorkflowConnection {
	id: string;
	source_node_id: string;
	target_node_id: string;
	source_handle?: string;
	target_handle?: string;
}

// Workflow settings
export interface IWorkflowSettings {
	timeout_seconds?: number;
	retry_on_failure?: boolean;
	max_retries?: number;
	error_workflow_id?: string;
}

// Workflow entity
export interface IWorkflow {
	id: string;
	name: string;
	description?: string | null;
	status?: TWorkflowStatus;
	version?: number;
	tags?: string[];
	color?: string | null;
	icon?: string | null;
	category?: string | null;
	is_favorite?: boolean;
	folder_id?: string | null;
	is_active?: boolean;
	is_locked?: boolean;
	current_version_id?: string | null;
	execution_count: number;
	last_executed_at: number | null;
	nodes?: IWorkflowNode[];
	connections?: IWorkflowConnection[];
	settings?: IWorkflowSettings;
	created_at: number;
	updated_at: number;
}

// Keep legacy alias for backward compat
export type TWorkflow = IWorkflow;

// Workflow filters for list query
export interface IWorkflowFilters {
	page?: number;
	per_page?: number;
	status?: TWorkflowStatus;
	search?: string;
	tags?: string;
	category?: string;
	is_favorite?: boolean;
	created_after?: number;
	created_before?: number;
	updated_after?: number;
	updated_before?: number;
	sort_by?: TWorkflowSortBy;
	order?: TSortOrder;
}

// ─── Request DTOs ────────────────────────────────────────────

// POST /workspaces/{id}/workflows
export type TCreateWorkflowDto = {
	name: string;
	description?: string;
	nodes?: IWorkflowNode[];
	connections?: IWorkflowConnection[];
	settings?: IWorkflowSettings;
	tags?: string[];
	color?: string;
	icon?: string;
	category?: string;
	folder_id?: string;
};

// PUT /workspaces/{id}/workflows/{id}
export type TUpdateWorkflowDto = {
	name?: string;
	description?: string;
	nodes?: any[];
	edges?: any[];
	connections?: IWorkflowConnection[];
	settings?: IWorkflowSettings;
	tags?: string[];
	color?: string;
	icon?: string;
	category?: string;
	is_favorite?: boolean;
	folder_id?: string | null;
	error_workflow_id?: string | null;
	max_concurrent_executions?: number;
};

// Execute workflow request
export interface IExecuteWorkflowDto {
	trigger_data?: Record<string, unknown>;
	input_data?: Record<string, unknown>;
	test_mode?: boolean;
}

// Workflow execution result (brief)
export interface IWorkflowExecutionResult {
	execution_id: string;
	status: 'running' | 'completed' | 'failed';
	started_at: number;
}

// Duplicate workflow request
export interface IDuplicateWorkflowDto {
	name?: string;
	variables?: Record<string, string>;
}

// POST /workspaces/{id}/workflows/import
export interface IImportWorkflowDto {
	workflow_data: {
		format_version: string;
		workflow: Record<string, unknown>;
	};
}

// POST /workspaces/{id}/folders/move-workflows
export interface IMoveWorkflowsDto {
	folder_id: string | null;
	workflow_ids: string[];
}

// ─── WorkflowEditor Extended Types ───────────────────────────

// Workflow version snapshot
export interface IWorkflowVersion {
	id: string;
	workflow_id: string;
	version?: number;
	version_number: number;
	name?: string | null;
	description?: string | null;
	nodes: unknown[];
	edges: unknown[];
	viewport?: Record<string, unknown> | null;
	settings?: IWorkflowSettings | Record<string, unknown>;
	change_summary?: string | null;
	is_published: boolean;
	published_at?: string | null;
	created_by?: string;
	created_at: number | string;
}

export type TStoreWorkflowVersionDto = {
	name?: string;
	description?: string;
	nodes: unknown[];
	edges: unknown[];
	viewport?: Record<string, unknown>;
	settings?: Record<string, unknown>;
	change_summary?: string;
};

export interface IWorkflowVersionComparisonSummary {
	nodesAdded: number;
	nodesRemoved: number;
	nodesModified: number;
	connectionsAdded: number;
	connectionsRemoved: number;
	settingsChanged: boolean;
}

export interface IWorkflowVersionDifference {
	type: 'added' | 'removed' | 'modified';
	path: string;
	oldValue?: unknown;
	newValue?: unknown;
	description?: string;
}

export interface IWorkflowVersionComparison {
	summary: IWorkflowVersionComparisonSummary;
	differences: IWorkflowVersionDifference[];
}

// Workflow export/import (linkflow format)
export interface IWorkflowExport {
	version: string;
	exportedAt: number;
	workflow: {
		name: string;
		description?: string;
		nodes: IWorkflowNode[];
		connections: IWorkflowConnection[];
		settings?: IWorkflowSettings;
		tags?: string[];
	};
}

export interface IWorkflowImport {
	version: string;
	workflow: {
		name: string;
		description?: string;
		nodes: IWorkflowNode[];
		connections: IWorkflowConnection[];
		settings?: IWorkflowSettings;
		tags?: string[];
	};
}

// Pinned test data per node
export interface IWorkflowPinnedDataItem {
	json: Record<string, unknown>;
}

export interface IWorkflowPinnedData {
	node_id: string;
	data: IWorkflowPinnedDataItem[];
}

export interface ISetPinnedDataDto {
	node_id: string;
	data: IWorkflowPinnedDataItem[];
}

// Workflow validation
export interface IWorkflowValidationResult {
	valid: boolean;
	errors: Array<{
		type: 'error' | 'warning';
		node?: string;
		message: string;
	}>;
}

// Test a single node
export interface ITestNodeDto {
	node_type: string;
	parameters: Record<string, unknown>;
	input?: Record<string, unknown>;
}

export interface ITestNodeResult {
	success: boolean;
	output?: Record<string, unknown>;
	error?: string;
	duration: number;
}

// Clone workflow (requires explicit name)
export interface ICloneWorkflowDto {
	name: string;
}
