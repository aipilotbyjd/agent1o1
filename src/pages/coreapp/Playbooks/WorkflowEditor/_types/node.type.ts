export type TPortType = 'string' | 'number' | 'boolean' | 'list' | 'file' | 'json' | 'any';

export type TNodeCategory =
	| 'trigger'
	| 'input'
	| 'ai'
	| 'scrape'
	| 'extract'
	| 'data'
	| 'logic'
	| 'loop'
	| 'integration'
	| 'output'
	| 'note'
	| 'flow-control'
	| 'communication'
	| 'http-apis'
	| 'utility'
	| 'storage'
	| 'debug';

export type TNodePort = {
	id: string;
	name: string;
	/** Actual property path in the output; empty means the complete output. */
	path?: string;
	type: TPortType;
	required?: boolean;
};

export type TFieldKind =
	| 'text'
	| 'longtext'
	| 'code'
	| 'number'
	| 'toggle'
	| 'select'
	| 'multiselect'
	| 'kv'
	| 'credential'
	| 'model'
	| 'picker'
	| 'dynamic'
	| 'list';

/** A `dynamic` field's live dropdown: see `INodeSchemaOptions`. */
export type TDynamicFieldOptions = {
	source: string;
	dependsOn: string[];
	uses: string[];
	multiple: boolean;
	allowCustom: boolean;
	/** The config value's shape: an id string, a number (GitHub issues), or a list. */
	valueType: 'string' | 'integer' | 'array';
};

export type TNodeField = {
	key: string;
	label: string;
	kind: TFieldKind;
	credentialType?: string;
	options?: { label: string; value: string }[];
	default?: unknown;
	required?: boolean;
	help?: string;
	placeholder?: string;
	supportsVariables?: boolean;
	rows?: number;
	/** Hidden behind "Show More Options" until the user opts in. */
	advanced?: boolean;
	/** picker only: call to action, e.g. "Pick Folder". */
	pickerLabel?: string;
	/** code only: the value is a JSON object/array, edited as JSON text. */
	json?: boolean;
	/** kv only: store the rows as a `{key: value}` object instead of a row list. */
	kvObject?: boolean;
	/** dynamic only, where the choices come from. */
	dynamic?: TDynamicFieldOptions;
	/** number only. */
	min?: number;
	max?: number;
};

/** A node's config edited outside the canvas (an agent's app trigger). */
export type TFieldHost = {
	type: string;
	values: Record<string, unknown>;
	fields: TNodeField[];
};

export type TNodeDefinition = {
	key: string;
	category: TNodeCategory;
	label: string;
	description: string;
	icon: string;
	color: string;
	colorHex?: string;
	inputs: TNodePort[];
	outputs: TNodePort[];
	fields: TNodeField[];
	supportsLoopMode?: boolean;
	/** Node can be promoted to the flow's entry trigger (shows the "Activate as flow trigger" strip). */
	supportsTrigger?: boolean;
	/** The app category this node belongs to (`slack`), for grouping nodes from many apps. */
	appSlug?: string;
	/** An admin's flag: the node is offered but marked beta or deprecated, with an optional note. */
	status?: 'beta' | 'deprecated';
	statusNote?: string;
	/** Whether the node starts a flow on its own (an instant trigger) or does a job in one. */
	nodeKind?: 'trigger' | 'action';
	/** Picked from Triggers & Events: the new node starts with its trigger switched on. */
	startsAsTrigger?: boolean;
	/** False for a retired node (the manual trigger): kept resolvable, hidden from the library. */
	listed?: boolean;
	requiresCredential?: boolean;
	/** Estimated credits charged per run. Falls back to a per-category default when unset. */
	creditCost?: number;
};

export type TNodeRunStatus = 'idle' | 'queued' | 'running' | 'success' | 'error' | 'skipped';

export type TNodeComment = {
	id: string;
	text: string;
	at: number;
	author?: string;
};

export type TCanvasNodeData = {
	defKey: string;
	label: string;
	definition?: TNodeDefinition;
	values: Record<string, unknown>;
	dynamicInputKeys?: string[];
	outputPortsSnapshot?: TNodePort[];
	fixedInputValues?: Record<string, unknown>;
	status?: TNodeRunStatus;
	durationMs?: number;
	error?: string;
	inputPreview?: unknown;
	outputPreview?: unknown;
	notes?: string;
	locked?: boolean;
	// New node data fields
	color?: string;
	comments?: TNodeComment[];
	testOutput?: unknown;
	testStatus?: 'idle' | 'running' | 'success' | 'error';
	// Resolved input the node ran against, error message, and wall time: captured
	// from a real single-node test run for inspection in the Runs panel.
	testInput?: unknown;
	testError?: string;
	testDurationMs?: number;
	// Pinned data: when pinned, the engine reuses this output instead of executing
	pinned?: boolean;
	pinnedOutput?: unknown;
	// When true the node runs once per item of its incoming list input
	loopMode?: boolean;
	// Collapsed nodes render header only, hiding fields and description
	collapsed?: boolean;
} & Record<string, unknown>;
