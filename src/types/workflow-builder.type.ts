// AI Workflow Builder — /workspaces/{workspace}/workflow-builder/

import type { TWorkflow } from './workflow.type';

// Draft graph

export interface IBuilderNodePosition {
	x: number;
	y: number;
}

export interface IBuilderNode {
	id: string;
	type: string;
	name: string;
	config: Record<string, unknown>;
	position: IBuilderNodePosition;
}

export interface IBuilderEdge {
	source: string;
	target: string;
	sourceHandle?: string;
	targetHandle?: string;
}

export interface IBuilderDraft {
	nodes: IBuilderNode[];
	edges: IBuilderEdge[];
}

// Sessions

export type TBuilderSessionStatus = 'active' | 'completed' | 'archived' | 'failed';

export type TBuilderMessageRole = 'user' | 'assistant';

export type TBuilderMessageStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface IBuilderMessageAction {
	type: 'node_added' | 'node_removed' | 'node_updated' | 'edges_added' | 'edges_removed';
	node_id?: string;
	node_type?: string;
	label?: string;
	count?: number;
}

export interface IBuilderMessage {
	id: string;
	role: TBuilderMessageRole;
	content: string;
	actions?: IBuilderMessageAction[] | null;
	processing_status: TBuilderMessageStatus;
	error_message?: string | null;
	draft_version_id?: string | null;
	created_at: string;
	updated_at?: string;
}

export interface IBuilderSession {
	id: string;
	title: string;
	status: TBuilderSessionStatus;
	status_label?: string;
	workflow_id?: string | null;
	conversation_id?: string | null;
	nodes_draft: IBuilderNode[];
	edges_draft: IBuilderEdge[];
	draft_lock_version: number;
	message_count?: number;
	version_count?: number;
	messages?: IBuilderMessage[];
	last_activity_at?: string | null;
	created_at: string;
	updated_at?: string;
}

export interface IBuilderDraftVersion {
	id: string;
	label?: string | null;
	node_count: number;
	edge_count: number;
	triggered_by?: string | null;
	nodes_snapshot?: IBuilderNode[];
	edges_snapshot?: IBuilderEdge[];
	created_at: string;
}

// Validation

export interface IBuilderValidationError {
	node_id: string | null;
	issue: string;
}

export interface IBuilderValidationResult {
	valid: boolean;
	errors: IBuilderValidationError[];
}

// Request DTOs

export interface IListSessionsParams {
	status?: TBuilderSessionStatus;
	per_page?: number;
	page?: number;
}

export interface ICreateSessionDto {
	title?: string;
	prompt?: string;
	workflow_id?: string;
	nodes?: IBuilderNode[];
	edges?: IBuilderEdge[];
}

export interface IRenameSessionDto {
	title: string;
}

export interface ISyncDraftDto {
	nodes: IBuilderNode[];
	edges: IBuilderEdge[];
}

export interface ISendBuilderMessageDto {
	message: string;
}

export interface IListMessagesParams {
	per_page?: number;
	page?: number;
}

export interface IListVersionsParams {
	per_page?: number;
	page?: number;
}

// Response shapes

export interface ISessionQueuedResponse {
	session_id: string;
	message_id: string;
}

export type TCreateSessionResponse = IBuilderSession | ISessionQueuedResponse;

export const isSessionQueued = (
	res: TCreateSessionResponse,
): res is ISessionQueuedResponse =>
	(res as ISessionQueuedResponse).session_id !== undefined &&
	(res as IBuilderSession).id === undefined;

export interface ISendMessageResponse {
	message_id: string;
}

// One-shot generation

export interface IGenerateWorkflowDto {
	prompt: string;
	save?: boolean;
}

export interface IGenerateWorkflowResult {
	name: string;
	description: string;
	nodes: IBuilderNode[];
	edges: IBuilderEdge[];
	workflow: TWorkflow | null;
}

export interface IExplainWorkflowDto {
	nodes: IBuilderNode[];
	edges: IBuilderEdge[];
}

export interface IExplainWorkflowResult {
	explanation: string;
}

export interface ISuggestNodesDto {
	nodes: IBuilderNode[];
	edges: IBuilderEdge[];
	goal?: string;
}

export interface INodeSuggestion {
	node_type: string;
	node_name: string;
	reason: string;
	category: string;
	complexity: string;
}

export interface ISuggestNodesResult {
	suggestions: INodeSuggestion[];
}

export interface IConfigureNodeDto {
	node_type: string;
	intent: string;
}

export interface IConfigureNodeResult {
	config: Record<string, unknown>;
	explanation: string;
	validation_notes: string;
}

export interface ISuggestEnhancementsDto {
	nodes: IBuilderNode[];
	edges: IBuilderEdge[];
}

export interface IEnhancementSuggestion {
	title: string;
	description: string;
	impact: string;
	priority: string;
	effort: string;
	suggested_node_type?: string;
}

export interface ISuggestEnhancementsResult {
	suggestions: IEnhancementSuggestion[];
}

// Realtime (WebSocket)

export interface IBuilderMessageReadyEvent {
	message: IBuilderMessage;
	draft: IBuilderDraft;
	version: {
		id: string;
		label?: string | null;
		node_count: number;
		edge_count: number;
		created_at: string;
	} | null;
	session: Pick<IBuilderSession, 'id' | 'title' | 'status'> & {
		draft_lock_version?: number;
	};
	error: boolean;
}

export interface IBuilderStreamTextDeltaEvent {
	type: 'text_delta';
	id: string;
	invocation_id: string | null;
	message_id: string;
	delta: string;
	timestamp: number;
}

export interface IBuilderStreamToolCallEvent {
	type: 'tool_call';
	id: string;
	invocation_id: string | null;
	tool_id: string;
	tool_name: string;
	arguments: Record<string, unknown>;
	reasoning_id?: string | null;
	timestamp: number;
}

export interface IBuilderStreamToolResultEvent {
	type: 'tool_result';
	id: string;
	invocation_id: string | null;
	tool_id: string;
	tool_name: string;
	result: unknown;
	successful: boolean;
	error: string | null;
	timestamp: number;
}

export interface IBuilderStreamStartEvent {
	type: 'stream_start';
	provider: string;
	model: string;
	timestamp: number;
}

export interface IBuilderStreamEndEvent {
	type: 'stream_end';
	reason: string;
	usage?: Record<string, unknown> | null;
	timestamp: number;
}

export interface IBuilderStreamErrorEvent {
	type: 'error';
	message: string;
	recoverable: boolean;
	timestamp: number;
}

// Legacy (v1 prototype, unused — kept for future reuse)

export type TWorkflowBuilderSessionStatus = 'active' | 'promoted' | 'archived';

export type TWorkflowBuilderMessage = {
	id: string;
	session_id: string;
	draft_version_id: string | null;
	role: 'user' | 'assistant';
	content: string;
	actions: unknown;
	created_at: string;
};

export type TWorkflowBuilderSession = {
	id: string;
	workspace_id: string;
	user_id: string;
	workflow_id: string | null;
	title: string | null;
	draft_graph: { nodes: unknown[]; edges: unknown[] };
	draft_lock_version: number;
	status: TWorkflowBuilderSessionStatus;
	last_activity_at: string;
	messages?: TWorkflowBuilderMessage[];
	created_at: string;
};

export type TCreateBuilderSessionDto = {
	title?: string;
	workflow_id?: string | null;
};

export type TSendBuilderMessageDto = {
	message: string;
};

export type TPromoteBuilderSessionDto = {
	name?: string;
};

export type TWorkflowGraphNodeInput = {
	key: string;
	type: string;
	config?: Record<string, unknown> | null;
};

export type TWorkflowGraphEdgeInput = {
	from: string;
	to: string;
	condition?: string | null;
};

export type TValidateWorkflowDto = {
	graph?: { nodes: TWorkflowGraphNodeInput[]; edges: TWorkflowGraphEdgeInput[] };
};

export type TDryRunWorkflowDto = TValidateWorkflowDto & {
	input?: Record<string, unknown>;
};

export type TWorkflowValidationResult = {
	valid: boolean;
	issues: unknown[];
};

export type TWorkflowDryRunResult = {
	dry_run: unknown;
};

export type TTestWorkflowNodeDto = {
	input?: Record<string, unknown>;
	nodes?: Record<string, unknown>;
	config?: Record<string, unknown> | null;
};
