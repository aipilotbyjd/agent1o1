import type {
	TBuilderDeltaEvent,
	TBuilderDraftEvent,
	TBuilderStatusEvent,
	TBuilderToolCallEvent,
	TBuilderToolResultEvent,
} from '@/types/workflow-builder.type';

/**
 * Minimal structural type for a Laravel Echo instance, so this module (and
 * `agent-sessions.realtime`) compiles without a hard dependency on `laravel-echo`.
 */
export interface IEchoChannelLike {
	listen: (event: string, cb: (payload: unknown) => void) => IEchoChannelLike;
	stopListening?: (event: string) => IEchoChannelLike;
	/** Runs once the server has accepted the subscription (`PusherChannel`). */
	subscribed?: (cb: () => void) => IEchoChannelLike;
	/** The underlying Pusher channel, when Echo exposes it. */
	subscription?: { subscribed?: boolean };
}

export interface IEchoLike {
	private: (channel: string) => IEchoChannelLike;
	leave: (channel: string) => void;
}

/** Mirrors App\Broadcasting\Channels::WORKFLOW_BUILDER_SESSION_PATTERN. */
export const builderChannelName = (workspaceId: string, sessionId: string) =>
	`workspaces.${workspaceId}.workflow-builder-sessions.${sessionId}`;

/**
 * `App\Events\Workflows\WorkflowBuilderActivity::broadcastAs()` names. The
 * leading dot stops Echo prefixing them with the `App.Events` namespace.
 */
export const BUILDER_EVENTS = {
	status: '.builder.status',
	delta: '.builder.delta',
	toolCall: '.builder.tool-call',
	toolResult: '.builder.tool-result',
	draft: '.builder.draft',
} as const;

export interface ISubscribeBuilderSessionHandlers {
	/** The reply moved to processing / completed / failed. */
	onStatus: (event: TBuilderStatusEvent) => void;
	/** A chunk of the reply's text — concatenate in order. */
	onDelta?: (event: TBuilderDeltaEvent) => void;
	onToolCall?: (event: TBuilderToolCallEvent) => void;
	onToolResult?: (event: TBuilderToolResultEvent) => void;
	/** The draft changed. Carries only the new lock version — refetch the session for the graph. */
	onDraft?: (event: TBuilderDraftEvent) => void;
}

/**
 * Subscribe to a builder session's private channel. Returns an unsubscribe
 * function. Payloads are capped server-side (Reverb drops events over
 * 10 KB), so the persisted message and draft stay the source of truth.
 */
export function subscribeToBuilderSession(
	echo: IEchoLike,
	workspaceId: string,
	sessionId: string,
	handlers: ISubscribeBuilderSessionHandlers,
): () => void {
	const channel = builderChannelName(workspaceId, sessionId);
	const instance = echo.private(channel);

	instance.listen(BUILDER_EVENTS.status, (payload) =>
		handlers.onStatus(payload as TBuilderStatusEvent),
	);

	if (handlers.onDelta) {
		const onDelta = handlers.onDelta;
		instance.listen(BUILDER_EVENTS.delta, (payload) => onDelta(payload as TBuilderDeltaEvent));
	}
	if (handlers.onToolCall) {
		const onToolCall = handlers.onToolCall;
		instance.listen(BUILDER_EVENTS.toolCall, (payload) =>
			onToolCall(payload as TBuilderToolCallEvent),
		);
	}
	if (handlers.onToolResult) {
		const onToolResult = handlers.onToolResult;
		instance.listen(BUILDER_EVENTS.toolResult, (payload) =>
			onToolResult(payload as TBuilderToolResultEvent),
		);
	}
	if (handlers.onDraft) {
		const onDraft = handlers.onDraft;
		instance.listen(BUILDER_EVENTS.draft, (payload) => onDraft(payload as TBuilderDraftEvent));
	}

	return () => echo.leave(channel);
}
