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

const draftNodeToCanvas = (node: TWorkflowNode): TCanvasNode =>
	builderNodeToCanvas({
		id: node.key,
		type: node.type,
		name: '',
		config: node.config ?? {},
		position: node.position ?? { x: 120, y: 120 },
	});

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
