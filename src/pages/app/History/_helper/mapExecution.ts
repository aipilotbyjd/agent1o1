import { Bot, Workflow } from 'lucide-react';
import dayjs from 'dayjs';
import type { DisplayItem, IHistoryItem } from '../_types/history.types';
import type { TExecution } from '@/types/execution.type';

/**
 * Normalises both mock IHistoryItem and real TExecution into a single
 * DisplayItem shape so the UI never has to branch on the type.
 */
export function mapToDisplayItem(item: IHistoryItem | TExecution): DisplayItem {
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

	// Real TExecution from API
	const real = item as TExecution;
	const isAgent = real.type === 'agent';

	let displayStatus = 'Pending';
	if (real.status === 'completed') displayStatus = 'Complete';
	else if (real.status === 'failed') displayStatus = 'Failed';
	else if (real.status === 'cancelled') displayStatus = 'Cancelled';
	else if (real.status) {
		displayStatus = real.status.charAt(0).toUpperCase() + real.status.slice(1);
	}

	return {
		id: real.id,
		title: isAgent ? real.agent_name || 'Agent Run' : real.workflow_name || 'Workflow Run',
		type: (isAgent ? 'Chat' : 'Workflow run') as 'Chat' | 'Workflow run',
		timestamp: real.started_at ? dayjs(real.started_at).format('MMM D, YYYY • h:mm A') : 'Pending',
		credits: real.credits_consumed ?? 0,
		status: displayStatus,
		icon: isAgent ? Bot : Workflow,
		chatTranscript: undefined,
	};
}
