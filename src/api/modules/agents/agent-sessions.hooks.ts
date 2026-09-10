import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback, useRef, useState } from 'react';
import type { TCreateAgentSessionDto, TUpdateAgentSessionDto, TSendAgentMessageDto } from '@/types/agent.type';
import type { TAgentSessionStreamEvent } from '@/types/agent.type';
import { AgentSessionService } from './agent-sessions.service';
import { agentSessionKeys } from './agents.keys';

export const useAgentSessions = (ws: string, agentId: string) =>
	useQuery({
		queryKey: agentSessionKeys.list(ws, agentId),
		queryFn: ({ signal }) => AgentSessionService.list(ws, agentId, signal),
		enabled: !!ws && !!agentId,
	});

export const useAgentSession = (ws: string, agentId: string, id: string) =>
	useQuery({
		queryKey: agentSessionKeys.detail(ws, agentId, id),
		queryFn: ({ signal }) => AgentSessionService.detail(ws, agentId, id, signal),
		enabled: !!ws && !!agentId && !!id,
	});

export const useCreateAgentSession = (ws: string, agentId: string) => {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (payload?: TCreateAgentSessionDto) => AgentSessionService.create(ws, agentId, payload),
		onSuccess: () => qc.invalidateQueries({ queryKey: agentSessionKeys.list(ws, agentId) }),
		meta: { errorMessage: 'Failed to create session' },
	});
};

export const useUpdateAgentSession = (ws: string, agentId: string) => {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: ({ id, body }: { id: string; body: TUpdateAgentSessionDto }) =>
			AgentSessionService.update(ws, agentId, id, body),
		onSuccess: (_session, { id }) => {
			qc.invalidateQueries({ queryKey: agentSessionKeys.list(ws, agentId) });
			qc.invalidateQueries({ queryKey: agentSessionKeys.detail(ws, agentId, id) });
		},
		meta: { errorMessage: 'Failed to update session' },
	});
};

export const useDeleteAgentSession = (ws: string, agentId: string) => {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (id: string) => AgentSessionService.remove(ws, agentId, id),
		onSuccess: () => qc.invalidateQueries({ queryKey: agentSessionKeys.list(ws, agentId) }),
		meta: { errorMessage: 'Failed to delete session' },
	});
};

export const useAgentSessionMessages = (
	ws: string,
	agentId: string,
	id: string,
	params?: { per_page?: number; page?: number },
) =>
	useQuery({
		queryKey: [...agentSessionKeys.detail(ws, agentId, id), 'messages', params ?? {}],
		queryFn: ({ signal }) => AgentSessionService.messages(ws, agentId, id, params, signal),
		enabled: !!ws && !!agentId && !!id,
	});

export const useSendAgentMessage = (ws: string, agentId: string, id: string) => {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (payload: TSendAgentMessageDto) => AgentSessionService.sendMessage(ws, agentId, id, payload),
		onSuccess: () => qc.invalidateQueries({ queryKey: agentSessionKeys.detail(ws, agentId, id) }),
		meta: { errorMessage: 'The agent failed to respond' },
	});
};

/** Drives a streamed turn — `events` accumulates as they arrive, `send`
 *  starts the stream, `isStreaming` tracks whether one is in flight. */
export const useStreamAgentMessage = (ws: string, agentId: string, id: string) => {
	const qc = useQueryClient();
	const [events, setEvents] = useState<TAgentSessionStreamEvent[]>([]);
	const [isStreaming, setIsStreaming] = useState(false);
	const abortRef = useRef<AbortController | null>(null);

	const send = useCallback(
		async (payload: TSendAgentMessageDto) => {
			setEvents([]);
			setIsStreaming(true);
			const controller = new AbortController();
			abortRef.current = controller;

			try {
				for await (const event of AgentSessionService.streamMessage(
					ws,
					agentId,
					id,
					payload,
					controller.signal,
				)) {
					setEvents((prev) => [...prev, event]);
				}
			} finally {
				setIsStreaming(false);
				qc.invalidateQueries({ queryKey: agentSessionKeys.detail(ws, agentId, id) });
			}
		},
		[ws, agentId, id, qc],
	);

	const cancel = useCallback(() => abortRef.current?.abort(), []);

	return { send, cancel, events, isStreaming };
};
