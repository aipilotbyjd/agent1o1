import { Bot, Workflow } from 'lucide-react';
import dayjs from 'dayjs';
import type { DisplayItem, IHistoryItem } from '../_types/history.type';
import type { TRun } from '@/types/run.type';

/**
 * Normalises both mock IHistoryItem and real TRun into a single
 * DisplayItem shape so the UI never has to branch on the type.
 */
export function mapToDisplayItem(item: IHistoryItem | TRun): DisplayItem {
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
	// polymorphic `runnable_type` (e.g. `App\Models\Agent`) rather than the
	// old flat `type` field, and carries no display name for it.
	const real = item as TRun;
	const isAgent = real.runnable_type.toLowerCase().includes('agent');

	let displayStatus = 'Pending';
	if (real.status === 'completed') displayStatus = 'Complete';
	else if (real.status === 'failed') displayStatus = 'Failed';
	else if (real.status === 'cancelled') displayStatus = 'Cancelled';
	else if (real.status) {
		displayStatus = real.status.charAt(0).toUpperCase() + real.status.slice(1).replace(/_/g, ' ');
	}

	return {
		id: real.id,
		title: isAgent ? 'Agent Run' : 'Workflow Run',
		type: (isAgent ? 'Chat' : 'Workflow run') as 'Chat' | 'Workflow run',
		timestamp: real.started_at ? dayjs(real.started_at).format('MMM D, YYYY • h:mm A') : 'Pending',
		credits: real.total_credits_used ?? 0,
		status: displayStatus,
		icon: isAgent ? Bot : Workflow,
		chatTranscript: undefined,
	};
}
