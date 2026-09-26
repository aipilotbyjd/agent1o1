import { Bot, Workflow } from 'lucide-react';
import dayjs from 'dayjs';
import type { DisplayItem, IHistoryItem } from '../_types/history.type';
import type { TRun } from '@/types/run.type';

/** What an agent run was, by its `runnable_type` morph alias. A chat turn is just the agent's name. */
const AGENT_RUN_KINDS: Record<string, string> = {
	reflection_run: 'Reflection',
	agent_session_evaluation: 'Chat grading',
	agent_eval_run: 'Eval suite',
};

const agentRunTitle = (run: TRun) => {
	const name = run.agent?.name ?? 'Agent';
	const kind = AGENT_RUN_KINDS[run.runnable_type];
	return kind ? `${name} · ${kind}` : name;
};

/**
 * Normalises both mock IHistoryItem and real TRun into a single
 * DisplayItem shape so the UI never has to branch on the type.
 */
export function mapToDisplayItem(item: IHistoryItem | TRun, workflowName?: string): DisplayItem {
	if ('timestamp' in item) {
		// Mock history item
		const mock = item as IHistoryItem;
		return {
			id: mock.id,
			title: mock.title,
			type: mock.type,
			timestamp: mock.timestamp,
			credits: mock.credits,
			status: mock.status,
			icon: mock.icon,
			chatTranscript: mock.chatTranscript,
		};
	}

	// Real TRun from API. The new backend describes what ran through the
	// polymorphic `runnable_type` (e.g. `agent_session`) rather than the old
	// flat `type` field. An agent run carries its agent's name; a workflow run
	// doesn't — the caller passes it when it can resolve `workflow_id`.
	const real = item as TRun;
	const isAgent = real.runnable_type !== 'workflow';

	let displayStatus = 'Pending';
	if (real.status === 'completed') displayStatus = 'Complete';
	else if (real.status === 'failed') displayStatus = 'Failed';
	else if (real.status === 'cancelled') displayStatus = 'Cancelled';
	else if (real.status) {
		displayStatus =
			real.status.charAt(0).toUpperCase() + real.status.slice(1).replace(/_/g, ' ');
	}

	return {
		id: real.id,
		title: isAgent ? agentRunTitle(real) : (workflowName ?? 'Workflow Run'),
		type: (isAgent ? 'Chat' : 'Workflow run') as 'Chat' | 'Workflow run',
		timestamp: real.started_at
			? dayjs(real.started_at).format('MMM D, YYYY • h:mm A')
			: 'Pending',
		credits: real.total_credits_used ?? 0,
		status: displayStatus,
		icon: isAgent ? Bot : Workflow,
		chatTranscript: undefined,
	};
}
