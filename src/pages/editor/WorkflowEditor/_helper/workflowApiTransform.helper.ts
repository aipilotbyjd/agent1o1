import type { IWorkflow, IWorkflowVersion, TStoreWorkflowVersionDto } from '@/types/workflow.type';
import { getNodeDefinition } from './nodeCatalog.constants';
import type { TCanvasNode } from '../_types/canvas.type';
import type { TExportedWorkflow, TWorkflowEditorState } from '../_types/workflow-editor.type';

type TApiCanvasNode = {
	id: string;
	type: string;
	position?: { x: number; y: number };
	data?: TCanvasNode['data'];
};

type TApiCanvasEdge = {
	id?: string;
	source: string;
	target: string;
	sourceHandle?: string;
	targetHandle?: string;
};

const canvasNodeTypeFor = (nodeType: string, data?: TCanvasNode['data']): TCanvasNode['type'] => {
	const def = getNodeDefinition(nodeType, data?.definition);
	if (def?.category === 'input') return 'input';
	if (def?.category === 'output') return 'output';
	if (def?.category === 'note') return 'note';
	return 'base';
};

export const buildVersionPayload = (
	state: TWorkflowEditorState,
	changeSummary = 'Updated workflow',
): TStoreWorkflowVersionDto => ({
	name: state.workflow.name,
	description: state.workflow.description ?? undefined,
	nodes: state.nodes.map((node) => ({
		id: node.id,
		type: node.data.defKey,
		position: node.position,
		data: node.data,
	})),
	edges: state.edges.map((edge) => ({
		id: edge.id,
		source: edge.source,
		target: edge.target,
		sourceHandle: edge.sourceHandle,
		targetHandle: edge.targetHandle,
	})),
	viewport: {},
	settings: {},
	change_summary: changeSummary,
});

export const versionToExportedWorkflow = (
	workflow: IWorkflow,
	version: IWorkflowVersion | undefined,
	workspaceId: string,
): TExportedWorkflow => {
	const apiNodes = (version?.nodes ?? []) as TApiCanvasNode[];
	const apiEdges = (version?.edges ?? []) as TApiCanvasEdge[];

	return {
		workflow: {
			id: workflow.id,
			apiId: workflow.id,
			workspaceId,
			currentVersionId: version?.id ?? workflow.current_version_id ?? null,
			currentVersionNumber: version?.version_number,
			name: version?.name ?? workflow.name,
			description: version?.description ?? workflow.description,
			folder: workflow.folder_id ?? 'Workflow',
			updatedAt: Date.now(),
			savingState: 'saved',
		},
		nodes: apiNodes.map((node) => {
			const data = node.data ?? {
				defKey: node.type,
				label: node.type,
				values: {},
				status: 'idle' as const,
			};

			return {
				id: node.id,
				type: canvasNodeTypeFor(data.defKey ?? node.type, data),
				position: node.position ?? { x: 120, y: 120 },
				data: {
					...data,
					defKey: data.defKey ?? node.type,
					status: data.status ?? 'idle',
					values: data.values ?? {},
				},
			};
		}),
		edges: apiEdges.map((edge, index) => ({
			id: edge.id ?? `edge_${index}`,
			source: edge.source,
			target: edge.target,
			sourceHandle: edge.sourceHandle,
			targetHandle: edge.targetHandle,
		})),
	};
};
