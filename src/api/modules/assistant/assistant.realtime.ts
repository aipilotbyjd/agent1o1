import type { IEchoLike } from '@/api/modules/workflow-builder/workflow-builder.realtime';
import type {
	TAssistantToolActivityEvent,
	TAssistantTurnChangedEvent,
	TAssistantTurnDeltaEvent,
} from '@/types/assistant.type';

/** Mirrors App\Broadcasting\Channels::ASSISTANT_SESSION_PATTERN. */
export const assistantSessionChannelName = (workspaceId: string, sessionId: string) =>
	`workspaces.${workspaceId}.assistant-sessions.${sessionId}`;

/** `broadcastAs()` names of App\Events\Assistant\*. The leading dot stops Echo
 *  prefixing them with the `App.Events` namespace. */
export const ASSISTANT_EVENTS = {
	changed: '.turn.changed',
	delta: '.turn.delta',
	tool: '.turn.tool',
} as const;

export type TAssistantSessionHandlers = {
	onChanged: (event: TAssistantTurnChangedEvent) => void;
	onDelta: (event: TAssistantTurnDeltaEvent) => void;
	onTool: (event: TAssistantToolActivityEvent) => void;
};

/** Subscribe to one conversation's live stream. Returns an unsubscribe function. */
export function subscribeToAssistantSession(
	echo: IEchoLike,
	workspaceId: string,
	sessionId: string,
	handlers: TAssistantSessionHandlers,
): () => void {
	const channelName = assistantSessionChannelName(workspaceId, sessionId);
	const channel = echo.private(channelName);

	channel.listen(ASSISTANT_EVENTS.changed, (payload) =>
		handlers.onChanged(payload as TAssistantTurnChangedEvent),
	);
	channel.listen(ASSISTANT_EVENTS.delta, (payload) =>
		handlers.onDelta(payload as TAssistantTurnDeltaEvent),
	);
	channel.listen(ASSISTANT_EVENTS.tool, (payload) =>
		handlers.onTool(payload as TAssistantToolActivityEvent),
	);

	return () => echo.leave(channelName);
}
