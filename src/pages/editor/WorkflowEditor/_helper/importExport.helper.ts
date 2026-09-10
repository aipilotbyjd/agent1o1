import type { TExportedWorkflow, TWorkflowEditorState } from '../_types/workflow-editor.type';

export const exportWorkflow = (state: TWorkflowEditorState): string =>
	JSON.stringify(
		{
			workflow: state.workflow,
			nodes: state.nodes,
			edges: state.edges,
		} satisfies TExportedWorkflow,
		null,
		2,
	);

export const parseWorkflowImport = (raw: string): TExportedWorkflow => {
	const parsed = JSON.parse(raw) as Partial<TExportedWorkflow>;
	if (!parsed.workflow || !Array.isArray(parsed.nodes) || !Array.isArray(parsed.edges)) {
		throw new Error('Invalid workflow JSON.');
	}

	const validNodes = parsed.nodes.every(
		(node) =>
			typeof node === 'object' &&
			node !== null &&
			'id' in node &&
			'type' in node &&
			'position' in node &&
			'data' in node &&
			typeof (node as { id: unknown }).id === 'string' &&
			typeof (node as { type: unknown }).type === 'string' &&
			typeof (node as { position: { x?: unknown; y?: unknown } }).position?.x === 'number' &&
			typeof (node as { position: { x?: unknown; y?: unknown } }).position?.y === 'number' &&
			typeof (node as { data: unknown }).data === 'object' &&
			(node as { data: unknown }).data !== null,
	);

	const validEdges = parsed.edges.every(
		(edge) =>
			typeof edge === 'object' &&
			edge !== null &&
			'id' in edge &&
			'source' in edge &&
			'target' in edge &&
			typeof (edge as { id: unknown }).id === 'string' &&
			typeof (edge as { source: unknown }).source === 'string' &&
			typeof (edge as { target: unknown }).target === 'string',
	);

	if (!validNodes || !validEdges) {
		throw new Error('Invalid workflow JSON.');
	}
	return parsed as TExportedWorkflow;
};
