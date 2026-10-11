// ============================================================
// Workflow Sub-Resource Types
// ------------------------------------------------------------
// Versions and the declared input interface — everything else that
// used to hang off a workflow (sticky notes, replay packs,
// environment releases, contract snapshots, share links) has no
// counterpart on the real backend. Node pinning lives in
// workflow.type.ts (`TPinWorkflowNodeDto`); approvals live in
// run.type.ts, since they're addressed through a run, not a
// workflow.
// ============================================================

import type { TBuilderGraph } from './workflow-builder.type';

// ─── Versions ────────────────────────────────────────────────

export type TWorkflowVersionPublisher = {
	id: string;
	name: string;
};

/** `graph` is what runs (loop-mode nodes compiled, no positions);
 *  `editor_graph` is the canvas as it was published. Both are only on a
 *  single-version read — the list leaves them out. */
export type TWorkflowVersion = {
	id: string;
	workflow_id: string;
	version: number;
	graph?: TBuilderGraph;
	editor_graph?: TBuilderGraph;
	notes: string | null;
	published_by: string | null;
	publisher?: TWorkflowVersionPublisher | null;
	runs_count?: number;
	created_at: string;
};

// ─── Interface ───────────────────────────────────────────────

export type TWorkflowInterfaceFieldType =
	| 'string'
	| 'text'
	| 'number'
	| 'boolean'
	| 'select'
	| 'json';

export type TWorkflowInterfaceFieldOption = {
	value: string;
	label?: string | null;
};

export type TWorkflowInterfaceField = {
	key: string;
	label?: string | null;
	type: TWorkflowInterfaceFieldType;
	required?: boolean;
	help?: string | null;
	default?: unknown;
	options?: TWorkflowInterfaceFieldOption[];
};

export type TWorkflowInterface = {
	workflow_id: string;
	published: boolean;
	/** `declared` when authored via `PUT .../interface`, `derived` when read
	 *  off the graph's `{{ input.* }}` references instead. */
	source: 'declared' | 'derived';
	fields: TWorkflowInterfaceField[];
};

export type TUpdateWorkflowInterfaceDto = {
	fields: TWorkflowInterfaceField[];
};

export type TSubmitWorkflowInterfaceDto = {
	input?: Record<string, unknown>;
};
