import type { TCanvasEdge, TCanvasNode } from '../_types/canvas.type';

export const getRunOrder = (nodes: TCanvasNode[], edges: TCanvasEdge[]): TCanvasNode[] => {
	const indegree = new Map(nodes.map((node) => [node.id, 0]));
	const byId = new Map(nodes.map((node) => [node.id, node]));

	edges.forEach((edge) => indegree.set(edge.target, (indegree.get(edge.target) ?? 0) + 1));
	const queue = nodes.filter((node) => (indegree.get(node.id) ?? 0) === 0).map((node) => node.id);
	const orderedIds: string[] = [];

	while (queue.length) {
		const id = queue.shift();
		if (!id) continue;
		orderedIds.push(id);
		edges
			.filter((edge) => edge.source === id)
			.forEach((edge) => {
				indegree.set(edge.target, (indegree.get(edge.target) ?? 1) - 1);
				if (indegree.get(edge.target) === 0) queue.push(edge.target);
			});
	}

	const unresolved = nodes.filter((node) => !orderedIds.includes(node.id));
	return [
		...orderedIds.map((id) => byId.get(id)).filter(Boolean),
		...unresolved,
	] as TCanvasNode[];
};
