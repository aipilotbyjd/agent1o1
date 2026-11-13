import dayjs from 'dayjs';
import type { DisplayItem } from '../_types/history.type';
import type { TRun } from '@/types/run.type';
import { runKind } from './runKind';

/** A workflow run is named after its workflow; every other run after the agent it was done for. */
export function mapToDisplayItem(run: TRun): DisplayItem {
	const kind = runKind(run.runnable_type);
	const isWorkflow = run.runnable_type === 'workflow';

	let displayStatus = 'Pending';
	if (run.status === 'completed') displayStatus = 'Complete';
	else if (run.status === 'failed') displayStatus = 'Failed';
	else if (run.status === 'cancelled') displayStatus = 'Cancelled';
	else if (run.status) {
		displayStatus = run.status.charAt(0).toUpperCase() + run.status.slice(1).replace(/_/g, ' ');
	}

	const agentName = run.agent?.name ?? 'Agent';

	return {
		id: run.id,
		title: isWorkflow
			? (run.workflow?.name ?? 'Workflow run')
			: run.runnable_type === 'agent_session'
				? agentName
				: `${agentName} · ${kind.label}`,
		type: kind.label,
		timestamp: run.started_at
			? dayjs(run.started_at).format('MMM D, YYYY • h:mm A')
			: 'Pending',
		credits: run.total_credits_used ?? 0,
		status: displayStatus,
		icon: kind.icon,
	};
}
