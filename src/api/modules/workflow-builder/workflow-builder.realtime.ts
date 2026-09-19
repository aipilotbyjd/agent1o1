import type {
	IBuilderMessageReadyEvent,
	IBuilderStreamTextDeltaEvent,
	IBuilderStreamToolCallEvent,
	IBuilderStreamToolResultEvent,
} from '@/types/workflowBuilder.type';

/**
 * Minimal structural type for a Laravel Echo instance. We avoid a hard
 * dependency on `laravel-echo` / `pusher-js` so this module compiles even when
 * realtime is wired up by the host application. Pass in whatever Echo instance
 * the app already constructs (see the WebSocket section of the builder docs).
 */
export interface IEchoChannelLike {
	listen: (event: string, cb: (payload: unknown) => void) => IEchoChannelLike;
	stopListening?: (event: string) => IEchoChannelLike;
}

export interface IEchoLike {
	private: (channel: string) => IEchoChannelLike;
	leave: (channel: string) => void;
}

export const builderChannelName = (sessionId: string) => `builder.session.${sessionId}`;

/** Event name as broadcast by Reverb (note the leading dot in Echo's `.listen`). */
export const BUILDER_MESSAGE_READY_EVENT = '.builder.message.ready';

// The `laravel/ai` package's StreamEvent::broadcast() sends the bare event
// name it returns from type() (e.g. "text_delta") — same leading-dot rule
// applies so Echo doesn't prefix it with the App.Events namespace.
export const BUILDER_TEXT_DELTA_EVENT = '.text_delta';
export const BUILDER_TOOL_CALL_EVENT = '.tool_call';
export const BUILDER_TOOL_RESULT_EVENT = '.tool_result';

export interface ISubscribeBuilderSessionOptions {
	onReady: (event: IBuilderMessageReadyEvent) => void;
	onError?: (event: IBuilderMessageReadyEvent) => void;
	/** A chunk of the reply as it's generated — append to the in-flight message. */
	onTextDelta?: (event: IBuilderStreamTextDeltaEvent) => void;
	/** The agent is invoking a tool (e.g. adding a node) — show live progress. */
	onToolCall?: (event: IBuilderStreamToolCallEvent) => void;
	onToolResult?: (event: IBuilderStreamToolResultEvent) => void;
}

/**
 * Subscribe to a builder session's private channel. Returns an unsubscribe
 * function. The `onError` callback (if provided) fires for events where
 * `event.error === true`; otherwise everything routes through `onReady`.
 *
 * @example
 *   const unsub = subscribeToBuilderSession(echo, sessionId, {
 *     onReady: (e) => { setNodes(e.draft.nodes); setEdges(e.draft.edges); },
 *     onError: (e) => showError(e.message.error_message),
 *   });
 *   // later: unsub();
 */
export function subscribeToBuilderSession(
	echo: IEchoLike,
	sessionId: string,
	{ onReady, onError, onTextDelta, onToolCall, onToolResult }: ISubscribeBuilderSessionOptions,
): () => void {
	const channel = builderChannelName(sessionId);
	const instance = echo.private(channel);

	instance.listen(BUILDER_MESSAGE_READY_EVENT, (payload) => {
		const event = payload as IBuilderMessageReadyEvent;
		if (event.error && onError) {
			onError(event);
			return;
		}
		onReady(event);
	});

	if (onTextDelta) {
		instance.listen(BUILDER_TEXT_DELTA_EVENT, (payload) => {
			onTextDelta(payload as IBuilderStreamTextDeltaEvent);
		});
	}
	if (onToolCall) {
		instance.listen(BUILDER_TOOL_CALL_EVENT, (payload) => {
			onToolCall(payload as IBuilderStreamToolCallEvent);
		});
	}
	if (onToolResult) {
		instance.listen(BUILDER_TOOL_RESULT_EVENT, (payload) => {
			onToolResult(payload as IBuilderStreamToolResultEvent);
		});
	}

	return () => echo.leave(channel);
}
