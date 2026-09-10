import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { TUpdateWorkflowInterfaceDto, TSubmitWorkflowInterfaceDto } from '@/types/workflow-extras.type';
import { WorkflowInterfaceService } from './workflow-interface.service';

const keys = {
	detail: (ws: string, workflowId: string) => ['workflows', ws, workflowId, 'interface'] as const,
};

export const useWorkflowInterface = (ws: string, workflowId: string) =>
	useQuery({
		queryKey: keys.detail(ws, workflowId),
		queryFn: ({ signal }) => WorkflowInterfaceService.show(ws, workflowId, signal),
		enabled: !!ws && !!workflowId,
	});

export const useUpdateWorkflowInterface = (ws: string, workflowId: string) => {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (payload: TUpdateWorkflowInterfaceDto) =>
			WorkflowInterfaceService.update(ws, workflowId, payload),
		onSuccess: () => qc.invalidateQueries({ queryKey: keys.detail(ws, workflowId) }),
		meta: { errorMessage: 'Failed to update workflow interface' },
	});
};

export const useSubmitWorkflowInterface = (ws: string, workflowId: string) =>
	useMutation({
		mutationFn: (payload?: TSubmitWorkflowInterfaceDto) =>
			WorkflowInterfaceService.submit(ws, workflowId, payload),
		meta: { errorMessage: 'Failed to start run' },
	});
