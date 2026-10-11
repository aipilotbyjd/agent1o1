import type { TCanvasPosition } from '../_types/canvas.type';

export const autoLayout = <TNode extends { id: string; position: TCanvasPosition }>(
	nodes: TNode[],
	edges: { source: string; target: string }[],
	direction: 'horizontal' | 'vertical' = 'horizontal',
): TNode[] => {
	const indegree = new Map(nodes.map((node) => [node.id, 0]));
	edges.forEach((edge) => indegree.set(edge.target, (indegree.get(edge.target) ?? 0) + 1));

	const columns = new Map<string, number>();
	const queue = nodes.filter((node) => (indegree.get(node.id) ?? 0) === 0).map((node) => node.id);
	queue.forEach((id) => columns.set(id, 0));

	while (queue.length) {
		const id = queue.shift();
		if (!id) continue;
		const nextColumn = (columns.get(id) ?? 0) + 1;
		edges
			.filter((edge) => edge.source === id)
			.forEach((edge) => {
				columns.set(edge.target, Math.max(columns.get(edge.target) ?? 0, nextColumn));
				indegree.set(edge.target, (indegree.get(edge.target) ?? 1) - 1);
				if (indegree.get(edge.target) === 0) queue.push(edge.target);
			});
	}

	const rowsByColumn = new Map<number, number>();
	return nodes.map((node, index) => {
		const column = columns.get(node.id) ?? index;
		const row = rowsByColumn.get(column) ?? 0;
		rowsByColumn.set(column, row + 1);
		return {
			...node,
			position:
				direction === 'vertical'
					? { x: 80 + row * 280, y: 90 + column * 170 }
					: { x: 80 + column * 280, y: 90 + row * 150 },
		};
	});
};

/**
 * Gives nodes without a stored position one — versions published before the
 * canvas was recorded have none. A node still on the canvas (`known`) goes
 * where it is now; if any isn't, the whole graph is laid out instead so
 * nothing overlaps.
 */
export const placeUnpositioned = <TNode extends { id: string; position: TCanvasPosition }>(
	nodes: TNode[],
	edges: { source: string; target: string }[],
	isPositioned: (node: TNode) => boolean,
	known: Map<string, TCanvasPosition>,
): TNode[] => {
	if (nodes.every(isPositioned)) return nodes;
	if (nodes.some((node) => !isPositioned(node) && !known.has(node.id))) {
		return autoLayout(nodes, edges, 'vertical');
	}
	return nodes.map((node) =>
		isPositioned(node) ? node : { ...node, position: known.get(node.id)! },
	);
};
