import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createResource } from '@/api/core';
import type { TSyncWorkflowTagsDto, TPinWorkflowNodeDto } from '@/types/workflow.type';
import { WorkflowService } from './workflows.service';
import { workflowKeys } from './workflows.keys';

const Workflows = createResource({
	service: WorkflowService,
	keys: workflowKeys,
	label: { singular: 'Workflow', plural: 'Workflows' },
});

export const useWorkflows = Workflows.useList;
export const useWorkflow = Workflows.useDetail;
export const useCreateWorkflow = Workflows.useCreate;
export const useUpdateWorkflow = Workflows.useUpdate;
export const useDeleteWorkflow = Workflows.useDelete;

// ─── Custom actions — not CRUD, so hand-written alongside the factory ──

export const useDuplicateWorkflow = (ws: string) => {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (id: string) => WorkflowService.duplicate(ws, id),
		onSuccess: () => qc.invalidateQueries({ queryKey: workflowKeys.lists(ws) }),
		meta: { errorMessage: 'Failed to duplicate workflow' },
	});
};

export const useSyncWorkflowTags = (ws: string, id: string) => {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (payload: TSyncWorkflowTagsDto) => WorkflowService.syncTags(ws, id, payload),
		onSuccess: () => qc.invalidateQueries({ queryKey: workflowKeys.detail(ws, id) }),
		meta: { errorMessage: 'Failed to update workflow tags' },
	});
};

export const usePinWorkflowNode = (ws: string, id: string) => {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: ({ nodeId, body }: { nodeId: string; body: TPinWorkflowNodeDto }) =>
			WorkflowService.pinNode(ws, id, nodeId, body),
		onSuccess: () => qc.invalidateQueries({ queryKey: workflowKeys.detail(ws, id) }),
		meta: { errorMessage: 'Failed to pin node data' },
	});
};

export const useUnpinWorkflowNode = (ws: string, id: string) => {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (nodeId: string) => WorkflowService.unpinNode(ws, id, nodeId),
		onSuccess: () => qc.invalidateQueries({ queryKey: workflowKeys.detail(ws, id) }),
		meta: { errorMessage: 'Failed to unpin node data' },
	});
};
