import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type {
	TCreateBuilderSessionDto,
	TSendBuilderMessageDto,
	TPromoteBuilderSessionDto,
	TValidateWorkflowDto,
	TDryRunWorkflowDto,
	TTestWorkflowNodeDto,
} from '@/types/workflow-builder.type';
import type { TReplaceGraphDto } from '@/types/workflow.type';
import {
	WorkflowBuilderSessionService,
	WorkflowBuilderMessageService,
	WorkflowDiagnosticsService,
} from './workflow-builder.service';
import { builderSessionKeys } from './workflow-builder.keys';
import { workflowKeys } from '../workflows/workflows.keys';

export const useWorkflowBuilderSessions = (ws: string) =>
	useQuery({
		queryKey: builderSessionKeys.list(ws),
		queryFn: ({ signal }) => WorkflowBuilderSessionService.list(ws, signal),
		enabled: !!ws,
	});

export const useWorkflowBuilderSession = (ws: string, id: string) =>
	useQuery({
		queryKey: builderSessionKeys.detail(ws, id),
		queryFn: ({ signal }) => WorkflowBuilderSessionService.detail(ws, id, signal),
		enabled: !!ws && !!id,
	});

export const useCreateWorkflowBuilderSession = (ws: string) => {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (payload: TCreateBuilderSessionDto) => WorkflowBuilderSessionService.create(ws, payload),
		onSuccess: () => qc.invalidateQueries({ queryKey: builderSessionKeys.lists(ws) }),
		meta: { errorMessage: 'Failed to create session' },
	});
};

export const useDeleteWorkflowBuilderSession = (ws: string) => {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (id: string) => WorkflowBuilderSessionService.remove(ws, id),
		onSuccess: () => qc.invalidateQueries({ queryKey: builderSessionKeys.lists(ws) }),
		meta: { errorMessage: 'Failed to delete session' },
	});
};

export const usePromoteWorkflowBuilderSession = (ws: string, id: string) => {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (payload?: TPromoteBuilderSessionDto) =>
			WorkflowBuilderSessionService.promote(ws, id, payload),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: builderSessionKeys.detail(ws, id) });
			qc.invalidateQueries({ queryKey: workflowKeys.lists(ws) });
		},
		meta: { errorMessage: 'Failed to publish workflow' },
	});
};

export const useSendWorkflowBuilderMessage = (ws: string, sessionId: string) => {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (payload: TSendBuilderMessageDto) =>
			WorkflowBuilderMessageService.send(ws, sessionId, payload),
		onSuccess: () => qc.invalidateQueries({ queryKey: builderSessionKeys.detail(ws, sessionId) }),
		meta: { errorMessage: 'Failed to send message' },
	});
};

// ─── Diagnostics ───────────────────────────────────────────────

export const useValidateWorkflow = (ws: string, workflowId: string) =>
	useMutation({
		mutationFn: (payload?: TValidateWorkflowDto) =>
			WorkflowDiagnosticsService.validate(ws, workflowId, payload),
		meta: { errorMessage: 'Failed to validate workflow' },
	});

export const useDryRunWorkflow = (ws: string, workflowId: string) =>
	useMutation({
		mutationFn: (payload?: TDryRunWorkflowDto) =>
			WorkflowDiagnosticsService.dryRun(ws, workflowId, payload),
		meta: { errorMessage: 'Dry run failed' },
	});

export const useTestWorkflowNode = (ws: string, workflowId: string) =>
	useMutation({
		mutationFn: ({ nodeId, body }: { nodeId: string; body?: TTestWorkflowNodeDto }) =>
			WorkflowDiagnosticsService.testNode(ws, workflowId, nodeId, body),
		meta: { errorMessage: 'Failed to test node' },
	});

export const useReplaceWorkflowGraph = (ws: string, workflowId: string) => {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (payload: TReplaceGraphDto) =>
			WorkflowDiagnosticsService.replaceGraph(ws, workflowId, payload),
		onSuccess: () => qc.invalidateQueries({ queryKey: workflowKeys.detail(ws, workflowId) }),
		meta: { errorMessage: 'Failed to save workflow graph' },
	});
};
