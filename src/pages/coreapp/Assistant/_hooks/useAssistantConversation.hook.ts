import { useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useRealtime } from '@/context/realtime/useRealtime';
import {
	assistantKeys,
	subscribeToAssistantSession,
	useAssistantMessages,
	useAssistantSession,
} from '@/api/modules/assistant';
import type { IEchoLike } from '@/api/modules/workflow-builder/workflow-builder.realtime';
import type { TAssistantTurnStatus } from '@/types/assistant.type';

export type TToolActivity = { id: string; tool: string; phase: 'started' | 'finished' };

const IN_FLIGHT: TAssistantTurnStatus[] = ['queued', 'running'];

/**
 * One conversation, live: the stored transcript, the turn in progress, and
 * the reply as it streams in over Reverb. When the socket isn't connected
 * the session is polled while a turn is in flight, so a reply still shows up.
 */
export const useAssistantConversation = (workspaceId: string, sessionId: string) => {
	const qc = useQueryClient();
	const { echo } = useRealtime();

	const sessionQuery = useAssistantSession(workspaceId, sessionId);
	const messagesQuery = useAssistantMessages(workspaceId, sessionId);

	const [draft, setDraft] = useState('');
	const [tools, setTools] = useState<TToolActivity[]>([]);
	const [lastError, setLastError] = useState<string | null>(null);

	const activeTurn = sessionQuery.data?.active_turn ?? null;
	const isWorking = activeTurn !== null && IN_FLIGHT.includes(activeTurn.status);

	useEffect(() => {
		setDraft('');
		setTools([]);
		setLastError(null);
	}, [sessionId]);

	useEffect(() => {
		if (!echo || !workspaceId || !sessionId) return undefined;

		const refresh = () => {
			qc.invalidateQueries({ queryKey: assistantKeys.session(workspaceId, sessionId) });
			qc.invalidateQueries({ queryKey: assistantKeys.messages(workspaceId, sessionId) });
		};

		return subscribeToAssistantSession(echo as unknown as IEchoLike, workspaceId, sessionId, {
			onDelta: (event) => setDraft((current) => current + event.text),
			onTool: (event) => {
				// Text written before and after a tool call are separate paragraphs.
				if (event.phase === 'started') {
					setDraft((current) =>
						current && !current.endsWith('\n\n') ? `${current}\n\n` : current,
					);
				}
				setTools((current) => [
					...current.filter((activity) => activity.id !== event.tool_call_id),
					{ id: event.tool_call_id, tool: event.tool, phase: event.phase },
				]);
			},
			onChanged: (event) => {
				setLastError(event.turn.status === 'failed' ? event.turn.error : null);

				if (!IN_FLIGHT.includes(event.turn.status)) {
					setDraft('');
					setTools([]);
					qc.invalidateQueries({ queryKey: assistantKeys.sessions(workspaceId) });
					qc.invalidateQueries({ queryKey: assistantKeys.memories(workspaceId) });
				}
				refresh();
			},
		});
	}, [echo, qc, workspaceId, sessionId]);

	// A turn just ended (seen by socket or by polling): the assistant may have
	// saved or forgotten something about the owner.
	const wasWorking = useRef(isWorking);
	useEffect(() => {
		if (wasWorking.current && !isWorking) {
			qc.invalidateQueries({ queryKey: assistantKeys.memories(workspaceId) });
			qc.invalidateQueries({ queryKey: assistantKeys.sessions(workspaceId) });
			qc.invalidateQueries({ queryKey: assistantKeys.context(workspaceId, sessionId) });
			qc.invalidateQueries({ queryKey: assistantKeys.messages(workspaceId, sessionId) });
		}
		wasWorking.current = isWorking;
	}, [isWorking, qc, workspaceId, sessionId]);

	// Fallback when the socket is down: poll while a turn is in flight.
	useEffect(() => {
		if (echo || !isWorking) return undefined;

		const timer = window.setInterval(() => {
			qc.invalidateQueries({ queryKey: assistantKeys.session(workspaceId, sessionId) });
			qc.invalidateQueries({ queryKey: assistantKeys.messages(workspaceId, sessionId) });
		}, 2000);

		return () => window.clearInterval(timer);
	}, [echo, isWorking, qc, workspaceId, sessionId]);

	return {
		messages: messagesQuery.data?.messages ?? [],
		isLoading: messagesQuery.isLoading,
		activeTurn,
		queuedCount: sessionQuery.data?.queued_count ?? 0,
		isWorking,
		draft,
		tools,
		lastError,
	};
};
