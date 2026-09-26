import type {
	TReplaceGraphDto,
	TWorkflow,
	TWorkflowEdge,
	TWorkflowNode,
} from '@/types/workflow.type';
import type { TWorkflowVersion } from '@/types/workflow-extras.type';
import { builderEdgeToCanvas, builderNodeToCanvas } from './builderDraft.helper';
import type { TCanvasEdge, TCanvasNode } from '../_types/canvas.type';
import type { TExportedWorkflow } from '../_types/workflow-editor.type';

/**
 * The backend stores the draft graph as `nodes` ({ key, type, config, position })
 * and `edges` ({ from, to, condition }) keyed by node `key` — see
 * `Workflow::replaceGraph()`. The canvas node id doubles as that key.
 *
 * Edges carry no port handles on the backend: `condition` is a branch value
 * (`null` = always, `'error'` = on failure), not a port name, so canvas edges
 * are saved unconditional and reload on each node's default handles.
 */
export const buildGraphPayload = (
	nodes: TCanvasNode[],
	edges: TCanvasEdge[],
): TReplaceGraphDto => ({
	nodes: nodes.map((node) => ({
		key: node.id,
		type: node.data.defKey,
		config: node.data.values ?? {},
		position: { x: node.position.x, y: node.position.y },
	})),
	edges: edges.map((edge) => ({
		from: edge.source,
		to: edge.target,
		condition: null,
	})),
});

const draftNodeToCanvas = (node: TWorkflowNode): TCanvasNode => {
	const canvasNode = builderNodeToCanvas({
		id: node.key,
		type: node.type,
		name: '',
		config: node.config ?? {},
		position: node.position ?? { x: 120, y: 120 },
	});
	// Pins live on the node row and survive a graph save (`replaceGraph` carries
	// them over by key), so they come back with the draft.
	if (node.pinned_data === null || node.pinned_data === undefined) return canvasNode;
	return { ...canvasNode, data: { ...canvasNode.data, pinned: true, pinnedOutput: node.pinned_data } };
};

/** Pinned data has to be a JSON object or array on the backend — a scalar
 *  output (only the local simulation produces those) is wrapped. */
export const toPinPayload = (output: unknown): Record<string, unknown> | unknown[] =>
	output !== null && typeof output === 'object'
		? (output as Record<string, unknown> | unknown[])
		: { value: output ?? null };

const draftEdgesToCanvas = (nodes: TWorkflowNode[], edges: TWorkflowEdge[]): TCanvasEdge[] => {
	// Edges point at node row ids; the canvas addresses nodes by key.
	const keyById = new Map(nodes.map((node) => [String(node.id), node.key]));
	return edges.flatMap((edge, index) => {
		const source = keyById.get(String(edge.from_node_id));
		const target = keyById.get(String(edge.to_node_id));
		return source && target ? [builderEdgeToCanvas({ source, target }, index)] : [];
	});
};

/** The editor always opens the live draft (`show` loads its nodes/edges);
 *  `version` only supplies the published-version badge. */
export const versionToExportedWorkflow = (
	workflow: TWorkflow,
	version: TWorkflowVersion | undefined,
	workspaceId: string,
): TExportedWorkflow => {
	const draftNodes = workflow.nodes ?? [];

	return {
		workflow: {
			id: workflow.id,
			apiId: workflow.id,
			workspaceId,
			currentVersionId: version?.id ?? workflow.current_version_id ?? null,
			currentVersionNumber: version?.version,
			name: workflow.name,
			description: workflow.description ?? undefined,
			folder: workflow.folder_id ?? 'Workflow',
			updatedAt: Date.now(),
			savingState: 'saved',
		},
		nodes: draftNodes.map(draftNodeToCanvas),
		edges: draftEdgesToCanvas(draftNodes, workflow.edges ?? []),
	};
};
