import type { TAgentMessageRole } from '@/types/agent.type';
import type { IEchoLike } from '@/api/modules/workflow-builder/workflow-builder.realtime';

/**
 * The old backend streamed a reply over broadcast, one channel per queued
 * request (`agent.stream.{id}`), with `text_delta` / `tool_call` /
 * `tool_result` / `artifact` / `agent.message.ready` events.
 *
 * This backend does **not** broadcast a reply token by token. Token-level
 * streaming is server-sent events on
 * `POST .../sessions/{session}/messages/stream` — see
 * `AgentSessionService.streamMessage`, which is what the chat UI uses.
 *
 * What *is* broadcast is one event per persisted message
 * (`App\Events\Agents\AgentMessageCreated`, event name `agent.message`) on the
 * session's private channel. That is a whole-message notification, meant for a
 * second tab — or a teammate watching a shared session — to follow along
 * without polling. It fires for every role: the user's own turn, the
 * assistant's reply, and tool results.
 */

/** Mirrors App\Broadcasting\Channels::AGENT_SESSION_PATTERN. */
export const agentSessionChannelName = (workspaceId: string, sessionId: string) =>
	`workspaces.${workspaceId}.agent-sessions.${sessionId}`;

/** Name from `AgentMessageCreated::broadcastAs()`. The leading dot stops Echo
 *  prefixing it with the `App.Events` namespace. */
export const AGENT_MESSAGE_EVENT = '.agent.message';

/**
 * Payload of `AgentMessageCreated::broadcastWith()`. Deliberately not derived
 * from `TAgentMessage`: the broadcast carries `tool_calls`, which the REST
 * resource omits, and omits `usage`, which the REST resource carries.
 */
export type TAgentMessageCreatedEvent = {
	id: string;
	agent_session_id: string;
	role: TAgentMessageRole;
	content: unknown;
	tool_calls: unknown;
	created_at: string | null;
};

/**
 * Subscribe to a session's message feed. Returns an unsubscribe function.
 * Keyed by session, not by queued request.
 */
export function subscribeToAgentSession(
	echo: IEchoLike,
	workspaceId: string,
	sessionId: string,
	onMessage: (event: TAgentMessageCreatedEvent) => void,
): () => void {
	const channelName = agentSessionChannelName(workspaceId, sessionId);
	const instance = echo.private(channelName);

	instance.listen(AGENT_MESSAGE_EVENT, (payload) => {
		onMessage(payload as TAgentMessageCreatedEvent);
	});

	return () => echo.leave(channelName);
}
