import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { TPublishWorkflowDto } from '@/types/workflow.type';
import { WorkflowVersionService } from './workflow-versions.service';
import { workflowKeys } from './workflows.keys';

export const workflowVersionKeys = {
	list: (ws: string, workflowId: string) => ['workflows', ws, workflowId, 'versions'] as const,
	detail: (ws: string, workflowId: string, version: string) =>
		['workflows', ws, workflowId, 'versions', version] as const,
};

export const useWorkflowVersions = (ws: string, workflowId: string) =>
	useQuery({
		queryKey: workflowVersionKeys.list(ws, workflowId),
		queryFn: ({ signal }) => WorkflowVersionService.list(ws, workflowId, signal),
		enabled: !!ws && !!workflowId,
	});

export const useWorkflowVersion = (ws: string, workflowId: string, version: string) =>
	useQuery({
		queryKey: workflowVersionKeys.detail(ws, workflowId, version),
		queryFn: ({ signal }) => WorkflowVersionService.detail(ws, workflowId, version, signal),
		enabled: !!ws && !!workflowId && !!version,
	});

export const usePublishWorkflowVersion = (ws: string, workflowId: string) => {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (payload?: TPublishWorkflowDto) =>
			WorkflowVersionService.publish(ws, workflowId, payload),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: workflowVersionKeys.list(ws, workflowId) });
			qc.invalidateQueries({ queryKey: workflowKeys.detail(ws, workflowId) });
		},
		// A refused publish (422) lists what to fix; the editor shows that itself.
		meta: { errorMessage: 'Failed to publish workflow', silentStatuses: [422] },
	});
};

export const useRestoreWorkflowVersion = (ws: string, workflowId: string) => {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (versionId: string) =>
			WorkflowVersionService.restore(ws, workflowId, versionId),
		onSuccess: (workflow) => {
			qc.setQueryData(workflowKeys.detail(ws, workflowId), workflow);
		},
		meta: { errorMessage: 'Could not restore this version', silentStatuses: [422] },
	});
};
