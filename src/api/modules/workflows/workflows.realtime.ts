/** What `WorkspaceChannelGate::workflowPresence()` shares about a member. */
export interface IPresenceMember {
	id: string;
	name: string;
	avatar: string | null;
}

interface IEchoPresenceChannelLike {
	here: (cb: (members: IPresenceMember[]) => void) => IEchoPresenceChannelLike;
	joining: (cb: (member: IPresenceMember) => void) => IEchoPresenceChannelLike;
	leaving: (cb: (member: IPresenceMember) => void) => IEchoPresenceChannelLike;
}

export interface IEchoPresenceLike {
	join: (channel: string) => IEchoPresenceChannelLike;
	leave: (channel: string) => void;
}

/** Mirrors App\Broadcasting\Channels::WORKFLOW_PRESENCE_PATTERN. */
export const workflowPresenceChannelName = (workspaceId: string, workflowId: string) =>
	`workspaces.${workspaceId}.workflows.${workflowId}`;

export interface IWorkflowPresenceHandlers {
	onHere: (members: IPresenceMember[]) => void;
	onJoining: (member: IPresenceMember) => void;
	onLeaving: (member: IPresenceMember) => void;
}

/** Joins a workflow's presence channel while it is open. Returns a leave function. */
export const joinWorkflowPresence = (
	echo: IEchoPresenceLike,
	workspaceId: string,
	workflowId: string,
	{ onHere, onJoining, onLeaving }: IWorkflowPresenceHandlers,
): (() => void) => {
	const channel = workflowPresenceChannelName(workspaceId, workflowId);
	echo.join(channel).here(onHere).joining(onJoining).leaving(onLeaving);

	return () => echo.leave(channel);
};
