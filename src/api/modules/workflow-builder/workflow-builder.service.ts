import { axiosClient } from '@/api/client';
import { unwrapKey } from '@/api/core';
import type { TApiResponse } from '@/api/core';
import type { TPaginatedResponse } from '@/types/api.type';
import type {
	TBuilderDraftVersion,
	TBuilderImprovement,
	TBuilderMessage,
	TBuilderNodeConfigProposal,
	TBuilderNodeSuggestion,
	TBuilderSession,
	TBuilderSessionListItem,
	TBuilderWorkflowExplanation,
	TConfigureBuilderNodeDto,
	TCreateBuilderSessionDto,
	TDryRunWorkflowDto,
	TListBuilderSessionsParams,
	TPromoteBuilderSessionDto,
	TRestoreBuilderVersionDto,
	TSendBuilderMessageDto,
	TSyncBuilderDraftDto,
	TTestWorkflowNodeDto,
	TUpdateBuilderSessionDto,
	TValidateWorkflowDto,
	TWorkflowDryRunResult,
	TWorkflowValidationResult,
} from '@/types/workflow-builder.type';
import type { TWorkflow, TReplaceGraphDto } from '@/types/workflow.type';
import type { TNodeRunDetail } from '@/types/run.type';
import {
	WorkflowBuilderEndpoints as E,
	WorkflowDiagnosticsEndpoints as D,
} from './workflow-builder.endpoints';

export const WorkflowBuilderSessionService = {
	/** Archived sessions are only listed when asked for by `status`. Items
	 *  leave out `draft_graph`. */
	list: (ws: string, params?: TListBuilderSessionsParams, signal?: AbortSignal) =>
		axiosClient
			.get<TApiResponse<{ sessions: TBuilderSessionListItem[] }>>(E.list(ws), {
				params: params && { ...params, mine: params.mine ? 1 : undefined },
				signal,
			})
			.then(unwrapKey<TBuilderSessionListItem[]>('sessions')),

	/** Includes the full message transcript. */
	detail: (ws: string, id: string, signal?: AbortSignal) =>
		axiosClient
			.get<TApiResponse<{ session: TBuilderSession }>>(E.detail(ws, id), { signal })
			.then(unwrapKey<TBuilderSession>('session')),

	/** With a `prompt`, `message` is the pending reply to that first message. */
	create: (ws: string, payload: TCreateBuilderSessionDto) =>
		axiosClient
			.post<
				TApiResponse<{ session: TBuilderSession; message: TBuilderMessage | null }>
			>(E.create(ws), payload)
			.then((res) => res.data.data),

	/** Rename, archive, or unarchive. */
	update: (ws: string, id: string, payload: TUpdateBuilderSessionDto) =>
		axiosClient
			.patch<TApiResponse<{ session: TBuilderSession }>>(E.update(ws, id), payload)
			.then(unwrapKey<TBuilderSession>('session')),

	remove: (ws: string, id: string) => axiosClient.delete(E.delete(ws, id)).then(() => undefined),

	/**
	 * Replace the draft with the canvas's copy. Rejected with 409 when
	 * `draft_lock_version` is behind — the assistant changed the draft since.
	 */
	syncDraft: (ws: string, id: string, payload: TSyncBuilderDraftDto) =>
		axiosClient
			.patch<TApiResponse<{ session: TBuilderSession }>>(E.syncDraft(ws, id), payload)
			.then(unwrapKey<TBuilderSession>('session')),

	/**
	 * Saves the draft graph as a real, workspace-visible workflow's draft.
	 * 409 when that workflow was edited outside the session since it loaded
	 * it (send `overwrite: true` to replace those edits), or while a reply is
	 * still being written.
	 */
	promote: (ws: string, id: string, payload?: TPromoteBuilderSessionDto) =>
		axiosClient
			.post<TApiResponse<{ workflow: TWorkflow }>>(E.promote(ws, id), payload)
			.then(unwrapKey<TWorkflow>('workflow')),
};

export const WorkflowBuilderMessageService = {
	list: (ws: string, sessionId: string, signal?: AbortSignal) =>
		axiosClient
			.get<
				TApiResponse<{ messages: TBuilderMessage[] }>
			>(E.messages(ws, sessionId), { signal })
			.then(unwrapKey<TBuilderMessage[]>('messages')),

	/**
	 * Returns (202) the pending assistant message. Its reply is written in the
	 * background — follow it on the session channel or poll `detail()`.
	 * 409 while a previous reply is still being written.
	 */
	send: (ws: string, sessionId: string, payload: TSendBuilderMessageDto) =>
		axiosClient
			.post<TApiResponse<{ message: TBuilderMessage }>>(E.messages(ws, sessionId), payload)
			.then(unwrapKey<TBuilderMessage>('message')),

	detail: (ws: string, sessionId: string, messageId: string, signal?: AbortSignal) =>
		axiosClient
			.get<
				TApiResponse<{ message: TBuilderMessage }>
			>(E.message(ws, sessionId, messageId), { signal })
			.then(unwrapKey<TBuilderMessage>('message')),
};

/** Undo history — one labelled snapshot per edit, newest first. */
export const WorkflowBuilderVersionService = {
	list: (ws: string, sessionId: string, signal?: AbortSignal) =>
		axiosClient
			.get<TPaginatedResponse<TBuilderDraftVersion>>(E.versions(ws, sessionId), {
				params: { per_page: 50 },
				signal,
			})
			.then((res) => res.data.data),

	/** 409 when `draft_lock_version` is behind — the draft changed since. */
	restore: (
		ws: string,
		sessionId: string,
		versionId: string,
		payload?: TRestoreBuilderVersionDto,
	) =>
		axiosClient
			.post<
				TApiResponse<{ session: TBuilderSession }>
			>(E.restoreVersion(ws, sessionId, versionId), payload)
			.then(unwrapKey<TBuilderSession>('session')),
};

/** One-shot helpers over a session's draft. None of them change it. */
export const WorkflowBuilderAssistService = {
	suggestNodes: (ws: string, sessionId: string, note?: string) =>
		axiosClient
			.post<TApiResponse<{ suggestions: TBuilderNodeSuggestion[] }>>(
				E.assist(ws, sessionId, 'suggest-nodes'),
				{
					note: note || undefined,
				},
			)
			.then(unwrapKey<TBuilderNodeSuggestion[]>('suggestions')),

	configureNode: (ws: string, sessionId: string, payload: TConfigureBuilderNodeDto) =>
		axiosClient
			.post<
				TApiResponse<{ proposal: TBuilderNodeConfigProposal }>
			>(E.assist(ws, sessionId, 'configure-node'), payload)
			.then(unwrapKey<TBuilderNodeConfigProposal>('proposal')),

	explain: (ws: string, sessionId: string) =>
		axiosClient
			.post<
				TApiResponse<{ explanation: TBuilderWorkflowExplanation }>
			>(E.assist(ws, sessionId, 'explain'))
			.then(unwrapKey<TBuilderWorkflowExplanation>('explanation')),

	suggestImprovements: (ws: string, sessionId: string) =>
		axiosClient
			.post<
				TApiResponse<{ improvements: TBuilderImprovement[] }>
			>(E.assist(ws, sessionId, 'suggest-improvements'))
			.then(unwrapKey<TBuilderImprovement[]>('improvements')),
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
			.post<
				TApiResponse<{ node_run: TNodeRunDetail }>
			>(D.testNode(ws, workflowId, nodeId), payload)
			.then(unwrapKey<TNodeRunDetail>('node_run')),

	/** Editor autosave — replaces the draft graph wholesale, not a partial
	 *  patch. */
	replaceGraph: (ws: string, workflowId: string, payload: TReplaceGraphDto) =>
		axiosClient
			.put<TApiResponse<{ workflow: TWorkflow }>>(D.replaceGraph(ws, workflowId), payload)
			.then(unwrapKey<TWorkflow>('workflow')),
};
