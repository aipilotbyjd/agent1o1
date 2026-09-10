import { axiosClient } from '@/api/client';
import { getAccessToken, unwrapKey } from '@/api/core';
import { apiConfig } from '@/api/core/config';
import type { TApiResponse, TPaginationMeta } from '@/api/core';
import type {
	TAgentSession,
	TCreateAgentSessionDto,
	TUpdateAgentSessionDto,
	TAgentMessage,
	TSendAgentMessageDto,
	TAgentSessionStreamEvent,
} from '@/types/agent.type';
import { AgentSessionEndpoints as E } from './agents.endpoints';

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
			.get<TApiResponse<TAgentMessage[]> & { meta: TPaginationMeta }>(E.messages(ws, agentId, id), {
				params,
				signal,
			})
			.then((r) => ({ messages: r.data.data, meta: r.data.meta })),

	sendMessage: (ws: string, agentId: string, id: string, payload: TSendAgentMessageDto) =>
		axiosClient
			.post<TApiResponse<{ message: TAgentMessage }>>(E.sendMessage(ws, agentId, id), payload)
			.then(unwrapKey<TAgentMessage>('message')),

	/** Streams one turn over server-sent events — see `TAgentSessionStreamEvent`
	 *  for the event names on the wire. Uses `fetch` directly since axios has
	 *  no native SSE support. */
	streamMessage: async function* (
		ws: string,
		agentId: string,
		id: string,
		payload: TSendAgentMessageDto,
		signal?: AbortSignal,
	): AsyncGenerator<TAgentSessionStreamEvent> {
		const response = await fetch(`${apiConfig.baseUrl}${E.streamMessage(ws, agentId, id)}`, {
			method: 'POST',
			credentials: 'include',
			headers: {
				'Content-Type': 'application/json',
				Accept: 'text/event-stream',
				Authorization: `Bearer ${getAccessToken() ?? ''}`,
			},
			body: JSON.stringify(payload),
			signal,
		});

		if (!response.body) return;

		const reader = response.body.getReader();
		const decoder = new TextDecoder();
		let buffer = '';

		while (true) {
			const { done, value } = await reader.read();
			if (done) break;

			buffer += decoder.decode(value, { stream: true });
			const chunks = buffer.split('\n\n');
			buffer = chunks.pop() ?? '';

			for (const chunk of chunks) {
				const eventLine = chunk.split('\n').find((line) => line.startsWith('event:'));
				const dataLine = chunk.split('\n').find((line) => line.startsWith('data:'));
				if (!eventLine || !dataLine) continue;

				const event = eventLine.replace('event:', '').trim();
				const data = JSON.parse(dataLine.replace('data:', '').trim());
				yield { event, ...data } as TAgentSessionStreamEvent;
			}
		}
	},
};
