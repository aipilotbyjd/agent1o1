import type { TRunStatus, TNodeRunStatus } from '@/types/run.type';

export interface IEchoChannelLike {
	listen: (event: string, cb: (payload: unknown) => void) => IEchoChannelLike;
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
}

export const runChannelName = (workspaceId: string, runId: string) =>
	`workspaces.${workspaceId}.runs.${runId}`;

export const RUN_STATE_CHANGED_EVENT = '.run.state-changed';
export const NODE_RUN_STATE_CHANGED_EVENT = '.node-run.state-changed';

export interface ISubscribeRunOptions {
	onRunState?: (event: IRunStateChangedEvent) => void;
	onNodeState?: (event: INodeRunStateChangedEvent) => void;
}

export function subscribeToRun(
	echo: IEchoLike,
	workspaceId: string,
	runId: string,
	{ onRunState, onNodeState }: ISubscribeRunOptions,
): () => void {
	const channel = runChannelName(workspaceId, runId);
	const instance = echo.private(channel);

	if (onRunState) {
		instance.listen(RUN_STATE_CHANGED_EVENT, (payload) =>
			onRunState(payload as IRunStateChangedEvent),
		);
	}
	if (onNodeState) {
		instance.listen(NODE_RUN_STATE_CHANGED_EVENT, (payload) =>
			onNodeState(payload as INodeRunStateChangedEvent),
		);
	}

	return () => echo.leave(channel);
}
