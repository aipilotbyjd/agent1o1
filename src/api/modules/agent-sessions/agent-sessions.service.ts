import { axiosClient } from '@/api/client';
import { unwrapKey } from '@/api/core';
import type { TApiResponse, TPaginationMeta } from '@/api/core';
import type {
	TAgentSession,
	TCreateAgentSessionDto,
	TUpdateAgentSessionDto,
	TAgentMessage,
	TSendAgentMessageDto,
	TAgentSessionStreamEvent,
} from '@/types/agent.type';
import { AgentActionService } from '@/api/modules/agent-actions/agent-actions.service';
import type { IEchoLike } from '@/api/modules/workflow-builder/workflow-builder.realtime';
import { AgentSessionEndpoints as E } from './agent-sessions.endpoints';
import { openAgentTurnStream } from './agent-sessions.realtime';

/** JSON, unless files ride along — then multipart, with each file under
 *  `attachments[]`. */
const messageBody = (payload: TSendAgentMessageDto): TSendAgentMessageDto | FormData => {
	if (!payload.attachments?.length)
		return {
			message: payload.message,
			...(payload.skill_id ? { skill_id: payload.skill_id } : {}),
		};
	const form = new FormData();
	form.append('message', payload.message);
	if (payload.skill_id) form.append('skill_id', payload.skill_id);
	payload.attachments.forEach((file) => form.append('attachments[]', file));
	return form;
};

export const AgentSessionService = {
	list: (ws: string, agentId: string, signal?: AbortSignal) =>
		axiosClient
			.get<TApiResponse<{ sessions: TAgentSession[] }>>(E.list(ws, agentId), { signal })
			.then(unwrapKey<TAgentSession[]>('sessions')),

	// Eager-loads the message transcript — the paginated `messages()` action
	// is for paging back through a long-running session instead.
	detail: (ws: string, agentId: string, id: string, signal?: AbortSignal) =>
		axiosClient
			.get<TApiResponse<{ session: TAgentSession }>>(E.detail(ws, agentId, id), { signal })
			.then(unwrapKey<TAgentSession>('session')),

	create: (ws: string, agentId: string, payload?: TCreateAgentSessionDto) =>
		axiosClient
			.post<TApiResponse<{ session: TAgentSession }>>(E.create(ws, agentId), payload)
			.then(unwrapKey<TAgentSession>('session')),

	update: (ws: string, agentId: string, id: string, payload: TUpdateAgentSessionDto) =>
		axiosClient
			.patch<TApiResponse<{ session: TAgentSession }>>(E.update(ws, agentId, id), payload)
			.then(unwrapKey<TAgentSession>('session')),

	remove: (ws: string, agentId: string, id: string) =>
		axiosClient.delete(E.delete(ws, agentId, id)).then(() => undefined),

	messages: (
		ws: string,
		agentId: string,
		id: string,
		params?: { per_page?: number; page?: number },
		signal?: AbortSignal,
	) =>
		axiosClient
			.get<TApiResponse<TAgentMessage[]> & { meta: TPaginationMeta }>(
				E.messages(ws, agentId, id),
				{
					params,
					signal,
				},
			)
			.then((r) => ({ messages: r.data.data, meta: r.data.meta })),

	sendMessage: (ws: string, agentId: string, id: string, payload: TSendAgentMessageDto) => {
		const body = messageBody(payload);
		const config =
			body instanceof FormData ? { headers: { 'Content-Type': undefined } } : undefined;
		return axiosClient
			.post<
				TApiResponse<{ message: TAgentMessage }>
			>(E.sendMessage(ws, agentId, id), body, config)
			.then(unwrapKey<TAgentMessage>('message'));
	},

	/**
	 * Sends a message and streams its reply: the request opens the turn and
	 * answers right away, and the reply arrives over Reverb on the session's
	 * channel — `openAgentTurnStream` plays it back as `TAgentSessionStreamEvent`s.
	 * Aborting stops listening; the turn still finishes on the backend.
	 */
	async *streamMessage(
		echo: IEchoLike | null,
		ws: string,
		agentId: string,
		id: string,
		payload: TSendAgentMessageDto,
		signal?: AbortSignal,
	): AsyncGenerator<TAgentSessionStreamEvent> {
		const stream = await openAgentTurnStream(
			echo,
			ws,
			id,
			(actionIds) =>
				AgentActionService.forSession(ws, agentId, id, signal).then((actions) =>
					actions.filter((action) => actionIds.includes(action.id)),
				),
			signal,
		);

		try {
			const body = messageBody(payload);
			const response = await axiosClient.post<TApiResponse<{ turn: { run_id: string } }>>(
				E.startTurn(ws, agentId, id),
				body,
				{
					signal,
					...(body instanceof FormData ? { headers: { 'Content-Type': undefined } } : {}),
				},
			);
			const turn = unwrapKey<{ run_id: string }>('turn')(response);

			yield* stream.follow(turn.run_id);
		} finally {
			stream.close();
		}
	},
};
