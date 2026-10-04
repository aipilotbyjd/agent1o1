import { WorkflowDiagnosticsService } from '@/api/modules/workflow-builder';
import { WorkflowService } from '@/api/modules/workflows';
import type { TCanvasEdge, TCanvasNode } from '../_types/canvas.type';
import { buildGraphPayload } from './workflowApiTransform.helper';

type Draft = {
	workspaceId: string;
	workflowId: string;
	name: string;
	description?: string | null;
	nodes: TCanvasNode[];
	edges: TCanvasEdge[];
};

// Autosave, Save, and Run can overlap. Serialize writes for each workflow so an
// older autosave cannot finish last and replace a newer graph.
const pendingWrites = new Map<string, Promise<unknown>>();

export const persistWorkflowDraft = (draft: Draft) => {
	const key = `${draft.workspaceId}:${draft.workflowId}`;
	const previous = pendingWrites.get(key) ?? Promise.resolve();
	const write = previous
		.catch(() => undefined)
		.then(async () => {
			await WorkflowService.update(draft.workspaceId, draft.workflowId, {
				name: draft.name,
				description: draft.description,
			});
			return WorkflowDiagnosticsService.replaceGraph(
				draft.workspaceId,
				draft.workflowId,
				buildGraphPayload(draft.nodes, draft.edges),
			);
		});
	pendingWrites.set(key, write);
	void write
		.finally(() => {
			if (pendingWrites.get(key) === write) pendingWrites.delete(key);
		})
		.catch(() => undefined);
	return write;
};
