import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type {
	TConfigureBuilderNodeDto,
	TCreateBuilderSessionDto,
	TDryRunWorkflowDto,
	TPromoteBuilderSessionDto,
	TSendBuilderMessageDto,
	TTestWorkflowNodeDto,
	TUpdateBuilderSessionDto,
	TValidateWorkflowDto,
	TBuilderSessionStatus,
} from '@/types/workflow-builder.type';
import type { TReplaceGraphDto } from '@/types/workflow.type';
import {
	WorkflowBuilderSessionService,
	WorkflowBuilderMessageService,
	WorkflowBuilderVersionService,
	WorkflowBuilderAssistService,
	WorkflowDiagnosticsService,
} from './workflow-builder.service';
import { builderSessionKeys } from './workflow-builder.keys';
import { workflowKeys } from '../workflows/workflows.keys';

export const useWorkflowBuilderSessions = (ws: string, status?: TBuilderSessionStatus) =>
	useQuery({
		queryKey: builderSessionKeys.list(ws, status),
		queryFn: ({ signal }) => WorkflowBuilderSessionService.list(ws, status ? { status } : undefined, signal),
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

export const useUpdateWorkflowBuilderSession = (ws: string) => {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: ({ id, payload }: { id: string; payload: TUpdateBuilderSessionDto }) =>
			WorkflowBuilderSessionService.update(ws, id, payload),
		onSuccess: (session) => {
			qc.invalidateQueries({ queryKey: builderSessionKeys.lists(ws) });
			qc.setQueryData(builderSessionKeys.detail(ws, session.id), session);
		},
		meta: { errorMessage: 'Failed to update chat' },
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

export const usePromoteWorkflowBuilderSession = (ws: string) => {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: ({ id, payload }: { id: string; payload?: TPromoteBuilderSessionDto }) =>
			WorkflowBuilderSessionService.promote(ws, id, payload),
		onSuccess: (workflow) => {
			qc.invalidateQueries({ queryKey: builderSessionKeys.all(ws) });
			qc.invalidateQueries({ queryKey: workflowKeys.lists(ws) });
			qc.setQueryData(workflowKeys.detail(ws, String(workflow.id)), workflow);
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

// ─── Undo history ──────────────────────────────────────────────

export const useWorkflowBuilderVersions = (ws: string, sessionId: string, enabled = true) =>
	useQuery({
		queryKey: builderSessionKeys.versions(ws, sessionId),
		queryFn: ({ signal }) => WorkflowBuilderVersionService.list(ws, sessionId, signal),
		enabled: enabled && !!ws && !!sessionId,
	});

export const useRestoreWorkflowBuilderVersion = (ws: string, sessionId: string) => {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (versionId: string) => WorkflowBuilderVersionService.restore(ws, sessionId, versionId),
		onSuccess: (session) => {
			qc.setQueryData(builderSessionKeys.detail(ws, sessionId), session);
			qc.invalidateQueries({ queryKey: builderSessionKeys.versions(ws, sessionId) });
		},
		meta: { errorMessage: 'Failed to restore that version' },
	});
};

// ─── Assist ────────────────────────────────────────────────────

export const useSuggestBuilderNodes = (ws: string, sessionId: string) =>
	useMutation({
		mutationFn: (note?: string) => WorkflowBuilderAssistService.suggestNodes(ws, sessionId, note),
		meta: { errorMessage: 'Could not get suggestions' },
	});

export const useConfigureBuilderNode = (ws: string, sessionId: string) =>
	useMutation({
		mutationFn: (payload: TConfigureBuilderNodeDto) =>
			WorkflowBuilderAssistService.configureNode(ws, sessionId, payload),
		meta: { errorMessage: 'Could not configure that node' },
	});

export const useExplainBuilderWorkflow = (ws: string, sessionId: string) =>
	useMutation({
		mutationFn: () => WorkflowBuilderAssistService.explain(ws, sessionId),
		meta: { errorMessage: 'Could not explain this workflow' },
	});

export const useSuggestBuilderImprovements = (ws: string, sessionId: string) =>
	useMutation({
		mutationFn: () => WorkflowBuilderAssistService.suggestImprovements(ws, sessionId),
		meta: { errorMessage: 'Could not review this workflow' },
	});

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
