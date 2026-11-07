import dagre from '@dagrejs/dagre';
import type { TCanvasPosition } from '../_types/canvas.type';

type TLayoutNode = {
	id: string;
	type?: string;
	position: TCanvasPosition;
	measured?: { width?: number; height?: number };
};

export type TLayoutEdge = {
	source: string;
	target: string;
	sourceHandle?: string | null;
	condition?: string | null;
};

type TLayoutOptions<TNode> = {
	/** Output port ids in the order they sit on the node, left to right. */
	portOrder?: (node: TNode) => string[];
};

const FALLBACK_SIZE = { width: 320, height: 160 };

const conditionRank = (condition?: string | null) => {
	if (condition === 'true') return 0;
	if (condition === 'false') return 2;
	if (condition === 'error') return 3;
	return 1;
};

/**
 * Lays the graph out top to bottom, matching the handles: outputs on the
 * bottom edge, inputs on top. Uses each node's measured size so tall steps
 * don't overlap, and keeps a node's children in the order of the ports and
 * branches they hang off. Sticky notes stay where they were put.
 */
export const autoLayout = <TNode extends TLayoutNode>(
	nodes: TNode[],
	edges: TLayoutEdge[],
	{ portOrder }: TLayoutOptions<TNode> = {},
): TNode[] => {
	const placed = nodes.filter((node) => node.type !== 'note');
	if (!placed.length) return nodes;
	const byId = new Map(placed.map((node) => [node.id, node]));
	const flowEdges = edges.filter(
		(edge) => edge.source !== edge.target && byId.has(edge.source) && byId.has(edge.target),
	);

	const graph = new dagre.graphlib.Graph({ multigraph: true });
	graph.setGraph({ rankdir: 'TB', rankalign: 'top', nodesep: 56, ranksep: 96 });
	graph.setDefaultEdgeLabel(() => ({}));
	placed.forEach((node) =>
		graph.setNode(node.id, {
			width: node.measured?.width ?? FALLBACK_SIZE.width,
			height: node.measured?.height ?? FALLBACK_SIZE.height,
		}),
	);
	flowEdges.forEach((edge, index) => graph.setEdge(edge.source, edge.target, {}, String(index)));

	const constraints: { left: string; right: string }[] = [];
	placed.forEach((node) => {
		const ports = portOrder?.(node) ?? [];
		const portIndex = (handle?: string | null) => {
			const index = handle ? ports.indexOf(handle) : -1;
			return index === -1 ? ports.length : index;
		};
		const children = flowEdges
			.filter((edge) => edge.source === node.id)
			.sort(
				(a, b) =>
					portIndex(a.sourceHandle) - portIndex(b.sourceHandle) ||
					conditionRank(a.condition) - conditionRank(b.condition),
			)
			.map((edge) => edge.target)
			.filter((target, index, all) => all.indexOf(target) === index);
		for (let index = 1; index < children.length; index++) {
			constraints.push({ left: children[index - 1], right: children[index] });
		}
	});

	dagre.layout(graph, { constraints });

	const origin = placed.reduce(
		(min, node) => ({
			x: Math.min(min.x, node.position.x),
			y: Math.min(min.y, node.position.y),
		}),
		{ x: Infinity, y: Infinity },
	);
	const positions = new Map(
		placed.map((node) => {
			const { x, y, width, height } = graph.node(node.id);
			return [node.id, { x: (x ?? 0) - width / 2, y: (y ?? 0) - height / 2 }];
		}),
	);
	const laidOut = [...positions.values()];
	const offset = {
		x: origin.x - Math.min(...laidOut.map((position) => position.x)),
		y: origin.y - Math.min(...laidOut.map((position) => position.y)),
	};

	return nodes.map((node) => {
		const position = positions.get(node.id);
		return position
			? { ...node, position: { x: position.x + offset.x, y: position.y + offset.y } }
			: node;
	});
};

/**
 * Gives nodes without a stored position one: versions published before the
 * canvas was recorded have none. A node still on the canvas (`known`) goes
 * where it is now; if any isn't, the whole graph is laid out instead so
 * nothing overlaps.
 */
export const placeUnpositioned = <TNode extends { id: string; position: TCanvasPosition }>(
	nodes: TNode[],
	edges: TLayoutEdge[],
	isPositioned: (node: TNode) => boolean,
	known: Map<string, TCanvasPosition>,
): TNode[] => {
	if (nodes.every(isPositioned)) return nodes;
	if (nodes.some((node) => !isPositioned(node) && !known.has(node.id))) {
		return autoLayout(nodes, edges);
	}
	return nodes.map((node) =>
		isPositioned(node) ? node : { ...node, position: known.get(node.id)! },
	);
};
