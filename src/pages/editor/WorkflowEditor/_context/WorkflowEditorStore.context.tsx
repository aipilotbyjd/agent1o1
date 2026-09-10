import { createContext } from 'react';
import { HISTORY_LIMIT } from '../_helper/builder.constants';
import { getNodeDefinition } from '../_helper/nodeCatalog.constants';

import { autoLayout } from '../_helper/layout.helper';
import type {
	TCanvasEdge,
	TCanvasNode,
	TCanvasPosition,
	TCanvasSnapshot,
} from '../_types/canvas.type';
import type {
	TCanvasNodeData,
	TNodeComment,
	TNodeDefinition,
	TNodeField,
	TNodeRunStatus,
} from '../_types/node.type';
import type { TRunLog, TRunRecord } from '../_types/run.type';
import type {
	TExportedWorkflow,
	TWorkflowEditorState,
	TWorkflowMeta,
} from '../_types/workflow-editor.type';

export type TWorkflowEditorAction =
	| {
			type: 'ADD_NODE';
			defKey: string;
			position: TCanvasPosition;
			definition?: TNodeDefinition;
	  }
	| { type: 'ADD_TEMPLATE'; defKeys: string[]; name: string }
	| { type: 'MOVE_NODE'; id: string; position: TCanvasPosition }
	| { type: 'SELECT_NODE'; id: string | null }
	| { type: 'SELECT_NODES'; ids: string[] }
	| { type: 'SELECT_ALL_NODES' }
	| { type: 'CLEAR_NODE_SELECTION' }
	| { type: 'UPDATE_NODE_VALUE'; id: string; fieldKey: string; value: unknown }
	| { type: 'RENAME_NODE'; id: string; label: string }
	| { type: 'CONFIGURE_NODE_FIELDS'; id: string; fields: TNodeField[] }
	| { type: 'DELETE_SELECTED' }
	| { type: 'DUPLICATE_SELECTED' }
	| {
			type: 'ADD_EDGE';
			source: string;
			target: string;
			sourceHandle?: string;
			targetHandle?: string;
	  }
	| { type: 'REMOVE_EDGE'; id: string }
	| { type: 'AUTO_LAYOUT' }
	| { type: 'UNDO' }
	| { type: 'REDO' }
	| { type: 'SET_WORKFLOW_META'; patch: Partial<TWorkflowMeta> }
	| { type: 'SET_SAVE_STATE'; savingState: TWorkflowMeta['savingState'] }
	| { type: 'TOGGLE_LEFT_PANEL'; intent?: 'home' | 'trigger' }
	| { type: 'TOGGLE_RUN_PANEL' }
	| { type: 'TOGGLE_AI_PANEL' }
	| { type: 'TOGGLE_MINIMAP' }
	| { type: 'SET_EMPTY_CANVAS_VIEW'; view: 'ai' | 'templates' | 'chat-started' }
	| { type: 'SET_COMMAND_PALETTE'; open: boolean }
	| { type: 'SET_QUICK_ADD'; open: boolean }
	| { type: 'SET_IMPORT_EXPORT'; open: boolean }
	| { type: 'RUN_START'; id: string }
	| { type: 'RUN_FINISH'; status: 'success' | 'error' | 'stopped' }
	| { type: 'RUN_CURRENT_NODE'; nodeId: string | null }
	| { type: 'APPEND_LOG'; log: Omit<TRunLog, 'id' | 'at'> }
	| { type: 'SET_LOGS'; logs: TRunLog[] }
	| {
			type: 'SET_NODE_STATUS';
			id: string;
			status: TNodeRunStatus;
			durationMs?: number;
			error?: string;
			inputPreview?: unknown;
			outputPreview?: unknown;
	  }
	| { type: 'LOAD_WORKFLOW'; workflow: TExportedWorkflow }
	| { type: 'APPLY_BUILDER_DRAFT'; nodes: TCanvasNode[]; edges: TCanvasEdge[] }
	// Granular live-apply — the AI builder dispatches these per tool call as it
	// works, so the canvas updates node-by-node instead of waiting for the whole
	// reply (Gumloop-style). APPLY_BUILDER_DRAFT still runs once at the end as
	// the authoritative reconciliation.
	| { type: 'BUILDER_ADD_NODE'; node: TCanvasNode }
	| {
			type: 'BUILDER_UPDATE_NODE';
			id: string;
			name?: string;
			config?: Record<string, unknown>;
			position?: TCanvasPosition;
	  }
	| { type: 'BUILDER_REMOVE_NODE'; id: string }
	| { type: 'BUILDER_REMOVE_EDGE'; source: string; target: string }
	// Node customization
	| { type: 'SET_NODE_COLOR'; id: string; color: string | null }
	| { type: 'TOGGLE_NODE_BREAKPOINT'; id: string }
	| { type: 'TOGGLE_NODE_LOOP_MODE'; id: string }
	| { type: 'TOGGLE_NODE_FLOW_TRIGGER'; id: string }
	| { type: 'TOGGLE_NODE_COLLAPSED'; id: string }
	| { type: 'ADD_NODE_COMMENT'; id: string; text: string }
	| { type: 'REMOVE_NODE_COMMENT'; id: string; commentId: string }
	| {
			type: 'SET_NODE_TEST_STATUS';
			id: string;
			status: 'idle' | 'running' | 'success' | 'error';
			output?: unknown;
			input?: unknown;
			error?: string;
			durationMs?: number;
	  }
	// UI state
	| { type: 'SET_SHORTCUTS_OPEN'; open: boolean }
	| { type: 'SET_CANVAS_SEARCH'; open?: boolean; query?: string }
	| { type: 'SET_TEMPLATE_LIBRARY'; open: boolean }
	| { type: 'SET_NODE_DOC'; open: boolean; nodeId?: string | null }
	| { type: 'SET_NODE_EXPANDED'; open: boolean; nodeId?: string | null }
	| { type: 'SET_DIFF_VIEWER'; open: boolean }
	| { type: 'SET_STEP_MODE'; enabled: boolean }
	| { type: 'STEP_NEXT' }
	| { type: 'SET_LINK_CREDENTIALS_OPEN'; open: boolean }
	// Pinned data + run history
	| { type: 'PIN_NODE_OUTPUT'; id: string; output?: unknown }
	| { type: 'UNPIN_NODE'; id: string }
	| { type: 'PUSH_RUN_HISTORY'; record: TRunRecord }
	| { type: 'CLEAR_RUN_HISTORY' }
	| { type: 'SET_RUN_PANEL_TAB'; tab: 'console' | 'history' };

export type TWorkflowEditorContextValue = {
	state: TWorkflowEditorState;
	dispatch: React.Dispatch<TWorkflowEditorAction>;
};

export const WorkflowEditorContext = createContext<TWorkflowEditorContextValue | null>(null);

export const createId = (prefix: string) =>
	`${prefix}_${Math.random().toString(36).slice(2, 8)}_${Date.now().toString(36)}`;

const initialWorkflow: TWorkflowMeta = {
	id: 'local',
	name: 'AI Lead Routing Agent',
	description: 'Qualify inbound leads, enrich accounts, and route next actions.',
	folder: 'Revenue Ops',
	updatedAt: Date.now(),
	savingState: 'saved',
};

export const initialWorkflowEditorState: TWorkflowEditorState = {
	workflow: initialWorkflow,
	nodes: [],
	edges: [],
	run: {
		id: null,
		status: 'idle',
		startedAt: null,
		finishedAt: null,
		currentNodeId: null,
		logs: [],
	},
	ui: {
		leftPanelOpen: false,
		leftPanelIntent: 'home',
		runPanelOpen: false,
		aiPanelOpen: false,
		miniMapOpen: false,
		commandPaletteOpen: false,
		quickAddOpen: false,
		importExportOpen: false,
		selectedNodeId: null,
		selectedNodeIds: [],
		emptyCanvasView: 'ai',
		shortcutsOpen: false,
		canvasSearchOpen: false,
		canvasSearchQuery: '',
		templateLibraryOpen: false,
		diffViewerOpen: false,
		nodeDocOpen: false,
		nodeDocNodeId: null,
		nodeExpandedOpen: false,
		nodeExpandedId: null,
		stepMode: false,
		waitingForStep: false,
		linkCredentialsOpen: false,
		runPanelTab: 'console',
	},
	history: {
		past: [],
		future: [],
	},
	runHistory: [],
};

const RUN_HISTORY_LIMIT = 25;

const snapshot = (state: TWorkflowEditorState): TCanvasSnapshot => ({
	nodes: structuredClone(state.nodes),
	edges: structuredClone(state.edges),
});

const withHistory = (state: TWorkflowEditorState): TWorkflowEditorState => ({
	...state,
	workflow: { ...state.workflow, savingState: 'dirty', updatedAt: Date.now() },
	history: {
		past: [...state.history.past.slice(-HISTORY_LIMIT + 1), snapshot(state)],
		future: [],
	},
});

const makeNode = (
	defKey: string,
	position: TCanvasPosition,
	runtimeDefinition?: TNodeDefinition,
): TCanvasNode | null => {
	const def = getNodeDefinition(defKey, runtimeDefinition);
	if (!def) return null;
	const values: Record<string, unknown> = {};
	def.fields.forEach((field) => {
		if (field.default !== undefined) values[field.key] = field.default;
	});
	const data: TCanvasNodeData = {
		defKey,
		label: def.label,
		definition: runtimeDefinition,
		values,
		status: 'idle',
	};
	const type =
		def.category === 'input'
			? 'input'
			: def.category === 'trigger'
				? 'trigger'
				: def.category === 'output'
					? 'output'
					: def.category === 'note'
						? 'note'
						: 'base';
	return {
		id: createId('node'),
		type,
		position,
		data,
	};
};

export const workflowEditorReducer = (
	state: TWorkflowEditorState,
	action: TWorkflowEditorAction,
): TWorkflowEditorState => {
	switch (action.type) {
		case 'ADD_NODE': {
			const node = makeNode(action.defKey, action.position, action.definition);
			if (!node) return state;
			const next = withHistory(state);
			return {
				...next,
				nodes: [...next.nodes, node],
				ui: { ...next.ui, selectedNodeId: node.id, selectedNodeIds: [node.id] },
			};
		}
		case 'ADD_TEMPLATE': {
			const next = withHistory(state);
			const nodes = action.defKeys
				.map((key, index) => makeNode(key, { x: 80 + index * 260, y: 120 }))
				.filter(Boolean) as TCanvasNode[];
			const edges: TCanvasEdge[] = [];
			for (let index = 0; index < nodes.length - 1; index += 1) {
				const sourceDef = getNodeDefinition(
					nodes[index].data.defKey,
					nodes[index].data.definition,
				);
				const targetDef = getNodeDefinition(
					nodes[index + 1].data.defKey,
					nodes[index + 1].data.definition,
				);
				if (!sourceDef?.outputs[0] || !targetDef?.inputs[0]) continue;
				edges.push({
					id: createId('edge'),
					source: nodes[index].id,
					target: nodes[index + 1].id,
					sourceHandle: sourceDef.outputs[0].id,
					targetHandle: targetDef.inputs[0].id,
				});
			}
			return {
				...next,
				workflow: { ...next.workflow, name: action.name, savingState: 'dirty' },
				nodes,
				edges,
				ui: {
					...next.ui,
					selectedNodeId: nodes[0]?.id ?? null,
					selectedNodeIds: nodes[0] ? [nodes[0].id] : [],
				},
			};
		}
		case 'MOVE_NODE': {
			const next = withHistory(state);
			return {
				...next,
				nodes: next.nodes.map((node) =>
					node.id === action.id ? { ...node, position: action.position } : node,
				),
			};
		}
		case 'SELECT_NODE':
			return {
				...state,
				ui: {
					...state.ui,
					selectedNodeId: action.id,
					selectedNodeIds: action.id ? [action.id] : [],
				},
			};
		case 'SELECT_NODES':
			return {
				...state,
				ui: {
					...state.ui,
					selectedNodeIds: action.ids,
					selectedNodeId: action.ids[action.ids.length - 1] ?? null,
				},
			};
		case 'SELECT_ALL_NODES': {
			const ids = state.nodes.map((node) => node.id);
			return {
				...state,
				ui: { ...state.ui, selectedNodeIds: ids, selectedNodeId: ids[ids.length - 1] ?? null },
			};
		}
		case 'CLEAR_NODE_SELECTION':
			return {
				...state,
				ui: { ...state.ui, selectedNodeIds: [], selectedNodeId: null },
			};
		case 'UPDATE_NODE_VALUE':
			return {
				...state,
				workflow: { ...state.workflow, savingState: 'dirty', updatedAt: Date.now() },
				nodes: state.nodes.map((node) =>
					node.id === action.id
						? {
								...node,
								data: {
									...node.data,
									values: {
										...node.data.values,
										[action.fieldKey]: action.value,
									},
								},
							}
						: node,
				),
			};
		case 'RENAME_NODE':
			return {
				...state,
				workflow: { ...state.workflow, savingState: 'dirty', updatedAt: Date.now() },
				nodes: state.nodes.map((node) =>
					node.id === action.id
						? { ...node, data: { ...node.data, label: action.label } }
						: node,
				),
			};
		case 'DELETE_SELECTED': {
			const ids = new Set(
				state.ui.selectedNodeIds.length > 0
					? state.ui.selectedNodeIds
					: state.ui.selectedNodeId
						? [state.ui.selectedNodeId]
						: [],
			);
			if (ids.size === 0) return state;
			const next = withHistory(state);
			return {
				...next,
				nodes: next.nodes.filter((node) => !ids.has(node.id)),
				edges: next.edges.filter((edge) => !ids.has(edge.source) && !ids.has(edge.target)),
				ui: { ...next.ui, selectedNodeId: null, selectedNodeIds: [] },
			};
		}
		case 'DUPLICATE_SELECTED': {
			const ids =
				state.ui.selectedNodeIds.length > 0
					? state.ui.selectedNodeIds
					: state.ui.selectedNodeId
						? [state.ui.selectedNodeId]
						: [];
			const nodesToClone = state.nodes.filter((item) => ids.includes(item.id));
			if (nodesToClone.length === 0) return state;
			const clones: TCanvasNode[] = nodesToClone.map((node) => ({
				...structuredClone(node),
				id: createId('node'),
				position: { x: node.position.x + 32, y: node.position.y + 32 },
			}));
			const next = withHistory(state);
			return {
				...next,
				nodes: [...next.nodes, ...clones],
				ui: {
					...next.ui,
					selectedNodeId: clones[clones.length - 1].id,
					selectedNodeIds: clones.map((clone) => clone.id),
				},
			};
		}
		case 'ADD_EDGE': {
			if (action.source === action.target) return state;
			const exists = state.edges.some(
				(edge) =>
					edge.source === action.source &&
					edge.target === action.target &&
					edge.sourceHandle === action.sourceHandle &&
					edge.targetHandle === action.targetHandle,
			);
			if (exists) return state;
			const next = withHistory(state);
			return {
				...next,
				edges: [
					...next.edges,
					{
						id: createId('edge'),
						source: action.source,
						target: action.target,
						sourceHandle: action.sourceHandle,
						targetHandle: action.targetHandle,
					},
				],
			};
		}
		case 'REMOVE_EDGE': {
			const next = withHistory(state);
			return { ...next, edges: next.edges.filter((edge) => edge.id !== action.id) };
		}
		case 'AUTO_LAYOUT': {
			const next = withHistory(state);
			return { ...next, nodes: autoLayout(next.nodes, next.edges) };
		}
		case 'UNDO': {
			const previous = state.history.past[state.history.past.length - 1];
			if (!previous) return state;
			return {
				...state,
				nodes: previous.nodes,
				edges: previous.edges,
				workflow: { ...state.workflow, savingState: 'dirty' },
				history: {
					past: state.history.past.slice(0, -1),
					future: [snapshot(state), ...state.history.future],
				},
			};
		}
		case 'REDO': {
			const next = state.history.future[0];
			if (!next) return state;
			return {
				...state,
				nodes: next.nodes,
				edges: next.edges,
				workflow: { ...state.workflow, savingState: 'dirty' },
				history: {
					past: [...state.history.past, snapshot(state)],
					future: state.history.future.slice(1),
				},
			};
		}
		case 'SET_WORKFLOW_META':
			return {
				...state,
				workflow: { ...state.workflow, ...action.patch, updatedAt: Date.now() },
			};
		case 'SET_SAVE_STATE':
			return { ...state, workflow: { ...state.workflow, savingState: action.savingState } };
		case 'TOGGLE_LEFT_PANEL': {
			const requestedIntent = action.intent ?? 'home';
			const isSwitchingIntent =
				state.ui.leftPanelOpen && state.ui.leftPanelIntent !== requestedIntent;
			const willBeOpen = isSwitchingIntent ? true : !state.ui.leftPanelOpen;
			return {
				...state,
				ui: {
					...state.ui,
					leftPanelOpen: willBeOpen,
					leftPanelIntent: willBeOpen ? requestedIntent : state.ui.leftPanelIntent,
					aiPanelOpen: willBeOpen ? false : state.ui.aiPanelOpen,
				},
			};
		}
		case 'TOGGLE_RUN_PANEL':
			return { ...state, ui: { ...state.ui, runPanelOpen: !state.ui.runPanelOpen } };
		case 'TOGGLE_AI_PANEL': {
			const willBeOpen = !state.ui.aiPanelOpen;
			return {
				...state,
				ui: {
					...state.ui,
					aiPanelOpen: willBeOpen,
					leftPanelOpen: willBeOpen ? false : state.ui.leftPanelOpen,
				},
			};
		}
		case 'TOGGLE_MINIMAP':
			return { ...state, ui: { ...state.ui, miniMapOpen: !state.ui.miniMapOpen } };
		case 'SET_EMPTY_CANVAS_VIEW':
			return { ...state, ui: { ...state.ui, emptyCanvasView: action.view } };
		case 'SET_COMMAND_PALETTE':
			return { ...state, ui: { ...state.ui, commandPaletteOpen: action.open } };
		case 'SET_QUICK_ADD':
			return { ...state, ui: { ...state.ui, quickAddOpen: action.open } };
		case 'SET_IMPORT_EXPORT':
			return { ...state, ui: { ...state.ui, importExportOpen: action.open } };
		case 'RUN_START':
			return {
				...state,
				run: {
					id: action.id,
					status: 'running',
					startedAt: Date.now(),
					finishedAt: null,
					currentNodeId: null,
					logs: [],
				},
				ui: { ...state.ui, runPanelOpen: true },
			};
		case 'RUN_FINISH':
			return {
				...state,
				run: {
					...state.run,
					status: action.status,
					currentNodeId: null,
					finishedAt: Date.now(),
				},
			};
		case 'RUN_CURRENT_NODE':
			return { ...state, run: { ...state.run, currentNodeId: action.nodeId } };
		case 'APPEND_LOG':
			return {
				...state,
				run: {
					...state.run,
					logs: [
						...state.run.logs,
						{ ...action.log, id: createId('log'), at: Date.now() },
					],
				},
			};
		case 'SET_LOGS':
			return {
				...state,
				run: {
					...state.run,
					logs: action.logs,
				},
			};
		case 'SET_NODE_STATUS':
			return {
				...state,
				nodes: state.nodes.map((node) =>
					node.id === action.id
						? {
								...node,
								data: {
									...node.data,
									status: action.status,
									durationMs: action.durationMs,
									error: action.error,
									inputPreview: action.inputPreview,
									outputPreview: action.outputPreview,
								},
							}
						: node,
				),
			};
		case 'LOAD_WORKFLOW':
			return {
				...state,
				workflow: { ...action.workflow.workflow, savingState: 'saved' },
				nodes: action.workflow.nodes,
				edges: action.workflow.edges,
				history: { past: [], future: [] },
				ui: {
					...state.ui,
					selectedNodeId: null,
					selectedNodeIds: [],
					importExportOpen: false,
					emptyCanvasView: 'ai',
					leftPanelOpen: false,
					aiPanelOpen: false,
					runPanelOpen: false,
					commandPaletteOpen: false,
					quickAddOpen: false,
					shortcutsOpen: false,
					canvasSearchOpen: false,
					canvasSearchQuery: '',
					templateLibraryOpen: false,
					diffViewerOpen: false,
					nodeDocOpen: false,
					nodeDocNodeId: null,
					waitingForStep: false,
					linkCredentialsOpen: false,
				},
			};
		case 'APPLY_BUILDER_DRAFT': {
			const next = withHistory(state);
			return {
				...next,
				nodes: action.nodes,
				edges: action.edges,
				workflow: { ...next.workflow, savingState: 'dirty' },
				ui: { ...next.ui, selectedNodeId: null, selectedNodeIds: [] },
			};
		}
		case 'BUILDER_ADD_NODE': {
			if (state.nodes.some((node) => node.id === action.node.id)) return state;
			const next = withHistory(state);
			return {
				...next,
				nodes: [...next.nodes, action.node],
				workflow: { ...next.workflow, savingState: 'dirty' },
			};
		}
		case 'BUILDER_UPDATE_NODE': {
			const next = withHistory(state);
			return {
				...next,
				nodes: next.nodes.map((node) =>
					node.id === action.id
						? {
								...node,
								position: action.position ?? node.position,
								data: {
									...node.data,
									label: action.name ?? node.data.label,
									values: action.config
										? { ...node.data.values, ...action.config }
										: node.data.values,
								},
							}
						: node,
				),
				workflow: { ...next.workflow, savingState: 'dirty' },
			};
		}
		case 'BUILDER_REMOVE_NODE': {
			const next = withHistory(state);
			return {
				...next,
				nodes: next.nodes.filter((node) => node.id !== action.id),
				edges: next.edges.filter(
					(edge) => edge.source !== action.id && edge.target !== action.id,
				),
				workflow: { ...next.workflow, savingState: 'dirty' },
			};
		}
		case 'BUILDER_REMOVE_EDGE': {
			const next = withHistory(state);
			return {
				...next,
				edges: next.edges.filter(
					(edge) => !(edge.source === action.source && edge.target === action.target),
				),
				workflow: { ...next.workflow, savingState: 'dirty' },
			};
		}
		case 'SET_NODE_COLOR': {
			const next = withHistory(state);
			return {
				...next,
				nodes: next.nodes.map((node) =>
					node.id === action.id
						? { ...node, data: { ...node.data, color: action.color ?? undefined } }
						: node,
				),
			};
		}
		case 'TOGGLE_NODE_BREAKPOINT':
			return {
				...state,
				nodes: state.nodes.map((node) =>
					node.id === action.id
						? { ...node, data: { ...node.data, breakpoint: !node.data.breakpoint } }
						: node,
				),
			};
		case 'TOGGLE_NODE_LOOP_MODE':
			return {
				...state,
				workflow: { ...state.workflow, savingState: 'dirty', updatedAt: Date.now() },
				nodes: state.nodes.map((node) =>
					node.id === action.id
						? { ...node, data: { ...node.data, loopMode: !node.data.loopMode } }
						: node,
				),
			};
		case 'TOGGLE_NODE_FLOW_TRIGGER': {
			// A flow has a single entry trigger — enabling one clears the rest.
			const enabling = !state.nodes.find((node) => node.id === action.id)?.data.activateAsTrigger;
			return {
				...state,
				workflow: { ...state.workflow, savingState: 'dirty', updatedAt: Date.now() },
				nodes: state.nodes.map((node) =>
					node.id === action.id
						? { ...node, data: { ...node.data, activateAsTrigger: enabling } }
						: enabling && node.data.activateAsTrigger
							? { ...node, data: { ...node.data, activateAsTrigger: false } }
							: node,
				),
			};
		}
		case 'TOGGLE_NODE_COLLAPSED':
			return {
				...state,
				nodes: state.nodes.map((node) =>
					node.id === action.id
						? { ...node, data: { ...node.data, collapsed: !node.data.collapsed } }
						: node,
				),
			};
		case 'ADD_NODE_COMMENT': {
			const comment: TNodeComment = {
				id: createId('cmt'),
				text: action.text,
				at: Date.now(),
			};
			return {
				...state,
				nodes: state.nodes.map((node) =>
					node.id === action.id
						? {
								...node,
								data: {
									...node.data,
									comments: [...(node.data.comments ?? []), comment],
								},
							}
						: node,
				),
			};
		}
		case 'REMOVE_NODE_COMMENT':
			return {
				...state,
				nodes: state.nodes.map((node) =>
					node.id === action.id
						? {
								...node,
								data: {
									...node.data,
									comments: (node.data.comments ?? []).filter(
										(c) => c.id !== action.commentId,
									),
								},
							}
						: node,
				),
			};
		case 'SET_NODE_TEST_STATUS':
			return {
				...state,
				nodes: state.nodes.map((node) =>
					node.id === action.id
						? {
								...node,
								data: {
									...node.data,
									testStatus: action.status,
									testOutput: action.output,
									testInput: action.input,
									testError: action.error,
									testDurationMs: action.durationMs,
								},
							}
						: node,
				),
			};
		case 'SET_SHORTCUTS_OPEN':
			return { ...state, ui: { ...state.ui, shortcutsOpen: action.open } };
		case 'SET_CANVAS_SEARCH':
			return {
				...state,
				ui: {
					...state.ui,
					canvasSearchOpen: action.open ?? state.ui.canvasSearchOpen,
					canvasSearchQuery: action.query ?? state.ui.canvasSearchQuery,
				},
			};
		case 'SET_TEMPLATE_LIBRARY':
			return { ...state, ui: { ...state.ui, templateLibraryOpen: action.open } };
		case 'SET_NODE_DOC':
			return {
				...state,
				ui: {
					...state.ui,
					nodeDocOpen: action.open,
					nodeDocNodeId: action.nodeId ?? state.ui.nodeDocNodeId,
				},
			};
		case 'SET_NODE_EXPANDED':
			return {
				...state,
				ui: {
					...state.ui,
					nodeExpandedOpen: action.open,
					nodeExpandedId: action.nodeId ?? state.ui.nodeExpandedId,
				},
			};
		case 'SET_DIFF_VIEWER':
			return { ...state, ui: { ...state.ui, diffViewerOpen: action.open } };
		case 'SET_STEP_MODE':
			return {
				...state,
				ui: { ...state.ui, stepMode: action.enabled, waitingForStep: false },
			};
		case 'STEP_NEXT':
			return { ...state, ui: { ...state.ui, waitingForStep: false } };
		case 'SET_LINK_CREDENTIALS_OPEN':
			return { ...state, ui: { ...state.ui, linkCredentialsOpen: action.open } };
		case 'CONFIGURE_NODE_FIELDS': {
			const next = withHistory(state);
			return {
				...next,
				nodes: next.nodes.map((node) =>
					node.id === action.id
						? {
								...node,
								data: {
									...node.data,
									definition: {
										...(node.data.definition ?? getNodeDefinition(node.data.defKey)!),
										fields: action.fields,
										outputs: action.fields.map((f) => ({
											id: f.key,
											name: f.label,
											type: f.kind === 'toggle' ? 'boolean' : f.kind === 'number' ? 'number' : 'string',
										})),
									},
								},
							}
						: node,
				),
			};
		}
		case 'PIN_NODE_OUTPUT':
			return {
				...state,
				nodes: state.nodes.map((node) =>
					node.id === action.id
						? {
								...node,
								data: {
									...node.data,
									pinned: true,
									pinnedOutput:
										action.output !== undefined
											? action.output
											: node.data.outputPreview,
								},
							}
						: node,
				),
			};
		case 'UNPIN_NODE':
			return {
				...state,
				nodes: state.nodes.map((node) =>
					node.id === action.id
						? { ...node, data: { ...node.data, pinned: false, pinnedOutput: undefined } }
						: node,
				),
			};
		case 'PUSH_RUN_HISTORY':
			return {
				...state,
				runHistory: [action.record, ...state.runHistory].slice(0, RUN_HISTORY_LIMIT),
			};
		case 'CLEAR_RUN_HISTORY':
			return { ...state, runHistory: [] };
		case 'SET_RUN_PANEL_TAB':
			return { ...state, ui: { ...state.ui, runPanelTab: action.tab } };
		default:
			return state;
	}
};
