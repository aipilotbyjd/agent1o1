import type { TCanvasEdge, TCanvasNode, TCanvasSnapshot } from './canvas.type';
import type { TRunRecord, TRunState } from './run.type';

export type TWorkflowMeta = {
	id: string;
	workspaceId?: string;
	apiId?: string;
	currentVersionId?: string | null;
	currentVersionNumber?: number;
	name: string;
	description?: string | null;
	folder: string;
	tags?: string[];
	updatedAt: number;
	savingState: 'saved' | 'saving' | 'dirty' | 'error';
};

export type TEditorUiState = {
	leftPanelOpen: boolean;
	leftPanelIntent: 'home' | 'trigger';
	runPanelOpen: boolean;
	aiPanelOpen: boolean;
	miniMapOpen: boolean;
	commandPaletteOpen: boolean;
	quickAddOpen: boolean;
	importExportOpen: boolean;
	selectedNodeId: string | null;
	/** Full multi-select set for box-select/Cmd+click/Select All — includes selectedNodeId when non-empty. */
	selectedNodeIds: string[];
	emptyCanvasView?: 'ai' | 'templates' | 'chat-started';
	// New UI state
	shortcutsOpen: boolean;
	canvasSearchOpen: boolean;
	canvasSearchQuery: string;
	templateLibraryOpen: boolean;
	diffViewerOpen: boolean;
	nodeDocOpen: boolean;
	nodeDocNodeId: string | null;
	nodeExpandedOpen: boolean;
	nodeExpandedId: string | null;
	stepMode: boolean;
	waitingForStep: boolean;
	linkCredentialsOpen: boolean;
	runPanelTab: 'console' | 'history';
};

export type THistoryState = {
	past: TCanvasSnapshot[];
	future: TCanvasSnapshot[];
};

export type TWorkflowEditorState = {
	workflow: TWorkflowMeta;
	nodes: TCanvasNode[];
	edges: TCanvasEdge[];
	run: TRunState;
	ui: TEditorUiState;
	history: THistoryState;
	runHistory: TRunRecord[];
};

export type TExportedWorkflow = {
	workflow: TWorkflowMeta;
	nodes: TCanvasNode[];
	edges: TCanvasEdge[];
};
