import { axiosClient } from '@/api/client';
import { getAccessToken, unwrapKey } from '@/api/core';
import { apiConfig } from '@/api/core/config';
import type { TApiResponse, TPaginationMeta } from '@/api/core';
import type {
	TAgentAction,
	TAgentActionListParams,
	TAgentPlan,
	TAgentTrustSuggestion,
	TApproveAgentPlanDto,
	TDecideAgentActionsDto,
	TRejectAgentPlanDto,
	TUpdateWorkspaceAgentPolicyDto,
	TWorkspaceAgentPolicy,
} from '@/types/agent-action.type';
import type { TAgentSessionStreamEvent } from '@/types/agent.type';
import { readEventStream } from '@/api/modules/agents/agent-sessions.service';
import {
	AgentActionEndpoints as E,
	AgentPlanEndpoints as P,
	AgentTrustEndpoints as T,
	WorkspaceAgentPolicyEndpoints as W,
} from './agent-actions.endpoints';

/** What deciding from the chat answered: the paused turn resumed right there
 *  (its events stream in, exactly like sending a message), or it still has
 *  undecided actions and only the decisions were recorded. */
export type TChatDecisionResult =
	| { resumed: true; events: AsyncGenerator<TAgentSessionStreamEvent> }
	| { resumed: false; actions: TAgentAction[] };

export const AgentActionService = {
	// Paginated — `data` sits flat in the envelope, `meta` alongside it.
	inbox: (ws: string, params?: TAgentActionListParams, signal?: AbortSignal) =>
		axiosClient
			.get<TApiResponse<TAgentAction[]> & { meta: TPaginationMeta }>(E.inbox(ws), {
				params,
				signal,
			})
			.then((r) => ({ actions: r.data.data, meta: r.data.meta })),

	detail: (ws: string, id: string, signal?: AbortSignal) =>
		axiosClient
			.get<TApiResponse<{ action: TAgentAction }>>(E.detail(ws, id), { signal })
			.then(unwrapKey<TAgentAction>('action')),

	/** Bulk decide from the inbox; decided turns resume on the backend's queue. */
	decide: (ws: string, payload: TDecideAgentActionsDto) =>
		axiosClient
			.post<TApiResponse<{ actions: TAgentAction[] }>>(E.decide(ws), payload)
			.then(unwrapKey<TAgentAction[]>('actions')),

	forAgent: (
		ws: string,
		agentId: string,
		params?: TAgentActionListParams,
		signal?: AbortSignal,
	) =>
		axiosClient
			.get<TApiResponse<TAgentAction[]> & { meta: TPaginationMeta }>(
				E.forAgent(ws, agentId),
				{
					params,
					signal,
				},
			)
			.then((r) => ({ actions: r.data.data, meta: r.data.meta })),

	forSession: (ws: string, agentId: string, sessionId: string, signal?: AbortSignal) =>
		axiosClient
			.get<TApiResponse<{ actions: TAgentAction[] }>>(E.forSession(ws, agentId, sessionId), {
				signal,
			})
			.then(unwrapKey<TAgentAction[]>('actions')),

	/**
	 * Decides from an open chat. When that leaves the paused turn fully
	 * decided, the backend continues it in the same response as server-sent
	 * events; otherwise it answers with plain JSON. `fetch` rather than axios,
	 * for the stream.
	 */
	async decideInChat(
		ws: string,
		agentId: string,
		sessionId: string,
		payload: TDecideAgentActionsDto,
		signal?: AbortSignal,
	): Promise<TChatDecisionResult> {
		const response = await fetch(
			`${apiConfig.baseUrl}${E.decideInChat(ws, agentId, sessionId)}`,
			{
				method: 'POST',
				credentials: 'include',
				headers: {
					'Content-Type': 'application/json',
					Accept: 'text/event-stream, application/json',
					Authorization: `Bearer ${getAccessToken() ?? ''}`,
				},
				body: JSON.stringify(payload),
				signal,
			},
		);

		if (response.ok && response.headers.get('Content-Type')?.includes('text/event-stream')) {
			return { resumed: true, events: readEventStream(response) };
		}

		const body = (await response.json().catch(() => null)) as
			(TApiResponse<{ actions: TAgentAction[] }> & { message?: string }) | null;

		if (!response.ok)
			throw new Error(body?.message ?? `Could not record the decision (${response.status}).`);

		return { resumed: false, actions: body?.data?.actions ?? [] };
	},
};

export const AgentPlanService = {
	list: (ws: string, agentId: string, sessionId: string, signal?: AbortSignal) =>
		axiosClient
			.get<TApiResponse<{ plans: TAgentPlan[] }>>(P.list(ws, agentId, sessionId), { signal })
			.then(unwrapKey<TAgentPlan[]>('plans')),

	approve: (
		ws: string,
		agentId: string,
		sessionId: string,
		planId: string,
		payload?: TApproveAgentPlanDto,
	) =>
		axiosClient
			.post<TApiResponse<{ plan: TAgentPlan }>>(
				P.approve(ws, agentId, sessionId, planId),
				payload ?? {},
			)
			.then(unwrapKey<TAgentPlan>('plan')),

	reject: (
		ws: string,
		agentId: string,
		sessionId: string,
		planId: string,
		payload?: TRejectAgentPlanDto,
	) =>
		axiosClient
			.post<TApiResponse<{ plan: TAgentPlan }>>(
				P.reject(ws, agentId, sessionId, planId),
				payload ?? {},
			)
			.then(unwrapKey<TAgentPlan>('plan')),
};

export const AgentTrustService = {
	list: (ws: string, agentId: string, signal?: AbortSignal) =>
		axiosClient
			.get<TApiResponse<{ suggestions: TAgentTrustSuggestion[] }>>(T.list(ws, agentId), {
				signal,
			})
			.then(unwrapKey<TAgentTrustSuggestion[]>('suggestions')),

	/** Sets the tool to run without asking; answers with the remaining suggestions. */
	apply: (ws: string, agentId: string, toolName: string) =>
		axiosClient
			.post<TApiResponse<{ suggestions: TAgentTrustSuggestion[] }>>(T.apply(ws, agentId), {
				tool_name: toolName,
			})
			.then(unwrapKey<TAgentTrustSuggestion[]>('suggestions')),
};

export const WorkspaceAgentPolicyService = {
	detail: (ws: string, signal?: AbortSignal) =>
		axiosClient
			.get<TApiResponse<{ policy: TWorkspaceAgentPolicy }>>(W.detail(ws), { signal })
			.then(unwrapKey<TWorkspaceAgentPolicy>('policy')),

	update: (ws: string, payload: TUpdateWorkspaceAgentPolicyDto) =>
		axiosClient
			.put<TApiResponse<{ policy: TWorkspaceAgentPolicy }>>(W.update(ws), payload)
			.then(unwrapKey<TWorkspaceAgentPolicy>('policy')),
};
