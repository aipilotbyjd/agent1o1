import type { IEchoLike } from '@/api/modules/workflow-builder/workflow-builder.realtime';
import { agentSessionChannelName } from '@/api/modules/agents/agents.realtime';

/**
 * `App\Events\Agents\AgentActionsRequested` / `AgentActionsChanged`, on the
 * conversation's private channel (the same one `agent.message` uses). Both
 * only say *that* something changed; the listener refetches the actions. The
 * leading dot stops Echo prefixing the `App.Events` namespace.
 */
export const AGENT_ACTIONS_REQUESTED_EVENT = '.agent.actions.requested';
export const AGENT_ACTIONS_CHANGED_EVENT = '.agent.actions.changed';

export type TAgentActionsBroadcast = {
	agent_session_id: string;
	run_id: string | null;
	action_ids?: string[];
};

/**
 * Follows a conversation's approvals — a turn pausing, and actions being
 * decided anywhere (the inbox, an email link, Slack, another tab). Returns an
 * unsubscribe that stops only these listeners, so it can share the channel
 * with `subscribeToAgentSession`.
 */
export function subscribeToAgentActions(
	echo: IEchoLike,
	workspaceId: string,
	sessionId: string,
	onChange: (event: TAgentActionsBroadcast) => void,
): () => void {
	const channel = echo.private(agentSessionChannelName(workspaceId, sessionId));

	channel.listen(AGENT_ACTIONS_REQUESTED_EVENT, (payload) =>
		onChange(payload as TAgentActionsBroadcast),
	);
	channel.listen(AGENT_ACTIONS_CHANGED_EVENT, (payload) =>
		onChange(payload as TAgentActionsBroadcast),
	);

	return () => {
		channel.stopListening?.(AGENT_ACTIONS_REQUESTED_EVENT);
		channel.stopListening?.(AGENT_ACTIONS_CHANGED_EVENT);
	};
}
