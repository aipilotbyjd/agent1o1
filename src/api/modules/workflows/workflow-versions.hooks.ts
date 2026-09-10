import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { TPublishWorkflowDto } from '@/types/workflow.type';
import { WorkflowVersionService } from './workflow-versions.service';
import { workflowKeys } from './workflows.keys';

const keys = {
	list: (ws: string, workflowId: string) => ['workflows', ws, workflowId, 'versions'] as const,
	detail: (ws: string, workflowId: string, version: string) =>
		['workflows', ws, workflowId, 'versions', version] as const,
};

export const useWorkflowVersions = (ws: string, workflowId: string) =>
	useQuery({
		queryKey: keys.list(ws, workflowId),
		queryFn: ({ signal }) => WorkflowVersionService.list(ws, workflowId, signal),
		enabled: !!ws && !!workflowId,
	});

export const useWorkflowVersion = (ws: string, workflowId: string, version: string) =>
	useQuery({
		queryKey: keys.detail(ws, workflowId, version),
		queryFn: ({ signal }) => WorkflowVersionService.detail(ws, workflowId, version, signal),
		enabled: !!ws && !!workflowId && !!version,
	});

export const usePublishWorkflowVersion = (ws: string, workflowId: string) => {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (payload?: TPublishWorkflowDto) => WorkflowVersionService.publish(ws, workflowId, payload),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: keys.list(ws, workflowId) });
			qc.invalidateQueries({ queryKey: workflowKeys.detail(ws, workflowId) });
		},
		meta: { errorMessage: 'Failed to publish workflow' },
	});
};
