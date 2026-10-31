import { getOutputPorts } from './outputPorts.helper';
import { buildOutputToken } from './tokenDrag.helper';
import { getNodeDefinition } from './nodeCatalog.constants';
import { getNodeAccentColor } from '../_partial/library/library.util';
import type { TCanvasEdge, TCanvasNode } from '../_types/canvas.type';

export const WORKFLOW_INPUT_TYPE = 'workflow_input';
export const WORKFLOW_OUTPUT_TYPE = 'workflow_output';

export type TWorkflowVariable = {
	nodeId: string;
	nodeLabel: string;
	nodeColor: string;
	outputId: string;
	token: string;
};

export const collectUpstreamVariables = (
	nodeId: string,
	nodes: TCanvasNode[],
	edges: TCanvasEdge[],
): TWorkflowVariable[] => {
	const byId = new Map(nodes.map((node) => [node.id, node]));
	const visited = new Set<string>();
	const upstream: TCanvasNode[] = [];

	const visit = (id: string) => {
		edges
			.filter((edge) => edge.target === id)
			.forEach((edge) => {
				if (visited.has(edge.source)) return;
				visited.add(edge.source);
				const node = byId.get(edge.source);
				if (!node) return;
				upstream.push(node);
				visit(edge.source);
			});
	};

	visit(nodeId);

	// The engine hands every step the Input steps' values, connected or not.
	const inputs = nodes.filter(
		(node) =>
			node.data.defKey === WORKFLOW_INPUT_TYPE && node.id !== nodeId && !visited.has(node.id),
	);

	return [...inputs, ...upstream].flatMap((node) => {
		const def = getNodeDefinition(node.data.defKey, node.data.definition);
		const nodeColor = getNodeAccentColor(
			node.id,
			node.data.color as string | undefined,
			def?.colorHex,
		);
		return getOutputPorts(def, node.data).map((output) => ({
			nodeId: node.id,
			nodeLabel: node.data.label,
			nodeColor,
			outputId: output.id,
			// Id-based, stable reference the backend resolver understands
			// (`{{nodes.node_2.city}}`). The friendly label is display-only
			// (see nodeLabel) so renaming/duplicating a node never breaks tokens.
			token: buildOutputToken(node.id, output.path ?? output.name),
		}));
	});
};
