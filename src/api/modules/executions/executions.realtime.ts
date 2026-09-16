/**
 * Realtime subscription for a workflow execution (Laravel Reverb / Pusher).
 *
 * The execute endpoint returns a private channel name (`private-execution.<id>`);
 * subscribe to it to receive live progress instead of polling. We keep this
 * decoupled from `laravel-echo` types via a minimal structural interface so the
 * host app can pass in whatever Echo instance it already constructs.
 */

/** Node-level progress event (`node.completed`). */
export interface IExecutionNodeEvent {
	execution_id: string;
	node_id: string;
	status: string;
	input?: unknown;
	output?: unknown;
	error?: { message?: string } | string | null;
	duration_ms?: number;
	sequence?: number;
}

/** Terminal / lifecycle events for the run. */
export interface IExecutionLifecycleEvent {
	execution_id: string;
	status?: string;
	result_data?: unknown;
	error?: { message?: string } | string | null;
	reason?: string;
	resume_at?: string | null;
	started_at?: string | null;
	finished_at?: string | null;
	duration_ms?: number;
}

export interface IExecutionEchoChannel {
	listen: (event: string, cb: (payload: unknown) => void) => IExecutionEchoChannel;
}

export interface IExecutionEcho {
	private: (channel: string) => IExecutionEchoChannel;
	leave: (channel: string) => void;
}

/** Event names as broadcast by the engine (Echo prefixes custom names with `.`). */
export const EXECUTION_EVENTS = {
	started: '.execution.started',
	nodeCompleted: '.node.completed',
	waiting: '.execution.waiting',
	completed: '.execution.completed',
	failed: '.execution.failed',
} as const;

export interface ISubscribeExecutionHandlers {
	onStarted?: (event: IExecutionLifecycleEvent) => void;
	onNode?: (event: IExecutionNodeEvent) => void;
	onWaiting?: (event: IExecutionLifecycleEvent) => void;
	onCompleted?: (event: IExecutionLifecycleEvent) => void;
	onFailed?: (event: IExecutionLifecycleEvent) => void;
}

/**
 * The execute response hands back a channel like `private-execution.<id>`; Echo's
 * `private()` re-adds the `private-` prefix, so strip it before subscribing.
 */
export const executionChannelName = (channel: string) => channel.replace(/^private-/, '');

/**
 * Subscribe to an execution's private channel. Returns an unsubscribe function.
 */
export function subscribeToExecution(
	echo: IExecutionEcho,
	channel: string,
	handlers: ISubscribeExecutionHandlers,
): () => void {
	const name = executionChannelName(channel);
	const ch = echo.private(name);

	if (handlers.onStarted) {
		ch.listen(EXECUTION_EVENTS.started, (p) => handlers.onStarted!(p as IExecutionLifecycleEvent));
	}
	if (handlers.onNode) {
		ch.listen(EXECUTION_EVENTS.nodeCompleted, (p) => handlers.onNode!(p as IExecutionNodeEvent));
	}
	if (handlers.onWaiting) {
		ch.listen(EXECUTION_EVENTS.waiting, (p) => handlers.onWaiting!(p as IExecutionLifecycleEvent));
	}
	if (handlers.onCompleted) {
		ch.listen(EXECUTION_EVENTS.completed, (p) =>
			handlers.onCompleted!(p as IExecutionLifecycleEvent),
		);
	}
	if (handlers.onFailed) {
		ch.listen(EXECUTION_EVENTS.failed, (p) => handlers.onFailed!(p as IExecutionLifecycleEvent));
	}

	return () => echo.leave(name);
}
