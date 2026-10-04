import type {
	TBuilderGraph,
	TBuilderGraphEdge,
	TBuilderGraphNode,
} from '@/types/workflow-builder.type';
import { getNodeDefinition } from './nodeCatalog.constants';
import type { TCanvasEdge, TCanvasNode, TCanvasPosition } from '../_types/canvas.type';

/**
 * Converts between the backend's graph shape — nodes `{ key, type, config,
 * position }`, edges `{ from, to, condition }` — and React Flow canvas
 * nodes/edges. Used for a saved workflow's draft (`workflowApiTransform`) and
 * for an AI builder session's `draft_graph`, which share that shape.
 *
 * The canvas node id doubles as the backend `key`. An edge's `condition`
 * lives in `edge.data.condition` so branches survive a round trip.
 */

const COLUMN_GAP = 300;
const ROW_GAP = 140;
const DEFAULT_POSITION: TCanvasPosition = { x: 120, y: 120 };

const canvasTypeFor = (defKey: string): TCanvasNode['type'] => {
	const def = getNodeDefinition(defKey);
	if (def?.category === 'input') return 'input';
	if (def?.category === 'trigger') return 'trigger';
	if (def?.category === 'output') return 'output';
	if (def?.category === 'note') return 'note';
	return 'base';
};

export const isNoteNode = (node: TCanvasNode) => node.type === 'note';

export const graphNodeToCanvas = (
	node: TBuilderGraphNode,
	position: TCanvasPosition = node.position ?? DEFAULT_POSITION,
	label?: string,
): TCanvasNode => {
	const def = getNodeDefinition(node.type);

	return {
		id: node.key,
		type: canvasTypeFor(node.type),
		position,
		data: {
			defKey: node.type,
			label: label || def?.label || node.type,
			definition: def,
			values: node.config ?? {},
			status: 'idle',
		},
	} as TCanvasNode;
};

/** Edge label/colour for a branch: `error` edges read as the failure path. */
export const conditionEdgeData = (condition: string | null | undefined): Record<string, unknown> =>
	condition
		? {
				condition,
				label: condition === 'error' ? 'on error' : condition,
				labelColor: condition === 'error' ? '#f43f5e' : undefined,
			}
		: {};

export const graphEdgeToCanvas = (edge: TBuilderGraphEdge, index: number): TCanvasEdge =>
	({
		id: `edge_${edge.from}_${edge.to}_${index}`,
		source: edge.from,
		target: edge.to,
		type: 'workflow',
		data: conditionEdgeData(edge.condition),
		...(edge.condition === 'error' ? { style: { stroke: '#f43f5e' } } : {}),
	}) as TCanvasEdge;

/** A canvas edge's branch condition — `null` for an ordinary connection. */
export const edgeCondition = (edge: TCanvasEdge): string | null => {
	const condition = edge.data?.condition;
	return typeof condition === 'string' && condition !== '' ? condition : null;
};

/**
 * Gives every node without a position one: the assistant adds nodes without
 * coordinates. A node already on the canvas keeps where the user put it; a
 * new one goes one column right of the node feeding it (stacked below any
 * siblings already there), or to the right of everything if nothing feeds it.
 */
const positionNodes = (
	graph: TBuilderGraph,
	currentPositions: Map<string, TCanvasPosition>,
): Map<string, TCanvasPosition> => {
	const positions = new Map<string, TCanvasPosition>();

	graph.nodes.forEach((node) => {
		const known = currentPositions.get(node.key) ?? node.position ?? null;
		if (known) positions.set(node.key, known);
	});

	const occupied = (candidate: TCanvasPosition) =>
		[...positions.values()].some(
			(p) => Math.abs(p.x - candidate.x) < COLUMN_GAP / 2 && Math.abs(p.y - candidate.y) < ROW_GAP / 2,
		);

	const freeSlotBelow = (start: TCanvasPosition) => {
		const slot = { ...start };
		while (occupied(slot)) slot.y += ROW_GAP;
		return slot;
	};

	// Nodes are placed after the node that feeds them, so a chain lays out
	// left to right; a few passes cover graphs listed out of order.
	for (let pass = 0; pass < graph.nodes.length && positions.size < graph.nodes.length; pass++) {
		graph.nodes.forEach((node) => {
			if (positions.has(node.key)) return;
			const feeder = graph.edges.find((edge) => edge.to === node.key && positions.has(edge.from));
			if (!feeder) return;
			const from = positions.get(feeder.from)!;
			positions.set(node.key, freeSlotBelow({ x: from.x + COLUMN_GAP, y: from.y }));
		});
	}

	graph.nodes.forEach((node) => {
		if (positions.has(node.key)) return;
		const rightmost = Math.max(
			DEFAULT_POSITION.x - COLUMN_GAP,
			...[...positions.values()].map((p) => p.x),
		);
		positions.set(node.key, freeSlotBelow({ x: rightmost + COLUMN_GAP, y: DEFAULT_POSITION.y }));
	});

	return positions;
};

/**
 * A builder session's draft as canvas nodes/edges. Nodes already on the
 * canvas keep their position, label and canvas-only state (pins, colour);
 * sticky notes — which the backend has no node type for, so never reach the
 * draft — are carried over untouched.
 */
export const builderGraphToCanvas = (
	graph: TBuilderGraph,
	currentNodes: TCanvasNode[] = [],
): { nodes: TCanvasNode[]; edges: TCanvasEdge[] } => {
	const currentById = new Map(currentNodes.map((node) => [node.id, node]));
	const positions = positionNodes(
		graph,
		new Map(currentNodes.map((node) => [node.id, node.position])),
	);

	const nodes = graph.nodes.map((node) => {
		const existing = currentById.get(node.key);
		const position = positions.get(node.key);

		return existing && existing.data.defKey === node.type
			? { ...existing, position: position ?? existing.position, data: { ...existing.data, values: node.config ?? {} } }
			: graphNodeToCanvas(node, position);
	});

	return {
		nodes: [...nodes, ...currentNodes.filter(isNoteNode)],
		edges: graph.edges.map(graphEdgeToCanvas),
	};
};

/**
 * The canvas as a builder session's `draft_graph`. Sticky notes are left
 * out — the backend has no node type for them and would reject the sync.
 */
export const canvasToBuilderGraph = (nodes: TCanvasNode[], edges: TCanvasEdge[]): TBuilderGraph => {
	const realNodes = nodes.filter((node) => !isNoteNode(node));
	const realIds = new Set(realNodes.map((node) => node.id));

	return {
		nodes: realNodes.map((node) => ({
			key: node.id,
			type: node.data.defKey,
			config: node.data.values ?? {},
			position: { x: Math.round(node.position.x), y: Math.round(node.position.y) },
		})),
		edges: edges
			.filter((edge) => realIds.has(edge.source) && realIds.has(edge.target))
			.map((edge) => ({ from: edge.source, to: edge.target, condition: edgeCondition(edge) })),
	};
};
