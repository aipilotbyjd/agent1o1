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
import type { IBuilderSession, IBuilderNode, IBuilderEdge } from '@/types/workflowBuilder.type';
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

// ── Ported-frontend adapter ───────────────────────────────────────────────────
//
// The old frontend called one flat `WorkflowBuilderService`; this module splits
// the same endpoints across Session/Message/Diagnostics services. The adapter
// keeps the old names and call signatures so the ported `aiChat.store` needed no
// changes — same approach as the agent-builder adapters in `agents.hooks.ts`.
//
// Contract gap to settle in the backend-adaptation pass: old `createSession`
// posted the first `prompt` with the session, this backend's create takes only
// `title`/`workflow_id`, so the prompt has to be sent as a follow-up message.
const toBuilderSession = (s: TWorkflowBuilderSession): IBuilderSession => ({
	id: s.id,
	title: s.title ?? '',
	// This backend has no `completed`/`failed` session state; `promoted` is its
	// terminal one, which is what the old UI rendered as `completed`.
	status: s.status === 'promoted' ? 'completed' : s.status,
	workflow_id: s.workflow_id,
	nodes_draft: (s.draft_graph?.nodes ?? []) as IBuilderNode[],
	edges_draft: (s.draft_graph?.edges ?? []) as IBuilderEdge[],
	draft_lock_version: s.draft_lock_version,
	last_activity_at: s.last_activity_at,
	created_at: s.created_at,
});

export const WorkflowBuilderService = {
	createSession: (ws: string, body: { prompt?: string; workflow_id?: string }) =>
		WorkflowBuilderSessionService.create(ws, { workflow_id: body.workflow_id ?? null }).then(
			toBuilderSession,
		),

	sendMessage: (ws: string, sessionId: string, body: TSendBuilderMessageDto) =>
		WorkflowBuilderMessageService.send(ws, sessionId, body).then((m) => ({ message_id: m.id })),

	/**
	 * `messages` is deliberately left off. Old's `IBuilderMessage` carried a
	 * `processing_status`, and the ported bridge polls this endpoint until the
	 * message it just sent reaches a terminal one. This backend models no
	 * per-message status at all, so any value here would be invented — and a
	 * fabricated `completed` would make that poll resolve against the user's own
	 * message instead of the assistant's reply. Session hydration, which is what
	 * the editor actually needs on load, works without it; reworking the poll is
	 * the backend-adaptation pass's job.
	 */
	getSession: (ws: string, id: string, signal?: AbortSignal) =>
		WorkflowBuilderSessionService.detail(ws, id, signal).then(toBuilderSession),

	/**
	 * No counterpart: this backend has no endpoint that pushes the live canvas
	 * into a builder session (its sessions own their own `draft_graph`). The
	 * ported caller already treats this as best-effort and swallows failures, so
	 * it degrades exactly as that call site was written to expect.
	 */
	syncDraft: (_ws: string, _id: string, _body: unknown): Promise<never> =>
		Promise.reject(new Error('Syncing the canvas draft into a builder session is not supported')),
};
