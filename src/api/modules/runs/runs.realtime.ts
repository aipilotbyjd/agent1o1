import type { TRunStatus, TNodeRunStatus } from '@/types/run.type';

type TEchoListener = (payload: unknown) => void;

export interface IEchoChannelLike {
	listen: (event: string, cb: TEchoListener) => IEchoChannelLike;
	stopListening: (event: string, cb?: TEchoListener) => IEchoChannelLike;
}

export interface IEchoLike {
	private: (channel: string) => IEchoChannelLike;
	leave: (channel: string) => void;
}

export interface IRunStateChangedEvent {
	id: string;
	workflow_id: string | null;
	runnable_type: string;
	runnable_id: string;
	status: TRunStatus;
	error: string | null;
	started_at: string | null;
	finished_at: string | null;
	emitted_at: number;
}

/** `output` is deliberately not broadcast; fetch it via `RunService.nodeRun`. */
export interface INodeRunStateChangedEvent {
	id: string;
	run_id: string;
	key: string;
	type: string;
	status: TNodeRunStatus;
	attempt: number;
	error: string | null;
	started_at: string | null;
	finished_at: string | null;
	emitted_at: number;
}

export const runChannelName = (workspaceId: string, runId: string | null) =>
	runId ? `workspaces.${workspaceId}.runs.${runId}` : `workspaces.${workspaceId}.runs`;

export const RUN_STATE_CHANGED_EVENT = '.run.state-changed';
export const NODE_RUN_STATE_CHANGED_EVENT = '.node-run.state-changed';

export interface ISubscribeRunOptions {
	onRunState?: (event: IRunStateChangedEvent) => void;
	onNodeState?: (event: INodeRunStateChangedEvent) => void;
}

/**
 * Subscribes to one run, or to every run in the workspace when `runId` is null.
 * Only this subscription's listeners are removed on cleanup, because the
 * workspace channel is shared; a single run's channel is left as well.
 */
export function subscribeToRun(
	echo: IEchoLike,
	workspaceId: string,
	runId: string | null,
	{ onRunState, onNodeState }: ISubscribeRunOptions,
): () => void {
	const channel = runChannelName(workspaceId, runId);
	const instance = echo.private(channel);
	const listeners: [string, TEchoListener][] = [];

	const listen = (event: string, cb: TEchoListener) => {
		instance.listen(event, cb);
		listeners.push([event, cb]);
	};

	if (onRunState) {
		listen(RUN_STATE_CHANGED_EVENT, (payload) => onRunState(payload as IRunStateChangedEvent));
	}
	if (onNodeState) {
		listen(NODE_RUN_STATE_CHANGED_EVENT, (payload) =>
			onNodeState(payload as INodeRunStateChangedEvent),
		);
	}

	return () => {
		listeners.forEach(([event, cb]) => instance.stopListening(event, cb));
		if (runId) echo.leave(channel);
	};
}

/**
 * Retried broadcasts can arrive out of order. Returns a check that is false for
 * an event older than the newest one already seen for the same key.
 */
export function createStaleEventGuard() {
	const newest = new Map<string, number>();

	return (key: string, emittedAt: number): boolean => {
		if (emittedAt < (newest.get(key) ?? 0)) return false;
		newest.set(key, emittedAt);
		return true;
	};
}
