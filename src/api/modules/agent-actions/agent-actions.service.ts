import { axiosClient } from '@/api/client';
import { unwrapKey } from '@/api/core';
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
import { openAgentTurnStream } from '@/api/modules/agents/agents.realtime';
import type { IEchoLike } from '@/api/modules/workflow-builder/workflow-builder.realtime';
import {
	AgentActionEndpoints as E,
	AgentPlanEndpoints as P,
	AgentTrustEndpoints as T,
	WorkspaceAgentPolicyEndpoints as W,
} from './agent-actions.endpoints';

/** What deciding from the chat answered: the paused turn resumed (its events
 *  stream in over Reverb, exactly like sending a message), or it still has
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
	 * Decides from an open chat. The decisions are recorded right away; when
	 * that leaves the paused turn fully decided, it carries on on the queue
	 * and `events` plays its reply from the session's Reverb channel, like
	 * sending a message. Otherwise only the decisions were recorded.
	 */
	async decideInChat(
		echo: IEchoLike | null,
		ws: string,
		agentId: string,
		sessionId: string,
		payload: TDecideAgentActionsDto,
		signal?: AbortSignal,
	): Promise<TChatDecisionResult> {
		// Listening starts before the request goes out: the turn can begin
		// streaming before the answer to this request arrives.
		const stream = await openAgentTurnStream(
			echo,
			ws,
			sessionId,
			(actionIds) =>
				AgentActionService.forSession(ws, agentId, sessionId, signal).then((actions) =>
					actions.filter((action) => actionIds.includes(action.id)),
				),
			signal,
		);

		try {
			const response = await axiosClient.post<
				TApiResponse<{ actions: TAgentAction[]; resumed: boolean; run_id: string | null }>
			>(E.decideInChat(ws, agentId, sessionId), payload, { signal });
			const { actions, resumed, run_id: runId } = response.data.data;

			if (!resumed || !runId) {
				stream.close();
				return { resumed: false, actions };
			}

			return { resumed: true, events: stream.follow(runId) };
		} catch (error) {
			stream.close();
			throw error;
		}
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
			.post<
				TApiResponse<{ plan: TAgentPlan }>
			>(P.approve(ws, agentId, sessionId, planId), payload ?? {})
			.then(unwrapKey<TAgentPlan>('plan')),

	reject: (
		ws: string,
		agentId: string,
		sessionId: string,
		planId: string,
		payload?: TRejectAgentPlanDto,
	) =>
		axiosClient
			.post<
				TApiResponse<{ plan: TAgentPlan }>
			>(P.reject(ws, agentId, sessionId, planId), payload ?? {})
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
