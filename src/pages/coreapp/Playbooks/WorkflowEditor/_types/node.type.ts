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
	| 'picker';

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
	/** picker only — call to action, e.g. "Pick Folder". */
	pickerLabel?: string;
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
	status?: TNodeRunStatus;
	durationMs?: number;
	error?: string;
	inputPreview?: unknown;
	outputPreview?: unknown;
	notes?: string;
	locked?: boolean;
	// New node data fields
	color?: string;
	breakpoint?: boolean;
	comments?: TNodeComment[];
	testOutput?: unknown;
	testStatus?: 'idle' | 'running' | 'success' | 'error';
	// Resolved input the node ran against, error message, and wall time — captured
	// from a real single-node test run so the card can show input/output/timing.
	testInput?: unknown;
	testError?: string;
	testDurationMs?: number;
	// Pinned data: when pinned, the engine reuses this output instead of executing
	pinned?: boolean;
	pinnedOutput?: unknown;
	// When true the node runs once per item of its incoming list input
	loopMode?: boolean;
	// When true this node is promoted to the flow's entry trigger
	activateAsTrigger?: boolean;
	// Collapsed nodes render header only, hiding fields and description
	collapsed?: boolean;
} & Record<string, unknown>;
