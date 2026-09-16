import type { IBuilderDraft, IBuilderEdge, IBuilderNode } from '@/types/workflowBuilder.type';
import { getNodeDefinition } from './nodeCatalog.constants';
import type { TCanvasEdge, TCanvasNode } from '../_types/canvas.type';

/**
 * Maps the AI workflow builder's draft (`nodes_draft` / `edges_draft`, as pushed
 * over the `builder.session.*` realtime channel) into the React Flow canvas
 * node/edge shapes the editor reducer understands.
 *
 * Backend node shape: { id, type, name, config, position }
 * Backend edge shape: { source, target, sourceHandle?, targetHandle? }
 */

const canvasTypeFor = (defKey: string): TCanvasNode['type'] => {
	const def = getNodeDefinition(defKey);
	if (def?.category === 'input') return 'input';
	if (def?.category === 'trigger') return 'trigger';
	if (def?.category === 'output') return 'output';
	if (def?.category === 'note') return 'note';
	return 'base';
};

export const builderNodeToCanvas = (node: IBuilderNode): TCanvasNode => {
	const def = getNodeDefinition(node.type);

	return {
		id: node.id,
		type: canvasTypeFor(node.type),
		position: node.position ?? { x: 120, y: 120 },
		data: {
			defKey: node.type,
			label: node.name || def?.label || node.type,
			definition: def,
			values: node.config ?? {},
			status: 'idle',
		},
	} as TCanvasNode;
};

export const builderEdgeToCanvas = (edge: IBuilderEdge, index: number): TCanvasEdge =>
	({
		id: `edge_${edge.source}_${edge.target}_${index}`,
		source: edge.source,
		target: edge.target,
		sourceHandle: edge.sourceHandle ?? undefined,
		targetHandle: edge.targetHandle ?? undefined,
		type: 'workflow',
	}) as TCanvasEdge;

export const builderDraftToCanvas = (
	draft: IBuilderDraft | null | undefined,
): { nodes: TCanvasNode[]; edges: TCanvasEdge[] } => ({
	nodes: (draft?.nodes ?? []).map(builderNodeToCanvas),
	edges: (draft?.edges ?? []).map(builderEdgeToCanvas),
});

/**
 * Reverse of the above — used to sync manual canvas edits (drag, delete, add
 * from the library, rename, etc.) back into the builder session's draft, so
 * the AI's tools see the current state instead of whatever it last wrote
 * itself. Sticky notes are excluded — they have no backend node type and
 * would fail the AI's node-type validation.
 */
export const canvasNodeToBuilder = (node: TCanvasNode): IBuilderNode => ({
	id: node.id,
	type: node.data.defKey,
	name: node.data.label || node.data.defKey,
	config: node.data.values ?? {},
	position: { x: node.position.x, y: node.position.y },
});

export const canvasEdgeToBuilder = (edge: TCanvasEdge): IBuilderEdge => ({
	source: edge.source,
	target: edge.target,
	sourceHandle: edge.sourceHandle ?? undefined,
	targetHandle: edge.targetHandle ?? undefined,
});

export const canvasToBuilderDraft = (
	nodes: TCanvasNode[],
	edges: TCanvasEdge[],
): IBuilderDraft => {
	const realNodes = nodes.filter((node) => node.type !== 'note');
	const realNodeIds = new Set(realNodes.map((node) => node.id));
	return {
		nodes: realNodes.map(canvasNodeToBuilder),
		edges: edges
			.filter((edge) => realNodeIds.has(edge.source) && realNodeIds.has(edge.target))
			.map(canvasEdgeToBuilder),
	};
};
