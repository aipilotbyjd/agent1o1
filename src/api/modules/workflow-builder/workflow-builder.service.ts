import { axiosClient } from '@/api/client';
import { unwrapKey } from '@/api/core';
import type { TApiResponse } from '@/api/core';
import type {
	TWorkflowBuilderSession,
	TCreateBuilderSessionDto,
	TWorkflowBuilderMessage,
	TSendBuilderMessageDto,
	TPromoteBuilderSessionDto,
	TValidateWorkflowDto,
	TDryRunWorkflowDto,
	TWorkflowValidationResult,
	TWorkflowDryRunResult,
	TTestWorkflowNodeDto,
} from '@/types/workflow-builder.type';
import type { TWorkflow, TReplaceGraphDto } from '@/types/workflow.type';
import type { TNodeRunDetail } from '@/types/run.type';
import { WorkflowBuilderEndpoints as E, WorkflowDiagnosticsEndpoints as D } from './workflow-builder.endpoints';

export const WorkflowBuilderSessionService = {
	list: (ws: string, signal?: AbortSignal) =>
		axiosClient
			.get<TApiResponse<{ sessions: TWorkflowBuilderSession[] }>>(E.list(ws), { signal })
			.then(unwrapKey<TWorkflowBuilderSession[]>('sessions')),

	// Eager-loads the message transcript — there is no separate messages
	// list endpoint.
	detail: (ws: string, id: string, signal?: AbortSignal) =>
		axiosClient
			.get<TApiResponse<{ session: TWorkflowBuilderSession }>>(E.detail(ws, id), { signal })
			.then(unwrapKey<TWorkflowBuilderSession>('session')),

	create: (ws: string, payload: TCreateBuilderSessionDto) =>
		axiosClient
			.post<TApiResponse<{ session: TWorkflowBuilderSession }>>(E.create(ws), payload)
			.then(unwrapKey<TWorkflowBuilderSession>('session')),

	remove: (ws: string, id: string) => axiosClient.delete(E.delete(ws, id)).then(() => undefined),

	/** Publishes the draft graph to a real, workspace-visible workflow. */
	promote: (ws: string, id: string, payload?: TPromoteBuilderSessionDto) =>
		axiosClient
			.post<TApiResponse<{ workflow: TWorkflow }>>(E.promote(ws, id), payload)
			.then(unwrapKey<TWorkflow>('workflow')),
};

export const WorkflowBuilderMessageService = {
	// Queues background processing on the session; re-fetch the session
	// (which eager-loads `messages`) to see the reply once it lands.
	send: (ws: string, sessionId: string, payload: TSendBuilderMessageDto) =>
		axiosClient
			.post<TApiResponse<{ message: TWorkflowBuilderMessage }>>(E.sendMessage(ws, sessionId), payload)
			.then(unwrapKey<TWorkflowBuilderMessage>('message')),
};

/** Pre-flight checks on an already-created `Workflow`, run against the same
 *  services the builder agent's own tools call. */
export const WorkflowDiagnosticsService = {
	validate: (ws: string, workflowId: string, payload?: TValidateWorkflowDto) =>
		axiosClient
			.post<TApiResponse<TWorkflowValidationResult>>(D.validate(ws, workflowId), payload)
			.then((r) => r.data.data),

	dryRun: (ws: string, workflowId: string, payload?: TDryRunWorkflowDto) =>
		axiosClient
			.post<TApiResponse<TWorkflowDryRunResult>>(D.dryRun(ws, workflowId), payload)
			.then((r) => r.data.data),

	testNode: (ws: string, workflowId: string, nodeId: string, payload?: TTestWorkflowNodeDto) =>
		axiosClient
			.post<TApiResponse<{ node_run: TNodeRunDetail }>>(D.testNode(ws, workflowId, nodeId), payload)
			.then(unwrapKey<TNodeRunDetail>('node_run')),

	/** Editor autosave — replaces the draft graph wholesale, not a partial
	 *  patch. */
	replaceGraph: (ws: string, workflowId: string, payload: TReplaceGraphDto) =>
		axiosClient
			.put<TApiResponse<{ workflow: TWorkflow }>>(D.replaceGraph(ws, workflowId), payload)
			.then(unwrapKey<TWorkflow>('workflow')),
};
