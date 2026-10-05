import type {
	TAgentAction,
} from '@/types/agent-action.type';
import type {
	TAgentMessageCreatedEvent,
	TAgentSessionStreamEvent,
	TAgentTurnChangedEvent,
	TAgentTurnDeltaEvent,
	TAgentTurnToolEvent,
} from '@/types/agent.type';
import type { IEchoChannelLike, IEchoLike } from '@/api/modules/workflow-builder/workflow-builder.realtime';

/**
 * A chat turn's reply is broadcast on the session's private channel while a
 * queue job writes it (`App\Services\Agents\AgentTurnBroadcaster`):
 * `turn.changed` (started / paused / finished / failed), `turn.delta` (batched
 * reply text) and `turn.tool` (a tool call started or finished). `streamAgentTurn`
 * plays them back as the `TAgentSessionStreamEvent`s the chat renders, for
 * both sending a message and deciding on a paused turn's actions.
 *
 * Also broadcast is one event per persisted message (`agent.message`, a
 * whole-message notice that lets a second tab or a teammate follow along
 * without polling).
 *
 * Events are not replayed: a late or reconnected client reads the stored
 * transcript, and the socket only carries what follows.
 */

/** Mirrors App\Broadcasting\Channels::AGENT_SESSION_PATTERN. */
export const agentSessionChannelName = (workspaceId: string, sessionId: string) =>
	`workspaces.${workspaceId}.agent-sessions.${sessionId}`;

/** Name from `AgentMessageCreated::broadcastAs()`. The leading dot stops Echo
 *  prefixing it with the `App.Events` namespace. */
export const AGENT_MESSAGE_EVENT = '.agent.message';

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

/** Names from `AgentTurnDelta` / `AgentTurnToolActivity` / `AgentTurnChanged`. */
export const AGENT_TURN_EVENTS = {
	delta: '.turn.delta',
	tool: '.turn.tool',
	changed: '.turn.changed',
} as const;

/** Longest a turn may run before the chat stops waiting for it — a subagent
 *  can take its full five minutes inside a turn. The reply is still stored. */
const TURN_MAX_WAIT_MS = 15 * 60 * 1000;

/** How long to wait for the channel before sending anyway — a dropped
 *  subscription then shows up as a missing live view, never a stuck send. */
const SUBSCRIBE_WAIT_MS = 3000;

type TTurnSignal =
	| { kind: 'delta'; payload: TAgentTurnDeltaEvent }
	| { kind: 'tool'; payload: TAgentTurnToolEvent }
	| { kind: 'changed'; payload: TAgentTurnChangedEvent };

const waitForSubscription = (channel: IEchoChannelLike) =>
	new Promise<void>((resolve) => {
		if (!channel.subscribed || channel.subscription?.subscribed) return resolve();
		const timer = setTimeout(resolve, SUBSCRIBE_WAIT_MS);
		channel.subscribed(() => {
			clearTimeout(timer);
			resolve();
		});
	});

/** A subscribed, buffering view of one session's turn broadcasts. */
export type TAgentTurnStream = {
	/** Plays `runId`'s broadcasts as chat events, ending with `done`. Closes the stream. */
	follow: (runId: string) => AsyncGenerator<TAgentSessionStreamEvent>;
	/** Stops this stream's listeners; safe to call more than once. */
	close: () => void;
};

/**
 * Subscribes to a session's turn broadcasts and starts holding them, so the
 * request that opens a turn (send a message, or decide on its actions) can
 * go out *after* this resolves and a fast worker still can't outrun it. Then
 * `follow(runId)` plays them back as the `TAgentSessionStreamEvent`s the chat
 * renders — ending with `complete` (or `error`) and `done`.
 *
 * The channel is left subscribed — the chat's own listeners share it, and
 * `echo.leave()` would drop them too. Only this stream's listeners are removed.
 * Call `close()` if the turn never gets as far as `follow()`.
 *
 * @param loadActions Fetches the actions a paused turn waits on, to show as cards.
 */
export async function openAgentTurnStream(
	echo: IEchoLike | null,
	workspaceId: string,
	sessionId: string,
	loadActions: (actionIds: string[]) => Promise<TAgentAction[]>,
	signal?: AbortSignal,
): Promise<TAgentTurnStream> {
	if (!echo) throw new Error('Live updates are not connected yet — try again in a moment.');

	const channel = echo.private(agentSessionChannelName(workspaceId, sessionId));
	const queue: TTurnSignal[] = [];
	let wake: (() => void) | null = null;

	const push = (item: TTurnSignal) => {
		queue.push(item);
		wake?.();
	};

	channel
		.listen(AGENT_TURN_EVENTS.delta, (payload) =>
			push({ kind: 'delta', payload: payload as TAgentTurnDeltaEvent }),
		)
		.listen(AGENT_TURN_EVENTS.tool, (payload) =>
			push({ kind: 'tool', payload: payload as TAgentTurnToolEvent }),
		)
		.listen(AGENT_TURN_EVENTS.changed, (payload) =>
			push({ kind: 'changed', payload: payload as TAgentTurnChangedEvent }),
		);

	const close = () => {
		channel.stopListening?.(AGENT_TURN_EVENTS.delta);
		channel.stopListening?.(AGENT_TURN_EVENTS.tool);
		channel.stopListening?.(AGENT_TURN_EVENTS.changed);
	};

	try {
		await waitForSubscription(channel);
	} catch (error) {
		close();
		throw error;
	}

	async function* follow(runId: string): AsyncGenerator<TAgentSessionStreamEvent> {
		const deadline = Date.now() + TURN_MAX_WAIT_MS;

		try {
			while (true) {
				if (signal?.aborted) throw new DOMException('Canceled', 'AbortError');

				const next = queue.shift();

				if (!next) {
					const remaining = deadline - Date.now();
					if (remaining <= 0) {
						throw new Error(
							'The agent is taking too long. Its reply will appear once it finishes.',
						);
					}
					await new Promise<void>((resolve) => {
						const timer = setTimeout(resolve, remaining);
						const done = () => {
							clearTimeout(timer);
							signal?.removeEventListener('abort', done);
							wake = null;
							resolve();
						};
						wake = done;
						signal?.addEventListener('abort', done, { once: true });
					});
					continue;
				}

				if (next.kind === 'delta') {
					if (next.payload.run_id === runId) {
						yield { event: 'delta', delta: next.payload.text };
					}
					continue;
				}

				if (next.kind === 'tool') {
					const tool = next.payload;
					if (tool.run_id !== runId) continue;

					if (tool.phase === 'started') {
						yield {
							event: 'tool-call',
							id: tool.tool_call_id,
							name: tool.tool,
							arguments: tool.arguments ?? {},
						};
					} else {
						yield {
							event: 'tool-result',
							id: tool.tool_call_id,
							name: tool.tool,
							output: tool.output ?? '',
							successful: tool.successful ?? true,
							denied: tool.denied,
							result: tool.subagent_task_id
								? { task_id: tool.subagent_task_id }
								: undefined,
						};
					}
					continue;
				}

				const { turn } = next.payload;
				if (turn.run_id !== runId || turn.status === 'running') continue;

				if (turn.status === 'failed') {
					yield { event: 'error', message: turn.error ?? 'The agent failed to respond.' };
					yield { event: 'done' };
					return;
				}

				if (turn.status === 'awaiting_approval') {
					const ids = turn.pending_action_ids ?? [];
					const actions = ids.length ? await loadActions(ids).catch(() => []) : [];
					yield { event: 'approval-required', actions };
				}

				yield {
					event: 'complete',
					run_id: turn.run_id,
					status: turn.status,
					message_id: turn.message_id ?? null,
					text: null,
					pending_action_ids: turn.pending_action_ids,
				};
				yield { event: 'done' };
				return;
			}
		} finally {
			close();
		}
	}

	return { follow, close };
}
